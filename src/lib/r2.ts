import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export { TAMANO_PARTE_MULTIPART, UMBRAL_MULTIPART } from "@/lib/constantes-subida";

function clienteR2() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// URL firmada de subida (PUT), válida 1 hora. El navegador sube directo a R2,
// nunca pasa por el servidor de Next (límite de 4.5MB/10s en Vercel).
export async function crearUrlSubida(key: string, contentType: string) {
  const comando = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(clienteR2(), comando, { expiresIn: 3600 });
}

export function urlPublicaPreview(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// URL firmada de descarga (GET), válida 24 horas. El original nunca tiene
// URL pública — esto se genera solo después de verificar pago + código vigente.
export async function crearUrlDescarga(key: string) {
  const comando = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  });
  return getSignedUrl(clienteR2(), comando, { expiresIn: 24 * 3600 });
}

// ============================================================================
// Multipart upload — para archivos grandes (el ZIP de originales) que un PUT
// simple no aguanta en una conexión hogareña: se corta a mitad de camino o
// la URL firmada expira durante la subida. Se sube en partes de 20MB, cada
// una con su propia URL firmada y su propio reintento del lado del cliente.
// ============================================================================

export async function iniciarMultipart(key: string, contentType: string) {
  const comando = new CreateMultipartUploadCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  const { UploadId } = await clienteR2().send(comando);
  if (!UploadId) throw new Error("R2 no devolvió un UploadId");
  return UploadId;
}

export async function firmarPartesMultipart(
  key: string,
  uploadId: string,
  cantidadPartes: number
) {
  const cliente = clienteR2();
  return Promise.all(
    Array.from({ length: cantidadPartes }, async (_, i) => {
      const numeroParte = i + 1;
      const comando = new UploadPartCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        UploadId: uploadId,
        PartNumber: numeroParte,
      });
      // Mínimo 1 hora pedido — dejamos 2 de margen para archivos grandes en
      // conexiones lentas.
      const url = await getSignedUrl(cliente, comando, { expiresIn: 2 * 3600 });
      return { numeroParte, url };
    })
  );
}

export async function completarMultipart(
  key: string,
  uploadId: string,
  partes: { numeroParte: number; etag: string }[]
) {
  const comando = new CompleteMultipartUploadCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: partes
        .sort((a, b) => a.numeroParte - b.numeroParte)
        .map((p) => ({ PartNumber: p.numeroParte, ETag: p.etag })),
    },
  });
  await clienteR2().send(comando);
}

export async function abortarMultipart(key: string, uploadId: string) {
  const comando = new AbortMultipartUploadCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    UploadId: uploadId,
  });
  await clienteR2().send(comando);
}
