import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
