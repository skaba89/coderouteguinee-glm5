// ============================================================
// CodeRoute Guinée — Phase 19-4 + 20-4: French audio narrations
// ============================================================
// Updates existing questions with a richer `audioFr` narration
// (longer than the question text itself, useful for visually
// impaired candidates who need more context to understand the
// scenario).
//
// Phase 19-4: 5 narrations (id 63, 101, 107, 113, 116)
// Phase 20-4: 10 additional narrations for broader coverage
//             (mix of sign/scenario/video questions)
//
// Idempotent: re-running it just updates the same questions with
// the same narration.
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NarrationUpdate = {
  searchTexte: string; // substring to find the question
  audioFr: string; // the narration to store
};

const narrations: NarrationUpdate[] = [
  {
    searchTexte: "Ce panneau vous indique que vous entrez dans une zone où la vitesse est limitée à 30 km/h",
    audioFr:
      "Vous êtes au volant et vous apercevez un panneau circulaire à bord rouge contenant le chiffre 30. " +
      "Ce panneau signale une zone où la vitesse maximale autorisée est de 30 kilomètres par heure. " +
      "Cette limitation est fréquente à proximité des écoles, des zones résidentielles et des marchés en Guinée. " +
      "Vous devez adapter votre vitesse immédiatement et la maintenir tant que vous êtes dans cette zone. " +
      "Question : que faites-vous à la vue de ce panneau ? " +
      "Option A : Adapter ma vitesse à 30 km/h maximum. " +
      "Option B : Maintenir 50 km/h car c'est la règle urbaine. " +
      "Option C : Accélérer car la route est dégagée. " +
      "Option D : Klaxonner pour prévenir les autres.",
  },
  {
    searchTexte: "Sur cette route rurale de nuit, des bovins traversent la route",
    audioFr:
      "Vous conduisez de nuit sur une route rurale guinéenne. La route est peu éclairée et vous roulez en feux de croisement. " +
      "Soudain, vous apercevez des bovins qui traversent la route à une centaine de mètres devant vous. " +
      "Les animaux peuvent être imprévisibles : ils peuvent s'arrêter au milieu de la route ou faire demi-tour. " +
      "Votre vitesse actuelle est de 60 km/h. Vous avez un véhicule derrière vous à une distance raisonnable. " +
      "Question : quelle est la bonne conduite ? " +
      "Option A : Ralentir, s'arrêter si nécessaire, feux de croisement. " +
      "Option B : Accélérer en klaxonnant. " +
      "Option C : Éteindre les feux pour ne pas les effrayer. " +
      "Option D : Forcer le passage à basse vitesse.",
  },
  {
    searchTexte: "Dans cette vidéo de rond-point à Kankan",
    audioFr:
      "Voici une vidéo montrant un rond-point à Kankan. Vous arrivez à ce rond-point et vous souhaitez sortir à la première rue à droite. " +
      "Plusieurs véhicules circulent déjà dans le rond-point. Un camion arrive sur votre gauche. " +
      "Vous devez décider quand actionner votre clignotant pour signaler votre intention de sortie. " +
      "Rappelez-vous : le clignotant droit indique une sortie, le clignotant gauche indique que vous continuez dans le rond-point. " +
      "Question : quand actionnez-vous le clignotant ? " +
      "Option A : À l'entrée du rond-point, clignotant droit. " +
      "Option B : À l'entrée, clignotant gauche. " +
      "Option C : Juste avant la sortie, clignotant droit. " +
      "Option D : Aucun clignotant n'est nécessaire.",
  },
  {
    searchTexte: "Dans cette vidéo sous pluie intense",
    audioFr:
      "Cette vidéo montre une route nationale sous une pluie intense. La visibilité est réduite à environ 50 mètres. " +
      "La chaussée est mouillée et glissante, surtout dans les virages. " +
      "Vous roulez à 60 km/h et un véhicule vous précède. " +
      "Sur route mouillée, la distance de freinage est multipliée par deux par rapport à une route sèche. " +
      "Vous devez adapter votre distance de sécurité pour éviter une collision en cas de freinage d'urgence. " +
      "Question : à quelle distance minimale devez-vous rester du véhicule devant vous ? " +
      "Option A : Au moins 3 secondes, environ 50 m à 60 km/h. " +
      "Option B : 1 seconde, comme sur route sèche. " +
      "Option C : 5 mètres suffisent. " +
      "Option D : 2 secondes, c'est la règle générale.",
  },
  {
    searchTexte: "Dans cette vidéo, des motos circulent entre les véhicules à Conakry",
    audioFr:
      "Voici une vidéo tournée à Conakry. Le trafic est dense et lent. " +
      "Des motos circulent entre les véhicules, slalomant entre les voitures et longeant le trottoir. " +
      "Une moto s'approche de votre véhicule sur la droite, entre votre voiture et le trottoir. " +
      "Le motard semble pressé mais roule à une vitesse raisonnable. " +
      "Vous n'avez pas prévu de changer de voie mais vous devez rester prévisible pour ne pas surprendre le motard. " +
      "Question : quelle attitude adoptez-vous ? " +
      "Option A : Conserver ma trajectoire, vérifier mes angles morts avant tout changement de voie. " +
      "Option B : Klaxonner pour écarter les motos. " +
      "Option C : Accélérer pour les distancer. " +
      "Option D : Freiner brutalement pour les surprendre.",
  },

  // ── Phase 20-4: 10 additional narrations for broader coverage ──
  {
    searchTexte: "Que signifie un panneau octogonal rouge",
    audioFr:
      "Vous êtes au volant et vous apercevez un panneau de forme octogonale, entièrement rouge, avec le mot STOP écrit en lettres blanches. " +
      "Ce panneau impose un arrêt complet à l'intersection. Vous devez marquer l'arrêt avant la ligne blanche, vérifier que la voie est libre dans les deux directions, puis vous engager. " +
      "Un simple ralentissement ne suffit pas : l'arrêt doit être complet, même si aucun véhicule n'arrive. " +
      "Question : que signifie ce panneau ? " +
      "Option A : Stop, arrêt obligatoire. " +
      "Option B : Cédez le passage. " +
      "Option C : Sens interdit. " +
      "Option D : Vitesse limitée.",
  },
  {
    searchTexte: "Un panneau circulaire avec un chiffre et un bord rouge signifie",
    audioFr:
      "Vous apercevez un panneau circulaire à bord rouge contenant un chiffre, par exemple 50, 90 ou 110. " +
      "Au code de la route, ce panneau indique la vitesse maximale autorisée sur cette portion de route. " +
      "En Guinée, les limitations courantes sont 30 km/h en zone scolaire, 50 km/h en ville, 90 km/h sur route nationale hors agglomération, et 110 km/h sur autoroute. " +
      "Dépasser cette limite expose à une amende et à un retrait de points. " +
      "Question : que signifie ce panneau ? " +
      "Option A : Vitesse maximale autorisée. " +
      "Option B : Vitesse minimale recommandée. " +
      "Option C : Distance jusqu'à la prochaine ville. " +
      "Option D : Numéro de la route.",
  },
  {
    searchTexte: "Vous approchez de cette intersection à Kaloum. Qui a la priorité",
    audioFr:
      "Voici une image montrant une intersection à Kaloum, le centre administratif de Conakry. " +
      "Vous arrivez à cette intersection non régulée par des feux. " +
      "Un véhicule arrive à votre droite, simultanément. " +
      "Aucun panneau de priorité n'est présent. " +
      "Vous devez appliquer la règle de la priorité à droite, qui s'applique à toutes les intersections non régulées. " +
      "Question : qui a la priorité ? " +
      "Option A : Le véhicule venant de droite. " +
      "Option B : Moi, car je suis sur l'axe principal. " +
      "Option C : Le véhicule le plus rapide. " +
      "Option D : Celui qui klaxonne le premier.",
  },
  {
    searchTexte: "Dans ce rond-point à Kankan, vous voulez y entrer. Que faites-vous",
    audioFr:
      "Voici une image d'un rond-point à Kankan, la deuxième plus grande ville de Guinée. " +
      "Vous arrivez à ce rond-point et vous souhaitez y entrer. " +
      "Plusieurs véhicules circulent déjà dans le giratoire, venant de votre gauche. " +
      "Un camion est sur le point de passer devant vous. " +
      "Rappelez-vous : les véhicules circulant dans le giratoire ont toujours la priorité sur ceux qui veulent y entrer. " +
      "Question : que faites-vous ? " +
      "Option A : Céder le passage aux véhicules dans le giratoire. " +
      "Option B : Forcer le passage car j'arrive à droite. " +
      "Option C : Klaxonner pour entrer en premier. " +
      "Option D : Accélérer pour passer avant le camion.",
  },
  {
    searchTexte: "Vous approchez de ce passage piétons près du marché. Que faites-vous",
    audioFr:
      "Voici une image d'un passage piétons situé près d'un marché animé de Conakry. " +
      "Vous roulez à 40 km/h et vous approchez de ce passage. " +
      "Une femme avec un enfant traverse actuellement sur le passage. " +
      "D'autres piétons attendent sur le trottoir pour traverser à leur tour. " +
      "Le passage piétons est un lieu à haute vigilance : les piétons ont toujours la priorité. " +
      "Question : que faites-vous ? " +
      "Option A : Ralentir et m'arrêter pour laisser traverser. " +
      "Option B : Accélérer pour passer avant. " +
      "Option C : Klaxonner pour les faire reculer. " +
      "Option D : Maintenir ma vitesse, ils attendront.",
  },
  {
    searchTexte: "Vous roulez sur cette route nationale derrière un camion. Le dépassement est-il",
    audioFr:
      "Voici une image montrant une route nationale en Guinée. Vous roulez derrière un camion qui se déplace lentement. " +
      "La visibilité vers l'avant est limitée par le camion. " +
      "La route est à deux voies, une dans chaque sens. " +
      "Une voiture arrive en sens inverse à environ 200 mètres. " +
      "Pour dépasser en sécurité, vous devez avoir une visibilité suffisante et un espace de dépassement suffisant. " +
      "Question : le dépassement est-il autorisé dans cette situation ? " +
      "Option A : Non, visibilité insuffisante. " +
      "Option B : Oui, à condition de klaxonner. " +
      "Option C : Oui, en accélérant fortement. " +
      "Option D : Oui, mais uniquement la nuit.",
  },
  {
    searchTexte: "Dans cette situation de nuit à Conakry, quels feux devez-vous utiliser",
    audioFr:
      "Voici une image montrant une conduite de nuit à Conakry. " +
      "Vous roulez sur une avenue éclairée par des lampadaires. " +
      "La visibilité est correcte mais réduite par rapport au jour. " +
      "Des véhicules arrivent en sens inverse, ainsi que des motos. " +
      "Vous devez choisir le bon type de feux pour voir sans aveugler les autres conducteurs. " +
      "Question : quels feux devez-vous utiliser ? " +
      "Option A : Feux de croisement. " +
      "Option B : Feux de route (pleins phares). " +
      "Option C : Feux de détresse. " +
      "Option D : Aucun feu, les lampadaires suffisent.",
  },
  {
    searchTexte: "Vous roulez sous une pluie intense comme sur cette image. Quelle attitude adopte",
    audioFr:
      "Voici une image montrant une route nationale sous une pluie intense. " +
      "La visibilité est fortement réduite, environ 50 mètres. " +
      "La chaussée est mouillée et glissante. " +
      "Vous roulez actuellement à 70 km/h. " +
      "Un véhicule vous précède à environ 30 mètres. " +
      "Sur route mouillée, la distance de freinage est multipliée par deux. " +
      "Vous devez adapter votre conduite à ces conditions difficiles. " +
      "Question : quelle attitude adoptez-vous ? " +
      "Option A : Réduire ma vitesse et augmenter la distance de sécurité. " +
      "Option B : Maintenir ma vitesse pour ne pas bloquer le trafic. " +
      "Option C : Allumer les feux de détresse en roulant. " +
      "Option D : Accélérer pour sortir rapidement de la zone de pluie.",
  },
  {
    searchTexte: "Vous approchez de cette zone scolaire à Dixinn. Quelle est la conduite à tenir",
    audioFr:
      "Voici une image de la zone scolaire de Dixinn, un quartier de Conakry. " +
      "Vous approchez de cette école et il est 17 heures, heure de sortie des classes. " +
      "Des enfants sont sur le trottoir, certains pourraient traverser imprévisiblement. " +
      "Des parents attendent avec leurs enfants. " +
      "Des taxis sont stationnés le long de l'école. " +
      "La vitesse dans une zone scolaire est strictement limitée. " +
      "Question : quelle est la conduite à tenir ? " +
      "Option A : Ralentir à 30 km/h, redoubler de vigilance. " +
      "Option B : Maintenir 50 km/h, la vitesse urbaine normale. " +
      "Option C : Klaxonner pour prévenir les enfants. " +
      "Option D : Accélérer pour passer avant la sortie des classes.",
  },
  {
    searchTexte: "Vous approchez de ce péage sur la RN1. Comment devez-vous procéder",
    audioFr:
      "Voici une image du péage sur la route nationale RN1, qui relie Conakry à l'intérieur du pays. " +
      "Vous approchez du péage et plusieurs voies sont disponibles. " +
      "Des véhicules sont déjà en attente dans certaines voies. " +
      "Vous devez choisir une voie, ralentir, et préparer le montant du péage. " +
      "Le péage est un lieu de ralentissement où les véhicules sont proches les uns des autres. " +
      "Question : comment devez-vous procéder ? " +
      "Option A : Ralentir, choisir une voie, payer le péage. " +
      "Option B : Accélérer pour passer rapidement. " +
      "Option C : Contourner le péage par la droite. " +
      "Option D : Klaxonner pour faire avancer les véhicules.",
  },
];

async function main() {
  console.log('🔊 Phase 19-4 + 20-4: Adding French audio narrations...');
  let updated = 0;
  let notFound = 0;

  for (const n of narrations) {
    const question = await prisma.question.findFirst({
      where: { texte: { contains: n.searchTexte } },
    });

    if (!question) {
      console.log(`  ✗ question not found: "${n.searchTexte.substring(0, 60)}..."`);
      notFound++;
      continue;
    }

    await prisma.question.update({
      where: { id: question.id },
      data: { audioFr: n.audioFr },
    });
    console.log(`  ✓ updated (id=${question.id}): "${question.texte.substring(0, 60)}..."`);
    updated++;
  }

  console.log(`  → ${updated} narrations added, ${notFound} not found.`);

  // Summary
  const withAudio = await prisma.question.count({ where: { audioFr: { not: null } } });
  const totalQ = await prisma.question.count();
  console.log(`  📊 Questions with audioFr: ${withAudio} / ${totalQ}`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
