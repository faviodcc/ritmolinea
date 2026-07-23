# Configuración de Supabase

## 1. Crear proyecto

Crea un proyecto nuevo y guarda:

- Project URL
- Publishable key
- Service role key

## 2. Authentication

En Authentication → Providers:

- Activa Anonymous Sign-Ins.
- Activa Email/Password si usarás perfiles permanentes.
- Activa el enlace manual de identidades para permitir que un invitado vincule su correo sin perder su UUID ni sus estadísticas.
- Configura Site URL con tu dominio de producción.
- Añade `http://localhost:3000/**` como redirect URL para desarrollo.

Para producción pública, habilita CAPTCHA o Cloudflare Turnstile para reducir abuso de altas anónimas.

## 3. Base de datos

Con Supabase CLI:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
supabase db seed
```

Alternativa: copia y ejecuta en SQL Editor, en orden:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_hardening_and_achievements.sql`
3. `supabase/seed.sql`

## 4. Primer administrador

1. Crea una cuenta desde `/profile`.
2. Ubica su UUID en Authentication → Users.
3. Ejecuta:

```sql
update public.profiles set role='admin' where id='UUID';
```

## 5. Realtime

La migración añade automáticamente:

- `games`
- `game_players`
- `game_rounds`
- `round_answers`
- `player_cards`

Si la publicación ya contiene una tabla y Supabase devuelve un error al migrar, verifica la publicación `supabase_realtime` y elimina únicamente el `alter publication` duplicado correspondiente.

## 6. Storage de portadas

La migración `002_hardening_and_achievements.sql` crea el bucket público `song-covers` con límite de 5 MB y formatos JPG, PNG y WebP. Las subidas pasan por `/api/library/image`, exigen rol administrador y se realizan exclusivamente con `service_role`; el navegador nunca recibe esa clave.

## 7. Limpieza de invitados

La función `cleanup_old_anonymous_profiles(days_old)` elimina usuarios anónimos antiguos. Solo `service_role` puede ejecutarla. Puedes programarla semanalmente con pg_cron en planes que lo permitan.
