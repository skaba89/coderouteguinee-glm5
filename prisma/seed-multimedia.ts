// ============================================================
// CodeRoute Guinée — Multimedia Enrichment Seed (Phase 17)
// ============================================================
// ADDS new media-rich questions, 3 new courses, and new lessons.
// Idempotent: uses upserts / checks existence by (texte, categorie).
// Does NOT touch existing data — existing accounts, courses,
// lessons and questions remain intact.
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper: find existing question by texte ─────────────
async function findQuestionByTexte(texte: string) {
  return prisma.question.findFirst({ where: { texte } });
}

// ─── New questions (15) ──────────────────────────────────
// Each one uses a real generated media asset under /public.
type NewQuestion = {
  texte: string;
  options: string[];
  bonneReponse: number;
  categorie: string;
  difficulte: 'facile' | 'moyen' | 'difficile';
  mediaType: 'sign' | 'scenario' | 'video' | 'text';
  signImage?: string;
  scenarioImage?: string;
  videoUrl?: string;
  explication: string;
  points?: number;
  tempsEstime?: number;
  tags: string[];
};

const newQuestions: NewQuestion[] = [
  // ── New sign questions (using new signs) ──
  {
    texte: "Ce panneau vous indique que vous entrez dans une zone où la vitesse est limitée à 30 km/h. Que faites-vous ?",
    options: [
      "Adapter ma vitesse à 30 km/h maximum",
      "Maintenir 50 km/h car c'est la règle urbaine",
      "Accélérer car la route est dégagée",
      "Klaxonner pour prévenir les autres"
    ],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/vitesse-30.png",
    explication: "Le panneau circulaire à bord rouge avec le chiffre 30 impose une vitesse maximale de 30 km/h. Cette limitation se rencontre souvent à proximité des écoles, zones résidentielles et marchés en Guinée.",
    tempsEstime: 15,
    tags: ["panneau", "vitesse", "30", "zone"]
  },
  {
    texte: "Sur route nationale, vous rencontrez ce panneau. Quelle est la vitesse maximale autorisée ?",
    options: ["90 km/h", "50 km/h", "110 km/h", "130 km/h"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/vitesse-90.png",
    explication: "Le panneau 90 km/h s'applique sur les routes nationales hors agglomération en Guinée. Sur autoroute, la limite est de 110 km/h, et 50 km/h en ville.",
    tempsEstime: 15,
    tags: ["panneau", "vitesse", "90", "route nationale"]
  },
  {
    texte: "Vous voyez ce panneau rond bleu avec des flèches courbes. Que signifie-t-il ?",
    options: [
      "Vous devez emprunter le rond-point",
      "Le rond-point est interdit",
      "Le rond-point est en travaux",
      "Rond-point facultatif"
    ],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/rond-point-obligatoire.png",
    explication: "Le panneau bleu circulaire avec les trois flèches courbes impose le sens giratoire. Vous devez contourner le rond-point dans le sens indiqué et ne pas le couper.",
    tempsEstime: 20,
    tags: ["panneau", "rond-point", "obligation"]
  },
  {
    texte: "Ce panneau annonce la fin d'une interdiction. Que pouvez-vous faire à partir de là ?",
    options: [
      "Dépasser à nouveau si les conditions de sécurité le permettent",
      "Dépasser sans aucune condition",
      "Accélérer immédiatement",
      "Continuer à ne pas dépasser"
    ],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/fin-interdiction-depasser.png",
    explication: "Ce panneau marque la fin de l'interdiction de dépasser. Le dépassement redevient possible, mais uniquement si les conditions de sécurité le permettent : visibilité suffisante, voie libre, signalisation locale non contradictoire.",
    tempsEstime: 20,
    tags: ["panneau", "fin interdiction", "dépassement"]
  },
  {
    texte: "Ce panneau triangulaire avec un point d'exclamation annonce :",
    options: [
      "Un danger non précisé, soyez vigilant",
      "Une interdiction d'avancer",
      "Une obligation de s'arrêter",
      "La fin de la route"
    ],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/danger.png",
    explication: "Le panneau triangulaire à pointe en haut avec un point d'exclamation signale un danger non précisé par d'autres panneaux. Il est souvent accompagné d'un cartouche indiquant la nature du danger (pont mobile, descente dangereuse, etc.).",
    tempsEstime: 15,
    tags: ["panneau", "danger", "vigilance"]
  },

  // ── New scenario questions (using new scenarios) ──
  {
    texte: "Dans cette circulation dense à Conakry, une moto s'insère entre votre voiture et le trottoir. Que faites-vous ?",
    options: [
      "Maintenir ma trajectoire et ma vitesse, sans brusquer",
      "Accélérer pour la bloquer",
      "Freiner brutalement",
      "Klaxonner longuement"
    ],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/moto-circulation-conakry.png",
    explication: "À Conakry, les motos circulent fréquemment entre les véhicules. Conservez votre trajectoire sans brusquer pour ne pas surprendre le motard. Vérifiez vos angles morts avant tout changement de voie et laissez de l'espace.",
    tempsEstime: 25,
    tags: ["conduite", "moto", "Conakry", "trafic urbain"]
  },
  {
    texte: "Sur cette route rurale de nuit, des bovins traversent la route. Quelle est la bonne conduite ?",
    options: [
      "Ralentir, s'arrêter si nécessaire, feux de croisement",
      "Accélérer en klaxonnant",
      "Éteindre les feux pour ne pas les effrayer",
      "Forcer le passage à basse vitesse"
    ],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "difficile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/animaux-nuit.png",
    explication: "De nuit sur les routes rurales guinéennes, les animaux (bovins, caprins) peuvent surgir sans préavis. Ralentissez, arrêtez-vous si nécessaire, conservez les feux de croisement (les pleins phares risqueraient d'aveugler les animaux). Ne reprenez la route que lorsque la voie est totalement libre.",
    tempsEstime: 30,
    tags: ["sécurité", "animaux", "nuit", "route rurale"]
  },
  {
    texte: "Vous approchez de cette zone scolaire. À quelle vitesse maximale devez-vous rouler ?",
    options: ["30 km/h maximum", "50 km/h, comme en ville", "60 km/h", "La vitesse que je veux"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/zone-scolaire-approche.png",
    explication: "Aux abords des écoles en Guinée, la vitesse est limitée à 30 km/h. Les enfants peuvent surgir imprévisiblement entre deux véhicules. Soyez particulièrement vigilant aux heures d'entrée et de sortie (7-8h, 12-13h, 17-18h).",
    tempsEstime: 20,
    tags: ["sécurité", "école", "vitesse", "30"]
  },
  {
    texte: "Vous approchez de ce carrefour giratoire de nuit à Conakry. Comment procéder ?",
    options: [
      "Ralentir, céder le passage aux véhicules dans le giratoire, utiliser le clignotant",
      "Forcer le passage car j'arrive à droite",
      "Accélérer pour passer avant les autres",
      "M'arrêter complètement à l'entrée"
    ],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/carrefour-giratoire-nuit.png",
    explication: "De nuit comme de jour, les véhicules circulant dans le giratoire ont la priorité. Ralentissez à l'approche, cédez le passage à gauche, entrez prudemment et signalez votre sortie avec le clignotant droit. Vérifiez l'éclairage de vos phares régulièrement.",
    tempsEstime: 25,
    tags: ["priorité", "giratoire", "nuit", "Conakry"]
  },
  {
    texte: "Vous approchez de ce chantier sur route nationale. Quelle est la conduite à tenir ?",
    options: [
      "Ralentir, respecter la signalisation temporaire, céder aux ouvriers",
      "Maintenir ma vitesse pour ne pas bloquer le trafic",
      "Klaxonner pour prévenir les ouvriers",
      "Contourner le chantier par la voie de gauche"
    ],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/panneau-travaux.png",
    explication: "À l'approche d'un chantier, ralentissez, respectez la signalisation temporaire (panneaux orange, cônes) et cédez le passage aux ouvriers et engins. Une amende est prévue en cas de non-respect de la signalisation de chantier.",
    tempsEstime: 20,
    tags: ["conduite", "travaux", "signalisation temporaire"]
  },

  // ── New video questions (reusing existing videos with new context) ──
  {
    texte: "Dans cette vidéo de rond-point à Kankan, vous voulez sortir à la première rue. Quand actionnez-vous le clignotant ?",
    options: [
      "À l'entrée du rond-point, clignotant droit",
      "À l'entrée, clignotant gauche",
      "Juste avant la sortie, clignotant droit",
      "Aucun clignotant n'est nécessaire"
    ],
    bonneReponse: 2,
    categorie: "Priorités",
    difficulte: "difficile",
    mediaType: "video",
    videoUrl: "/videos/scenario-rond-point.mp4",
    scenarioImage: "/scenarios/rond-point-kankan.png",
    explication: "Pour sortir d'un rond-point à la première rue, mettez le clignotant droit juste avant la sortie, après avoir vérifié qu'aucun véhicule n'entre sur votre gauche. À l'entrée, pas de clignotant si vous prenez la première sortie. Pour les sorties suivantes, clignotant gauche à l'entrée puis droit à la sortie.",
    tempsEstime: 30,
    tags: ["priorité", "rond-point", "clignotant", "vidéo", "Kankan"]
  },
  {
    texte: "Dans cette vidéo d'intersection à Kaloum, un taxi jaune arrive à votre droite simultanément. Qui passe ?",
    options: [
      "Le taxi, car la priorité est à droite",
      "Moi, car je suis sur l'axe principal",
      "Celui qui klaxonne le premier",
      "Le véhicule le plus rapide"
    ],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "moyen",
    mediaType: "video",
    videoUrl: "/videos/scenario-intersection.mp4",
    scenarioImage: "/scenarios/intersection-kaloum.png",
    explication: "À une intersection sans signalisation de priorité, la règle de la priorité à droite s'applique à tous les véhicules, y compris les taxis. Le taxi jaune venant de votre droite a la priorité. Vous devez céder le passage et ne vous engager qu'après son passage.",
    tempsEstime: 25,
    tags: ["priorité", "intersection", "taxi", "Kaloum", "vidéo"]
  },
  {
    texte: "Dans cette vidéo sous pluie intense, à quelle distance minimale devez-vous rester du véhicule devant vous ?",
    options: [
      "Au moins 3 secondes (≈ 50 m à 60 km/h)",
      "1 seconde, comme sur route sèche",
      "5 mètres suffisent",
      "2 secondes, c'est la règle générale"
    ],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "video",
    videoUrl: "/videos/scenario-pluie.mp4",
    scenarioImage: "/scenarios/route-pluie.png",
    explication: "Sur route mouillée, la distance de freinage est multipliée par 2. Adoptez au moins 3 secondes de distance de sécurité (environ 50 mètres à 60 km/h). Réduisez votre vitesse de 20% par rapport au sec et allumez vos feux de croisement, jamais les feux de détresse en roulant.",
    tempsEstime: 25,
    tags: ["sécurité", "pluie", "distance", "vidéo"]
  },
  {
    texte: "Dans cette vidéo de zone scolaire à Dixinn, que devez-vous faire en voyant des enfants sur le trottoir ?",
    options: [
      "Ralentir à 30 km/h et être prêt à freiner",
      "Maintenir ma vitesse, les enfants restent sur le trottoir",
      "Klaxonner pour les éloigner",
      "Accélérer pour passer avant qu'ils ne traversent"
    ],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "video",
    videoUrl: "/videos/scenario-ecole.mp4",
    scenarioImage: "/scenarios/zone-scolaire-dixinn.png",
    explication: "En zone scolaire, les enfants peuvent traverser imprévisiblement. Ralentissez à 30 km/h, placez le pied sur le frein et surveillez les mouvements latéraux. Aux heures d'entrée et de sortie, redoublez de vigilance — un enfant peut surgir entre deux véhicules stationnés.",
    tempsEstime: 25,
    tags: ["sécurité", "école", "enfants", "vidéo", "Dixinn"]
  },
  {
    texte: "Dans cette vidéo de dépassement, après avoir dépassé le camion, quand reprenez-vous votre voie ?",
    options: [
      "Lorsque je vois le camion dans mon rétroviseur intérieur",
      "Immédiatement après l'avoir passé",
      "Avant même d'avoir fini de le passer",
      "Lorsque le camion klaxonne"
    ],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "difficile",
    mediaType: "video",
    videoUrl: "/videos/scenario-depassement.mp4",
    scenarioImage: "/scenarios/route-nationale-depassement.png",
    explication: "Après un dépassement, ne reprenez votre voie que lorsque vous voyez entièrement le véhicule dépassé dans votre rétroviseur intérieur. Cela garantit une distance latérale suffisante. Mettez le clignotant droit, vérifiez l'angle mort, et rabattez-vous en douceur.",
    tempsEstime: 30,
    tags: ["conduite", "dépassement", "rétroviseur", "vidéo"]
  }
];

// ─── New courses (3) ─────────────────────────────────────
type NewLesson = {
  titre: string;
  description: string;
  type: 'text' | 'sign' | 'video' | 'quiz' | 'interactive';
  contenu: string;
  duree: number;
  ordre: number;
  signImage?: string;
  scenarioImage?: string;
  mediaUrl?: string;
};

type NewCourse = {
  titre: string;
  description: string;
  categorie: string;
  imageCover: string;
  dureeTotale: number;
  lessons: NewLesson[];
};

const newCourses: NewCourse[] = [
  {
    titre: "Vitesse et distances de sécurité",
    description: "Maîtrisez les limitations de vitesse en Guinée et apprenez à adapter votre vitesse aux conditions. Un cours essentiel avec vidéos, panneaux et situations réelles pour comprendre les distances de sécurité et les temps de réaction.",
    categorie: "Conduite",
    imageCover: "/courses/cover-vitesse.png",
    dureeTotale: 35,
    lessons: [
      {
        titre: "Limitations de vitesse en Guinée",
        description: "Les seuils légaux à connaître",
        type: "sign",
        contenu: "Les limitations de vitesse en Guinée sont : 50 km/h en agglomération, 90 km/h sur route nationale hors agglomération, 110 km/h sur autoroute. Des seuils plus bas s'appliquent dans certaines zones : 30 km/h en zone scolaire, 20 km/h en marche pas à pas près des marchés. Le non-respect est sanctionné d'une amende de 25 000 à 100 000 GNF selon l'excès.",
        duree: 10,
        ordre: 1,
        signImage: "/signs/limitation-50.png"
      },
      {
        titre: "Distance de sécurité sur route sèche",
        description: "La règle des 2 secondes",
        type: "text",
        contenu: "Sur route sèche, la distance de sécurité minimale est de 2 secondes entre deux véhicules. À 50 km/h, cela représente environ 28 mètres. À 90 km/h, c'est 50 mètres. Pour la calculer, repérez un point fixe (panneau, arbre) et comptez le temps entre le passage du véhicule devant et le vôtre. Si moins de 2 secondes, vous êtes trop près.",
        duree: 10,
        ordre: 2
      },
      {
        titre: "Distance de sécurité sous la pluie",
        description: "Vidéo — Route mouillée",
        type: "video",
        contenu: "Sur route mouillée, la distance de freinage est multipliée par 2. Adoptez au moins 3 secondes de distance de sécurité (environ 50 m à 60 km/h). Réduisez votre vitesse de 20% par rapport au sec. Allumez vos feux de croisement, jamais les feux de détresse en roulant. Cette vidéo montre une conduite sous pluie intense : observez comment la visibilité est réduite et l'adhérence altérée.",
        duree: 8,
        ordre: 3,
        mediaUrl: "/videos/scenario-pluie.mp4",
        scenarioImage: "/scenarios/route-pluie.png"
      },
      {
        titre: "Temps de réaction et distance de freinage",
        description: "Comprendre les composantes de l'arrêt",
        type: "text",
        contenu: "La distance d'arrêt = distance de réaction + distance de freinage. Le temps de réaction moyen est de 1 seconde (à 50 km/h, vous parcourez 14 m avant de freiner). La distance de freinage dépend de la vitesse, de l'état de la route, des pneus et des freins. À 50 km/h sur route sèche, il faut environ 25 m pour s'arrêter. À 90 km/h, c'est 70 m. Fatigue, alcool et téléphone allongent le temps de réaction.",
        duree: 8,
        ordre: 4
      },
      {
        titre: "Adapter sa vitesse en zone scolaire",
        description: "Vidéo — Vigilance à Dixinn",
        type: "video",
        contenu: "Aux abords des écoles, ralentissez à 30 km/h maximum. Cette vidéo tournée à Dixinn montre une zone scolaire typique de Conakry. Les enfants peuvent surgir imprévisiblement entre deux véhicules. Soyez particulièrement vigilant aux heures d'entrée et de sortie : 7h-8h, 12h-13h, 17h-18h. Placez systématiquement le pied sur le frein à l'approche de ces zones.",
        duree: 7,
        ordre: 5,
        mediaUrl: "/videos/scenario-ecole.mp4",
        scenarioImage: "/scenarios/zone-scolaire-dixinn.png"
      },
      {
        titre: "Quiz — Vitesse et distances",
        description: "Validez vos acquis",
        type: "quiz",
        contenu: "Quiz de 8 questions sur les limitations de vitesse, distances de sécurité et adaptation à la circulation.",
        duree: 8,
        ordre: 6
      }
    ]
  },

  {
    titre: "Infractions et sanctions routières",
    description: "Connaissez les infractions les plus courantes en Guinée et leurs sanctions : excès de vitesse, alcoolémie, non-port de la ceinture, téléphone au volant. Un cours pratique illustré pour éviter les amendes et conduire en sécurité.",
    categorie: "Infractions",
    imageCover: "/courses/cover-infractions.png",
    dureeTotale: 30,
    lessons: [
      {
        titre: "Excès de vitesse — Barème des amendes",
        description: "De 25 000 à 100 000 GNF",
        type: "sign",
        contenu: "L'excès de vitesse est l'infraction la plus sanctionnée en Guinée. Les amendes varient de 25 000 à 100 000 GNF selon le dépassement : moins de 20 km/h au-dessus = 25 000 GNF, 20 à 30 km/h = 50 000 GNF, plus de 30 km/h = 100 000 GNF. Au-delà de 40 km/h, le permis peut être suspendu. Les contrôles radar sont de plus en plus fréquents sur les routes nationales et à Conakry.",
        duree: 8,
        ordre: 1,
        signImage: "/signs/limitation-50.png"
      },
      {
        titre: "Alcoolémie — La limite légale",
        description: "0,5 g/l en Guinée, 0,2 g/l pour les jeunes",
        type: "text",
        contenu: "La limite d'alcoolémie en Guinée est de 0,5 g par litre de sang. Pour les jeunes conducteurs (permis depuis moins de 3 ans), elle est de 0,2 g/l. Un verre standard (vin, bière, pastis) fait grimper le taux à 0,2-0,3 g/l. Au-delà de la limite : amende de 200 000 à 500 000 GNF, suspension du permis, et en cas de récidive ou d'accident avec blessés, peine de prison. Ne conduisez jamais après avoir bu.",
        duree: 8,
        ordre: 2
      },
      {
        titre: "Non-port de la ceinture de sécurité",
        description: "Obligatoire avant ET arrière",
        type: "text",
        contenu: "Le port de la ceinture est obligatoire pour TOUS les occupants, à l'avant comme à l'arrière. Amende forfaitaire : 25 000 GNF par passager non attaché. La ceinture réduit de 50% le risque de décès en cas d'accident. Ajustez-la basse sur le bassin, plate contre les épaules, sans torsion. Pour les enfants de moins de 10 ans, utilisez un rehausseur ou un siège adapté.",
        duree: 6,
        ordre: 3
      },
      {
        titre: "Téléphone au volant",
        description: "Sanctions et bonnes pratiques",
        type: "text",
        contenu: "L'usage du téléphone tenu en main en conduisant est interdit en Guinée. Amende : 50 000 GNF. Le téléphone mains-libres (kit Bluetooth) est toléré mais déconseillé : la conversation réduit l'attention de 40%. Pour utiliser le GPS, fixez-le sur un support et programmez la destination avant de démarrer. En cas d'appel urgent, garez-vous en lieu sûr avant de décrocher.",
        duree: 6,
        ordre: 4
      },
      {
        titre: "Conduite sans permis ou permis expiré",
        description: "Sanctions pénales lourdes",
        type: "text",
        contenu: "Conduire sans permis valide (jamais obtenu, expiré, suspendu) est un délit pénal en Guinée : amende de 500 000 à 2 000 000 GNF et/ou emprisonnement de 1 à 6 mois. Le véhicule peut être immobilisé. Vérifiez la date d'expiration de votre permis (valable 10 ans) et renouvelez-le à temps auprès du centre de cartes grises le plus proche.",
        duree: 6,
        ordre: 5
      },
      {
        titre: "Conduite en état de fatigue",
        description: "Reconnaître les signes",
        type: "interactive",
        contenu: "La fatigue multiplie par 3 le risque d'accident. Signes avant-coureurs : bâillements, picotements des yeux, difficulté à fixer la route, micro-sommeils. Sur les longs trajets (Conakry-Kankan, Conakry-Nzérékoré), faites une pause toutes les 2 heures ou 200 km. Ne conduisez jamais plus de 10 heures par jour. La nuit, privilégiez le repos — les routes guinéennes ne sont pas toutes éclairées.",
        duree: 6,
        ordre: 6,
        scenarioImage: "/scenarios/conduite-nuit-conakry.png"
      },
      {
        titre: "Quiz — Infractions et sanctions",
        description: "Testez vos connaissances",
        type: "quiz",
        contenu: "Quiz de 10 questions sur les infractions routières et leurs sanctions en Guinée.",
        duree: 8,
        ordre: 7
      }
    ]
  },

  {
    titre: "Conduite écologique et économique",
    description: "Adoptez une conduite éco-responsable pour réduire votre consommation de carburant de 15 à 25%, préserver votre véhicule et limiter votre empreinte environnementale. Techniques d'accélération, anticipation, optimisation des trajets en contexte guinéen.",
    categorie: "Conduite",
    imageCover: "/courses/cover-conduite-eco.png",
    dureeTotale: 25,
    lessons: [
      {
        titre: "Les principes de l'éco-conduite",
        description: "Pourquoi et comment conduire éco",
        type: "text",
        contenu: "L'éco-conduite permet de réduire la consommation de carburant de 15 à 25%, l'usure du véhicule et les émissions de CO2. Principes : anticipation, souplesse, régularité. Anticipez le trafic pour éviter freinages/accélérations brutaux. Passez les rapports rapidement (vers 2000 tr/min). Maintenez une vitesse constante. À l'arrêt prolongé (plus de 30 secondes), coupez le moteur.",
        duree: 8,
        ordre: 1
      },
      {
        titre: "Anticipation dans le trafic de Conakry",
        description: "Adopter une conduite fluide",
        type: "interactive",
        contenu: "À Conakry, le trafic est dense et imprévisible. Anticipez en regardant 2 à 3 véhicules devant vous, pas seulement le véhicule immédiat. Repérez les motos qui pourraient s'insérer, les piétons près du trottoir, les taxis qui pourraient s'arrêter. Lissez votre vitesse : il vaut mieux rouler à 30 km/h sans s'arrêter que de faire des pointes à 50 et des arrêts complets. Vous économisez carburant et stress.",
        duree: 8,
        ordre: 2,
        scenarioImage: "/scenarios/moto-circulation-conakry.png"
      },
      {
        titre: "Pression des pneus et entretien",
        description: "Un pneu bien gonflé consomme moins",
        type: "sign",
        contenu: "Une pression de pneus inférieure de 0,3 bar au seuil recommandé augmente la consommation de 2 à 3%. Vérifiez la pression mensuellement à froid. Pneus sous-gonflés = usure rapide, tenue de route dégradée, surconsommation. Pneus sur-gonflés = usure centrale, confort réduit. Respectez les valeurs indiquées sur le montant de la portière conducteur ou le manuel. En Guinée, vérifiez plus souvent sur routes en mauvais état.",
        duree: 5,
        ordre: 3,
        signImage: "/signs/limitation-50.png"
      },
      {
        titre: "Optimiser ses trajets",
        description: "Planifier pour économiser",
        type: "text",
        contenu: "Un trajet planifié consomme moins. Regroupez vos courses en un seul trajet plutôt que plusieurs. Évitez les heures de pointe (7h-9h, 17h-19h à Conakry) si possible : le trafic stop-and-go multiplie la consommation. Utilisez les applications de navigation (Google Maps, Waze) pour éviter les embouteillages. Pour les longs trajets (Conakry-Kankan), partez tôt le matin : température clémente, trafic réduit, meilleure visibilité.",
        duree: 5,
        ordre: 4
      },
      {
        titre: "Quiz — Conduite éco",
        description: "Validez vos acquis",
        type: "quiz",
        contenu: "Quiz de 6 questions sur l'éco-conduite et l'optimisation du carburant.",
        duree: 5,
        ordre: 5
      }
    ]
  }
];

// ─── Main ────────────────────────────────────────────────
async function main() {
  console.log('🌱 Multimedia enrichment seed (Phase 17)...');
  console.log('');

  // ── Add new questions ──
  console.log('▶ Adding new media-rich questions...');
  let addedQ = 0, skippedQ = 0;
  for (const q of newQuestions) {
    const existing = await findQuestionByTexte(q.texte);
    if (existing) {
      console.log(`  ✓ exists: "${q.texte.substring(0, 60)}..."`);
      skippedQ++;
      continue;
    }
    await prisma.question.create({
      data: {
        texte: q.texte,
        options: JSON.stringify(q.options),
        bonneReponse: q.bonneReponse,
        categorie: q.categorie,
        difficulte: q.difficulte,
        mediaType: q.mediaType,
        signImage: q.signImage || null,
        scenarioImage: q.scenarioImage || null,
        videoUrl: q.videoUrl || null,
        explication: q.explication,
        points: q.points ?? 1,
        tempsEstime: q.tempsEstime ?? 20,
        tags: JSON.stringify(q.tags),
        actif: true,
      },
    });
    console.log(`  + added: "${q.texte.substring(0, 60)}..." [${q.mediaType}]`);
    addedQ++;
  }
  console.log(`  → ${addedQ} new questions added, ${skippedQ} already present.`);

  // ── Add new courses ──
  console.log('');
  console.log('▶ Adding new media-rich courses...');
  let addedC = 0, skippedC = 0;
  for (const c of newCourses) {
    const existing = await prisma.course.findFirst({ where: { titre: c.titre } });
    if (existing) {
      console.log(`  ✓ exists course: "${c.titre}"`);
      skippedC++;
      continue;
    }
    const created = await prisma.course.create({
      data: {
        titre: c.titre,
        description: c.description,
        categorie: c.categorie,
        status: 'publie',
        imageCover: c.imageCover,
        dureeTotale: c.dureeTotale,
        nbInscrits: 0,
        rating: 0,
      },
    });
    await prisma.lesson.createMany({
      data: c.lessons.map(l => ({
        courseId: created.id,
        titre: l.titre,
        description: l.description,
        type: l.type,
        contenu: l.contenu,
        mediaUrl: l.mediaUrl || null,
        signImage: l.signImage || null,
        scenarioImage: l.scenarioImage || null,
        duree: l.duree,
        ordre: l.ordre,
      })),
    });
    console.log(`  + added course: "${c.titre}" (${c.lessons.length} lessons)`);
    addedC++;
  }
  console.log(`  → ${addedC} new courses added, ${skippedC} already present.`);

  // ── Summary ──
  console.log('');
  console.log('✅ Multimedia enrichment completed!');
  const totalQ = await prisma.question.count();
  const totalC = await prisma.course.count();
  const totalL = await prisma.lesson.count();
  console.log(`   📊 Total questions: ${totalQ}`);
  console.log(`   📊 Total courses:   ${totalC}`);
  console.log(`   📊 Total lessons:   ${totalL}`);
  console.log('');
  console.log('   📁 Media inventory:');
  console.log('      Signs:    17 (10 original + 7 new)');
  console.log('      Scenarios: 20 (15 original + 5 new)');
  console.log('      Videos:    8');
  console.log('      Covers:    6 (3 original + 3 new)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
