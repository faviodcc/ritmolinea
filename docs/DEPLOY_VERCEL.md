# Despliegue en Vercel

## Desde GitHub

1. Sube el repositorio a GitHub.
2. En Vercel, selecciona **Add New → Project**.
3. Importa el repositorio.
4. Vercel detectará Next.js automáticamente.
5. Agrega las variables de `.env.example` en Settings → Environment Variables.
6. Marca `SUPABASE_SERVICE_ROLE_KEY` como sensible.
7. Despliega.

## Variables por entorno

Configura Development, Preview y Production según corresponda:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Después de cambiar una variable, vuelve a desplegar.

## Supabase Auth

Actualiza Authentication → URL Configuration:

- Site URL: `https://tu-dominio.com`
- Redirect URLs: `https://tu-dominio.com/**`
- Añade también el dominio `*.vercel.app` de previews si los usarás para probar autenticación.

## Dominio propio

En Vercel → Settings → Domains, agrega tu dominio y sigue los registros DNS indicados. Usa siempre HTTPS: los QR del DJ y las sesiones móviles dependen de un origen seguro.

## Verificación posterior

1. Abre `/profile` y confirma que se crea una sesión.
2. Crea una partida.
3. Únete desde dos celulares.
4. Marca ambos como listos.
5. Escanea el QR del DJ.
6. Comprueba temporizador, respuesta, revelación y siguiente ronda.
7. Termina una partida corta de 3 rondas y verifica `/stats`.
