# ROADMAP — Guess the Model

_État vivant + prochaines étapes. `CLAUDE.md` = architecture durable ; ce fichier = où on en est et quoi faire ensuite. Pour reprendre après un /compact ou /clear : lire `CLAUDE.md` + ce fichier._

## État actuel

- **FULL SKETCHFAB** : plus un seul asset 3D local dans le projet. Tout (musée **et** garage d'accueil) streame depuis les collections « base models » de **Ddiaz Design**.
- **5 marques · 118 modèles · 352 variantes**, couverture 3D 100 % par construction.
  Ferrari 35 · Lamborghini 26 · BMW 31 · Porsche 16 · Bugatti 10.
- Stack : **Next 16 + React 19 + Tailwind 4 + motion**. `three` / R3F / gltf-transform / leva : **désinstallés**.
- Catalogue : `npm run build:museum` → `src/content/museum/<marque>.json`. Reproductible (rebuild ⇒ JSON byte-identiques). Config : `collections.json`. Regroupement : `seeds.json`. Variante de base forçable : `base-variants.json`.
- **Garde-fou** : `build:museum` sort en erreur (exit 1) si une clé de `src/content/specs/*.json` ne correspond plus à aucune variante — la dérive d'ids ne peut plus casser les fiches en silence.
- Routes : `/` garage carrousel (poster Sketchfab → fondu vers la 3D live, débounce 420 ms, un seul viewer monté) · `/musee` → `/musee/[marque]` → `/musee/[marque]/[modèle]`. `npx tsc --noEmit` et `npm run lint` verts, 9/9 routes en 200.

## Pivot full Sketchfab — FAIT ✅ (25/07/2026)

Le musée était déjà Sketchfab ; cette étape a fini le travail côté accueil et a retiré le pipeline local.

1. [x] `seeds.json` figé depuis `cars.ts` **avant** sa suppression → ids musée stables, 33/33 specs Ferrari intactes.
2. [x] Garage d'accueil réécrit en Sketchfab : `src/content/showcase.ts` (liste plate, marques **entrelacées** → deux voisins ne sont jamais de la même marque) + `src/components/garage/GarageShowcase.tsx`. La page est un Server Component : le JSON catalogue ne part pas dans le bundle client.
3. [x] `SketchfabEmbed` généralisé et déplacé dans `src/components/sketchfab/` (plus seulement musée). Props : `cameraDistance`, `uiTheme`, `autospin`, `entranceAnimation`, `maxTextureSize`, `onReady`.
4. [x] **Paramètres d'embed corrigés** : `preload` passé à 0 (Sketchfab le déconseille — plante iOS), `camera=0` sur l'accueil, `annotations_visible=0` (gratuit) à la place de `ui_annotations=0` (Premium), `max_texture_size=2048` sur le carrousel.
5. [x] **Fuite de listener corrigée** : le viewer 1.12.1 retire son listener de bootstrap mais jamais celui du client → 1 listener `message` fuité par voiture vue. Désormais dé-abonné au démontage.
6. [x] Supprimés : `public/models/` (2,7 Go), `downloads/` (99 Mo), `src/lib/cars.ts`, `garage.ts`, `base-variants.json`, `src/components/three/*`, `GarageControls`, `scripts/{generate-registry,optimize-car,organize_models}`, `public/decoders/`, et les deps `three` · `@types/three` · `@react-three/{fiber,drei,postprocessing}` · `@gltf-transform/cli` · `leva`.
7. [x] Archivés : les listes de curation par marque → `docs/reference-models/` (elles étaient dans `public/models/`).

### Récupération, si besoin

Les 241 fichiers de `public/models/` **étaient versionnés** (la règle `/public/models/` du `.gitignore` n'a jamais pris effet : les fichiers avaient été ajoutés avant). Donc `git checkout HEAD -- public/models` les restaure tant que l'historique n'est pas réécrit. C'est aussi pour ça que `.git` pèse **1,3 Go** : pour récupérer ce Go pour de vrai il faudrait réécrire l'historique (`git filter-repo`) — décision destructive séparée, non prise.

## Décisions en attente / à valider

- ⚠️ **Le quiz n'a plus de solution évidente.** `ui_infos=0` (masquer le nom du modèle) est **Premium**, et vérifié : sur un modèle appartenant à un compte basic la demande est **réécrite côté serveur en `uiInfos:true`** — le paramètre ne marche pas, ce n'est pas qu'une question de CGU. Un embed Sketchfab **affiche donc la réponse**. Options : (a) plan Sketchfab Premium, (b) quiz sur des **vignettes recadrées** (détail de phare/jante) plutôt que de la 3D live, (c) rogner géométriquement l'iframe sous la barre d'infos (limite CGU), (d) réintroduire des GLB locaux **pour le quiz seul** (récupérables depuis git, cf. ci-dessus). À trancher avant de coder la boucle QCM.
- **Coup d'œil visuel à donner** sur `/` : le `cameraDistance={1.05}` de l'accueil et le `0.7` du musée n'ont pas été validés à l'œil (pas d'outil navigateur dans la session). Note : `0.7` **rapproche** la caméra — l'ancien commentaire du code prétendait l'inverse.
- **Logos** : seul `public/logos/ferrari.svg` existe ; les 4 autres marques affichent le fallback typo. Déposer `public/logos/<marque>.svg`.
- **Specs** : seule Ferrari est renseignée (33 bases). Manquent `ferrari-430--2008-ferrari-430-scuderia` et `ferrari-ff--2012-ferrari-ff`. **Chevaux fiscaux** toujours vides. Prix/production/anecdotes = brouillon à relire (prix `≈`).
- **Base Testarossa** : l'heuristique choisit la 1984 F110 ; pour la classique 1988 → ajouter la paire dans `src/content/museum/base-variants.json` + `npm run build:museum`.
- **Groupe `ferrari-430`** : la 430 Scuderia forme son propre modèle (dérivé du fallback) au lieu de rejoindre `ferrari-f430`. Fusionnable en ajoutant « F430 » aux seeds, **mais ça change des ids** → à faire dans le même commit qu'un re-keying des specs, jamais à la légère.
- `gsap` / `@gsap/react` / `lenis` sont installés mais **inutilisés** (prévus pour les cinématiques au scroll). `zustand` ne sert qu'au squelette `src/lib/store.ts` (quiz), lui aussi sans consommateur.

## Backlog

- Curer les autres marques : ajouter l'uid de collection Ddiaz dans `collections.json` + `npm run build:museum`, puis écrire les specs.
- **Quizz** (boucle QCM) — dépend de la décision « spoiler » ci-dessus.
- Enrichir les specs (dimensions/poids/transmission façon vecarz) — champs optionnels à ajouter au type `CarSpecs`.
- Déploiement LAN/local (Docker/Caddy) — fin. Usage **privé** (`CLAUDE.md` → IP posture). Rappel : full Sketchfab ⇒ **aucun mode hors-ligne**.

## UID collections Ddiaz

ferrari `e82e32907e864ec88a9c903bb662afb4` · lamborghini `8b38b8a6578f4fabb302e605a1ba6e53` · porsche `14cb80db95d6422a9187ba52ac1299ed` · bmw `c707bb093b9c433180439b9c96b618d5` · bugatti `08ae330925324dfc9edb8077537b7081`
