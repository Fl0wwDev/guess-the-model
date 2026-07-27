# ROADMAP — Guess the Model

_État vivant + prochaines étapes. `CLAUDE.md` = architecture durable ; ce fichier = où on en est et quoi faire ensuite. Pour reprendre après un /compact ou /clear : lire `CLAUDE.md` + ce fichier._

## État actuel

- **FULL SKETCHFAB** : plus un seul asset 3D local dans le projet. Tout (musée **et** garage d'accueil) streame depuis les collections « base models » de **Ddiaz Design**.
- **5 marques · 118 modèles · 352 variantes** (dont **347 ids uniques** — 5 doublons, cf. « Connu »), couverture 3D 100 % par construction.
  Ferrari 35 · Lamborghini 26 · BMW 31 · Porsche 16 · Bugatti 10.
- **Fiches techniques : 347/347 variantes renseignées** (100 %). Remplissage par champ : anecdote 100 % · moteur 99 % · transmission 98 % · puissance 97 % · couple 91 % · production 90 % · poids 87 % · 0-100 86 % · vitesse max 85 % · prix 59 % · **chevaux fiscaux 45 %** (volontairement omis quand ni sourcé ni calculable).
- Stack : **Next 16 + React 19 + Tailwind 4 + motion**. `three` / R3F / gltf-transform / leva : **désinstallés**.
- Catalogue : `npm run build:museum` → `src/content/museum/<marque>.json`. Reproductible (rebuild ⇒ JSON byte-identiques). Config : `collections.json`. Regroupement : `seeds.json`. Variante de base forçable : `base-variants.json`.
- **Garde-fou** : `build:museum` sort en erreur (exit 1) si une clé de `src/content/specs/*.json` ne correspond plus à aucune variante — la dérive d'ids ne peut plus casser les fiches en silence.
- Assets de marque : `npm run fetch:brands` → `public/brands/<marque>.jpg` + `public/logos/<marque>.svg` depuis Wikimedia Commons, avec `public/brands/CREDITS.md`. Les deux sont **optionnels** : sans fichier, le musée retombe sur la vignette Sketchfab du modèle emblématique et sur le wordmark sérif.
- **Identité unique, en clair** (`#f4f2ef`) sur toutes les pages, `SiteHeader` partagé partout. Le sombre n'est plus qu'une surface d'accent : panneau photo du musée, scène du quiz.
- Routes : `/` menu typographique (aucune 3D) · `/quiz` · `/a-propos` · `/musee` (split photo/logos) → `/musee/[marque]` → `/musee/[marque]/[modèle]`. `npx tsc --noEmit` et `npm run lint` verts, routes en 200.

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

## Refonte accueil + musée + specs — FAIT ✅ (26/07/2026)

1. [x] **Accueil sans 3D** : `src/app/page.tsx` est un menu typographique sombre (titre sérif, entrées filetées Musée / Quiz / À propos, compteurs). Il s'affiche instantanément, sans dépendre de Sketchfab.
2. [x] **Carrousel supprimé** : `src/components/garage/GarageShowcase.tsx` et `src/content/showcase.ts` effacés. Plus qu'un seul endroit monte un viewer : le musée.
3. [x] **`/a-propos`** créée (l'entrée de menu ne pointe pas dans le vide) : compteurs, pitch, crédits Ddiaz Design + Commons + mention trademarks.
4. [x] **`/musee` façon vecarz** (`BrandExplorer`) : photo plein écran à gauche, grille de logos filetée et scrollable à droite ; survol **et focus clavier** font un fondu de 900 ms vers la photo de la marque et changent la légende (origine, accroche, compteurs, crédit photo). Version mobile séparée en cartes photo, puisqu'il n'y a pas de survol au doigt.
5. [x] **Photos + logos** : `scripts/fetch-brand-assets.mjs` (`npm run fetch:brands`) télécharge depuis Commons, recompressé ensuite à 1800 px / ~400 Ko. Les 4 logos manquants (BMW, Porsche, Lamborghini, Bugatti) sont là. Éditorial (origine, accroche, cadrage, crédit) : `src/content/brands.ts`.
6. [x] **Specs de toutes les variantes** : 347 fiches recherchées puis contre-vérifiées (deux passes indépendantes par lot). `CarSpecs` gagne `couple`, `transmission`, `cvFiscaux` ; la fiche n'affiche plus que les lignes réellement renseignées, au lieu d'un mur de « — ».
7. [x] Sélecteur de variantes plafonné (`max-h-52` au-delà de 12 variantes) — la 911 en a 37 et poussait la fiche sous la ligne de flottaison.

### Comment les specs ont été produites (et ce que ça vaut)

31 lots d'environ 14 variantes, chacun passé à un agent de recherche web puis à un **relecteur adversarial** (cohérence poids/puissance/0-100, unités ch vs kW / Nm vs lb-ft / kg vs livres, confusion entre variantes, suppression de toute valeur non sourçable). Règle appliquée partout : **champ absent plutôt que champ inventé** — d'où les 45 % sur les chevaux fiscaux. La fusion repart des seules données hand-authored (`git show HEAD:…/ferrari.json`, 33 fiches) : sinon elle ressuscite les champs que le relecteur avait justement supprimés faute de source. Contrôle final automatique : **0 clé orpheline** sur 347. Les « jumeaux » détectés (fiches identiques entre variantes d'un même modèle) ont été vérifiés : ce sont des livrées (CSR2, Patrol, Martini, Heritage) et des kits carrosserie (LB★Works, Vorsteiner, Pandem…) qui partagent légitimement la mécanique du donneur. Une seule valeur a été retirée à la main : le couple annoncé de la Tourbillon (2 300 Nm, introuvable chez Bugatti). À l'inverse, **les 154 CV fiscaux des Veyron Super Sport ne sont pas une erreur** : `539/45 + (883/40)^1,6 ≈ 153,4`, la formule officielle donne bien ça — ne pas « corriger ».

**Ce n'est pas relu ligne à ligne par un humain.** Deux passes de vérification croisée ≠ certitude ; sur un chiffre qui compte, remonter à la source.

## Harmonisation + Quiz — FAIT ✅ (26/07/2026)

1. [x] **Une seule identité.** Tout le site passe en clair (`#f4f2ef`), variables CSS communes (`--muted`, `--rule`, accent). Le musée ne pouvait pas passer en sombre (les modèles Sketchfab sont rendus sur fond studio clair), donc c'est l'accueil qui s'est aligné. `SiteHeader` partagé sur toutes les pages, y compris dans la colonne droite de `/musee`.
2. [x] **Photos de marque : plus de recadrage.** Le panneau est portrait, les photos sont paysage — `object-cover` n'en gardait qu'un tiers. Désormais la photo est affichée **entière** (`object-contain`) sur une copie d'elle-même floutée et assombrie. Cadre rempli, rien de coupé.
3. [x] **Tri sportives / citadines** : `src/content/categories.ts`. 98 sportives · 19 citadines. Tout est sportive sauf liste explicite ; **Ferrari et Porsche sont sportives y compris leurs SUV** (Purosangue, Cayenne, Macan), contrairement aux X1–X7.
4. [x] **Quiz jouable de bout en bout** (`/quiz`) : choix catégorie + longueur, 4 propositions, score dégressif, récapitulatif, rejouer. Raccourcis clavier 1-4 et Entrée.
5. [x] **Vignettes 1920px** (`npm run fetch:thumbs` → `thumbnails-hd.json`, 352/352). Le quiz zoome jusqu'à 3,2× : le 1024px du catalogue partait en bouillie. Fichier séparé pour pouvoir le régénérer sans toucher aux ids.

### Le problème du spoiler — tranché

`ui_infos=0` est Premium **et réécrit côté serveur** : vérifié en capturant un embed brut avec le paramètre, la barre affiche toujours « 1987 Ferrari F40 / by Ddiaz Design ». Rogner l'iframe masquerait le logo Sketchfab et les liens de retour → interdit par les CGU.

**Solution retenue : le viewer porte la réponse, pas la question.**

- La question est un zoom 3,2× dans la photo de la voiture, qui se dézoome sur 14 s (courbe `p^1.7` : reste serré tant qu'on cherche, s'ouvre vite à la fin). Les points fondent avec le zoom.
- Le viewer Sketchfab de la même voiture est **monté dès la première frame de la question**, en `opacity-0` derrière le recadrage. Il boote pendant qu'on réfléchit.
- À la réponse, le recadrage se dissout et le viewer — déjà chaud — prend la place, nom et attribution CC compris, exactement là où ils ont leur place.

Le chargement de 1 à 3 s tombe dans le temps de réflexion et ne se voit jamais. **La couche de recadrage doit rester opaque et `inset-0`** : c'est la seule chose qui garde la réponse hors écran pendant que le viewer chauffe dessous.

## Décisions en attente / à valider
- ~~**Coup d'œil visuel**~~ : réglé. Chrome headless se pilote via le **DevTools Protocol** (Node 22 a `WebSocket` en global) — voir `shot.mjs` dans le scratchpad de la session : navigation, `Input.dispatchMouseEvent` pour simuler un survol, `Page.captureScreenshot`. `--screenshot` tout court ne capture que l'état au repos. Reste à valider à l'œil : `cameraDistance={0.7}` du musée (`0.7` **rapproche** la caméra).
- **Specs restantes** : `prix` à 59 % (beaucoup de versions course et de kits n'ont pas de tarif public — normal) et **chevaux fiscaux à 45 %**. Pour compléter les CV : L'Argus / cartes grises, ou appliquer la formule officielle `CV = (CO2/45) + (P/40)^1,6` là où CO2 et kW sont sourcés.
- **Cadrage des photos de marque** : le panneau est **portrait**, les photos sont **paysage** → `object-cover` montre toute la hauteur et coupe en largeur. Le `focus` de `src/content/brands.ts` est donc un levier **horizontal**. Regarder le rendu avant de changer une photo.
- **Base Testarossa** : l'heuristique choisit la 1984 F110 ; pour la classique 1988 → ajouter la paire dans `src/content/museum/base-variants.json` + `npm run build:museum`.
- **Groupe `ferrari-430`** : la 430 Scuderia forme son propre modèle (dérivé du fallback) au lieu de rejoindre `ferrari-f430`. Fusionnable en ajoutant « F430 » aux seeds, **mais ça change des ids** → à faire dans le même commit qu'un re-keying des specs, jamais à la légère.
- `gsap` / `@gsap/react` / `lenis` sont installés mais **inutilisés** (prévus pour les cinématiques au scroll). `zustand` ne sert qu'au squelette `src/lib/store.ts` (quiz), lui aussi sans consommateur.

## Connu — défauts de données du catalogue (pas touchés, exprès)

Repérés en écrivant les specs. **Les corriger change des ids**, donc il faut le faire dans le même commit qu'un re-keying des 347 fiches — jamais séparément.

- **Accents = modèles dédoublés.** `lamborghini-huracan` (16 variantes) *et* `lamborghini-hurac-n` (8) ; `lamborghini-murcielago` (5) *et* `lamborghini-murci-lago` (1) ; `lamborghini-s-n` (Síán, 2) *et* `lamborghini-si-n` (Sián, 1). Le slug est dérivé du nom Sketchfab sans normalisation NFD, donc « Huracán » et « Huracan » ne se rejoignent pas.
- **Un modèle au slug vide** : `lamborghini-` , nom « & », une seule variante (« 2003 Fast & Furious Lamborghini Murciélago LP640 »). Son URL est `/musee/lamborghini/` — c'est-à-dire la page marque : **le modèle est inatteignable**. Le nom vient du « & » de « Fast & Furious ».
- **5 ids de variante en double** (même voiture téléversée deux fois par l'auteur) : `ferrari-599--2010-ferrari-599-gto`, `lamborghini-huracan--2019-...-evo`, `lamborghini-huracan--2024-...-sterrato`, `lamborghini-revuelto--2024-...`, `porsche-718--2024-...-spyder-rs`. Sans conséquence : la fiche est partagée, ce qui est correct.

## Backlog

- Curer les autres marques : ajouter l'uid de collection Ddiaz dans `collections.json` + `npm run build:museum`, puis les specs, la photo et le logo (`PHOTOS`/`LOGOS` dans `scripts/fetch-brand-assets.mjs`) et l'entrée éditoriale dans `src/content/brands.ts`.
- **Quiz, suite possible** : mode chrono global, difficulté (moins de temps / décor plus neutre), séries et records en `localStorage` (`zustand` est déjà installé et inutilisé), questions « fiche technique » (deviner puissance/année) pour exploiter les 347 fiches, et pool par variante plutôt que par modèle pour multiplier les visuels.
- **Citadines : 19 voitures seulement**, presque toutes des BMW. La catégorie tourne vite en rond ; elle s'étoffera en curant une marque généraliste (Mercedes, Audi, Volkswagen).
- Enrichir les specs (dimensions, empattement, cylindrée exacte façon vecarz) — champs optionnels à ajouter au type `CarSpecs`. `couple`, `transmission` et `cvFiscaux` sont faits.
- Nettoyer les ids Lamborghini (cf. « Connu ») **en même temps** qu'un re-keying des specs.
- Déploiement LAN/local (Docker/Caddy) — fin. Usage **privé** (`CLAUDE.md` → IP posture). Rappel : full Sketchfab ⇒ **aucun mode hors-ligne**.

## UID collections Ddiaz

ferrari `e82e32907e864ec88a9c903bb662afb4` · lamborghini `8b38b8a6578f4fabb302e605a1ba6e53` · porsche `14cb80db95d6422a9187ba52ac1299ed` · bmw `c707bb093b9c433180439b9c96b618d5` · bugatti `08ae330925324dfc9edb8077537b7081`
