# Estilo y Greña

Sitio y sistema de reservas para un salón de cortes alternativos. Está construido con Next.js App Router, TypeScript, Tailwind CSS, Prisma, Neon PostgreSQL, Mercado Pago y Cloudflare R2.

## Requisitos

- Node.js 20 o superior
- pnpm 10
- Una base de datos PostgreSQL en Neon
- Credenciales de Mercado Pago para cobros en línea
- Un bucket público de Cloudflare R2 para imágenes

No requiere Docker.

## Inicio local

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

En Windows PowerShell puede ser necesario ejecutar `pnpm.cmd` si la política local bloquea el shim `pnpm.ps1`.

## Variables de entorno

Copia `.env.example` a `.env`. `DATABASE_URL` debe ser la URL de conexión agrupada (pooled) de Neon con SSL. El administrador se define exclusivamente mediante `ADMIN_USERNAME`, `ADMIN_PASSWORD` y un `ADMIN_SESSION_SECRET` aleatorio de al menos 32 caracteres. No se crean usuarios en la base de datos.

Configura en Mercado Pago:

- `MERCADO_PAGO_ACCESS_TOKEN` con el token privado.
- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` con la clave pública (reservada para una futura integración visual de Bricks; el flujo actual usa Checkout Pro).
- `MERCADO_PAGO_WEBHOOK_SECRET` con la firma secreta del webhook.
- La URL de notificaciones será `https://tu-dominio.com/api/webhooks/mercadopago`.

Configura R2 con una API Token que tenga permiso de lectura/escritura sobre el bucket. `R2_PUBLIC_URL` debe ser la URL pública del bucket o del dominio personalizado, sin ruta final. Reinicia Next.js después de cambiarla para que el optimizador de imágenes actualice sus patrones remotos.

`NEXT_PUBLIC_APP_URL` debe ser el origen público exacto y HTTPS en producción. Se usa para metadatos, retornos de pago y webhooks.

## Base de datos

La migración inicial crea modelos, índices y una restricción PostgreSQL `EXCLUDE` sobre rangos de tiempo para impedir citas activas superpuestas incluso si dos solicitudes llegan simultáneamente. El cálculo de disponibilidad también valida horario semanal, excepciones, bloqueos, duración completa, citas y reservas de pago temporales.

Los servicios admiten `FIXED` (precio fijo) o `QUOTE` (cotización). Los servicios cotizados conservan duración y disponibilidad normales, pero guardan importe nulo, una etiqueta de cotización histórica y nunca pueden iniciar Mercado Pago. La migración `20260924000000_service_quote_pricing` convierte de forma segura los servicios y citas existentes a `FIXED` sin borrar sus precios.

Para aplicar migraciones en producción:

```bash
pnpm prisma migrate deploy
```

La semilla agrega servicios de ejemplo, horario de martes a sábado de 11:00 a 20:00 y configuración pública editable.

## Logo e imágenes

Coloca el logo real y transparente en `public/logo.png`; mientras no exista, el sitio muestra un wordmark tipográfico. Las fotos se suben desde `/admin/galeria`, se validan y guardan en R2. PostgreSQL almacena solamente la metadata y URL.

## Comandos de verificación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Despliegue

El proyecto es compatible con Vercel. Añade todas las variables de `.env.example`, ejecuta `prisma migrate deploy` contra Neon y registra el webhook público en Mercado Pago. La lista de intentos fallidos de login se limita en memoria por instancia; en una operación con alto tráfico conviene sustituirla por un rate limiter distribuido.

Antes de publicar, revisa los textos provisionales de privacidad y cancelación con la persona responsable del negocio.
