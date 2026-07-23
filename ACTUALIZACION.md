# Actualización RitmoLínea 1.1

Incluye dos cambios:

1. Sincronización automática de cada ronda mediante Realtime + respaldo de actualización cada segundo.
2. Cada jugador debe escribir el título y colocar la canción en la línea temporal. El título correcto suma 50 puntos adicionales.

## Orden de instalación

1. Extraer este ZIP sobre la raíz del repositorio usando `unzip -o`.
2. Ejecutar en Supabase SQL Editor todo el archivo `supabase/migrations/003_title_guess_and_live_sync.sql`.
3. Guardar y subir a GitHub con `git add .`, `git commit` y `git push`.
4. Esperar el nuevo despliegue de Vercel y crear una partida nueva.
