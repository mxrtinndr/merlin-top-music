# 🎧 Merlin FM · La canción del día

La tradición musical del equipo de Merlin Software, sin Excel. Cada día una persona **presenta** una canción, el resto la **puntúa del 1 al 4**, y quien presenta **nomina** a la siguiente persona. Hay ranking con podio, histórico con Hall of Fame y un "salón de la vergüenza".

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + API REST) · despliegue en Vercel.

---

## Pantallas

| Ruta | Qué hace |
| --- | --- |
| `/` **Hoy** | Quién presenta hoy y quién va después. La canción de hoy ocupa la mitad del ancho, con *Votación* y *Comentarios* al lado. Tiene flechas ‹ › y un selector para ver las canciones anteriores de la semana (`/?dia=AAAA-MM-DD`), y con `/?cancion=<id>` abre cualquier canción. Si no hay canción y te toca, el formulario para publicarla. Debajo, el *Resumen de la semana*: portada destacada, canciones, votos, media, géneros más escuchados y carátulas de la semana. |
| `/ranking` | Podio (🥇🥈🥉) + lista con barras. Media de **todas** las notas recibidas por las canciones de cada persona. Debajo, las canciones mejor puntuadas: al pulsar una se abre en la portada. Filtro: esta semana / este mes / histórico. |
| `/historico` | Todas las canciones por meses, más *🏆 Hall of Fame* y *🙈 Vergüenza* (top/bottom 20). Cada una abre su detalle. |
| `/historico/[id]` | Detalle de una canción con todos los votos. Se puede puntuar tarde. |
| `/admin` | Gestión del equipo: altas, foto de perfil, nombres, emoji/color, activar o desactivar, quitar PIN olvidados. |

Cada persona puede además editar su foto, nombre y color desde el menú de la cabecera → **Editar mi perfil**.

---

## Puesta en marcha (local)

Requisitos: Node 20+ y un proyecto de Supabase.

```bash
npm install
cp .env.local.example .env.local   # y rellena los dos valores
npm run dev                        # http://localhost:3000
```

### 1. Variables de entorno

En Supabase → **Project Settings → API** (o el botón **Connect**):

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave pública: la `anon` (JWT) o la nueva `publishable` (`sb_publishable_…`). Las dos valen. |

Si faltan, la app muestra una pantalla explicando qué configurar en lugar de romperse.

### Opcional: avisos en Microsoft Teams

Al publicar la canción del día, la app puede mandar una tarjeta a un canal de Teams con la canción, el comentario y la persona nominada. Teams la avisa en el escritorio y en el móvil aunque la web esté cerrada.

1. En Teams, abre el canal, pulsa **⋯ → Workflows** y elige la plantilla **"Publicar en un canal cuando se reciba una solicitud de webhook"** (*Post to a channel when a webhook request is received*).
2. Copia la URL que te da al terminar.
3. Añádela como `TEAMS_WEBHOOK_URL` en `.env.local` y en Vercel (**Settings → Environment Variables**), y vuelve a desplegar. No lleva `NEXT_PUBLIC_`: solo la ve el servidor.

Sin esa variable, la app funciona igual y no manda nada a Teams.

### 2. Aplicar las migraciones

Están en [`supabase/migrations/`](supabase/migrations) y se aplican en orden:

1. `20260924090000_initial_schema.sql`: tablas, constraints, trigger y políticas RLS.
2. `20260924090100_views_and_functions.sql`: vista de resumen, función de ranking y funciones de PIN.
3. `20260925090000_member_photos.sql`: columna `avatar_url`, bucket de Storage `avatars` y sus políticas. No hay que crear el bucket a mano.
4. `20260926090000_realtime_daily_picks.sql`: activa Realtime en `daily_picks` (refresco en vivo y avisos de nominación).

**Opción A, Supabase CLI** (recomendada):

```bash
npx supabase login
npx supabase link --project-ref <ref-del-proyecto>
npx supabase db push
```

Si el CLI se queja de que falta `supabase/config.toml`, ejecuta antes `npx supabase init`. No toca las migraciones.

**Opción B, SQL Editor** del dashboard: pega el contenido de cada archivo, en orden, y ejecútalo.

### 3. Miembros del equipo

Hay tres formas, elige la que prefieras:

- **Nada que hacer**: la primera vez que alguien entra pulsa *"Es mi primera vez"* y se crea su perfil.
- **Desde `/admin`**: das de alta a todo el equipo desde la web (también se llega desde el menú de usuario → *Gestionar equipo*).
- **Con el seed**: [`supabase/seed.sql`](supabase/seed.sql) trae la lista inicial del equipo. Revísala y ejecútala en el SQL Editor. Es idempotente: no duplica nombres que ya existan. Las fotos se suben luego desde la app.

---

## Despliegue en Vercel

1. Sube el repo a GitHub/GitLab e impórtalo en [vercel.com/new](https://vercel.com/new). Next.js se detecta solo.
2. En **Settings → Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production y Preview).
3. Despliega. Si cambias las variables después, **vuelve a desplegar**: las `NEXT_PUBLIC_*` se incrustan al compilar.

> **Error "No Output Directory named "public" found"**: el proyecto de Vercel no se ha detectado como Next.js (pasa si se importó el repo antes de tener código). El [`vercel.json`](vercel.json) ya fija `"framework": "nextjs"`. Si aun así falla, en **Settings → Build and Deployment** pon *Framework Preset: Next.js* y quita cualquier override de *Output Directory*.

No hace falta nada más: todas las páginas se renderizan en cada petición (los datos cambian cada mañana) y "hoy" se calcula siempre en hora de Madrid, aunque Vercel corra en UTC.

---

## Modelo de datos

```
members ──┬─< daily_picks.presenter_id        (quién presenta ese día)
          ├─< daily_picks.next_presenter_id   (a quién nomina)
          └─< ratings.member_id               (quién puntúa)
daily_picks ─< ratings.daily_pick_id
members ─── member_pins                       (PIN hasheado, invisible para el cliente)
members.avatar_url ──> Storage: avatars/<member_id>/<timestamp>.webp
```

| Tabla | Campos clave | Reglas en la base de datos |
| --- | --- | --- |
| `members` | `name`, `avatar_url`, `emoji`, `color`, `active`, `has_pin` | Nombre único sin distinguir mayúsculas ni espacios. Color `#RRGGBB`. `avatar_url` debe ser `http(s)://`. |
| `daily_picks` | `date`, `presenter_id`, `song_title`, `song_artist`, `song_url`, `presenter_comment`, `next_presenter_id` | **Una canción por día** (`unique(date)`). No se puede nominar a quien presenta. El enlace debe ser `http(s)://`. |
| `ratings` | `daily_pick_id`, `member_id`, `score`, `comment` | `score` entre **1 y 4**. **Un voto por persona y canción** (`unique(daily_pick_id, member_id)`). Un trigger impide puntuar tu propia canción. Comentario ≤ 280 caracteres. |
| `member_pins` | `member_id`, `pin_hash` (bcrypt) | Sin permisos para el cliente. Solo se usa a través de funciones. |

Además:

- **`daily_picks_summary`** (vista): cada canción con `avg_score` y `ratings_count`.
- **`get_leaderboard(p_from, p_to)`** (función): ranking por rango de fechas.
- **`verify_member_pin`**, **`set_member_pin`**, **`admin_clear_member_pin`**: gestión del PIN.
- **Bucket `avatars`** (Supabase Storage): público para lectura, máx. 1 MB, solo WebP/JPEG/PNG.

Las mismas validaciones están en el frontend, con mensajes en castellano. Si alguna se salta, la base de datos la rechaza y la UI traduce el error.

---

## Decisiones de diseño

- **Nombre: "Merlin FM"**, en plan emisora interna, con "La canción del día" como subtítulo. Se cambia en [`src/lib/config.ts`](src/lib/config.ts).
- **Escala 1–4.** Así lo pedía la especificación técnica. Cuatro botones grandes (🙉 No es lo mío · 😐 Pasable · 😊 Me gusta · 🔥 ¡Temazo!) se pulsan cómodamente desde el móvil. Para volver al 1–10 de la época del Excel:
  1. Cambia `MAX_SCORE` y `SCORE_OPTIONS` en [`src/lib/scores.ts`](src/lib/scores.ts).
  2. Crea una migración nueva:
     ```sql
     alter table public.ratings drop constraint ratings_score_range;
     alter table public.ratings add constraint ratings_score_range check (score between 1 and 10);
     ```
- **Quién presenta hoy**: quien fue nominado en la **última** canción registrada. Así los fines de semana y festivos no rompen la cadena.
- **"¿X no está hoy? Presento yo"**: si la persona nominada falta, cualquiera puede tomar el relevo desde la portada. Por eso la base de datos no obliga a que presente la persona nominada. La restricción de "solo presenta quien le toca" vive en la interfaz.
- **Primera canción de la historia**: si no hay ninguna canción previa, cualquiera puede estrenar la tradición.
- **Votos ocultos hasta que votas**: para no condicionar a nadie, las notas del resto se ven después de puntuar. Quien presenta las ve siempre.
- **Quien presenta no puntúa su canción** (trigger en base de datos).
- **Se puede puntuar tarde** desde el histórico. La canción solo la edita quien presenta, y solo el mismo día.
- **Miembros inactivos** en lugar de borrados: desaparecen de los selectores pero conservan su histórico y su sitio en el ranking.
- **Fotos de perfil**: son opcionales, y quien no sube foto conserva el emoji como avatar. Al elegir una foto aparece un encuadre circular: se arrastra para moverla y se amplía con la barra, la rueda del ratón o el teclado (flechas y +/−). De entrada sale centrada y algo subida en fotos verticales, que es donde suele estar la cara. El navegador reduce el recorte a 320 px y la convierte a WebP (o JPEG) antes de subirla, así que una foto de móvil de varios MB se queda en pocos KB. Cada subida usa un nombre nuevo, para no pelearse con la caché, y la foto anterior se borra del bucket. Como no hay login, cualquiera con la app puede subir o borrar fotos del bucket.
- **Identidad**: se guarda el id del miembro en `localStorage` (`merlin-fm:member-id`). Se cambia desde el menú de la cabecera.
- **PIN opcional (4 dígitos)**: se guarda con bcrypt en una tabla que el cliente no puede leer. Se pide al elegir un perfil protegido. Cualquiera puede quitar un PIN desde `/admin` (para olvidos): **la seguridad no es un objetivo**. La API es pública con la clave anónima, y alguien con conocimientos podría escribir directamente. Para algo más serio habría que pasar a Supabase Auth.
- **Ranking**: la media es sobre **todas** las notas recibidas (no la media de medias por canción). Hay desempate por nº de votos. Quien no tiene votos en el periodo aparece aparte.
- **Refresco automático**: al volver a la pestaña (p. ej. la dejaste abierta ayer) se recargan los datos.
- **Tiempo real y avisos de escritorio**: la app escucha los cambios de `daily_picks` con Supabase Realtime y se refresca sola. Si la nueva nominación es para ti y has activado los avisos (menú de usuario → *Avisarme cuando me nominen*), te llega una notificación del sistema, una sola vez por canción. Funciona mientras la app esté abierta, aunque sea en segundo plano. Con la app cerrada harían falta Web Push y un servidor que los envíe.
- **Tu turno**: el día que te toca aparece *"¡Hoy es tu turno de recomendar una canción!"* junto a tu usuario en la cabecera (en móvil, como franja bajo ella) y en la baldosa de *Hoy presenta*.
- **Carátulas**: `/api/cover` busca la portada de cada canción: la de Spotify (oEmbed) si el enlace es de Spotify; si no, la del catálogo de Apple Music por título y artista; y como último recurso, la miniatura del vídeo de YouTube. Redirige a la imagen y se cachea una semana. Si no encuentra nada, se ve una nota musical.
- **Spotify y YouTube**: al publicar solo se pide el enlace de Spotify. Cada canción muestra los logos de las dos plataformas: Spotify abre el enlace (o una búsqueda si no lo hay) y YouTube pasa por `/api/youtube`, que redirige al primer vídeo del buscador para "título artista". No hay API de YouTube sin clave, así que se lee la página de resultados: si YouTube la cambia, se abre la búsqueda sin más. Las canciones antiguas con enlace de YouTube lo conservan.
- **Pie de página**: una línea azul de marca y una fila por persona que hizo la app, alineada a la izquierda: su nombre y el icono de GitHub como enlace (`AUTHORS` en [`src/lib/config.ts`](src/lib/config.ts)).
- **Listas largas**: la lista del equipo en `/admin` y los comentarios de cada canción van en un contenedor con scroll vertical que muestra 10 elementos. Al final hay un botón *Ver más* que despliega el resto.
- **Votación interactiva**: pulsar una barra del reparto (p. ej. la del 4) filtra los comentarios por esa nota, y pulsarla otra vez quita el filtro. El número de votos abre la lista de quién ha votado, y la media abre la nota de cada persona con la cuenta que da esa media.
- **Géneros del resumen semanal**: no se guardan en la base de datos. Se deducen del catálogo de Apple Music al mostrar el resumen, con las búsquedas cacheadas una semana. Las canciones que Apple no conoce no cuentan.
- **Modo claro y oscuro**: botón sol/luna en la cabecera. Sin elección guardada se sigue el tema del sistema. En lugar de añadir `dark:` a cada clase, el modo oscuro redefine la paleta en [`globals.css`](src/app/globals.css): grises invertidos, azules de texto más claros y fondos en `surface`. Los degradados con texto blanco usan `deep-*`, que no cambia de un tema a otro.

---

## Estructura

```
supabase/
  migrations/            SQL versionado (esquema, RLS, funciones)
  seed.sql               Miembros iniciales del equipo
src/
  app/                   Rutas: / · /ranking · /historico · /historico/[id] · /admin
  components/
    identity/            Provider de identidad, selector, PIN, menú de usuario
    picks/               Tarjeta de canción, reproductor, formulario, detalle
    ratings/             Formulario 1–4, panel, lista y reparto de votos
    leaderboard/         Podio y lista del ranking
    today/               Vista de portada y baldosas de turno
    admin/               Gestión del equipo
    ui/                  Primitivas: Button, Card, Field, Modal, SegmentedLinks
  lib/
    queries.ts           Lecturas (Server Components)
    mutations.ts         Escrituras (cliente) + traducción de errores
    dates.ts             "Hoy" en Europe/Madrid, formatos en castellano
    music.ts             Detección y embed de Spotify / YouTube, enlaces de escucha
    covers.ts            Búsqueda de carátulas (Spotify, Apple Music, YouTube)
    scores.ts            Escala de puntuación
    config.ts            Nombre de la app, emojis y colores
```

## Scripts

| Comando | |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipos de rutas + `tsc` |
