le # ROADMAP — Guess the Model

_État vivant + prochaines étapes. `CLAUDE.md` = architecture durable ; ce fichier = où on en est et quoi faire ensuite. Pour reprendre après un /compact ou /clear : lire `CLAUDE.md` + ce fichier._

## État actuel

- Stack **Next 16 + R3F** opérationnelle, build vert. Page d'accueil = **garage carrousel** (← / →).
- **Registre auto-généré** : `scripts/generate-registry.mjs` → `src/lib/cars.ts` (`BRANDS → models → variants`). Régénérer : `node scripts/generate-registry.mjs` (ou `npm run generate:registry`). **NE PAS éditer `cars.ts` à la main.**
- **7 marques · 77 modèles · 233 variantes.** GLB RAW dans `public/models/<marque>/<Modèle>/<variante>.glb` (~2,7 Go, **non optimisés**).
- `CarModel` = loader GLB (auto-scale + pose au sol, clone du cache). `Scene` **ne précharge que les voisins** (jamais tout — scalable à des centaines).
- Listes de référence par marque : `public/models/<marque>/MODELS.md`.
- **Aucun vrai doublon** (vérifié md5). 2 fichiers `(1)` (Huracan evo/sterrato) = contenus distincts → gardés (à renommer éventuellement).

## PIVOT majeur : le musée = **embeds Sketchfab** (plus de GLB local pour le musée)

**Décision user (validée)** : musée **100 % Sketchfab** (auteur **Ddiaz Design**, collections « base models » par marque). Sketchfab rend/streame en qualité max → zéro lag, zéro optimisation, **vignettes gratuites** via son CDN. On perd le offline + risque de link-rot (assumé). Le **quiz** gardera la 3D locale (un embed affiche le nom → spoil).

- Sync : `npm run sync:sketchfab -- <brandId> <collectionUid>` → `src/content/sketchfab/<brand>.json` (clé = **id de variante**, match par nom normalisé). Overrides possibles : `src/content/sketchfab/<brand>.overrides.json` (`variantId → uid`). Loader : `src/content/sketchfab.ts`.
- Ferrari : collection `e82e32907e864ec88a9c903bb662afb4`, **62/62 variantes mappées**.

## Pôle FERRARI (musée) — v1 FAITE ✅

1. [x] **Variante de base** : `baseVariantId` (heuristique `basePenalty` + override `src/lib/base-variants.json`). `baseVariant()` + `VARIANT_MAP`.
2. [x] **Specs** : `src/content/specs/ferrari.json` (33 bases) via `src/content/specs.ts`. Hand-authored.
3. [x] **Sketchfab** : mapping 62/62, composant `SketchfabEmbed`, vignettes cartes.
4. [x] **Routes musée** : `/musee` (grille marques + logos + cover) → `/musee/[brand]` (grille chrono + vignettes) → `/musee/[brand]/[model]` (embed héros + titre serif + chips variantes + tableau specs + histoire + modèles liés). `generateStaticParams`, `params` typés main. Build 7 s / 89 pages.
5. [x] **UX** : direction éditoriale vecarz — fond noir, **serif Playfair** (titres), glassmorphism, `motion`. `BrandLogo` (fichier `public/logos/<id>.svg` sinon fallback typo).

### Décisions en attente / à valider

- **Logos** : déposer les fichiers dans `public/logos/<marque>.svg` (Ferrari, Porsche, …) — le fallback typo s'affiche en attendant. (User n'a pas tranché fichiers vs monogrammes ; slots + fallback en place.)
- **Prix / production / anecdotes** Ferrari = brouillon à relire (prix `≈`). **Chevaux fiscaux** vides → à remplir main dans `ferrari.json`.
- **Base Testarossa** : heuristique = 1984 F110 ; pour la classique 1988 → override `base-variants.json` + `npm run generate:registry`.
- Le musée n'utilise plus les GLB → l'**optimisation GLB** ne concerne plus que le futur quiz (2,7 Go gardés pour ça).

## Backlog

- **Curer les autres marques** sur Sketchfab (Ddiaz Design a des collections « base models » quasi partout) : `npm run sync:sketchfab -- porsche <uid>`, etc. + specs par marque.
- **Quizz** (boucle QCM, base uniquement, 3D locale R3F — pas d'embed).
- Enrichir les specs (dimensions/poids/transmission façon vecarz) — champs optionnels à ajouter au type `CarSpecs`.
- Déploiement LAN/local (Docker/Caddy) — fin. Usage **privé** (`CLAUDE.md` → IP posture).
