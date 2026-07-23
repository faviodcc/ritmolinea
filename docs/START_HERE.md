# Puesta en marcha paso a paso

## A. Abrir el proyecto

1. Descomprime la carpeta.
2. Ábrela en Visual Studio Code.
3. Instala Node.js 20.9 o superior.
4. Abre una terminal dentro de la carpeta `ritmolinea`.

## B. Crear Supabase

1. Crea un proyecto nuevo en Supabase.
2. En **Authentication → Providers**, activa:
   - Anonymous Sign-Ins.
   - Email/Password.
   - Manual identity linking para convertir invitados sin perder su perfil.
3. En **Project Settings → API**, copia:
   - Project URL.
   - Publishable key.
   - Service role key.

## C. Crear la base de datos

En Supabase → **SQL Editor**, ejecuta en este orden:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_hardening_and_achievements.sql`
3. `supabase/seed.sql`

La segunda migración también crea el bucket público `song-covers` con restricciones de tipo y tamaño.

## D. Configurar variables

1. Duplica `.env.example`.
2. Cambia el nombre de la copia a `.env.local`.
3. Completa:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...
```

Nunca publiques `.env.local` ni pongas la service role con prefijo `NEXT_PUBLIC_`.

## E. Ejecutar localmente

```bash
npm install
npm run validate:library
npm run validate:static
npm run typecheck
npm run test
npm run dev
```

Abre `http://localhost:3000`.

## F. Crear el administrador

1. Entra a `/profile`.
2. Vincula y verifica tu correo.
3. Copia el UUID de tu usuario en Supabase → Authentication → Users.
4. Ejecuta:

```sql
update public.profiles
set role='admin'
where id='TU_UUID';
```

5. Recarga `/library`.

## G. Primera prueba completa

1. Crea una partida de 3 rondas en modo Perú, Disney o Anime.
2. Abre el QR de ingreso en dos celulares.
3. Escribe nombres distintos, elige avatares y marca ambos como listos.
4. Usa un tercer teléfono conectado al parlante para escanear el QR del DJ.
5. Confirma que Spotify abre la pista y el contador comienza.
6. Arrastra la carta en ambos celulares.
7. Verifica revelación, puntuación, racha y avance automático.
8. Termina la partida y revisa `/stats`.

## H. Publicar en Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. Importa el repositorio en Vercel.
3. Agrega las tres variables de entorno.
4. Despliega.
5. En Supabase Auth, agrega tu dominio de Vercel a Site URL y Redirect URLs.
6. Prueba nuevamente con dos celulares y el teléfono DJ.
