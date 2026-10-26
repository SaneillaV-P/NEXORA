# NEXORA

**Le futur ne vous attend pas.**

NEXORA est un média de veille technologique : il collecte des actualités publiées par des sources identifiables, les filtre, les classe et conserve le lien vers leur publication d’origine. Les fonctions IA sont désactivées par défaut et peuvent être activées explicitement avec Gemini ou Anthropic. L’application ne fabrique pas de titres, de sources ni de statistiques.

## Documentation

- [Documentation fonctionnelle et technique](docs/FONCTIONNEMENT.md) : parcours des pages, sources, collecte, traitements IA, modèle de données, API, sécurité, exploitation et limites actuelles.
- Ce README : démarrage Docker ou Node.js, configuration, migrations et déploiement Vercel.

## Démarrage le plus simple : Docker

Docker Desktop est installé séparément de ce projet et doit être **démarré**.

1. Ouvrir Docker Desktop et attendre l’état **Engine running**.
2. Dans PowerShell, à la racine du projet :

```powershell
Copy-Item .env.example .env
```

Le secret du modèle est réservé au développement. Pour en créer un unique avant de démarrer les conteneurs :

```powershell
$secret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$path = (Resolve-Path .env).Path
$settings = [System.IO.File]::ReadAllText($path)
$settings = [regex]::Replace($settings, '(?m)^CRON_SECRET=.*$', ('CRON_SECRET=' + $secret))
[System.IO.File]::WriteAllText($path, $settings, [System.Text.UTF8Encoding]::new($false))
```

Puis valider et démarrer l’application :

```powershell
docker compose config
docker compose up --build -d
docker compose ps
```

Compose construit l’application Next.js, lance PostgreSQL 17, crée les tables depuis les migrations SQL et attend que la base soit prête avant de lancer le site. Les données PostgreSQL sont conservées dans le volume Docker `nexora-postgres` après redémarrage.

3. Ouvrir <http://localhost:3000>. Vérifier l’état des services :

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

L’état attendu avec Docker est `status: ok`, `storage: connected`, `ai: not_configured` et `aiProvider: none` tant qu’aucun fournisseur n’a été explicitement configuré. L’API vérifie réellement la connexion PostgreSQL avant d’annoncer cet état.

4. Lancer une collecte immédiate. Cette étape importe des actualités des vrais flux vers PostgreSQL :

```powershell
$secret = (Get-Content .env | Where-Object { $_ -match '^CRON_SECRET=' } | Select-Object -First 1).Split('=', 2)[1]
$headers = @{ Authorization = "Bearer $secret" }
Invoke-RestMethod -Uri http://localhost:3000/api/collect -Headers $headers
```

Les articles sont visibles sur <http://localhost:3000/actualites>. La commande retourne le nombre d’articles trouvés, insérés et les éventuelles erreurs par source.

**Si Docker ne démarre pas :** ouvrir Docker Desktop depuis Windows, puis attendre que son moteur Linux soit prêt. Un `docker.exe` installé ne signifie pas que son moteur tourne déjà. En cas d’erreur de port, fermer l’application qui utilise le port 3000 ou 5432, ou modifier `POSTGRES_PORT` dans `.env`.

### Arrêter et préserver les données

```powershell
docker compose down
```

Pour reprendre : `docker compose up -d`. **Ne pas utiliser `docker compose down -v`** sauf si la suppression définitive de tous les articles et favoris stockés dans la base Docker locale est voulue.

Le paramètre `CRON_SECRET` de `.env.example` est un placeholder local. Il sert uniquement à protéger les commandes manuelles de développement ; il ne faut jamais le réutiliser en production.

## Alternative : lancement Node.js sans Docker

Il faut Node.js **20.9 ou supérieur** et npm.

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Ouvrir <http://localhost:3000>. **Sans `DATABASE_URL`**, les pages lisent directement les flux en direct, mais les articles ne sont pas conservés entre les requêtes. La base et l’IA ne sont pas nécessaires pour explorer les actualités RSS. L’IA est désactivée par défaut (`AI_PROVIDER=none`).

Pour une persistance locale sans Docker, installer PostgreSQL séparément, créer une base, ajuster `DATABASE_URL` dans `.env.local`, puis appliquer le schéma :

```powershell
npm run db:push
```

Pour effectuer une collecte manuelle, renseigner `CRON_SECRET` dans `.env.local`, puis démarrer le serveur avant d’appeler `/api/collect` avec `Authorization: Bearer <valeur>`. Sans base, les pages continuent à lire les flux en direct ; elles n’écrivent rien dans PostgreSQL.

## Les actualités : quelles sources, exactement ?

- **Hacker News — API officielle** : histoires récentes et URL de la publication originale. Les posts non technologiques sont filtrés. L’étiquette indique, par exemple, `ubicloud.com · via Hacker News` : Hacker News n’est pas présenté comme l’auteur du blog d’origine.
- **GitHub Blog — flux RSS officiel**.
- **OpenAI News — flux RSS officiel**.
- **Google Security Blog — flux Atom officiel**.
- **Cloudflare Blog — flux RSS officiel**.

La liste maintenue par le projet se trouve dans `lib/sources.ts`. La route `/sources` affiche les éditeurs suivis. Les flux sont interrogés simultanément, au plus une fois toutes les dix minutes par cache Next.js ; la collecte conserve au plus 15 entrées par flux RSS et examine les 15 histoires les mieux classées par l’API Hacker News. Les requêtes réseau expirent en 12 secondes, et les articles Hacker News sont demandés par lots de huit.

Une actualité conserve sa date publiée par sa source, son URL canonique, l’éditeur de l’article et le flux qui l’a découverte. Aucun texte complet externe n’est aspiré. Lorsqu’un flux ne fournit qu’une URL ou des métadonnées de discussion, NEXORA n’affiche pas celles-ci comme un résumé journalistique. Les points et les commentaires communautaires ne sont pas présentés comme des indicateurs éditoriaux.

Vérifier les sources **en direct** avec :

```powershell
npm run verify:feeds
```

Cette commande affiche le résultat et les titres réels renvoyés par chaque source, ou l’erreur concrète rencontrée. C’est un test réseau, pas une garantie que les éditeurs maintiendront éternellement leurs flux. Les tests unitaires emploient des réponses simulées et restent exécutables hors connexion.

## Recherche, rédaction et favoris

- `/actualites` filtre par sujet, trie et pagine les articles disponibles.
- `/categorie/[slug]` et `/recherche` explorent cette même collection.
- `/article/[slug]` présente l’éditeur, la date d’origine et un lien vers l’article original. Si seul un extrait RSS est disponible, il est identifié comme tel.
- `/tendances` compte les articles effectivement présents par catégorie. Les résultats ne prétendent pas mesurer l’ensemble d’Internet.
- `/radar` sélectionne des articles réellement publiés dans les flux ; il ne s’agit pas d’une liste d’outils inventés.
- `/favoris` conserve la sélection dans le stockage local du navigateur, sans compte ni service tiers.
- `/briefing` n’affiche un briefing que lorsqu’il a été généré depuis des articles stockés dans PostgreSQL ; les références aux articles sont liées.
- `/sources` et `/a-propos` expliquent la provenance et le fonctionnement éditorial.

## PostgreSQL, Neon et migrations

Variables principales dans `.env.local` (Node) ou `.env` (Compose) :

| Variable | Usage |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL. Le projet choisit le pilote Neon pour les hôtes `*.neon.tech` et PostgreSQL standard pour Docker ou les autres serveurs. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Identifiants et port du PostgreSQL **local Docker uniquement**. |
| `CRON_SECRET` | Protège la route de collecte. |
| `AI_PROVIDER` | `none` par défaut ; choisir explicitement `gemini` ou `anthropic` pour activer l’IA. |
| `GEMINI_API_KEY` | Clé serveur Google AI Studio, utilisée uniquement si `AI_PROVIDER=gemini`. Le modèle `gemini-2.5-flash-lite` est fixé par l’application ; aucun fallback n’est effectué. |
| `ANTHROPIC_API_KEY` | Facultative ; utilisée uniquement si `AI_PROVIDER=anthropic`. |
| `ANTHROPIC_MODEL` | Modèle Anthropic ; par défaut `claude-haiku-5-5`. |
| `NEXT_PUBLIC_SITE_URL` | URL canonique du déploiement. |

Les colonnes et index sont définis dans `lib/db/schema.ts`. Les migrations SQL versionnées se trouvent dans `drizzle/`. Une base neuve est initialisée au premier démarrage du service PostgreSQL Docker. Pour Neon ou un serveur PostgreSQL existant, renseigner l’URL et appliquer `npm run db:push` avant de collecter.

Pour mettre à niveau une ancienne base qui contient déjà des articles, exécuter d’abord `drizzle/0001_article_publisher.sql` dans l’éditeur SQL Neon ou avec `psql`, puis `npm run db:push`. Cette étape renseigne le nom du flux et l’adresse de publication originale des articles existants avant d’ajouter les contraintes `NOT NULL`.

La base contient les sources, catégories, articles, dates de publication, URL canoniques, éditeurs, extraits, résumés, tags, entités, groupes d’articles similaires, briefings et journaux de traitement. Les articles sont dédupliqués par URL canonique. Les erreurs de flux et d’IA restent visibles dans les réponses de collecte et les logs du serveur.

## Résumés et briefings IA

Par défaut, `AI_PROVIDER=none` : aucune API IA n’est appelée, même si une clé Anthropic est présente. Pour activer Gemini, configurer côté serveur `.env.local`, `.env` ou les variables de déploiement :

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=<cle-privee-Google-AI-Studio>
```

L’application utilise `gemini-2.5-flash-lite` sans option de modèle, grounding, outils, nouvelle tentative automatique ni fallback vers un fournisseur payant. Pour rester dans l’offre gratuite, vérifier les quotas actuels du projet dans Google AI Studio et ne pas activer de facturation sur ce projet. Les quotas peuvent évoluer et une limite dépassée laisse les articles en attente ; aucun autre modèle n’est essayé. **La documentation Google indique que les données soumises au palier gratuit peuvent être utilisées pour améliorer ses produits.** Seuls les titres et les extraits publics transmis par les flux sont fournis au modèle.

Anthropic reste disponible uniquement si on le sélectionne explicitement avec `AI_PROVIDER=anthropic` et une clé valide. Ce fournisseur est payant : ne pas le configurer pour un déploiement strictement à 0 €.

Le pipeline ne traite que les articles dont le résumé est encore absent et au plus trois articles par collecte. Les briefings sont générés uniquement si aucun briefing du jour n’existe, depuis les articles récents, avec validation des références avant enregistrement. Les contenus externes sont non fiables, aucun outil n’est exposé au modèle et toutes les réponses sont validées par Zod. L’absence de fournisseur ou de clé ne désactive ni les flux ni l’affichage de leurs sources.

## Collecte manuelle et sécurité

La route `GET /api/collect` nécessite l’en-tête `Authorization: Bearer <CRON_SECRET>`. Sans clé, elle répond `401` ; trois appels au maximum sont autorisés par minute et par instance. La route `/api/health` indique seulement si la base et l’IA sont configurées ; elle ne révèle aucune clé.

La collecte planifiée Vercel se trouve dans `vercel.json` et vise 00:00 UTC (04:00 à Maurice, UTC+4), une fois par jour. Le plan Hobby permet un Cron quotidien, mais l’heure exacte peut varier jusqu’à 59 minutes et l’exécution utilise les quotas Vercel Functions. Hobby est destiné à un usage personnel non commercial ; un média commercial doit choisir un hébergement et un plan adaptés.

## Ce que permet un lancement gratuit

- **En local :** Next.js, la collecte RSS et les favoris navigateur fonctionnent sans clé IA ni base distante. Docker ajoute une base PostgreSQL locale persistante, sans frais de service cloud (le poste reste à votre charge).
- **Gemini :** l’API Developer propose un palier gratuit pour certains modèles, avec des quotas par projet et modèle qui peuvent changer. Le modèle de l’application est fixe ; une limite atteinte ne déclenche aucun repli. Les données envoyées sur le palier gratuit peuvent être utilisées par Google pour améliorer ses produits.
- **Neon Free :** au moment de la vérification, 100 CU-heures et 1 Go de stockage par projet, avec mise en veille après 5 minutes ; le transfert public inclus est limité. Cette offre convient à un prototype, sans garantie de sauvegarde longue durée.
- **Vercel Hobby :** gratuit pour les projets personnels non commerciaux, avec Cron quotidien et quotas mensuels de fonctions. Le plan ne convient pas à un média exploité à des fins commerciales ; vérifier les conditions et limites actuelles avant publication.
- **Domaine :** le sous-domaine fourni par Vercel évite l’achat d’un domaine personnalisé.

Les offres, quotas, disponibilité des modèles et conditions évoluent. Vérifier avant activation les pages officielles [Gemini](https://ai.google.dev/gemini-api/docs/rate-limits), [Neon](https://neon.com/docs/introduction/plans), [Vercel Hobby](https://vercel.com/docs/plans/hobby) et [Cron Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing). Ne pas activer la facturation Google pour un objectif strictement à 0 €.

## Déploiement sur Vercel

1. Créer une base Neon et conserver son URL PostgreSQL.
2. Importer le projet sur Vercel ; le projet se construit avec le preset Next.js et le Dockerfile n’est pas utilisé par Vercel.
3. Ajouter dans **Project → Settings → Environment Variables** :
   - `DATABASE_URL` : chaîne de connexion Neon de production.
   - `CRON_SECRET` : valeur longue et aléatoire générée, différente du placeholder local.
   - `NEXT_PUBLIC_SITE_URL` : URL publique réelle du site.
   - Pour l’IA gratuite optionnelle : `AI_PROVIDER=gemini` et `GEMINI_API_KEY`, en vérifiant les quotas et conditions Google.
   - Ne pas définir de clé Anthropic en visant un coût nul ; Anthropic n’est utilisé que si `AI_PROVIDER=anthropic`.
4. Dans un terminal configuré pour la base de production, appliquer `npm run db:push` avant de recevoir du trafic.
5. Déployer sur Vercel. Vérifier `/api/health`, les journaux des Cron Jobs et `/actualites`.

À noter : Vercel exécute les fonctions en Node.js ; la collecte et le pilote HTTP Neon sont destinés à cette exécution sans stocker les secrets dans le navigateur. `docker compose down -v` n’est pas une commande de déploiement.

## Vérification locale

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run verify:feeds
```

Le test des flux en direct nécessite une connexion Internet. Lors de la dernière vérification, **58 articles réels sont arrivés depuis les cinq sources, sans erreur** ; `npm run verify:feeds` affiche leurs titres, dates, liens canoniques et éditeurs. La collecte a été exécutée sur la pile Docker de production locale : les 58 articles ont été enregistrés dans PostgreSQL, puis une seconde collecte a inséré **0 doublon**. Les deux conteneurs sont sains, `/api/health` répond avec la base connectée, et les principales routes éditoriales renvoient HTTP 200. L’endpoint de collecte renvoie HTTP 401 sans secret.

Les **15 tests** (dont les tests IA simulés), TypeScript, ESLint, le build Next.js de production, `npm audit` (aucune vulnérabilité) et `docker compose config` passent. Les tests ne font aucun appel aux fournisseurs IA. Les clés Gemini/Anthropic et une base Neon de production n’ont pas été configurées ni testées avec le fournisseur ; l’authentification et la réponse JSON réelle devront être vérifiées manuellement, en surveillant les quotas Gemini.

## Contenu du projet

- Interface et routes Next.js : `app/` et `components/`.
- Sources, normalisation, tri et regroupement : `lib/`.
- Schéma et migrations PostgreSQL : `lib/db/schema.ts` et `drizzle/`.
- Docker de production locale : `Dockerfile`, `compose.yaml`, `.dockerignore`.
- Modèle des variables : `.env.example`.
- Tests unitaires : `tests/`.
