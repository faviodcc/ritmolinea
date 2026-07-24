# RitmoLínea 1.2 — actualización

Esta actualización incorpora:

- Inicio manual con un botón visible **INICIAR JUEGO** en la pantalla del anfitrión.
- Inicio habilitado cuando existen al menos dos jugadores; el estado «listo» ya no inicia la sala automáticamente.
- 57 canciones latinas adicionales. La base queda con 119 canciones registradas y 115 activas después de desactivar las cuatro canciones de anime del paquete original.
- Los modos Fiesta y Aleatorio generan una selección aproximada de 78 % música latina y 22 % canciones internacionales.
- Se elimina el modo Anime y las canciones de anime dejan de entrar en partidas nuevas.
- La respuesta del título se compara únicamente contra el nombre de la canción. El artista o los autores no son necesarios.
- La comparación acepta mayúsculas, minúsculas, tildes, signos, textos entre paréntesis y pequeñas diferencias de escritura.
- Corrección y validación de la posición cronológica, incluyendo canciones con el mismo año.
- La posición seleccionada se conserva al desplazar la pantalla, al actualizarse Realtime y al recuperar el foco del navegador.
- Las zonas de la línea temporal se pueden tocar o usar mediante arrastre.

## Instalación desde Codespaces

1. Coloca el ZIP de actualización en la raíz del repositorio, junto a `package.json`.
2. Ejecuta:

```bash
unzip -o ritmolinea-update-v1.2-manual-start-latin-fixes.zip
```

3. Abre `supabase/migrations/004_manual_start_latin_library_and_answer_fixes.sql`, copia todo y ejecútalo una vez en **Supabase → SQL Editor**.
4. Guarda los cambios:

```bash
rm ritmolinea-update-v1.2-manual-start-latin-fixes.zip
git add .
git commit -m "RitmoLinea 1.2 inicio manual y biblioteca latina"
git push
```

5. Espera a que el nuevo despliegue de Vercel aparezca como **Ready**.
6. Prueba con una partida nueva. Las colas de partidas antiguas ya fueron generadas y no se reconstruyen.

No es necesario cambiar las variables de entorno de Vercel.
