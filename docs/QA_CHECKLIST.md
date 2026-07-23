# Checklist de QA

## Funcional

- [ ] Crear sala en cada modo con catálogo suficiente.
- [ ] Código de 6 caracteres sin símbolos ambiguos.
- [ ] QR de ingreso abre la sala correcta.
- [ ] Nombres duplicados se rechazan.
- [ ] Sala llena se rechaza.
- [ ] Dos o más jugadores listos inician automáticamente.
- [ ] QR del DJ solo funciona para la ronda actual.
- [ ] El primer escaneo inicia el tiempo; escaneos repetidos no reinician el reloj.
- [ ] Cada jugador puede cambiar de posición antes del deadline.
- [ ] No se aceptan respuestas tardías.
- [ ] Mismo año acepta posiciones dentro del bloque.
- [ ] Exacto inserta carta; fallo no la inserta.
- [ ] Puntaje y rachas coinciden con configuración.
- [ ] Revelación dura el tiempo configurado.
- [ ] La partida termina e inserta resultados una sola vez.

## Seguridad

- [ ] Service role no aparece en bundles cliente.
- [ ] Jugador no puede consultar `songs` directamente.
- [ ] Jugador no ve respuestas de otros.
- [ ] No administrador recibe 403 en `/api/songs`.
- [ ] RPC críticas no son ejecutables con anon/authenticated.
- [ ] RLS permanece activada en todas las tablas públicas.

## Dispositivos

- [ ] iPhone Safari.
- [ ] Android Chrome.
- [ ] Tablet vertical y horizontal.
- [ ] TV/laptop a 1366×768 y 1920×1080.
- [ ] Conexión móvil lenta y reconexión.
- [ ] Modo de movimiento reducido.

## Producción

- [ ] Anonymous Sign-Ins protegido con CAPTCHA.
- [ ] Logs y alertas de errores.
- [ ] Política de privacidad y términos.
- [ ] Revisión de marca y licencias musicales.
- [ ] Backups y recuperación de Supabase.
