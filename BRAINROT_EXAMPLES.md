# Exemples Brainrot (qualite)

Ces exemples montrent la difference entre une sortie faible et une sortie valide selon le pipeline.

## Brainrot rate (a eviter)

Texte:

Le mot est drole. C'est du pur brainrot. C'est chaotique.

Pourquoi c'est rate:

- pas d'image mentale concrete
- ton meta et generique
- pas de montee en intensite
- phrases bannies detectees

Score attendu (scoreBrainrot): tres bas, rejet.

## Brainrot reussi (attendu)

Texte:

Banane laser debarque avec un grille-pain en feu sur une trottinette au plafond, et le feed panique. Elle reclame un autographe au lampadaire pendant qu'un pigeon en armure fait du drift sur la table. Puis un aquarium dans le bus passe en mode glitch et meme le frigo demande une truce. Dernier palier: la gravite depose sa demission et internet se met a genoux.

Pourquoi c'est valide:

- 4 phrases, rythme court
- 2+ images mentales concretes
- personnification absurde
- escalation claire jusqu'a la derniere phrase
- vibe internet/meme (feed, glitch)

Score attendu (scoreBrainrot): eleve, accepte.

## Test manuel rapide

Dans la console navigateur:

const ex = BRAINROT_PIPELINE.qualityExamples();
console.log(ex.failed.score, ex.success.score);
