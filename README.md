# RitmoLínea

Party game musical multijugador para jugar presencialmente con una pantalla central, celulares como controles y un teléfono dedicado a Spotify.

## Qué incluye

- Pantalla principal para TV/laptop y experiencia móvil separada.
- Creación de salas con código y QR.
- Sesiones anónimas de Supabase Auth para invitados.
- Realtime para lobby, rondas, respuestas, puntuación y revelaciones.
- QR de DJ seguro: registra el escaneo, inicia el tiempo y redirige a Spotify.
- Línea del tiempo con drag-and-drop táctil.
- Puntaje 100 / 70 / 40 / 0 y rachas +20 / +40 / +60.
- Carta inicial, inserción automática al acertar y descarte al fallar.
- 15 modos de juego configurables.
- Biblioteca CRUD con portadas en Supabase Storage, importación y exportación JSON.
- Perfiles, avatares, temas, logros, estadísticas y ranking histórico.
- RLS, tokens de escaneo aislados, funciones SQL idempotentes, cola de canciones y rutas server-side protegidas.
- Manifest web, diseño responsive y configuración para Vercel.

## Stack

- Next.js App Router + TypeScript
- React
- Supabase Postgres, Auth y Realtime
- `@dnd-kit` para drag-and-drop
- QRCode React
- Canvas Confetti
- CSS propio, sin Bootstrap

## Inicio rápido

1. Crea un proyecto en Supabase.
2. Activa **Anonymous Sign-Ins** en Authentication → Providers.
3. Instala Supabase CLI y vincula el proyecto, o ejecuta manualmente los archivos de `supabase/migrations` en orden.
4. Ejecuta `supabase/seed.sql` para cargar la biblioteca demo.
5. Copia `.env.example` a `.env.local` y completa las claves.
6. Instala dependencias y ejecuta:

```bash
npm install
npm run dev
```

7. Abre `http://localhost:3000`.

Empieza por [docs/START_HERE.md](docs/START_HERE.md). También tienes [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md), [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) y [docs/VALIDATION_REPORT.md](docs/VALIDATION_REPORT.md).

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` nunca debe llevar el prefijo `NEXT_PUBLIC_` ni usarse en componentes cliente.

## Crear el primer administrador

Vincula y verifica una cuenta desde `/profile`, copia el UUID del usuario y ejecuta:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_DEL_USUARIO';
```

Después podrás abrir `/library` y administrar canciones.

## Flujo del teléfono DJ

La TV muestra un QR por ronda. Al escanearlo:

1. La ruta `/scan/[token]` valida el token en el servidor.
2. Supabase cambia la ronda a `answering` y fija el deadline.
3. Realtime actualiza TV y celulares.
4. El teléfono es redirigido al enlace de Spotify.

Los sistemas móviles pueden exigir tocar **Play** dentro de Spotify; el navegador no puede garantizar autoplay en una app externa. El enlace sí abre la canción exacta cuando el catálogo contiene un URL de pista válido.

## Biblioteca demo

`data/songs.sample.json` contiene 62 canciones de prueba con enlaces de pista. La propiedad intelectual del audio y las portadas permanece en sus respectivos titulares; RitmoLínea no almacena ni retransmite audio.

La biblioteca incluye una selección inicial para Perú, Disney y Anime. Cada uno permite una partida demo corta; para partidas más largas, importa más canciones desde el administrador. La creación de partida valida que haya al menos `rondas + 1` canciones elegibles.

## Comandos

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
npm run validate:library
npm run validate:static
```

## Limitaciones operativas deliberadas

- Spotify es una app externa; no se incorpora su audio ni se eluden sus controles.
- El navegador del anfitrión orquesta el cierre y avance automático de rondas. Debe permanecer abierto durante la partida.
- Para producción pública, añade CAPTCHA/Turnstile al alta anónima y observabilidad de errores.

## Licencia

Código del proyecto bajo MIT. El nombre, identidad visual y catálogo musical deben revisarse legalmente antes de un lanzamiento comercial.
