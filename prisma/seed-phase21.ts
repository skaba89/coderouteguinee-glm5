// ============================================================
// CodeRoute Guinée — Phase 21 Expansion Seed
// ============================================================
// Adds 3 new courses (~17 lessons) + 50 new questions across
// all 5 categories (Signalisation, Priorités, Conduite,
// Sécurité, Infractions). Includes audioFr enrichments for
// accessibility. Idempotent: skip if (texte) or (titre) match.
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findQuestionByTexte(texte: string) {
  return prisma.question.findFirst({ where: { texte } });
}

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
  audioFr?: string;
  explication: string;
  points?: number;
  tempsEstime?: number;
  tags: string[];
};

const newQuestions: NewQuestion[] = [
  // ═════════════════════════════════════════════════════════════
  // SIGNALISATION (10 questions)
  // ═════════════════════════════════════════════════════════════
  {
    texte: "Vous apercevez ce panneau triangulaire avec un virage dessiné. Comment adaptez-vous votre conduite ?",
    options: ["Ralentir et adapter ma vitesse", "Accélérer pour passer le virage vite", "Klaxonner avant le virage", "Maintenir ma vitesse actuelle"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/virage-dangereux.png",
    explication: "Le panneau triangulaire avec virage signale un virage dangereux. Ralentissez AVANT le virage, jamais pendant. Adaptez votre vitesse à la visibilité et au rayon du virage. En Guinée, ces panneaux sont fréquents sur les routes nationales entre Conakry et Kankan.",
    tempsEstime: 15,
    tags: ["panneau", "virage", "danger"]
  },
  {
    texte: "Ce panneau annonce la fin d'une interdiction de dépasser. Que pouvez-vous faire ?",
    options: ["Reprendre les dépassements si la visibilité est bonne", "Continuer à ne pas dépasser", "Dépasser uniquement les motos", "Accélérer immédiatement"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/fin-interdiction-depasser.png",
    explication: "Ce panneau signale la fin de zone d'interdiction de dépasser. Vous pouvez reprendre les manœuvres de dépassement, mais seulement si les conditions de sécurité sont réunies : visibilité suffisante, pas de véhicule arrivant en face, ligne continue autorisée.",
    tempsEstime: 15,
    tags: ["panneau", "fin", "dépassement"]
  },
  {
    texte: "Vous arrivez à un carrefour et voyez ce panneau. Qui a la priorité ?",
    options: ["Les véhicules venant de droite", "Moi, car je suis sur la route principale", "Personne, c'est un stop généralisé", "Les piétons uniquement"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/priorite-droite.png",
    explication: "Ce panneau indique que vous devez céder le passage aux véhicules venant de droite. C'est la règle de priorité à droite. Ralentissez à l'approche de l'intersection et soyez prêt à stopper si un véhicule arrive de votre droite.",
    tempsEstime: 15,
    tags: ["panneau", "priorité", "droite"]
  },
  {
    texte: "Ce panneau indique une obligation. Que devez-vous faire ?",
    options: ["Tourner à droite obligatoirement", "Tourner à gauche", "Continuer tout droit", "Faire demi-tour"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/obligation-droite.png",
    explication: "Le panneau rond bleu avec une flèche indique une direction obligatoire. Ici, vous devez tourner à droite. Continuer tout droit ou tourner à gauche constituerait une infraction. Ces panneaux sont utilisés dans les carrefours à sens unique ou les giratoires.",
    tempsEstime: 12,
    tags: ["panneau", "obligation", "direction"]
  },
  {
    texte: "Ce panneau vous indique que vous entrez dans un sens interdit. Que faites-vous ?",
    options: ["Ne pas entrer, faire demi-tour", "Continuer prudemment", "Klaxonner et avancer", "Entrer uniquement si pas de véhicule"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/sens-interdit.png",
    explication: "Le panneau rond rouge avec barre blanche horizontale indique un sens interdit. Aucune exception : ne pas entrer, même s'il n'y a pas de véhicule. Faites demi-tour en sécurité. Pénétrer dans un sens interdit est sanctionné d'une amende de 50 000 GNF.",
    tempsEstime: 12,
    tags: ["panneau", "sens interdit", "interdiction"]
  },
  {
    texte: "À quoi sert ce panneau bleu avec une flèche courbe ?",
    options: ["Indiquer un rond-point obligatoire", "Interdire le rond-point", "Annoncer un parking", "Indiquer une sortie"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/rond-point-obligatoire.png",
    explication: "Le panneau rond bleu avec flèches courbes indique que vous devez contourner le rond-point dans le sens indiqué (généralement sens anti-horaire en Guinée). Ne coupez pas le rond-point, même si la sortie est immédiate à droite.",
    tempsEstime: 12,
    tags: ["panneau", "rond-point", "obligation"]
  },
  {
    texte: "Vous voyez ce panneau avec un piéton. Que signifie-t-il ?",
    options: ["Passage piéton à venir", "Parking piéton", "Fin de zone piétonne", "Piétons interdits"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/passage-pietons.png",
    explication: "Ce panneau triangulaire annonce un passage piéton. Ralentissez et soyez prêt à stopper pour laisser passer les piétons qui s'engagent. En Guinée, aux abords des marchés (Madina, Niger), la vigilance est accrue : piétons, charrettes et motos peuvent surgir.",
    tempsEstime: 12,
    tags: ["panneau", "piéton", "passage"]
  },
  {
    texte: "Ce panneau circulaire avec une bande rouge et un 'P' barré. Que signifie-t-il ?",
    options: ["Stationnement interdit", "Parking autorisé", "Pause obligatoire", "Zone de péage"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/interdiction-stationner.png",
    explication: "Ce panneau indique que le stationnement est interdit. Vous pouvez vous arrêter brièvement pour monter/descendre un passager, mais pas garer le véhicule. En Guinée, le non-respect entraîne une amende de 25 000 GNF et la mise en fourrière possible.",
    tempsEstime: 12,
    tags: ["panneau", "stationnement", "interdiction"]
  },
  {
    texte: "Ce panneau rouge avec un 'C' ou deux véhicules. Que signifie-t-il ?",
    options: ["Interdiction de dépasser", "Parking pour camions", "Carrefour dangereux", "Zone de contrôle"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/interdiction-depasser.png",
    explication: "Ce panneau interdit le dépassement de véhicules (sauf deux-roues sans side-car). Cette interdiction s'applique jusqu'au panneau de fin d'interdiction. Le dépassement dans cette zone est sanctionné d'une amende de 100 000 GNF et d'un retrait de points.",
    tempsEstime: 12,
    tags: ["panneau", "dépassement", "interdiction"]
  },
  {
    texte: "Que signifie ce panneau triangulaire avec un point d'exclamation ?",
    options: ["Danger non précisé, soyez vigilant", "Arrêt obligatoire", "Zone sans issue", "Panneau publicitaire"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/danger.png",
    explication: "Le panneau triangulaire avec point d'exclamation signale un danger non précisé. Soyez particulièrement vigilant : il peut s'agir d'un virage, d'une école, d'animaux, d'un chantier. Réduisez votre vitesse et observez l'environnement.",
    tempsEstime: 12,
    tags: ["panneau", "danger", "vigilance"]
  },

  // ═════════════════════════════════════════════════════════════
  // PRIORITÉS (10 questions)
  // ═════════════════════════════════════════════════════════════
  {
    texte: "Vous arrivez à cette intersection à Kaloum sans feu. Qui priorité ?",
    options: ["Le véhicule venant de droite", "Moi, car la route est plus large", "Le véhicule qui va plus vite", "Celui qui klaxonne en premier"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/intersection-kaloum.png",
    explication: "En l'absence de panneau de priorité, c'est la règle de la priorité à droite qui s'applique. Le véhicule venant de votre droite a la priorité, même si votre route est plus large. Ralentissez à l'approche de toute intersection non réglée.",
    tempsEstime: 20,
    tags: ["priorité", "intersection", "droite"]
  },
  {
    texte: "Dans ce rond-point à Kankan, vous voulez sortir à la 2ème sortie. Qui priorité ?",
    options: ["Les véhicules déjà dans le rond-point", "Moi, car je suis à l'entrée", "Le véhicule qui arrive en face", "Aucun, c'est premier arrivé premier servi"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "moyen",
    mediaType: "video",
    videoUrl: "/videos/scenario-rond-point.mp4",
    scenarioImage: "/scenarios/rond-point-kankan.png",
    explication: "Les véhicules déjà engagés dans le rond-point ont la priorité. À l'entrée, vous devez céder le passage à ceux qui y circulent. Mettez votre clignotant gauche pour signaler que vous continuez, puis droite à l'approche de votre sortie.",
    tempsEstime: 25,
    tags: ["rond-point", "priorité", "sortie"]
  },
  {
    texte: "À ce carrefour avec feux, le feu passe au vert pour vous mais un camion traverse. Que faites-vous ?",
    options: ["Attendre que le carrefour soit dégagé", "Avancer car j'ai le vert", "Klaxonner pour faire bouger le camion", "Faire un appel de phares"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/carrefour-feux.png",
    explication: "Le vert vous autorise à avancer, mais uniquement si l'intersection est dégagée. Si un véhicule (souvent un camion lent à Conakry) bloque le carrefour, attendez. S'engager dans un carrefour encombré est une infraction et bloque la circulation transversale.",
    tempsEstime: 18,
    tags: ["feu", "carrefour", "encombrement"]
  },
  {
    texte: "Vous êtes sur la RN1 et un véhicule d'urgence approche derrière vous. Que faire ?",
    options: ["Ralentir et serrer à droite", "Accélérer pour lui céder le chemin", "Stopper net au milieu", "Continuer normalement"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/peage-rn1.png",
    explication: "Les véhicules d'urgence (police, pompiers, SAMU) ont priorité. Ralentissez, serrez à droite et laissez passer. Ne vous arrêtez jamais brutalement au milieu de la route : cela créerait un danger. Si vous êtes à l'arrêt, restez à l'arrêt.",
    tempsEstime: 15,
    tags: ["urgence", "police", "priorité"]
  },
  {
    texte: "Un piéton s'engage sur un passage clouté sans feu. Que faites-vous ?",
    options: ["Stopper pour le laisser passer", "Klaxonner pour le faire reculer", "Contourner le piéton", "Accélérer pour passer avant"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/passage-pietons-marche.png",
    explication: "Sur un passage piéton sans feu, le piéton a TOUJOURS la priorité dès qu'il manifeste l'intention de traverser. Stoppez complètement et laissez-le traverser. En Guinée, près des marchés (Madina, Tombè-a), la prudence est de mise : enfants, personnes âgées, marchands.",
    tempsEstime: 15,
    tags: ["piéton", "passage", "priorité"]
  },
  {
    texte: "Vous abordez ce pont étroit à Tombo. Un camion arrive en face. Qui passe ?",
    options: ["Celui qui est le plus près de la sortie du pont", "Le plus gros véhicule", "Celui qui klaxonne", "Le premier arrivé sur le pont"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "difficile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/pont-tombo.png",
    explication: "Sur un pont étroit, le véhicule le plus proche de la sortie du pont a la priorité. Si le camion est engagé et vous êtes à l'entrée, attendez. Ne tentez jamais de croisement à 2 véhicules sur un pont étroit : risque de collision et de chute.",
    tempsEstime: 20,
    tags: ["pont", "étroit", "priorité"]
  },
  {
    texte: "À cette intersection, vous voulez tourner à gauche. Qui priorité ?",
    options: ["Les véhicules venant en face et allant tout droit", "Moi, car je tourne", "Les piétons uniquement", "Aucun, c'est un stop généralisé"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/intersection-conakry.png",
    explication: "Pour tourner à gauche, vous devez céder le passage aux véhicules venant en face qui continuent tout droit ou tournent à droite. Attendez un créneau sûr. Les piétons sur le passage piéton ont également priorité. Soyez patient, surtout à Conakry où le trafic est dense.",
    tempsEstime: 20,
    tags: ["tourne-gauche", "priorité", "intersection"]
  },
  {
    texte: "Vous voyez ce panneau triangulaire à une intersection. Que signifie-t-il ?",
    options: ["Vous n'avez pas la priorité au carrefour", "Vous êtes prioritaire", "Stop obligatoire", "Carrefour en travaux"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/cedezer-passage.png",
    explication: "Le panneau triangulaire 'cédez le passage' indique que vous n'avez pas la priorité au carrefour. Vous devez ralentir et céder aux véhicules de la route abordée. Pas besoin de stopper complètement si la voie est libre, mais soyez prêt à le faire.",
    tempsEstime: 15,
    tags: ["cédez-passage", "priorité", "carrefour"]
  },
  {
    texte: "Sur cette route à 2 voies, vous voulez dépasser un camion. Quand pouvez-vous le faire ?",
    options: ["Quand la visibilité est suffisante et la ligne est discontinue", "Dès que le camion ralentit", "Quand un véhicule arrive en face", "Uniquement la nuit"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/route-nationale-depassement.png",
    explication: "Le dépassement n'est autorisé que si : visibilité suffisante (au moins 500 m), ligne discontinue, aucun véhicule arrivant en face, vitesse adaptée. Vérifiez le rétroviseur, mettez le clignotant gauche, dépassez franchement. En Guinée, les dépassements sur RN1 causent 30% des accidents graves.",
    tempsEstime: 25,
    tags: ["dépassement", "route", "sécurité"]
  },
  {
    texte: "Vous êtes dans une zone marchande piétonne. Un piéton marche au milieu de la route. Que faire ?",
    options: ["Rouler très lentement (≤ 20 km/h) et le laisser passer", "Klaxonner pour le faire avancer", "Le dépasser par la droite", "L'attendre immobile"],
    bonneReponse: 0,
    categorie: "Priorités",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/zone-marche-pietons.png",
    explication: "En zone piétonne ou marchande, le piéton est roi. Roulez à vitesse très réduite (≤ 20 km/h), klaxonnez seulement en cas de réel danger, et laissez les piétons circuler. À Madina et Niger à Conakry, la cohabitation piétons-vehicules est permanente : prudence maximale.",
    tempsEstime: 15,
    tags: ["piéton", "marché", "lent"]
  },

  // ═════════════════════════════════════════════════════════════
  // CONDUITE (10 questions)
  // ═════════════════════════════════════════════════════════════
  {
    texte: "Vous conduisez la nuit à Conakry. Quelle est la vitesse adaptée ?",
    options: ["Réduire à 40-50 km/h pour adapter à la visibilité", "Maintenir 50 km/h car c'est la limite légale", "Accélérer pour sortir vite de la ville", "Rouler en feux de route tout le temps"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "moyen",
    mediaType: "video",
    videoUrl: "/videos/scenario-nuit.mp4",
    scenarioImage: "/scenarios/conduite-nuit-conakry.png",
    audioFr: "Voici une vidéo tournée de nuit à Conakry. Observez la densité du trafic, les motos souvent sans feu, et les piétons sur les bas-côtés. La nuit, réduisez votre vitesse à 40-50 km/h même si la limite est à 50. Allumez les feux de croisement dès la tombée du jour. Attention aux motos sans éclairage qui surgissent.",
    explication: "La nuit, la visibilité est réduite. Adaptez votre vitesse à la portée de vos phares. À Conakry, motos sans feu, piétons et charrettes sont des dangers permanents. Feux de croisement en ville, feux de route sur route nationale si aucun véhicule en face.",
    tempsEstime: 25,
    tags: ["nuit", "Conakry", "vitesse"]
  },
  {
    texte: "Sous cette pluie intense, quelle attitude adopter ?",
    options: ["Réduire vitesse de 20-30%, allumer feux de croisement, augmenter distance", "Maintenir vitesse, allumer feux de détresse", "Stopper sur le bas-côté sans feux", "Accélérer pour sortir vite de la zone pluvieuse"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "moyen",
    mediaType: "video",
    videoUrl: "/videos/scenario-pluie.mp4",
    scenarioImage: "/scenarios/route-pluie.png",
    audioFr: "Voici une vidéo tournée sous pluie intense. La visibilité est réduite à 50 mètres. La chaussée est glissante, l'adhérence est divisée par deux. Réduisez votre vitesse de 20 à 30%. Allumez les feux de croisement, jamais les feux de détresse en roulant. Augmentez la distance de sécurité à 4 secondes. La distance de freinage est multipliée par 2 sur route mouillée.",
    explication: "Sous pluie : réduisez vitesse de 20-30%, allumez feux de croisement, augmentez distance de sécurité à 3-4 secondes. Les feux de détresse en roulant sont INTERDITS et dangereux (confusent les autres). Risque d'aquaplaning au-dessus de 80 km/h.",
    tempsEstime: 25,
    tags: ["pluie", "vitesse", "sécurité"]
  },
  {
    texte: "Vous êtes à Conakry dans un embouteillage. Comment réagir face aux motos ?",
    options: ["Anticiper, regarder les rétroviseurs fréquemment, ne pas changer de voie brusquement", "Klaxonner en continu", "Avancer en zigzag", "Ouvrir la portière pour les faire passer"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "moyen",
    mediaType: "video",
    videoUrl: "/videos/scenario-moto.mp4",
    scenarioImage: "/scenarios/moto-circulation-conakry.png",
    audioFr: "Voici une vidéo tournée à Conakry. Le trafic est dense et lent. Une moto s'infiltre à droite entre les véhicules. Anticipez : regardez fréquemment vos rétroviseurs. Ne changez pas de voie brusquement. Ne sortez pas la main. Les motos peuvent surgir de partout, notamment entre les voies. Prévoyez toujours une marge à droite pour les motos qui remontent le trafic.",
    explication: "À Conakry, les motos taxi (clandos) s'infiltrent partout. Anticipez, vérifiez rétroviseurs, ne changez pas de voie brusquement. Ne sortez jamais la main ou la portière. Laissez une marge à droite pour les motos qui remontent le trafic.",
    tempsEstime: 25,
    tags: ["moto", "Conakry", "embouteillage"]
  },
  {
    texte: "Sur cette route nationale, à quelle distance du véhicule devant devez-vous rouler ?",
    options: ["Au moins 50 m (2 secondes) à 90 km/h", "20 m pour bien voir", "5 m pour ne pas perdre le véhicule", "100 m même si lent"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/route-nationale-depassement.png",
    explication: "À 90 km/h sur route nationale, la distance de sécurité minimale est de 50 m (règle des 2 secondes). Comptez 'un-two-three' entre le passage du véhicule devant et le vôtre à un repère fixe. Trop près = risque de collision si freinage brutal.",
    tempsEstime: 15,
    tags: ["distance", "sécurité", "route"]
  },
  {
    texte: "Comment dépasser ce camion sur route nationale en sécurité ?",
    options: ["Vérifier rétroviseur, clignotant, déboîter franchement, signal clignotant droite au retour", "Coller le camion pour mieux voir", "Dépasser uniquement la nuit", "Dépasser uniquement si un autre véhicule le fait"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "difficile",
    mediaType: "video",
    videoUrl: "/videos/scenario-depassement.mp4",
    scenarioImage: "/scenarios/depassement.png",
    audioFr: "Voici une vidéo montrant un dépassement de camion sur route nationale. Le conducteur vérifie son rétroviseur gauche, met son clignotant, déboîte franchement, accélère pour dépasser vite, puis met le clignotant droit pour se rabattre. Étapes obligatoires : visibilité 500m, ligne discontinue, aucun véhicule en face, clignotant, contrôle visuel.",
    explication: "Dépassement sûr : vérifier rétro (aucun véhicule qui vous dépasse), clignotant gauche, déboîter franchement (ne pas hésiter), accélérer, clignotant droit pour se rabattre à bonne distance. Ne jamais dépasser à l'aveugle dans un virage ou en haut de côte.",
    tempsEstime: 30,
    tags: ["dépassement", "camion", "sécurité"]
  },
  {
    texte: "Vous approchez d'une zone scolaire à Dixinn. Quelle attitude ?",
    options: ["Ralentir à 30 km/h, pied prêt sur le frein, regard attentif", "Maintenir 50 km/h", "Klaxonner pour prévenir", "Accélérer pour passer avant les enfants"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "facile",
    mediaType: "video",
    videoUrl: "/videos/scenario-ecole.mp4",
    scenarioImage: "/scenarios/zone-scolaire-dixinn.png",
    audioFr: "Voici une vidéo à l'approche d'une école à Dixinn. La zone est signalée par un panneau 30 km/h. Aux heures d'entrée (7h-8h), de pause (12h-13h) et de sortie (17h-18h), les enfants peuvent surgir entre deux voitures. Ralentissez à 30 km/h, gardez le pied prêt sur le frein, et soyez extrêmement attentif. Un enfant peut courir sans regarder.",
    explication: "En zone scolaire : 30 km/h maximum, vigilance accrue aux heures d'entrée/sortie (7h-8h, 12h-13h, 17h-18h). Les enfants sont imprévisibles : peuvent courir, tomber, surgir entre les véhicules. Pied prêt sur le frein à l'approche du panneau.",
    tempsEstime: 18,
    tags: ["école", "enfants", "30 km/h"]
  },
  {
    texte: "Sur cette route de nuit, un véhicule arrive en face. Que faites-vous avec vos feux ?",
    options: ["Passer en feux de croisement", "Garder les feux de route", "Éteindre les feux", "Allumer les feux de détresse"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/conduite-nuit-conakry.png",
    explication: "Quand un véhicule arrive en face, passez en feux de croisement pour ne pas l'éblouir. Les feux de route (pleins phares) sont à couper à 150 m du véhicule arrivant en face, et quand vous suivez un véhicule à 50 m. Éblouir = danger pour les deux conducteurs.",
    tempsEstime: 15,
    tags: ["nuit", "feux", "croisement"]
  },
  {
    texte: "À l'approche de ce carrefour giratoire la nuit, comment procéder ?",
    options: ["Ralentir, céder le passage aux véhicules engagés, utiliser les clignotants", "Maintenir vitesse, foncer", "S'arrêter systématiquement", "Klaxonner avant d'entrer"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "moyen",
    mediaType: "video",
    videoUrl: "/videos/scenario-giratoire-nuit.mp4",
    scenarioImage: "/scenarios/carrefour-giratoire-nuit.png",
    audioFr: "Voici un giratoire la nuit à Conakry. La visibilité est correcte mais le trafic est dense. À l'approche : ralentissez, observez les véhicules déjà engagés, cédez-leur le passage. Clignotant gauche pour continuer dans le giratoire, clignotant droit à l'approche de votre sortie. Ne vous arrêtez jamais dans le giratoire.",
    explication: "Giratoire la nuit : ralentir fortement, céder le passage à ceux déjà engagés, utiliser clignotants (gauche pour continuer, droit pour sortir). Ne jamais s'arrêter dans le giratoire. La nuit, attention aux véhicules sans feu et aux motos.",
    tempsEstime: 25,
    tags: ["giratoire", "nuit", "priorité"]
  },
  {
    texte: "Sur cette route avec travaux, quelle est la bonne conduite ?",
    options: ["Ralentir, respecter les panneaux temporaires, vigilance ouvriers", "Maintenir vitesse normale", "Accélérer pour passer vite", "Klaxonner pour prévenir"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "facile",
    mediaType: "video",
    videoUrl: "/videos/scenario-travaux.mp4",
    scenarioImage: "/scenarios/panneau-travaux.png",
    audioFr: "Voici une vidéo d'un chantier routier sur la route nationale. Des ouvriers travaillent près de la chaussée. Ralentissez à la vitesse indiquée par le panneau temporaire (souvent 30-50 km/h). Respectez les panneaux orange, les plots, les cônes. Soyez vigilant : un ouvrier peut traverser, un camion peut faire demi-tour. Ne klaxonnez pas pour ne pas surprendre.",
    explication: "En zone de travaux : ralentir, respecter les panneaux temporaires (souvent 30-50 km/h), être vigilant aux ouvriers et engins. Ne klaxonnez pas. Les ouvriers peuvent traverser inopinément. Un chantier = danger accru, prudence maximale.",
    tempsEstime: 20,
    tags: ["travaux", "ralentir", "ouvriers"]
  },
  {
    texte: "Vous arrivez à ce carrefour feux. Le feu passe au orange. Que faites-vous ?",
    options: ["Si vous pouvez stopper en sécurité, arrêtez-vous", "Accélérer pour passer avant le rouge", "Continuer à la même vitesse", "Freiner brutalement"],
    bonneReponse: 0,
    categorie: "Conduite",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/carrefour-feux.png",
    explication: "Au feu orange, vous devez stopper si vous pouvez le faire en sécurité. Si vous êtes trop près pour freiner sans danger, continuez. Le feu orange n'est pas un 'accéléré pour passer' — c'est un 'préparez-vous à stopper'. Freinage brutal = risque de collision arrière.",
    tempsEstime: 12,
    tags: ["feu", "orange", "arrêt"]
  },

  // ═════════════════════════════════════════════════════════════
  // SÉCURITÉ (10 questions)
  // ═════════════════════════════════════════════════════════════
  {
    texte: "Sur cette route rurale, vous voyez des animaux. Que faites-vous ?",
    options: ["Ralentir fortement, klaxonner modérément, attendre qu'ils dégagent", "Accélérer pour passer avant", "Contourner en force", "Faire appel de phares"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "video",
    videoUrl: "/videos/scenario-animaux.mp4",
    scenarioImage: "/scenarios/animaux-nuit.png",
    audioFr: "Voici une vidéo de nuit sur une route rurale. Des bovins traversent la route. La nuit, sur les routes rurales de Guinée, les animaux (bovins, moutons, chèvres) sont un danger permanent. Ralentissez fortement à 40 km/h. Klaxonnez modérément pour les faire bouger. N'accélérez jamais : un bovin peut pivoter brusquement. Feux de croisement, voire route si aucun véhicule en face.",
    explication: "Animaux sur la route = danger. Ralentissez fortement, klaxonnez modérément pour les faire bouger, attendez qu'ils dégagent. N'accélérez jamais. Sur les routes rurales de Guinée (Kindia, Mamou, Labé), bovins et moutons sont fréquents, surtout la nuit et au lever du jour.",
    tempsEstime: 20,
    tags: ["animaux", "rurale", "nuit"]
  },
  {
    texte: "À cette zone scolaire, qui peut surgir inopinément ?",
    options: ["Un enfant entre deux véhicules", "Un camion", "Un motard adulte", "Une voiture sortant d'un parking"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/zone-scolaire-approche.png",
    explication: "En zone scolaire, le danger principal est l'enfant imprévisible : peut courir entre deux voitures, tomber, jouer sur le trottoir et déboucher soudainement. Aux heures d'entrée/sortie, soyez extrêmement vigilant. Ralentissez à 30 km/h, regard balayant trottoirs et interstices entre véhicules.",
    tempsEstime: 18,
    tags: ["école", "enfant", "vigilance"]
  },
  {
    texte: "Sur cette route mouillée, quel est le risque principal ?",
    options: ["Aquaplaning (perte d'adhérence)", "Sur-consommation de carburant", "Usure prématurée des pneus", "Éblouissement"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/route-pluie.png",
    explication: "Sur route mouillée, le risque principal est l'aquaplaning : un film d'eau s'intercale entre pneu et chaussée, le véhicule flotte et devient incontrôlable. Risque accru au-dessus de 80 km/h. En cas d'aquaplaning : NE PAS freiner, NE PAS tourner, décélérer doucement en ligne droite.",
    tempsEstime: 20,
    tags: ["aquaplaning", "pluie", "adhérence"]
  },
  {
    texte: "Pourquoi cette zone à proximité du marché est-elle dangereuse ?",
    options: ["Piétons imprévisibles, charrettes, motos, visibilité réduite", "Trafic trop rapide", "Route trop large", "Manque de feux"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/zone-marche-pietons.png",
    explication: "Les marchés (Madina, Niger, Tombè-a à Conakry) concentrent tous les dangers : piétons imprévisibles, charrettes à bras ou à âne, motos taxis, étals qui réduisent la visibilité, enfants. Roulez à 20 km/h, klaxon seulement en cas de danger réel, ne forcez jamais le passage.",
    tempsEstime: 18,
    tags: ["marché", "piéton", "danger"]
  },
  {
    texte: "Sur cette approche de passage piéton, que faites-vous ?",
    options: ["Ralentir, regarder les trottoirs, prêt à stopper", "Maintenir vitesse", "Accélérer pour passer avant les piétons", "Klaxonner pour vider le passage"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/passage-pietons-approche.png",
    explication: "À l'approche d'un passage piéton : ralentissez, balayez les trottoirs du regard, soyez prêt à stopper. Un piéton peut s'engager à tout moment. Si un piéton attend ou s'engage, STOP complet. Ne jamais forcir le passage : amende 50 000 GNF et risque d'accident grave.",
    tempsEstime: 15,
    tags: ["passage", "piéton", "ralentir"]
  },
  {
    texte: "Vous roulez à 90 km/h sur route nationale. Distance de freinage approximative ?",
    options: ["70 mètres", "25 mètres", "10 mètres", "150 mètres"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "text",
    explication: "À 90 km/h sur route sèche, la distance de freinage est d'environ 70 m. Ajoutée au temps de réaction (1 s = 25 m), la distance d'arrêt totale est de ~95 m. Sur route mouillée, doublez ce chiffre. Connaître ces distances aide à garder la bonne distance de sécurité.",
    tempsEstime: 20,
    tags: ["freinage", "vitesse", "distance"]
  },
  {
    texte: "Avant un long trajet Conakry-Kankan, que vérifier ?",
    options: ["Pression pneus, niveau huile, liquide frein, feux, rétroviseurs", "Juste le niveau d'essence", "Rien, c'est inutile", "Uniquement la propreté"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "text",
    explication: "Avant un long trajet : pression des pneus (y compris roue de secours), niveau d'huile moteur, liquide de frein, liquide de refroidissement, état des feux, propreté des rétroviseurs et pare-brise, état des essuie-glaces. Une crevaison ou une panne sur la RN1 peut être dangereuse.",
    tempsEstime: 25,
    tags: ["vérification", "trajet", "pneus"]
  },
  {
    texte: "Sur cette route, vous voyez un panneau travaux. Quelle distance avant le chantier ?",
    options: ["Au moins 200 m avant", "Juste devant le chantier", "50 m avant", "À l'entrée du chantier"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/panneau-travaux.png",
    explication: "Les panneaux de travaux temporaires sont posés à au moins 200 m avant le chantier sur route nationale (50 m en agglomération). À 90 km/h, 200 m = 8 secondes pour réagir et ralentir. Dès le premier panneau, levez le pied et préparez-vous à ralentir.",
    tempsEstime: 18,
    tags: ["travaux", "distance", "signalisation"]
  },
  {
    texte: "Vous conduisez fatigué sur la RN1. Que faire ?",
    options: ["Faire une pause de 15 min toutes les 2 heures", "Continuer en buvant du café", "Mettre la musique forte", "Ouvrir la fenêtre"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "text",
    explication: "La fatigue multiplie par 3 le risque d'accident. Pause de 15 min toutes les 2 heures, hydratation, aération. Si bâillements, paupières lourdes, difficulty concentration : STOP immédiat, sieste de 15-20 min. Le café et la musique ne remplacent pas le sommeil. Sur RN1, aires de repos à Kindia, Mamou, Kouroussa.",
    tempsEstime: 18,
    tags: ["fatigue", "pause", "RN1"]
  },
  {
    texte: "Pourquoi le port de la ceinture est-il obligatoire, même à 30 km/h ?",
    options: ["À 30 km/h, choc = 1 tonne de pression sur le corps non attaché", "Pour éviter les amendes", "Pour économiser carburant", "Pour la posture"],
    bonneReponse: 0,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "text",
    explication: "À 30 km/h, un choc projette un adulte de 70 kg avec une force équivalente à 1 tonne contre le volant ou le pare-brise. Sans ceinture, vous risquez : traumatisme thoracique, tête contre pare-brise, éjection. La ceinture réduit la mortalité de 50%. Même en ville, ATTACHEZ-VOUS.",
    tempsEstime: 15,
    tags: ["ceinture", "choc", "sécurité"]
  },

  // ═════════════════════════════════════════════════════════════
  // INFRACTIONS (10 questions)
  // ═════════════════════════════════════════════════════════════
  {
    texte: "Vous êtes contrôlé à 80 km/h en ville (limitation 50). Quelle amende ?",
    options: ["50 000 GNF (excès de 20 à 30 km/h)", "25 000 GNF", "100 000 GNF", "Aucune amende"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "text",
    explication: "Excès de 30 km/h au-dessus de la limite = 50 000 GNF. Barème Guinée : < 20 km/h au-dessus = 25 000 GNF, 20-30 km/h = 50 000 GNF, > 30 km/h = 100 000 GNF + retrait de permis possible. Au-delà de 40 km/h, suspension 6 mois.",
    tempsEstime: 15,
    tags: ["excès vitesse", "amende", "ville"]
  },
  {
    texte: "Vous buvez 3 verres de vin au restaurant. Pouvez-vous conduire ?",
    options: ["Non, vous êtes au-dessus de la limite 0,5 g/l", "Oui si vous attendez 1 heure", "Oui en mangeant", "Oui en buvant du café"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "text",
    explication: "3 verres de vin = ~0,6 à 0,8 g/l selon le poids. La limite est 0,5 g/l (0,2 g/l pour jeunes conducteurs). Au-delà : amende 200 000-500 000 GNF, suspension permis, prison possible en cas d'accident. Un seul verre = prise de taxi recommandée. L'alcool tue sur la route.",
    tempsEstime: 18,
    tags: ["alcool", "limite", "amende"]
  },
  {
    texte: "Vous téléphonez au volant sans kit mains libres. Quelle sanction ?",
    options: ["50 000 GNF d'amende", "25 000 GNF", "100 000 GNF", "Simple avertissement"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "text",
    explication: "Téléphone au volant sans kit mains-libres = 50 000 GNF d'amende. Le téléphone multiplie par 3 le risque d'accident : temps de réaction augmenté, regard détourné. Même avec kit, la conversation diminue la concentration. Préférez arrêter pour appeler. SMS = interdiction totale.",
    tempsEstime: 12,
    tags: ["téléphone", "amende", "volant"]
  },
  {
    texte: "Quelqu'un dans votre voiture refuse de mettre la ceinture à l'arrière. Sanction ?",
    options: ["25 000 GNF par passager non attaché", "Aucune (ceinture arrière facultative)", "100 000 GNF", "5 000 GNF"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "text",
    explication: "Ceinture obligatoire AVANT ET ARRIÈRE en Guinée. Sanction : 25 000 GNF par passager non attaché. Un passager arrière non attaché devient projectile en cas de choc : peut tuer le conducteur ou les passagers avant. Exigez le port par tous, sans exception.",
    tempsEstime: 12,
    tags: ["ceinture", "passager", "amende"]
  },
  {
    texte: "Vous grille un feu rouge à Conakry. Quelle sanction immédiate ?",
    options: ["100 000 GNF + retrait de points", "25 000 GNF", "Avertissement verbal", "50 000 GNF"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/carrefour-feux.png",
    explication: "Griller un feu rouge = 100 000 GNF + 4 points retirés. En cas de récidive ou d'accident : suspension permis, peine de prison. Les feux rouges ne sont jamais 'optionnels'. Même à 5h du matin sans trafic, STOP complet. Les caméras de contrôle sont de plus en plus fréquentes à Conakry.",
    tempsEstime: 15,
    tags: ["feu rouge", "amende", "points"]
  },
  {
    texte: "Vous stationnez sur un passage piéton. Risque ?",
    options: ["Amende 25 000 GNF + mise en fourrière possible", "Rien, c'est toléré 5 min", "5 000 GNF", "Avertissement"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "text",
    explication: "Stationner sur passage piéton = 25 000 GNF + mise en fourrière possible. Autres zones interdites : sortie pompiers, entrée garage, sur trottoir, à moins de 5 m d'un carrefour, devant panneau d'arrêt. Le véhicule peut être enlevé par la police municipale.",
    tempsEstime: 12,
    tags: ["stationnement", "amende", "piéton"]
  },
  {
    texte: "Vous roulez sans assurance valide. Sanction ?",
    options: ["Amende 500 000 GNF + suspension permis + saisie véhicule", "25 000 GNF", "100 000 GNF", "Avertissement"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Rouler sans assurance = 500 000 GNF d'amende + suspension permis 6 mois + saisie du véhicule. En cas d'accident avec dommages corporels, vous êtes personnellement responsable sur vos biens et revenus à vie. L'assurance responsabilité civile est OBLIGATOIRE en Guinée.",
    tempsEstime: 18,
    tags: ["assurance", "amende", "saisie"]
  },
  {
    texte: "Vous conduisez sans permis valide (expiré ou jamais eu). Sanction ?",
    options: ["Amende 1 000 000 GNF + prison 6 mois possible", "25 000 GNF", "100 000 GNF", "Simple rappel"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Conduite sans permis valide = amende jusqu'à 1 000 000 GNF + emprisonnement jusqu'à 6 mois + saisie du véhicule. Renouvelez votre permis avant échéance (validité 10 ans en Guinée). En cas de perte, déclarez immédiatement à la police et refaites un duplicata.",
    tempsEstime: 18,
    tags: ["permis", "prison", "amende"]
  },
  {
    texte: "Vous dépassez dans une zone interdite. Sanction ?",
    options: ["100 000 GNF + retrait de points", "25 000 GNF", "Avertissement", "5 000 GNF"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/route-nationale-depassement.png",
    explication: "Dépassement en zone interdite (ligne continue, virage, sommet de côte, carrefour, passage piéton) = 100 000 GNF + 3 points. En cas d'accident lors d'un dépassement interdit : responsabilité pénale et civile. Vérifiez toujours ligne, visibilité et signalisation avant de dépasser.",
    tempsEstime: 18,
    tags: ["dépassement", "interdiction", "amende"]
  },
  {
    texte: "Votre véhicule n'a pas de contrôle technique valide. Sanction ?",
    options: ["50 000 GNF + immobilisation du véhicule", "25 000 GNF", "Aucune en Guinée", "10 000 GNF"],
    bonneReponse: 0,
    categorie: "Infractions",
    difficulte: "facile",
    mediaType: "text",
    explication: "Pas de contrôle technique = 50 000 GNF + immobilisation du véhicule jusqu'à présentation. Le contrôle technique est obligatoire tous les ans pour véhicules > 5 ans. Vérifie : freins, pneus, feux, émissions. Centres agréés à Conakry, Kankan, Labé, Nzérékoré.",
    tempsEstime: 15,
    tags: ["contrôle technique", "amende", "véhicule"]
  }
];

// ═════════════════════════════════════════════════════════════
// NOUVEAUX COURS (3 cours, ~17 leçons)
// ═════════════════════════════════════════════════════════════
type NewLesson = {
  titre: string;
  description: string;
  type: "video" | "sign" | "text" | "quiz" | "interactive";
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
    titre: "Conduite nocturne en Guinée",
    description: "Maîtrisez la conduite de nuit sur les routes guinéennes. Un cours complet sur l'usage des feux, l'adaptation de la vitesse, la détection des dangers spécifiques à la nuit (motos sans feu, animaux, piétons) et les réflexes de sécurité. Illustré par des vidéos tournées à Conakry et sur route nationale.",
    categorie: "Conduite",
    imageCover: "/courses/cover-conduite-eco.png",
    dureeTotale: 32,
    lessons: [
      {
        titre: "Les feux : quand et comment les utiliser",
        description: "Croisement, route, brouillard, détresse",
        type: "text",
        contenu: "Feux de croisement (codes) : en ville, à la tombée du jour, sous pluie, dans les tunnels, hors agglomération quand véhicule en face à moins de 150 m ou devant à 50 m. Feux de route (pleins phares) : sur route nationale non éclairée, sans véhicule en face. Feux de brouillard : uniquement en cas de brouillard ou chute de neige. Feux de détresse (warning) : véhicule immobilisé sur la route, NEVER en roulant. En Guinée, allumez les feux dès 18h30.",
        duree: 8,
        ordre: 1
      },
      {
        titre: "Adapter sa vitesse de nuit",
        description: "Vidéo — Conduite nocturne à Conakry",
        type: "video",
        contenu: "La nuit, la visibilité est réduite à 50-100 m avec feux de croisement. Adaptez votre vitesse pour pouvoir stopper dans la distance éclairée. À Conakry : 40-50 km/h max. Sur route nationale : 70-80 km/h max. Au-delà, vous ne pourrez pas éviter un obstacle (piéton, animal, véhicule arrêté) surgissant dans la zone éclairée. Cette vidéo montre la densité du trafic nocturne à Conakry et la nécessité d'anticiper.",
        duree: 7,
        ordre: 2,
        mediaUrl: "/videos/scenario-nuit.mp4",
        scenarioImage: "/scenarios/conduite-nuit-conakry.png"
      },
      {
        titre: "Les motos sans feu : danger permanent",
        description: "Anticiper et détecter les motos invisibles",
        type: "text",
        contenu: "À Conakry et dans tout le pays, 30% des motos roulent sans feu ou avec feu défectueux. Anticipez : aux intersections, regardez les roues arrière des véhicules arrêtés (une moto peut s'infiltrer). Aux ronds-points, balayez du regard. Ne changez pas de voie brusquement la nuit. Si vous voyez un point bleu/blanc faible dans le rétroviseur, c'est probablement une moto. Laissez une marge à droite pour les motos qui remontent le trafic.",
        duree: 6,
        ordre: 3
      },
      {
        titre: "Animaux sur la route la nuit",
        description: "Vidéo — Route rurale de nuit",
        type: "video",
        contenu: "Sur les routes rurales de Guinée (Kindia-Mamou, Labé-Koundara, Nzérékoré-Yomou), les animaux (bovins, moutons, chèvres, porcs) dorment souvent sur la chaussée qui a restitué la chaleur de la journée. La nuit, ils sont invisibles jusqu'à 30 m. Ralentissez à 40-50 km/h sur les portions rurales. Klaxonnez modérément : cela les fait bouger. Ne pointez PAS les feux de route dans les yeux des animaux (ils se figent). Cette vidéo montre une nuit sur route rurale avec présence de bovins.",
        duree: 6,
        ordre: 4,
        mediaUrl: "/videos/scenario-animaux.mp4",
        scenarioImage: "/scenarios/animaux-nuit.png"
      },
      {
        titre: "Fatigue et conduite nocturne",
        description: "Reconnaître les signes et réagir",
        type: "text",
        contenu: "La nuit, la mélatonine naturelle augmente la somnolence entre 2h-5h et 14h-16h. Signes de fatigue : bâillements, paupières lourdes, difficulté à focaliser, troubles de la mémoire récente (quel était le dernier panneau ?), dérive de la trajectoire. Réaction : STOP immédiat, sieste 15-20 min, café, marche. Sur RN1, aires de repos à Kindia (PK 100), Mamou (PK 250), Kouroussa (PK 350). Ne jamais rouler plus de 2h sans pause de nuit.",
        duree: 6,
        ordre: 5
      },
      {
        titre: "Éblouissement : comment réagir",
        description: "Gestes qui sauvent",
        type: "text",
        contenu: "Si un véhicule arrive en face avec feux de route : ne le regardez pas, fixez le bord droit de la route (ligne blanche). Clignez une fois vos feux de route pour signaler. Si éblouissement malgré tout : ralentissez sans freiner brutalement, ne changez pas de direction. La vision revient en 3-5 secondes. En cas d'éblouissement prolongé, stoppez en sécurité sur le bas-côté. Pare-soleil baissé pour les feux bas. Pare-brise propre (poussière amplifie l'éblouissement).",
        duree: 5,
        ordre: 6
      }
    ]
  },

  {
    titre: "Conduite en zone rurale et sur routes nationales",
    description: "Spécificités de la conduite hors agglomération en Guinée : routes nationales (RN1, RN2, RN3), animaux, transport en commun (magbana, taxis brousse), villages traversés, état des routes. Un cours essentiel pour les longs trajets Conakry-Kankan, Conakry-Nzérékoré.",
    categorie: "Conduite",
    imageCover: "/courses/cover-securite.png",
    dureeTotale: 35,
    lessons: [
      {
        titre: "Les routes nationales de Guinée",
        description: "RN1, RN2, RN3 : caractéristiques et dangers",
        type: "text",
        contenu: "RN1 (Conakry-Boké, 350 km) : route goudronnée, 2 voies, trafic dense, poids lourds vers Boké (mines bauxite). RN2 (Conakry-Kankan, 700 km) : traverse Kindia, Mamou, Kouroussa. Goudronnée mais sections dégradées. RN3 (Kankan-Nzérékoré, 350 km) : portions non goudronnées, difficile en saison des pluies. Limitation : 90 km/h hors agglomération. Risques : animaux, poids lourds lents, taxis brousse arrêtés, villages traversés sans ralentisseur.",
        duree: 9,
        ordre: 1
      },
      {
        titre: "Traversée des villages",
        description: "Vigilance et ralentissement",
        type: "text",
        contenu: "À l'approche d'un village sur RN : panneau d'entrée de localité, ralentissez à 50 km/h. Risques : enfants qui jouent ou traversent, animaux (chèvres, moutons), vélos, motos taxi, charrettes. Marché hebdomadaire : le jour du marché, le trafic peut être bloqué. Évitez de rouler à 12h-13h (pause déjeuner, somnolence des conducteurs). Klaxonnez modérément à l'approche d'un virage dans le village. Respectez les panneaux de limitation.",
        duree: 7,
        ordre: 2
      },
      {
        titre: "Taxis brousse et magbanas",
        description: "Comportement à adopter",
        type: "text",
        contenu: "Taxis brousse (Toyota Hiace, 9 places souvent surchargées) : roulent vite, s'arrêtent brusquement pour prendre/déposer des passagers, peuvent faire demi-tour sans prévenir. Magbanas (camions transportant passagers et marchandises) : lents, larges, parfois sans feux. Conduite à adopter : gardez vos distances, ne les collez pas. Pour les dépasser : attendez une portion droite avec visibilité 500 m minimum. Anticipez leurs arrêts imprévus. Ne tentez jamais de les dépasser à l'aveugle.",
        duree: 7,
        ordre: 3
      },
      {
        titre: "Route nationale sous la pluie",
        description: "Vidéo — Pluie intense",
        type: "video",
        contenu: "En saison des pluies (juin-octobre), la RN1 et RN2 peuvent être inondées. La visibilité chute à 30-50 m sous pluie battante. Réduisez à 50 km/h maximum. Distance de sécurité : 4 secondes (environ 60 m à 50 km/h). Risque d'aquaplaning accru au-dessus de 70 km/h. Si la route est inondée : NE traversez PAS si l'eau dépasse le milieu des roues. Risque d'emportement du véhicule. Patientez, la décrue vient vite en Guinée. Cette vidéo montre une conduite sous pluie intense.",
        duree: 6,
        ordre: 4,
        mediaUrl: "/videos/scenario-pluie.mp4",
        scenarioImage: "/scenarios/route-pluie.png"
      },
      {
        titre: "Péages et check-points",
        description: "Comportement aux postes de péage et de contrôle",
        type: "text",
        contenu: "Péages : sur RN1 à Boké et Conakry-Dixin. Ralentissez 200 m avant, préparez l'argent, passez en 1ère si péage manuel. Check-points police/gendarmerie : fréquents entre Conakry et Kindia. Ralentissez, feux de détresse si file d'attente. Présentez : permis, carte grise, assurance, vignette. Restez courtois, ne proposez jamais d'argent spontanément (risque d'arrestation pour corruption). Si verbalisé : demandez le PV, payez au compte officiel.",
        duree: 6,
        ordre: 5
      },
      {
        titre: "Animaux sur route rurale",
        description: "Vidéo — Bovins la nuit",
        type: "video",
        contenu: "Sur routes rurales, les animaux sont un danger majeur. Bovins (vaches, bœufs) : 500-700 kg, immobiles ou lents. Un choc à 70 km/h = létal. Moutons, chèvres : imprévisibles, peuvent bondir. Porcs : imprévisibles, sortent des bas-côtés. Conduite : ralentissez à l'approche des troupeaux, klaxonnez modérément. Ne tentez JAMAIS de contourner un troupeau à fond (risque de véhicule en face). Si animal isolé : stoppez, laissez-le dégager. Cette vidéo montre des bovins sur route rurale de nuit.",
        duree: 6,
        ordre: 6,
        mediaUrl: "/videos/scenario-animaux.mp4",
        scenarioImage: "/scenarios/route-rurale-animaux.png"
      }
    ]
  },

  {
    titre: "Panneaux et signalisation avancés",
    description: "Maîtrisez TOUS les panneaux de signalisation guinéens : panneaux de danger, d'interdiction, d'obligation, d'indication, de priorité, temporaires. Un cours complet avec photos réelles, explications détaillées et cas concrets. Indispensable pour réussir l'examen du code et conduire en sécurité.",
    categorie: "Signalisation",
    imageCover: "/courses/cover-signalisation.png",
    dureeTotale: 40,
    lessons: [
      {
        titre: "Panneaux de danger (forme triangulaire)",
        description: "Virage, cassis, école, piétons, animaux",
        type: "sign",
        contenu: "Forme : triangle à fond blanc, bord rouge. Placés à 150-250 m hors agglo, 50 m en agglo. Panneaux courants en Guinée : virage dangereux à droite/gauche, succession de virages, cassis ou dos-d'âne, chaussée glissante, passage piéton, enfants (école), cyclistes, animaux, chute de pierres, carrefour dangereux, débouché sur voie publique. Au feu vert, repérez systématiquement les panneaux triangulaires : ils annoncent un danger qui nécessite de ralentir.",
        duree: 8,
        ordre: 1,
        signImage: "/signs/virage-dangereux.png"
      },
      {
        titre: "Panneaux d'interdiction (forme circulaire, fond blanc, bord rouge)",
        description: "Sens interdit, stationnement, dépassement, vitesse",
        type: "sign",
        contenu: "Forme : rond, fond blanc, bord rouge (sauf 'sens interdit' qui est rond avec fond rouge et bande blanche). Panneaux interdiction en Guinée : sens interdit, interdiction de tourner à droite/gauche, interdiction de faire demi-tour, vitesse maximale, interdiction de dépasser, interdiction de stationner, arrêt et stationnement interdits, interdiction d'accès (tous véhicules), poids maximum, hauteur maximum, largeur maximum. Le non-respect = amende et danger.",
        duree: 8,
        ordre: 2,
        signImage: "/signs/sens-interdit.png"
      },
      {
        titre: "Panneaux d'obligation (forme circulaire, fond bleu)",
        description: "Direction obligatoire, rond-point, vitesse minimale",
        type: "sign",
        contenu: "Forme : rond, fond bleu, symbole blanc. Panneaux obligation en Guinée : direction obligatoire (tout droit, à droite, à gauche), rond-point obligatoire, contour obligatoire, vitesse minimale obligatoire, chaînes à neige obligatoires (rare en Guinée), voies réservées (bus, vélos). Ces panneaux INDIQUENT ce que vous DEVEZ faire, à la différence des panneaux d'interdiction qui indiquent ce qui est interdit.",
        duree: 7,
        ordre: 3,
        signImage: "/signs/rond-point-obligatoire.png"
      },
      {
        titre: "Panneaux de priorité",
        description: "STOP, cédez le passage, priorité, fin de priorité",
        type: "sign",
        contenu: "STOP (octogone rouge, fond blanc, 'STOP' blanc) : arrêt ABSOLU. Véhicule à l'arrêt complet, vérifiez les deux directions, repartez en sécurité. Cédez le passage (triangle inversé, fond blanc, bord rouge) : ralentissez, cédez si véhicule arrive. Priorité (losange jaune) : vous êtes prioritaire au prochain carrefour. Fin de priorité (losange barré). Priorité ponctuelle (croix de Saint-André). En Guinée, les carrefours à STOP sont nombreux entre Conakry et Kindia.",
        duree: 7,
        ordre: 4,
        signImage: "/signs/cedezer-passage.png"
      },
      {
        titre: "Panneaux d'indication (forme carrée ou rectangulaire, fond bleu)",
        description: "Direction, distance, services, parkings",
        type: "text",
        contenu: "Forme : carré ou rectangulaire, fond bleu, symbole blanc. Panneaux indication en Guinée : directions ( villes à 50, 100, 200 km), parkings (P bleu), hôpital (croix rouge), station-service (pompe), restaurant (couvert), hôtel (lit), camping (tente), aire de repos (arbre), poste de secours, gendarmerie, douane. Panneaux de localisation : entrée d'agglomération (nom de ville) = automatiquement limitation à 50 km/h. Sortie d'agglomération = retour à 90 km/h.",
        duree: 7,
        ordre: 5
      },
      {
        titre: "Signalisation temporaire (travaux, chantiers)",
        description: "Panneaux jaunes/orange et dispositifs",
        type: "sign",
        contenu: "Forme : souvent losange ou carré, fond jaune ou orange. Dispositifs : plots, cônes de Lübeck, barrières, feux de chantier. Distances : 200 m avant sur RN, 50 m en agglo. Panneaux travaux : homme à la pelle, drapeau, signalisation manuelle par agent. À l'approche d'un chantier : levez le pied DÈS le premier panneau, respectez la limitation temporaire (souvent 30-50 km/h), restez dans la voie, ne klaxonnez pas. Les ouvriers peuvent traverser inopinément.",
        duree: 7,
        ordre: 6,
        signImage: "/signs/danger.png"
      },
      {
        titre: "Marquage au sol — Lignes et couleurs",
        description: "Lignes continues, discontinues, flèches, zèbres",
        type: "text",
        contenu: "Ligne blanche continue : interdiction de franchir (dépassement, changement de voie). Ligne discontinue : franchissement autorisé si sécurité. Ligne jaune continue : arrêt et stationnement interdits. Ligne jaune discontinue : stationnement interdit, arrêt bref autorisé. Lignes zébrées : interdiction de s'y arrêter. Flèches au sol : indiquent les voies (direction obligatoire selon la flèche). Bandes sonores (rumble strips) : annoncent un danger (carrefour, péage). Ralentisseurs (dos-d'âne) : passages piétons surélevés, 30 km/h max.",
        duree: 8,
        ordre: 7
      },
      {
        titre: "Quiz — Reconnaître les panneaux",
        description: "Validez vos acquis",
        type: "quiz",
        contenu: "Quiz de 10 questions : identifier le type de panneau (danger, interdiction, obligation, indication, priorité), reconnaître les panneaux courants (STOP, cédez passage, sens interdit, vitesse, rond-point), comprendre leur signification et adapter sa conduite.",
        duree: 8,
        ordre: 8
      }
    ]
  }
];

async function main() {
  console.log('═════════════════════════════════════════════════════════════');
  console.log('  PHASE 21 EXPANSION — 3 courses + 50 questions');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('');

  // ── Add new questions ──
  console.log('▶ Adding 50 new questions...');
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
        audioFr: q.audioFr || null,
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
  console.log('▶ Adding 3 new courses...');
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
  console.log('✅ Phase 21 expansion completed!');
  const totalQ = await prisma.question.count();
  const totalC = await prisma.course.count();
  const totalL = await prisma.lesson.count();
  const withAudio = await prisma.question.count({ where: { audioFr: { not: null } } });
  const withVideo = await prisma.question.count({ where: { videoUrl: { not: null } } });
  console.log(`   📊 Total questions: ${totalQ} (video: ${withVideo}, audioFr: ${withAudio})`);
  console.log(`   📊 Total courses:   ${totalC}`);
  console.log(`   📊 Total lessons:   ${totalL}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
