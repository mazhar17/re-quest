# RE Quest · Renewable Energy Systems

An offline, self-contained gamified undergraduate Renewable Energy course companion.

Open `renewable-energy-quest.html` in any modern browser. It covers energy foundations, solar PV, solar thermal/CSP, wind, hydropower, ocean energy, bioenergy, geothermal energy, and storage/system design.

The revised interface uses flat 2D technical vector schematics, interactive response charts, and labelled block diagrams on a white background. Nine numbered topic panels retain the original course coverage, assumptions, and limitations. Numerical displays use SI units, including MJ, kW, s, and K. All physical equations define their variables and units. A Key Points strip closes each view.

The lecture-graphics edition includes eight figures extracted from the lecturer-provided ME4011 PDFs. Each figure was cropped and vector-traced, with source colours reduced to neutral tones, blue, and orange on white. Plant/equipment geometry and original technical labels are retained; decorative vegetation was removed from the digester illustration. The source material is identified in `LECTURE-FIGURE-SOURCES.md` and inside the game. The PDFs were not modified.

Click a lecture figure to enlarge it. In a topic section, select a component label to highlight its location and display its function. The comparison note explicitly distinguishes the detailed source plant from the simplified calculator where needed. All graphics remain embedded in the standalone HTML.

There are no living figures, character graphics, religious references, decorative ornamentation, external runtime dependencies, accounts, trackers, or music. Blue and restrained orange are the only accent colours.

`index.html` and `renewable-energy-quest.html` are identical standalone files. Uploading `index.html` alone is sufficient to run the complete game.

## Publishing with GitHub Pages

If the repository already publishes its root through GitHub Pages, upload this folder beneath that root; the game will be available at `/re-quest/`. For a new Pages repository, place `index.html` in its published root (root or `/docs` for branch-based publishing). Alternatively, configure a Pages workflow to upload `re-quest` as its site artifact. GitHub Pages branch-based publishing does not offer an arbitrary `/re-quest` source directory.
