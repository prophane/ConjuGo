# Conjugo Pop (MVP CE1)

Application web PWA pour s'entrainer a la conjugaison au present (niveau CE1).
Le mode de base fonctionne sans backend metier. Cette version inclut en plus une mini API locale pour auto-creer les utilisateurs via SSO Pangolin.

## 1) Note de conception courte

- Format MVP retenu: QCM 4 choix.
- Pourquoi: simple pour CE1, feedback immediat, faible charge cognitive, rythme rapide.
- Session fixe: 10 questions.
- Gameplay: config rapide -> mission 10 questions -> recap motivant.
- Anti-repetition: generation equilibree par categories, unicite verbe+pronom, limitation repetition immediate d'un verbe, variation douce des pronoms.

## 2) Architecture du projet

- index.html: structure UI (configuration, session, resultats)
- styles.css: design system, responsive mobile-first, animations courtes
- data.js: dataset initial des verbes + pronoms + groupes
- app.js: logique de session, generation des questions, feedback, PWA install
- server.js: serveur Node (fichiers statiques + API /api/me + auto-provisioning utilisateur)
- manifest.webmanifest: metadonnees PWA
- sw.js: service worker (cache static)
- icons/icon-192.svg: icone PWA
- icons/icon-512.svg: icone PWA grand format

## 3) Fonctionnalites MVP implementees

- Ecran de configuration avec cartes toggle:
  - etre
  - avoir
  - 1er groupe
  - 2e groupe
  - 3e groupe
- Bouton Commencer desactive tant qu'aucune categorie n'est choisie
- Resume de selection dynamique
- Session de 10 questions, 1 question a la fois
- Compteur question X/10 + barre de progression
- Feedback immediat correct/incorrect
- Affichage de la bonne reponse en cas d'erreur
- Animation de recompense legere quand la reponse est correcte
- Ecran final avec score, message motivant, recap des erreurs
- Boutons Rejouer et Changer la selection
- Suivi local: sessions, precision, meilleur score, pieces
- Recompenses: badges debloques automatiquement
- Galerie de stickers originaux style brainy/arcade (assets locaux)
- Pack de cartes a la fin de chaque session (common/rare/epic)
- Collection locale avec suivi des doublons

## 4) Logique de generation (anti-repetition)

Dans app.js:

- Repartition equilibree:
  - buildCategoryTargets() repartit 10 questions entre categories selectionnees.
- Unicite locale:
  - generateQuestions() interdit de reposer la meme paire verbe+pronom dans la session (tant que possible).
- Anti-doublon proche:
  - recentVerbs (fenetre glissante) penalise la repetition immediate du meme verbe.
- Variation pronoms:
  - pronounUsage favorise les pronoms moins utilises.
- QCM coherent:
  - distracteurs prioritairement sur le meme pronom pour comparer des formes proches.

## 5) Dataset initial de verbes (present CE1)

- Etre, Avoir
- 1er groupe: manger, jouer, parler, aimer
- 2e groupe: finir, choisir
- 3e groupe: aller, faire, venir, prendre

Le dataset est interne et extensible dans data.js.

## 6) Lancer en local

### Option A (Python)

```bash
python -m http.server 8080
```

Puis ouvrir:

- http://localhost:8080

### Option B (VS Code Live Server)

- Ouvrir le dossier du projet
- Lancer Live Server sur index.html

## 7) Deploiement derriere reverse proxy

- Build requis: aucun
- Deploiement: copier les fichiers statiques tels quels
- Le reverse proxy gere l'authentification en amont
- L'app est directement accessible sans ecran login

## 8) Accessibilite et UX

- Contrastes lisibles
- Focus clavier visible
- Gros boutons tactiles
- Interface mobile-first
- Texte court, feedback simple et rassurant

## 9) Ameliorations futures

1. Ajouter un mode saisie libre (apres le QCM) pour renforcer la memorisation.
2. Ajouter plusieurs niveaux de difficulte (easy/normal/challenge).
3. Ajouter audio (lecture de la consigne et encouragements).
4. Ajouter mini-recompenses (stickers, badges locaux).
5. Ajouter historique local de progression par date.
6. Ajouter plus de verbes et filtrage CE1/CE2.
7. Ajouter mode hors-ligne avance (strategie stale-while-revalidate).

## 10) Deploiement Docker (port par defaut 3077)

Le projet inclut maintenant:

- Dockerfile
- docker-compose.yml
- server.js

Le conteneur expose le service sur le port 3077.

### Lancer avec Docker Compose

```bash
docker compose up -d --build
```

Puis ouvrir:

- http://localhost:3077

### Arreter

```bash
docker compose down
```

## 11) Deploiement sur machine Ampere (ARM64)

L'image de base node:20-alpine est multi-architecture et fonctionne sur ARM64 (Ampere).

### Option simple (sur la machine Ampere)

```bash
docker compose up -d --build
```

### Option image prebuild (amd64 + arm64)

Construire et publier une image multi-arch:

```bash
docker buildx create --use --name conjugo-builder
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t <votre-registry>/conjugo:latest \
  --push .
```

Puis sur la machine Ampere:

```bash
docker run -d --name conjugo-pwa -p 3077:3077 --restart unless-stopped <votre-registry>/conjugo:latest
```

### Reverse proxy

Le reverse proxy peut router vers:

- http://<ip-machine-ampere>:3077

## 12) Auto-creation utilisateur via SSO Pangolin

Objectif: recuperer l'identite envoyee par Pangolin et creer automatiquement un compte local au premier acces.

### Endpoint

- GET /api/me

Comportement:

1. Lit les headers SSO recus depuis Pangolin.
2. Cherche un utilisateur existant (email ou subject fournisseur).
3. Cree l'utilisateur si absent.
4. Met a jour lastSeenAt.
5. Retourne le profil JSON.

### Headers attendus (configurables via variables d'environnement)

- SSO_SUB_HEADER (defaut: x-pangolin-sub)
- SSO_EMAIL_HEADER (defaut: x-pangolin-email)
- SSO_NAME_HEADER (defaut: x-pangolin-name)

Le serveur accepte aussi des en-tetes de secours frequents (utile si Pangolin ne propose pas de mapping claims explicite):

- sub: x-forwarded-user, x-auth-request-user, x-user, remote-user
- email: x-forwarded-email, x-auth-request-email, x-email, remote-email
- name: x-forwarded-name, x-auth-request-name, x-name, x-forwarded-preferred-username

### Variables de securite (docker-compose.yml)

- TRUST_PROXY_HEADER (defaut: x-pangolin-trusted)
- TRUST_PROXY_SECRET (defaut vide)

Si TRUST_PROXY_SECRET est renseigne, /api/me exige ce header exact pour faire confiance a la requete.

### Persistance

- Les utilisateurs sont stockes dans data/users.json
- Le volume ./data:/app/data conserve les comptes entre redemarrages

### Exemple Pangolin (concept)

Configurer Pangolin pour forwarder vers Conjugo:

- x-pangolin-sub
- x-pangolin-email
- x-pangolin-name
- x-pangolin-trusted (valeur secrete, optionnelle mais recommandee)

### Debug rapide quand aucun mapping claims n'apparait dans l'UI Pangolin

Si ta version Pangolin ne montre pas d'ecran claims -> headers, tu peux verifier ce qui est vraiment forwarde:

1. ouvrir /api/debug-identity derriere Pangolin
2. regarder les headers effectivement recus
3. ajuster SSO_SUB_HEADER / SSO_EMAIL_HEADER / SSO_NAME_HEADER si necessaire

Commande de test:

```bash
curl -s https://conjugo.ph4.fr/api/debug-identity
```

Puis test final:

```bash
curl -s https://conjugo.ph4.fr/api/me
```
