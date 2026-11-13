# RE Quest 3D model sources

Readable sources for the 3D block embedded at the end of `index.html`.

- `core.js`: renderer, lighting, procedural textures, shared parts (turbine, container, transformer), viewer and thumbnail functions.
- `scenes.js`: one builder per topic (`basics`, `pv`, `thermal`, `wind`, `hydro`, `ocean`, `bio`, `geo`, `storage`, `campus`). Each returns camera, labels, `set(values)` and `update(dt)`.
- `main.js`: exposes `window.RE3D`.
- `integ.js`, `integ.css`: hook the models into the game views.

Rebuild the engine bundle (needs Node.js):

    npm install three@0.187 esbuild
    npx esbuild main.js --bundle --minify --format=iife --target=es2019 --legal-comments=none --outfile=re3d.js

Then replace the content of the second-last `<script>` block in `index.html` with `re3d.js`, the last `<script>` block with `integ.js`, and the last `<style>` block with `integ.css`; copy `index.html` to `renewable-energy-quest.html`.
