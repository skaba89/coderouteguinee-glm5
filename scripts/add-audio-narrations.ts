// ============================================================
// CodeRoute Guinée — Phase 19-4: Add French audio narrations
// ============================================================
// Updates 5 existing questions with a richer `audioFr` narration
// (longer than the question text itself, useful for visually
// impaired candidates who need more context to understand the
// scenario).
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
];

async function main() {
  console.log('🔊 Phase 19-4: Adding French audio narrations...');
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
