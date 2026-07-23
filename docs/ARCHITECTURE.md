# Arquitectura de RitmoLínea

## Clientes

### Pantalla central (`/host/[code]`)

- Propiedad de `games.host_user_id`.
- Ve todos los jugadores y respuestas reveladas.
- Muestra el QR de ingreso y el QR del DJ.
- Orquesta dos transiciones idempotentes:
  - `answering → revealed` al vencer el deadline.
  - `revealed → siguiente ronda/final` al terminar la revelación.

### Jugador (`/play/[code]`)

- Se autentica como usuario anónimo o permanente.
- Solo recibe su fila de jugador, su respuesta y sus cartas mediante RLS.
- Usa drag-and-drop táctil para enviar un índice de inserción.

### Teléfono DJ (`/scan/[token]`)

- No necesita sesión ni se registra como jugador.
- El token aleatorio identifica una ronda concreta.
- La ruta server-side ejecuta `mark_round_scanned` con service role y redirige a Spotify.

## Backend

### Postgres

Tablas principales:

- `games`: configuración y estado global.
- `game_players`: participantes, score y rachas.
- `game_song_queue`: selección inmutable de canciones por partida.
- `game_rounds`: estado y temporización de la ronda.
- `game_round_scan_tokens`: token secreto aislado del payload Realtime.
- `round_answers`: posición, distancia y puntaje.
- `player_cards`: línea del tiempo adquirida.
- `songs`: biblioteca administrable.
- Supabase Storage (`song-covers`): portadas subidas por administradores.
- `profiles`, `achievements`, `player_achievements`, `game_results`.

### Funciones transaccionales

- `start_game_by_code`
- `mark_round_scanned`
- `submit_round_answer`
- `resolve_round_by_code`
- `advance_game_by_code`

Son `SECURITY DEFINER`, están revocadas para `anon` y `authenticated`, y solo las ejecuta el backend con `service_role`.

### Realtime

Las tablas de juego se añaden a `supabase_realtime`. Los clientes escuchan cambios y vuelven a consultar `/api/games/[code]/state`; la API filtra el payload según rol.

## Privacidad

- La tabla `songs` no es legible por jugadores.
- Antes de la revelación, el host recibe solo `scan_url`, no el Spotify URL. El token vive en una tabla sin políticas de lectura para clientes y nunca se publica por Realtime.
- El jugador no recibe filas de otros participantes.
- Las respuestas ajenas solo se entregan al host durante la revelación.
- Los helpers RLS usan `SECURITY DEFINER` para evitar recursión entre `games` y `game_players`.

## Cálculo de posición

Para canciones del mismo año se admite cualquier índice dentro del bloque de ese año:

- `lower = cantidad de cartas con año menor`
- `upper = cantidad de cartas con año menor o igual`
- Un índice entre `lower` y `upper` es exacto.
- Fuera del rango, la distancia es el mínimo hasta cualquiera de los límites.

## Escalabilidad

- Las escrituras críticas son atómicas e idempotentes en Postgres.
- La cola evita repetir canciones en una partida.
- Los índices cubren código, rondas, respuestas, cartas, tags y filtros de canciones.
- El frontend es modular por superficie: host, player, library y UI.
