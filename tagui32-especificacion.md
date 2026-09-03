# Tagui32 — Fotografía Deportiva
## Documento de especificación técnica

---

## 1. Resumen del proyecto

Web para un fotógrafo deportivo independiente que permite:

1. Mostrar un portfolio de fotos de ejemplo.
2. Recibir solicitudes de cobertura de partidos desde un formulario público.
3. Entregar y cobrar los packs de fotos post-partido mediante un código de acceso privado y Mercado Pago.

**Modelo de negocio:** el fotógrafo cobra un pack completo por partido a un único responsable del equipo (normalmente el capitán o delegado). No hay venta por foto individual ni por jugador. El equipo se organiza internamente para juntar la plata.

**Flujo de plata:** el pago ocurre DESPUÉS del partido, cuando las fotos ya están editadas y subidas. No hay seña.

---

## 2. Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Front y back en un solo proyecto. Las API routes alojan el webhook de MP. |
| Estilos | Tailwind CSS + shadcn/ui | Rápido de generar, componentes accesibles listos. |
| Base de datos | Supabase (PostgreSQL) | Postgres administrado, cliente JS cómodo, plan gratis generoso. |
| Storage de imágenes | Cloudflare R2 | **Egreso gratis.** Ver sección 3. |
| Mails transaccionales | Resend | 3.000 mails/mes gratis, integración de 2 líneas. |
| Pagos | Mercado Pago — Checkout Pro | Un solo pago, sin manejar datos de tarjeta. |
| Auth del admin | Supabase Auth (email + password, un solo usuario) | El acceso de clientes NO usa Auth: usa código. |
| Hosting | Vercel | Deploy automático desde GitHub. |

### Por qué R2 y no Supabase Storage / S3

Supabase Storage y AWS S3 cobran por **egreso**, es decir, por cada GB que un cliente descarga. Un pack de ~1 GB descargado varias veces por varios equipos por mes se vuelve caro rápido.

Cloudflare R2 cobra ~USD 0,015 por GB/mes de almacenamiento y **cero por descarga**. Habla el mismo protocolo que S3, así que se usa el SDK `@aws-sdk/client-s3` sin cambios.

**Costo estimado real:** 100 fotos ≈ 1 GB por evento. Con 30 días de retención y ~4 partidos por mes en simultáneo, son ~4 GB almacenados = **menos de USD 0,10 por mes**. Es despreciable.

---

## 3. Arquitectura de subida y entrega (decisión clave)

Vercel tiene límites de tiempo de ejecución (10s en plan gratuito) y de tamaño de request (4,5 MB). Subir 100 fotos a través del servidor es imposible. La solución:

### Subida (panel de admin)

1. El fotógrafo edita las fotos en su compu y las exporta.
2. Comprime los originales en un único archivo `.zip` (con el ZIP de Windows o cualquier compresor).
3. En el panel selecciona las 100 fotos sueltas + el ZIP.
4. **El navegador genera las previews:** cada foto se redimensiona a 1200px de ancho, calidad JPEG 70, y se le estampa la marca de agua usando la Canvas API. Cero procesamiento en el servidor.
5. El navegador pide al backend URLs firmadas de subida (`presigned PUT`) y sube todo **directo a R2**, con una barra de progreso.
6. El backend solo registra en la base de datos las claves de los archivos subidos.

R2 acepta archivos de hasta 5 GB en un PUT simple, así que el ZIP entra sin necesidad de multipart upload.

### Entrega

El original nunca se expone con URL pública. Cuando un cliente ya pagó y toca "Descargar", el backend:

1. Verifica que el evento esté pagado y el código vigente.
2. Genera una **URL firmada de R2 con vencimiento de 24 horas** apuntando al ZIP.
3. Redirige el navegador a esa URL.

La descarga sale de la red de Cloudflare, a máxima velocidad y sin costo de egreso. La calidad es la original: el ZIP es exactamente el archivo que subió el fotógrafo, sin recompresión.

### Marca de agua

- Texto: **`Tagui32`**
- Aplicada solo a las previews, nunca a los originales.
- Repetida en diagonal (patrón en mosaico), blanco con ~35% de opacidad, rotada -30°, cubriendo toda la imagen. Un solo watermark en una esquina se recorta en 5 segundos; el patrón en mosaico no.
- Las imágenes de preview se muestran con `pointer-events: none`, `user-select: none` y click derecho deshabilitado. Es un freno para el usuario casual, no una protección real — la protección real es que la preview esté en baja resolución.

---

## 4. Modelo de datos

```sql
-- Solicitudes de cobertura y eventos ya realizados.
-- Una fila recorre todo el ciclo: solicitud -> confirmado -> fotos subidas -> pagado.
create table eventos (
  id                  uuid primary key default gen_random_uuid(),
  -- Datos de la solicitud
  deporte             text not null,
  equipo              text not null,
  fecha_partido       timestamptz not null,
  lugar               text not null,
  duracion_horas      numeric(3,1),
  cantidad_jugadores  int,
  notas               text,
  -- Contacto del responsable
  contacto_nombre     text not null,
  contacto_email      text not null,
  contacto_whatsapp   text not null,
  -- Estado y plata
  estado              text not null default 'pendiente',
    -- pendiente | confirmado | rechazado | fotos_subidas | pagado | vencido
  precio_centavos     int not null,      -- se precarga con el precio base, editable
  zip_key             text,              -- clave del ZIP de originales en R2
  zip_bytes           bigint,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Previews con marca de agua que ve el cliente en la galería.
create table fotos (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references eventos(id) on delete cascade,
  preview_key text not null,             -- clave en R2
  ancho       int,
  alto        int,
  orden       int default 0,
  created_at  timestamptz default now()
);

-- Código con el que el equipo entra a ver y comprar su pack.
create table codigos_acceso (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references eventos(id) on delete cascade,
  codigo     text not null unique,       -- 8 caracteres, alfabeto sin ambiguos
  expira_en  timestamptz not null,       -- generación + 30 días
  usos       int default 0,
  created_at timestamptz default now()
);

-- Registro de pagos de Mercado Pago. Sirve de log y de defensa anti-duplicados.
create table pagos (
  id             uuid primary key default gen_random_uuid(),
  evento_id      uuid not null references eventos(id),
  mp_payment_id  text not null unique,   -- unique = protección contra webhooks repetidos
  mp_preference_id text,
  monto_centavos int not null,
  estado         text not null,          -- approved | pending | rejected | refunded
  payload        jsonb,                  -- respuesta cruda de MP, para auditar
  created_at     timestamptz default now()
);

-- Fotos de ejemplo de la home. Separadas del resto a propósito.
create table portfolio (
  id         uuid primary key default gen_random_uuid(),
  imagen_key text not null,
  titulo     text,
  deporte    text,
  orden      int default 0,
  visible    boolean default true
);

-- Configuración editable sin tocar código (precio base, textos, contacto).
create table configuracion (
  clave  text primary key,
  valor  text not null
);
```

**Nota sobre el código de acceso:** usar el alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin I, O, 0, 1, que se confunden al dictarlos por WhatsApp). 8 caracteres. Ejemplo: `K7RM4XPQ`.

**Seguridad de la base:** activar Row Level Security en todas las tablas y no exponer la `service_role key` al cliente. Todo acceso a datos pasa por API routes del servidor.

---

## 5. Flujos completos

### 5.1 Solicitud de cobertura (público)

1. El visitante entra a `/agendar` y completa: deporte, nombre del equipo, fecha y hora del partido, lugar, duración estimada, cantidad de jugadores, nombre de contacto, email y **WhatsApp (obligatorio)**.
2. Se crea un evento en estado `pendiente` con el precio base precargado.
3. Le llega un mail al fotógrafo con los datos y un link al panel.
4. Al solicitante le llega un mail de "recibimos tu solicitud, te confirmamos a la brevedad".
5. El fotógrafo confirma o rechaza desde el panel. Si confirma, sale mail de confirmación al cliente.

> El WhatsApp es obligatorio porque es la única vía práctica para avisar de una suspensión por lluvia el mismo día del partido. El sistema no manda WhatsApp automáticos: el panel muestra un botón `wa.me/54...` que abre el chat con un mensaje pre-escrito. Suficiente y sin costo.

### 5.2 Carga del pack (admin)

1. Post-partido, el fotógrafo edita las fotos y arma el ZIP.
2. Entra al evento en el panel, ajusta el precio si hace falta, y sube fotos + ZIP.
3. Al terminar la subida, el sistema en una sola operación:
   - Marca el evento como `fotos_subidas`.
   - Genera el código de acceso con vencimiento a 30 días.
   - Manda el mail al contacto del equipo con el código, el link a la galería, el precio y la fecha de vencimiento.

### 5.3 Compra (cliente)

1. El cliente entra a `/galeria`, ingresa el código.
2. Se valida contra la base: existe, no venció, el evento tiene fotos. Se guarda una cookie firmada de sesión (`httpOnly`, 30 días) para que no tenga que reingresarlo.
3. Ve la grilla de previews con marca de agua, el nombre del equipo, la fecha, la cantidad de fotos y el precio. Puede abrir cada foto en un lightbox.
4. Toca "Comprar pack" → el backend crea una preferencia de Mercado Pago → redirección a Checkout Pro.
5. Paga y vuelve a `/galeria/exito`.
6. La galería ahora muestra el botón "Descargar todas". Puede volver a descargar cuantas veces quiera mientras el código no venza.

### 5.4 Vencimiento

Un cron de Vercel corre una vez por día:
- Marca como `vencido` los códigos con más de 30 días.
- Manda un mail de aviso al cliente **3 días antes** del vencimiento si todavía no pagó, y también si ya pagó (para que no pierda las fotos por no bajarlas).
- Opcionalmente borra de R2 los archivos de eventos vencidos hace más de 7 días.

---

## 6. Integración con Mercado Pago

### Configuración

Usar **Checkout Pro**. Se instala el SDK oficial: `npm install mercadopago`.

Credenciales necesarias desde el panel de desarrolladores de MP:
- `MP_ACCESS_TOKEN` (privada, solo servidor)
- `MP_PUBLIC_KEY`

Trabajar primero con las credenciales de **test** y usuarios de prueba, y recién pasar a producción cuando el flujo completo funcione.

### Creación de la preferencia

En `POST /api/pagos/crear`:

```ts
const preference = {
  items: [{
    title: `Pack de fotos — ${evento.equipo} — ${fechaFormateada}`,
    quantity: 1,
    unit_price: evento.precio_centavos / 100,
    currency_id: 'ARS',
  }],
  external_reference: evento.id,       // CRÍTICO: así identificás el evento en el webhook
  notification_url: `${BASE_URL}/api/pagos/webhook`,
  back_urls: {
    success: `${BASE_URL}/galeria/exito`,
    failure: `${BASE_URL}/galeria/error`,
    pending: `${BASE_URL}/galeria/pendiente`,
  },
  auto_return: 'approved',
};
```

### Webhook — reglas que NO se pueden saltear

`POST /api/pagos/webhook`:

1. **Nunca confiar en el contenido del webhook.** El payload solo trae un ID. Con ese ID hay que consultar la API de MP (`GET /v1/payments/{id}`) usando el access token, y usar *esa* respuesta como verdad.
2. **Idempotencia obligatoria.** MP reenvía la misma notificación varias veces. El `unique` sobre `mp_payment_id` en la tabla `pagos` resuelve esto: si el insert falla por duplicado, se ignora y se responde 200.
3. **Responder 200 rápido.** Si el endpoint tarda o falla, MP reintenta y ensucia todo. Primero responder, procesar después si hace falta.
4. Solo si `status === 'approved'` se marca el evento como `pagado` y se habilita la descarga.
5. Validar que el monto recibido coincida con el precio del evento antes de habilitar nada.
6. Al aprobarse, mandar mail de confirmación al cliente con el link de descarga.

**No depender de la redirección `back_urls` para dar por pagado el evento.** El cliente puede cerrar el navegador antes de volver. El webhook es la fuente de verdad; la pantalla de éxito solo consulta el estado.

---

## 7. Pantallas

### Públicas
| Ruta | Contenido |
|---|---|
| `/` | Hero con una foto potente, portfolio en grilla, cómo funciona (3 pasos), precio base, CTA a agendar. |
| `/agendar` | Formulario de solicitud con validación (Zod + react-hook-form). |
| `/agendar/gracias` | Confirmación de solicitud recibida. |
| `/galeria` | Input del código de acceso. |
| `/galeria/[codigo]` | Grilla de previews, lightbox, precio, botón de compra o de descarga. |
| `/terminos` | Términos y condiciones. |

### Admin (protegidas)
| Ruta | Contenido |
|---|---|
| `/admin` | Login. |
| `/admin/eventos` | Lista de eventos filtrable por estado, con badges de color. |
| `/admin/eventos/[id]` | Detalle: datos del partido, botón de WhatsApp, editar precio, subir fotos y ZIP, ver código generado, estado del pago, reenviar mail. |
| `/admin/portfolio` | Gestión de las fotos de ejemplo de la home. |
| `/admin/config` | Precio base y textos editables. |

**Diseño:** mobile first. La mayoría va a entrar desde el celular por un link de WhatsApp. Estética oscura, tipografía con carácter, la foto siempre como protagonista y la interfaz en segundo plano.

---

## 8. Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # solo servidor, nunca exponer

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=                  # dominio público del bucket para previews

# Mercado Pago
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=

# Resend
RESEND_API_KEY=
MAIL_FROM=

# App
NEXT_PUBLIC_BASE_URL=
ADMIN_EMAIL=                    # a dónde llegan los avisos de solicitudes
SESSION_SECRET=                 # para firmar la cookie de galería
CRON_SECRET=                    # protege el endpoint del cron
```

---

## 9. Cuestiones legales y administrativas

**Facturación.** Mercado Pago te entrega credenciales sin monotributo, pero informa tus cobros a ARCA y aplica retenciones. Si esto va a generar ingresos regulares, conviene que lo hables con un contador antes de lanzar — no es algo que pueda resolver un documento técnico, y es mejor ordenarlo desde el arranque que corregirlo después.

**Derechos de imagen.** Aunque los fotografiados sean mayores, los términos y condiciones tienen que decir explícitamente:
- Que el fotógrafo conserva la autoría y los derechos de las imágenes.
- Que puede usar una selección de las fotos en su portfolio y redes, salvo que el equipo pida por escrito lo contrario.
- Que el pack entregado es para uso personal del equipo, sin cesión para uso comercial ni reventa.
- Que el acceso vence a los 30 días y después las fotos se eliminan.

**Política de suspensión.** Dejar escrito en los términos: si el partido se suspende, se reprograma sin costo. Como no hay seña, no hay plata en juego, lo cual simplifica mucho.

---

## 10. Plan de construcción por fases

Aunque el objetivo es lanzar completo, conviene construirlo en este orden para poder probar cada pieza:

1. **Base:** proyecto Next.js, Tailwind, shadcn, esquema de Supabase, layout y home estática.
2. **Solicitudes:** formulario `/agendar`, guardado en base, mails con Resend, login de admin y listado de eventos.
3. **Storage:** integración con R2, presigned URLs, subida directa desde el navegador, generación de previews con watermark en canvas.
4. **Galería:** código de acceso, cookie de sesión, grilla de previews, lightbox.
5. **Pagos:** Checkout Pro en modo test, webhook, idempotencia, habilitación de descarga, URL firmada del ZIP.
6. **Cierre:** cron de vencimiento, mails de aviso, portfolio administrable, términos, SEO básico, y pasaje de MP a producción.
