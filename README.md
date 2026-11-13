# RE Quest · Renewable Energy Systems

An offline, self-contained gamified undergraduate Renewable Energy course companion.

Open `renewable-energy-quest.html` in any modern browser. It covers energy foundations, solar PV, solar thermal/CSP, wind, hydropower, ocean energy, bioenergy, geothermal energy, and storage/system design.

The interface combines interactive 3D plant models with flat 2D technical vector schematics, interactive response charts, and labelled block diagrams on a white background. Nine numbered topic panels retain the original course coverage, assumptions, and limitations. Numerical displays use SI units, including MJ, kW, s, and K. All physical equations define their variables and units. A Key Points strip closes each view.

The lecture-graphics edition includes eight figures extracted from the lecturer-provided ME4011 PDFs. Each figure was cropped and vector-traced, with source colours reduced to neutral tones, blue, and orange on white. Plant/equipment geometry and original technical labels are retained; decorative vegetation was removed from the digester illustration. The source material is identified in `LECTURE-FIGURE-SOURCES.md` and inside the game. The PDFs were not modified.

Click a lecture figure to enlarge it. In a topic section, select a component label to highlight its location and display its function. The comparison note explicitly distinguishes the detailed source plant from the simplified calculator where needed. All graphics remain embedded in the standalone HTML.

There are no living figures, character graphics, religious references, decorative ornamentation, external runtime dependencies, accounts, trackers, or music. Blue and restrained orange are the only accent colours of the interface; natural material colours appear inside the 3D views only.

`index.html` and `renewable-energy-quest.html` are identical standalone files. Uploading `index.html` alone is sufficient to run the complete game.

## 3D plant models edition

Every section opens with a real-time 3D model generated in the browser (WebGL): campus microgrid, ground-mounted PV plant, flat-plate collectors with a parabolic-trough plant, wind turbine, reservoir hydropower scheme, tidal barrage, fixed-dome biogas digester (cutaway), binary geothermal plant (cutaway), and a battery storage system.

- Drag to orbit, use the zoom buttons, and select numbered markers to read each component's function.
- Models are animated (rotor, tidal cycle, fluid flow, gas-pressure cycle, state of charge) and respond to the section sliders, which are repeated beside the model.
- The topic panels show rendered views of the models; the opening panel and the campus design view use a live campus model that follows the design sliders.
- Animation starts paused when the device requests reduced motion. Without WebGL the 2D schematics and lecture figures are shown as before.
- Models are illustrative and not to scale; each carries a note stating what the adjustable calculator does and does not simulate.

The 3D engine is three.js r187 (MIT License, Copyright 2010-2026 three.js authors), embedded in the HTML together with the scene code, so the game remains a single offline file (about 2 MB). All geometry and textures are procedural; no image or model files are used.

## Enriched content edition

Each of the nine sections now also contains:

- **Study notes** (section x.8): four structured concept blocks, a typical-values table, two worked examples with step-by-step solutions, common misconceptions with corrections, and a key-relationships formula strip.
- **Bangladesh context** (section x.9): local resource data and installations (e.g. Karnaphuli/Kaptai hydropower, Cox's Bazar wind, IDCOL solar home systems, Sandwip tidal range, Barapukuria geothermal gradient), a local exercise, and source links. Figures are as reported by the cited sources; items marked "engineering interpretation" are explanatory.
- **Question banks**: 10 concept questions and 3 numerical problems per section (90 MCQs, 27 problems in total). Each knowledge check draws from its own pool with shuffled options; "Try a different question" and "Different problem" give fresh practice. XP rules are unchanged (900 + 100 = 1,000 XP maximum).

Two new views are added to the navigation:

- **06 · Glossary & formulas**: 50 searchable terms filterable by topic, plus a formula sheet for all sections.
- **07 · Practice exam**: untimed, randomised mixed exams (10/15/25 questions, about 20% numerical) across all or one section, with full feedback, weak-section summary, and a best score saved in the browser.

The enrichment is a separate `<script>`/`<style>` block appended at the end of the HTML; the original game code and lecture figures are untouched.

## Credit and licence

ME4011 Renewable Energy by Professor Dr. Mazharul Islam, Department of Mechanical and Production Engineering, Ahsanullah University of Science and Technology (AUST), Dhaka, Bangladesh.

Except where otherwise noted, this work is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/). Third-party lecture figures keep the attributions and licences recorded in `LECTURE-FIGURE-SOURCES.md`; the embedded three.js library is under the MIT License.

## Publishing with GitHub Pages

If the repository already publishes its root through GitHub Pages, upload this folder beneath that root; the game will be available at `/re-quest/`. For a new Pages repository, place `index.html` in its published root (root or `/docs` for branch-based publishing). Alternatively, configure a Pages workflow to upload `re-quest` as its site artifact. GitHub Pages branch-based publishing does not offer an arbitrary `/re-quest` source directory.
