# Lienzo de diseño (mockups móviles)

Archivos fuente del rediseño móvil, para iterar en la skill `/design` de Claude Code.

- `*.dc.html` — una pantalla por archivo (Design Component). `Main.dc.html` es Resumen.
- `canvas.json` — disposición de las pantallas en el lienzo.
- `logo.svg` — copia del logo de marca (misma que `apps/web/public/logo.svg`).

Para publicar/actualizar el lienzo se regenera `presupuesto-app-movil.html` (ignorado, ~2,5 MB)
con `seed-canvas.mjs` y se sube como Artifact. Estos archivos son solo la referencia
visual; la implementación real está en `apps/web`.
