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
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma:seed
pnpm integrations:check
pnpm r2:import-cortes
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

Configura R2 con un token con permiso de lectura/escritura sobre el bucket. `R2_PUBLIC_URL` debe ser la URL pública HTTPS del bucket o del dominio personalizado, sin credenciales ni parámetros. El patrón de imágenes se deriva del host y su ruta; para cambiar a un dominio propio basta actualizar la variable y reiniciar/recompilar Next.js.

En Cloudflare → R2 → bucket → Settings, activa **Public Development URL → Enable** para servir por `r2.dev`, o conecta un dominio desde **Custom Domains**. Una conexión S3 correcta no demuestra que la lectura pública esté habilitada. [Documentación de buckets públicos](https://developers.cloudflare.com/r2/buckets/public-buckets/).

Las únicas variables para el navegador son `NEXT_PUBLIC_APP_URL` y `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`. Las demás variables de `.env.example` permanecen en el servidor; la validación es por integración, para permitir desarrollo local sin habilitar todos los proveedores. Los scripts cargan `.env*` con la misma precedencia de Next.js y solo reportan errores sin credenciales.

`NEXT_PUBLIC_APP_URL` debe ser el origen público exacto y HTTPS en producción. Se usa para metadatos, retornos de pago y webhooks.

## Base de datos

La migración inicial crea modelos, índices y una restricción PostgreSQL `EXCLUDE` sobre rangos de tiempo para impedir citas activas superpuestas incluso si dos solicitudes llegan simultáneamente. El cálculo de disponibilidad también valida horario semanal, excepciones, bloqueos, duración completa, citas y reservas de pago temporales.

Los servicios admiten `FIXED` (precio fijo) o `QUOTE` (cotización). Los servicios cotizados conservan duración y disponibilidad normales, pero guardan importe nulo, una etiqueta de cotización histórica y nunca pueden iniciar Mercado Pago. La migración `20260924000000_service_quote_pricing` convierte de forma segura los servicios y citas existentes a `FIXED` sin borrar sus precios.

Para aplicar migraciones en producción:

```bash
pnpm prisma migrate deploy
```

`pnpm prisma:seed` agrega cinco servicios iniciales (tres FIXED y dos QUOTE), horario de martes a sábado de 11:00 a 20:00 y ajustes públicos. Es seguro repetirla: conserva servicios, precios y ajustes existentes y solo agrega el horario si está vacío. Verifica los precios y horarios del negocio antes de publicar. WhatsApp queda vacío hasta configurar el número real desde `/admin/configuracion`; no se inventan datos de contacto.

## Logo e imágenes

Coloca el logo real y transparente en `public/logo.png`; mientras no exista, el sitio muestra un wordmark tipográfico.

Las 14 fotos originales viven en `public/images/cortes/corte-001.jpeg` a `corte-014.jpeg`. Sus bytes y extensiones se conservan. `lib/cortes.ts` define textos, dimensiones y encuadres de la selección editorial: hero, concepto y collages laterales usan archivos locales intencionalmente; el archivo de galería proviene exclusivamente de PostgreSQL/R2. Si falla una imagen importada, se usa su copia local; otras imágenes muestran una placa tipográfica que conserva el espacio.

Importación inicial (una vez por entorno):

```bash
pnpm r2:import-cortes
```

El script busca archivos con nombres limpios, valida contenido/MIME/tamaño, conserva los bytes, comprueba objetos existentes por SHA-256 y verifica cada lectura pública antes de crear registros. Usa `gallery/cortes/` y un upsert por objectKey. Es seguro repetirlo: no duplica uploads ni registros, conserva orden/visibilidad/textos editados y rechaza sobrescribir un objeto con bytes diferentes. Asigna dos imágenes representativas únicamente a servicios iniciales que aún no tengan foto. Un fallo parcial se recupera repitiendo el comando después de corregir la configuración. Para cambiar de host público, repítelo para actualizar las URLs importadas. Una imagen borrada del archivo puede volver a importarse al ejecutar este flujo inicial.

El administrador sube fotografías desde `/admin/galeria` y `/admin/servicios`. Se aceptan JPG, PNG, WebP y AVIF estáticos de hasta 10 MB, se verifica el contenido real y se generan claves UUID. Los formularios admiten el tamaño de archivo anunciado. El borrado conserva objetos que todavía utiliza otra entrada de galería o servicio.

Configura `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` (al menos 32 caracteres) antes de usar el admin habitual; las pruebas temporales no escriben credenciales en `.env`.

## Comandos de verificación

Comprobación externa, segura de repetir:

```bash
pnpm integrations:check
```

Verifica conexión/query a Neon y HEAD del bucket, upload, HEAD/GET S3, lectura HTTP pública y borrado de un objeto aislado en `healthchecks/`. Lo elimina en un bloque de limpieza y confirma su ausencia. Una lectura pública fallida produce salida de error, aunque S3 funcione.

Pruebas optativas del flujo real (fuera de la suite unitaria):

```bash
pnpm integrations:workflows
pnpm integrations:admin
```

`integrations:workflows` crea servicios/citas e imágenes temporales, comprueba disponibilidad, precios/cotización, solapamientos de aplicación/PostgreSQL y gestión de galería; al terminar elimina los registros y objetos de prueba. No crea preferencias ni cargos de Mercado Pago. Si hay un servidor local, define `WORKFLOW_APP_URL=http://localhost:3000` para comprobar también que el HTML público incluye la foto temporal.

`integrations:admin` inicia un servidor local separado en 127.0.0.1:3031, prueba los formularios reales mediante HTTP (login, subir, ordenar, ocultar/mostrar y eliminar), comprueba R2/Neon y cierra el proceso. Si faltan credenciales de admin, genera unas temporales solo en memoria. Requiere ese puerto libre y ningún otro `next dev` activo para este proyecto. Ambos comandos usan exclusivamente datos de prueba y pueden repetirse en desarrollo; si el proceso se interrumpe, revisa los identificadores de cleanup que reporta el script.

Validaciones locales, sin depender de servicios externos:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Despliegue

El proyecto es compatible con Vercel. Añade todas las variables de `.env.example`, ejecuta `prisma migrate deploy` contra Neon y registra el webhook público en Mercado Pago. La lista de intentos fallidos de login se limita en memoria por instancia; en una operación con alto tráfico conviene sustituirla por un rate limiter distribuido.

Antes de publicar, revisa los textos provisionales de privacidad y cancelación con la persona responsable del negocio.
