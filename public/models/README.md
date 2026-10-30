# 3D models

This folder is empty on purpose.

Every building in the current site is generated procedurally in code
(`lib/three/builders/`), so the project ships no model files.

To replace a concept with a professionally authored model:

1. Export the model as a compressed glTF binary (`.glb`) with Draco or
   Meshopt geometry compression and KTX2 textures where possible. Aim for
   under 8 MB for the hero.
2. Save it here, for example `public/models/residential.glb`.
3. Follow "Replacing the procedural models" in the main README.
