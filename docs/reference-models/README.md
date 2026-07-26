# Listes de référence par marque

Rescapées de `public/models/<marque>/MODELS.md`, supprimé avec les 2,7 Go de GLB
lors du passage **full Sketchfab** (le musée est construit depuis les collections
Sketchfab de Ddiaz Design — voir `CLAUDE.md`).

Elles ne servent plus à suivre des imports de fichiers : ce sont désormais des
**listes de curation** — quels modèles d'une marque méritent d'être au musée,
classés par notoriété. Utile pour repérer ce qui manque dans une collection
Sketchfab, et pour prioriser les specs à écrire à la main dans
`src/content/specs/<marque>.json`.

Les coches « ✅ importé » et les chemins `.glb` sont **obsolètes** — ignorés.

`_local-glb-credits.md` est l'ancien registre de provenance des GLB locaux,
gardé pour mémoire. L'attribution des modèles 3D vient maintenant directement de
l'API Sketchfab (auteur + licence stockés dans `src/content/museum/<marque>.json`
et affichés sur la fiche modèle).
