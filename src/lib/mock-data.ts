import { Question, Centre, Region, ExamResult, LanguageConfig, NationalLanguage, Course } from './types';

// ============================================================
// Language Configuration
// ============================================================
export const languages: LanguageConfig[] = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: 'france',
    regions: ['Toutes les régions'],
    population: 'Langue officielle'
  }
];

// ============================================================
// Question Bank — 40 questions with multimedia
// ============================================================
export const questions: Question[] = [
  // ---- SIGNALISATION — With road sign images ----
  {
    id: 1,
    texte: "Que signifie ce panneau ?",
    options: ["Arrêt obligatoire", "Cédez le passage", "Sens interdit", "Priorité à droite"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/stop.png",
    explication: "Le panneau STOP (octogonal rouge) impose un arrêt absolu avant de continuer.",
    points: 1,
    tempsEstime: 20,
    tags: ["panneau", "stop", "arrêt"],
    actif: true

  },
  {
    id: 2,
    texte: "Que signifie ce panneau ?",
    options: ["Interdiction", "Obligation", "Indication", "Danger"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/sens-interdit.png",
    explication: "Un panneau circulaire avec bord rouge indique une interdiction. Ici, sens interdit.",
    points: 1,
    tempsEstime: 20,
    tags: ["panneau", "interdiction", "sens interdit"],
    actif: true

  },
  {
    id: 3,
    texte: "Que signifie ce panneau ?",
    options: ["Arrêt", "Cédez le passage", "Priorité à droite", "Danger"],
    bonneReponse: 1,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/cedezer-passage.png",
    explication: "Le panneau triangulaire inversé (cédez le passage) impose de laisser passer les autres véhicules.",
    points: 1,
    tempsEstime: 25,
    tags: ["panneau", "cédez le passage", "priorité"],
    actif: true

  },
  {
    id: 4,
    texte: "Que signifie ce panneau ?",
    options: ["Interdiction", "Obligation", "Indication", "Priorité"],
    bonneReponse: 3,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/priorite-droite.png",
    explication: "Le panneau en losange indique une priorité, ici la priorité à l'intersection.",
    points: 1,
    tempsEstime: 25,
    tags: ["panneau", "priorité", "losange"],
    actif: true

  },
  {
    id: 5,
    texte: "Que signifie ce panneau ?",
    options: ["Vitesse limitée à 50 km/h", "Vitesse minimale 50 km/h", "Vitesse recommandée 50 km/h", "Fin de limitation"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/limitation-50.png",
    explication: "Un panneau circulaire avec bord rouge et chiffre indique une limitation de vitesse maximale.",
    points: 1,
    tempsEstime: 20,
    tags: ["panneau", "vitesse", "limitation"],
    actif: true

  },
  {
    id: 6,
    texte: "Que signifie ce panneau ?",
    options: ["Interdiction de dépasser", "Sens interdit aux camions", "Danger poids lourd", "Fin d'interdiction"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/interdiction-depasser.png",
    explication: "Ce panneau interdit le dépassement de véhicules pour tous les conducteurs.",
    points: 1,
    tempsEstime: 25,
    tags: ["panneau", "dépassement", "interdiction"],
    actif: true

  },
  {
    id: 7,
    texte: "Que signifie ce panneau ?",
    options: ["Passage piétons", "Zone scolaire", "Parking", "Arrêt de bus"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/passage-pietons.png",
    explication: "Le panneau bleu carré avec piéton indique un passage pour piétons.",
    points: 1,
    tempsEstime: 20,
    tags: ["panneau", "piéton", "passage"],
    actif: true

  },
  {
    id: 8,
    texte: "Que signifie ce panneau ?",
    options: ["Obligation de tourner à droite", "Sens obligatoire à droite", "Danger virage à droite", "Interdiction de tourner"],
    bonneReponse: 1,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/sens-obligatoire.png",
    explication: "Le panneau rond bleu avec flèche indique une direction obligatoire.",
    points: 1,
    tempsEstime: 25,
    tags: ["panneau", "obligation", "direction"],
    actif: true

  },
  {
    id: 9,
    texte: "Que signifie ce panneau ?",
    options: ["Virage dangereux", "Rond-point", "Carrefour", "Route glissante"],
    bonneReponse: 0,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "sign",
    signImage: "/signs/virage-dangereux.png",
    explication: "Le triangle rouge avec flèche courbe signale un virage dangereux, il faut ralentir.",
    points: 1,
    tempsEstime: 20,
    tags: ["panneau", "danger", "virage"],
    actif: true

  },
  {
    id: 10,
    texte: "Que signifie ce panneau ?",
    options: ["Sens interdit", "Rond-point", "Carrefour à 4 voies", "Cédez le passage"],
    bonneReponse: 1,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "sign",
    signImage: "/signs/rond-point.png",
    explication: "Le panneau bleu avec flèches circulaires indique un rond-point. Les véhicules dans le rond-point ont la priorité.",
    points: 1,
    tempsEstime: 25,
    tags: ["panneau", "rond-point", "priorité"],
    actif: true

  },

  // ---- SCENARIOS — With scenario images ----
  {
    id: 11,
    texte: "Vous approchez de cette intersection. Qui a la priorité ?",
    options: ["Vous, car vous venez de la droite", "Le véhicule bleu, il est dans le rond-point", "Les piétons uniquement", "Celui qui arrive le premier"],
    bonneReponse: 1,
    categorie: "Priorité",
    difficulte: "moyen",
    mediaType: "scenario",
    scenarioImage: "/scenarios/intersection-conakry.png",
    explication: "Dans un rond-point, les véhicules qui y circulent ont toujours la priorité sur ceux qui veulent y entrer.",
    points: 1,
    tempsEstime: 30,
    tags: ["priorité", "rond-point", "intersection"],
    actif: true

  },
  {
    id: 12,
    texte: "Dans cette situation, que devez-vous faire ?",
    options: ["Accélérer pour passer rapidement", "Ralentir et céder le passage aux piétons", "Klaxonner pour les prévenir", "Continuer à la même vitesse"],
    bonneReponse: 1,
    categorie: "Priorité",
    difficulte: "facile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/passage-pietons-approche.png",
    explication: "Lorsqu'on approche d'un passage piétons avec des piétons, on doit ralentir et céder le passage.",
    points: 1,
    tempsEstime: 25,
    tags: ["priorité", "piéton", "passage"],
    actif: true

  },
  {
    id: 13,
    texte: "Dans cette situation, le dépassement est-il autorisé ?",
    options: ["Oui, la route est libre", "Non, la visibilité est insuffisante", "Oui, mais seulement à 80 km/h", "Oui, si le camion roule lentement"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "difficile",
    mediaType: "scenario",
    scenarioImage: "/scenarios/depassement.png",
    explication: "Le dépassement est interdit lorsque la visibilité est insuffisante, même si la route semble libre.",
    points: 1,
    tempsEstime: 35,
    tags: ["dépassement", "sécurité", "visibilité"],
    actif: true

  },

  // ---- QUESTIONS TEXTE — Classic without images ----
  {
    id: 14,
    texte: "Quelle est la vitesse maximale autorisée en agglomération en Guinée ?",
    options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"],
    bonneReponse: 1,
    categorie: "Vitesse",
    difficulte: "facile",
    mediaType: "text",
    explication: "La vitesse maximale en agglomération est de 50 km/h en Guinée.",
    points: 1,
    tempsEstime: 15,
    tags: ["vitesse", "agglomération"],
    actif: true

  },
  {
    id: 15,
    texte: "Quel est le taux d'alcoolémie maximal autorisé pour conduire en Guinée ?",
    options: ["0,2 g/l", "0,5 g/l", "0,8 g/l", "1,0 g/l"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "facile",
    mediaType: "text",
    explication: "Le taux d'alcoolémie maximal autorisé est de 0,5 g/l en Guinée.",
    points: 1,
    tempsEstime: 15,
    tags: ["alcool", "réglementation"],
    actif: true

  },
  {
    id: 16,
    texte: "Quel document est obligatoire pour conduire un véhicule en Guinée ?",
    options: ["Carte d'identité uniquement", "Permis de conduire et carte grise", "Passeport", "Attestation de domicile"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "facile",
    mediaType: "text",
    explication: "Le permis de conduire et la carte grise sont obligatoires.",
    points: 1,
    tempsEstime: 15,
    tags: ["documents", "réglementation", "permis"],
    actif: true

  },
  {
    id: 17,
    texte: "Que signifie un feu orange clignotant ?",
    options: ["Arrêt obligatoire", "Feu en panne", "Prudence, passage à caractère dangereux", "Priorité à droite"],
    bonneReponse: 2,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Un feu orange clignotant indique la prudence à un passage dangereux.",
    points: 1,
    tempsEstime: 20,
    tags: ["feu", "signalisation", "prudence"],
    actif: true

  },
  {
    id: 18,
    texte: "À quelle distance minimum devez-vous stationner d'un passage piéton ?",
    options: ["3 mètres", "5 mètres", "10 mètres", "15 mètres"],
    bonneReponse: 1,
    categorie: "Stationnement",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Il est interdit de stationner à moins de 5 mètres d'un passage piéton.",
    points: 1,
    tempsEstime: 20,
    tags: ["stationnement", "piéton", "distance"],
    actif: true

  },
  {
    id: 19,
    texte: "Qui a la priorité à un carrefour sans signalisation en Guinée ?",
    options: ["Le véhicule le plus rapide", "Le véhicule venant de droite", "Le véhicule venant de gauche", "Le plus gros véhicule"],
    bonneReponse: 1,
    categorie: "Priorité",
    difficulte: "facile",
    mediaType: "text",
    explication: "La priorité à droite s'applique en l'absence de signalisation.",
    points: 1,
    tempsEstime: 20,
    tags: ["priorité", "carrefour", "droite"],
    actif: true

  },
  {
    id: 20,
    texte: "Quel est l'âge minimal pour obtenir le permis de conduire catégorie B en Guinée ?",
    options: ["16 ans", "18 ans", "20 ans", "21 ans"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "facile",
    mediaType: "text",
    explication: "L'âge minimal pour le permis B est de 18 ans.",
    points: 1,
    tempsEstime: 15,
    tags: ["âge", "permis", "réglementation"],
    actif: true

  },
  {
    id: 21,
    texte: "Un panneau rectangulaire avec fond bleu indique :",
    options: ["Interdiction", "Indication ou obligation", "Danger", "Travaux"],
    bonneReponse: 1,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Un panneau rectangulaire bleu indique une obligation ou une indication.",
    points: 1,
    tempsEstime: 20,
    tags: ["panneau", "obligation", "bleu"],
    actif: true

  },
  {
    id: 22,
    texte: "La ceinture de sécurité est obligatoire :",
    options: ["Uniquement à l'avant", "Uniquement sur autoroute", "Pour tous les occupants", "Seulement pour le conducteur"],
    bonneReponse: 2,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "text",
    explication: "La ceinture de sécurité est obligatoire pour tous les occupants du véhicule.",
    points: 1,
    tempsEstime: 15,
    tags: ["ceinture", "sécurité", "obligation"],
    actif: true

  },
  {
    id: 23,
    texte: "Que faire en cas d'accident avec des blessés ?",
    options: ["Continuer votre route", "S'arrêter, sécuriser, alerter les secours", "Déplacer les blessés immédiatement", "Appeler uniquement la police"],
    bonneReponse: 1,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "text",
    explication: "Il faut s'arrêter, sécuriser le lieu et alerter les secours (SAMU : 115).",
    points: 1,
    tempsEstime: 20,
    tags: ["accident", "secours", "sécurité"],
    actif: true

  },
  {
    id: 24,
    texte: "Quel est le sens de circulation en Guinée ?",
    options: ["Gauche", "Droite", "Les deux selon les routes", "Pas de règle définie"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "facile",
    mediaType: "text",
    explication: "La Guinée circule à droite, comme la majorité des pays d'Afrique de l'Ouest.",
    points: 1,
    tempsEstime: 15,
    tags: ["circulation", "sens", "réglementation"],
    actif: true

  },
  {
    id: 25,
    texte: "La distance de sécurité recommandée entre deux véhicules est de :",
    options: ["1 seconde", "2 secondes", "5 secondes", "10 secondes"],
    bonneReponse: 1,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "text",
    explication: "La règle des 2 secondes est recommandée pour maintenir une distance de sécurité.",
    points: 1,
    tempsEstime: 20,
    tags: ["distance", "sécurité", "vitesse"],
    actif: true

  },
  {
    id: 26,
    texte: "Un panneau rond avec fond bleu et une flèche blanche pointant vers le haut signifie :",
    options: ["Interdiction de tourner", "Obligation d'aller tout droit", "Sens unique", "Fin d'interdiction"],
    bonneReponse: 1,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Un panneau rond bleu avec flèche blanche vers le haut = obligation d'aller tout droit.",
    points: 1,
    tempsEstime: 25,
    tags: ["panneau", "obligation", "direction"],
    actif: true

  },
  {
    id: 27,
    texte: "Quand faut-il utiliser les feux de détresse ?",
    options: ["Pour se garer", "En cas de danger sur la route ou véhicule en panne", "Pour dire merci", "La nuit uniquement"],
    bonneReponse: 1,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "text",
    explication: "Les feux de détresse sont utilisés pour signaler un danger ou un véhicule en panne.",
    points: 1,
    tempsEstime: 15,
    tags: ["feux", "détresse", "sécurité"],
    actif: true

  },
  {
    id: 28,
    texte: "Un véhicule d'urgence avec gyrophaire approche. Que devez-vous faire ?",
    options: ["Accélérer pour passer", "Vous arrêter ou vous ranger sur le côté", "Ignorer et continuer", "Klaxonner en retour"],
    bonneReponse: 1,
    categorie: "Priorité",
    difficulte: "facile",
    mediaType: "text",
    explication: "Il faut céder le passage aux véhicules d'urgence en se rangeant sur le côté.",
    points: 1,
    tempsEstime: 15,
    tags: ["urgence", "priorité", "gyrophaire"],
    actif: true

  },
  {
    id: 29,
    texte: "Que signifie une ligne blanche continue au milieu de la chaussée ?",
    options: ["On peut la franchir pour doubler", "Interdiction de la franchir", "Fin de route", "Zone de stationnement"],
    bonneReponse: 1,
    categorie: "Signalisation",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Une ligne blanche continue ne peut pas être franchie.",
    points: 1,
    tempsEstime: 20,
    tags: ["ligne", "signalisation", "interdiction"],
    actif: true

  },
  {
    id: 30,
    texte: "Quelle est la sanction pour conduite sans permis en Guinée ?",
    options: ["Avertissement", "Amende et/ou peine de prison", "Retrait de points", "Stage obligatoire"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "moyen",
    mediaType: "text",
    explication: "La conduite sans permis est punie d'une amende et/ou d'une peine de prison.",
    points: 1,
    tempsEstime: 20,
    tags: ["sanction", "permis", "réglementation"],
    actif: true

  },
  {
    id: 31,
    texte: "Quel est le numéro d'urgence médicale en Guinée ?",
    options: ["15", "115", "17", "18"],
    bonneReponse: 1,
    categorie: "Sécurité",
    difficulte: "facile",
    mediaType: "text",
    explication: "Le SAMU en Guinée est joignable au 115.",
    points: 1,
    tempsEstime: 10,
    tags: ["urgence", "SAMU", "sécurité"],
    actif: true

  },
  {
    id: 32,
    texte: "Dans un rond-point, qui a la priorité ?",
    options: ["Les véhicules entrant", "Les véhicules circulant dans le rond-point", "Les piétons", "Les véhicules les plus rapides"],
    bonneReponse: 1,
    categorie: "Priorité",
    difficulte: "facile",
    mediaType: "text",
    explication: "Les véhicules circulant dans le rond-point ont la priorité sur ceux qui y entrent.",
    points: 1,
    tempsEstime: 15,
    tags: ["rond-point", "priorité"],
    actif: true

  },
  {
    id: 33,
    texte: "La catégorie A du permis de conduire concerne :",
    options: ["Les voitures", "Les motocyclettes", "Les camions", "Les autobus"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "facile",
    mediaType: "text",
    explication: "La catégorie A est pour les motocyclettes.",
    points: 1,
    tempsEstime: 10,
    tags: ["permis", "catégorie", "moto"],
    actif: true

  },
  {
    id: 34,
    texte: "Le dépassement d'un autre véhicule s'effectue par :",
    options: ["La droite", "La gauche", "Le côté le plus proche", "Les deux côtés"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "facile",
    mediaType: "text",
    explication: "Le dépassement s'effectue normalement par la gauche.",
    points: 1,
    tempsEstime: 15,
    tags: ["dépassement", "gauche", "réglementation"],
    actif: true

  },
  {
    id: 35,
    texte: "Quel équipement est obligatoire dans un véhicule en Guinée ?",
    options: ["GPS", "Trousse de premiers secours et extincteur", "Caméra de recul", "Climatisation"],
    bonneReponse: 1,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "text",
    explication: "La trousse de premiers secours et l'extincteur sont obligatoires.",
    points: 1,
    tempsEstime: 15,
    tags: ["équipement", "sécurité", "obligation"],
    actif: true

  },
  {
    id: 36,
    texte: "Quelle est la vitesse maximale sur route nationale en Guinée ?",
    options: ["80 km/h", "90 km/h", "110 km/h", "130 km/h"],
    bonneReponse: 1,
    categorie: "Vitesse",
    difficulte: "facile",
    mediaType: "text",
    explication: "La vitesse maximale sur route nationale est de 90 km/h.",
    points: 1,
    tempsEstime: 15,
    tags: ["vitesse", "route nationale"],
    actif: true

  },
  {
    id: 37,
    texte: "En cas de brouillard dense, quels feux devez-vous allumer ?",
    options: ["Feux de croisement", "Feux de brouillard avant et arrière", "Feux de route", "Feux de détresse uniquement"],
    bonneReponse: 1,
    categorie: "Sécurité",
    difficulte: "moyen",
    mediaType: "text",
    explication: "Par brouillard dense, les feux de brouillard avant et arrière doivent être allumés.",
    points: 1,
    tempsEstime: 20,
    tags: ["brouillard", "feux", "sécurité"],
    actif: true

  },
  {
    id: 38,
    texte: "Un panneau triangulaire avec un bord rouge indique :",
    options: ["Une interdiction", "Une obligation", "Un danger", "Une indication"],
    bonneReponse: 2,
    categorie: "Signalisation",
    difficulte: "facile",
    mediaType: "text",
    explication: "Un panneau triangulaire avec bord rouge signale un danger.",
    points: 1,
    tempsEstime: 15,
    tags: ["panneau", "danger", "triangle"],
    actif: true

  },
  {
    id: 39,
    texte: "Quel est le taux d'alcoolémie maximal pour les conducteurs professionnels ?",
    options: ["0,1 g/l", "0,2 g/l", "0,5 g/l", "0,8 g/l"],
    bonneReponse: 1,
    categorie: "Réglementation",
    difficulte: "difficile",
    mediaType: "text",
    explication: "Pour les conducteurs professionnels, le taux maximal est de 0,2 g/l, plus strict que pour les conducteurs ordinaires.",
    points: 1,
    tempsEstime: 25,
    tags: ["alcool", "professionnel", "réglementation"],
    actif: true

  },
  {
    id: 40,
    texte: "Un panneau avec un triangle blanc sur fond bleu indique :",
    options: ["Fin de priorité", "Priorité à l'intersection", "Cédez le passage", "Sens interdit"],
    bonneReponse: 1,
    categorie: "Signalisation",
    difficulte: "difficile",
    mediaType: "text",
    explication: "Le panneau priorité à l'intersection a un triangle blanc sur fond bleu.",
    points: 1,
    tempsEstime: 25,
    tags: ["panneau", "priorité", "intersection"],
    actif: true

  }
];

// ============================================================
// Centers
// ============================================================
export const centres: Centre[] = [
  {
    id: "CTR-001",
    nom: "Centre RouteSafe Kaloum",
    ville: "Conakry",
    region: "Conakry",
    adresse: "Avenue de la République, Kaloum",
    capacite: 50,
    telephone: "+224 622 11 11 11",
    email: "contact@routesafe-kaloum.gn",
    actif: true,
    accreditation: { dateDebut: "2025-01-01", dateFin: "2027-12-31", statut: "actif", scoreQualite: 92 },
    equipements: ["Salle informatique", "Vidéoprojecteur", "Bureau examen", "Accessibilité PMR"],
    languesDisponibles: ['fr']
  },
  {
    id: "CTR-002",
    nom: "Centre Auto-Plus Dixinn",
    ville: "Conakry",
    region: "Conakry",
    adresse: "Boulevard du Commerce, Dixinn",
    capacite: 40,
    telephone: "+224 622 22 22 22",
    email: "info@autoplus-dixinn.gn",
    actif: true,
    accreditation: { dateDebut: "2025-03-01", dateFin: "2027-03-01", statut: "actif", scoreQualite: 88 },
    equipements: ["Salle informatique", "Webcam surveillance", "Climatisation"],
    languesDisponibles: ['fr']
  },
  {
    id: "CTR-003",
    nom: "Centre Conduite Matam",
    ville: "Conakry",
    region: "Conakry",
    adresse: "Route du Niger, Matam",
    capacite: 35,
    telephone: "+224 622 33 33 33",
    email: "contact@conduite-matam.gn",
    actif: true,
    accreditation: { dateDebut: "2024-06-01", dateFin: "2026-06-01", statut: "en_renouvellement", scoreQualite: 75 },
    equipements: ["Salle informatique"],
    languesDisponibles: ['fr']
  },
  {
    id: "CTR-004",
    nom: "Centre Permis Kankan",
    ville: "Kankan",
    region: "Kankan",
    adresse: "Avenue Sékou Touré, Kankan",
    capacite: 30,
    telephone: "+224 622 44 44 44",
    email: "info@permis-kankan.gn",
    actif: true,
    accreditation: { dateDebut: "2025-01-01", dateFin: "2027-12-31", statut: "actif", scoreQualite: 85 },
    equipements: ["Salle informatique", "Vidéoprojecteur"],
    languesDisponibles: ['fr']
  },
  {
    id: "CTR-005",
    nom: "Centre Routier Nzérékoré",
    ville: "Nzérékoré",
    region: "Nzérékoré",
    adresse: "Route de la Forêt, Nzérékoré",
    capacite: 25,
    telephone: "+224 622 55 55 55",
    email: "contact@routier-nzerekore.gn",
    actif: true,
    accreditation: { dateDebut: "2025-06-01", dateFin: "2027-06-01", statut: "actif", scoreQualite: 80 },
    equipements: ["Salle informatique"],
    languesDisponibles: ['fr']
  },
  {
    id: "CTR-006",
    nom: "Centre Auto-École Kindia",
    ville: "Kindia",
    region: "Kindia",
    adresse: "Avenue de l'Indépendance, Kindia",
    capacite: 20,
    telephone: "+224 622 66 66 66",
    email: "info@autoecole-kindia.gn",
    actif: true,
    accreditation: { dateDebut: "2025-01-01", dateFin: "2026-12-31", statut: "actif", scoreQualite: 78 },
    equipements: ["Salle informatique"],
    languesDisponibles: ['fr']
  },
  {
    id: "CTR-007",
    nom: "Centre Routier Boké",
    ville: "Boké",
    region: "Boké",
    adresse: "Avenue de la Mine, Boké",
    capacite: 20,
    telephone: "+224 622 77 77 77",
    email: "contact@routier-boke.gn",
    actif: false,
    accreditation: { dateDebut: "2024-01-01", dateFin: "2025-12-31", statut: "expire", scoreQualite: 65 },
    equipements: ["Salle informatique"],
    languesDisponibles: ['fr']
  }
];

// ============================================================
// Regions
// ============================================================
export const regions: Region[] = [
  {
    id: "REG-01",
    nom: "Conakry",
    villes: [{ id: "VIL-01", nom: "Conakry", centres: centres.filter(c => c.region === "Conakry") }]
  },
  {
    id: "REG-02",
    nom: "Kankan",
    villes: [{ id: "VIL-04", nom: "Kankan", centres: centres.filter(c => c.region === "Kankan") }]
  },
  {
    id: "REG-03",
    nom: "Nzérékoré",
    villes: [{ id: "VIL-05", nom: "Nzérékoré", centres: centres.filter(c => c.region === "Nzérékoré") }]
  },
  {
    id: "REG-04",
    nom: "Kindia",
    villes: [{ id: "VIL-06", nom: "Kindia", centres: centres.filter(c => c.region === "Kindia") }]
  },
  {
    id: "REG-05",
    nom: "Boké",
    villes: [{ id: "VIL-07", nom: "Boké", centres: centres.filter(c => c.region === "Boké") }]
  }
];

// ============================================================
// Time slots & permit categories
// ============================================================
export const creneauxHoraires = [
  "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30"
];

export const categoriesPermis = [
  { value: "A", label: "A - Motocyclette" },
  { value: "B", label: "B - Véhicule léger" },
  { value: "C", label: "C - Camion" },
  { value: "D", label: "D - Autobus" },
  { value: "E", label: "E - Remorque" }
];

// ============================================================
// Mock exam results
// ============================================================
export const mockExamResults: ExamResult[] = [
  {
    id: "RES-001",
    session: {
      id: "SES-001",
      candidatId: "USR-001",
      centreId: "CTR-001",
      centreNom: "Centre RouteSafe Kaloum",
      date: "2026-01-15",
      heure: "09:00",
      langue: "fr",
      statut: "reussi",
      score: 38,
      totalQuestions: 40,
      dateInscription: "2026-01-10"
    },
    score: 38,
    totalQuestions: 40,
    reussi: true,
    details: [
      { categorie: "Signalisation", total: 12, correct: 12 },
      { categorie: "Sécurité", total: 8, correct: 8 },
      { categorie: "Priorité", total: 6, correct: 5 },
      { categorie: "Réglementation", total: 8, correct: 7 },
      { categorie: "Vitesse", total: 4, correct: 4 },
      { categorie: "Stationnement", total: 2, correct: 2 }
    ],
    datePassage: "2026-01-15"
  },
  {
    id: "RES-002",
    session: {
      id: "SES-002",
      candidatId: "USR-001",
      centreId: "CTR-002",
      centreNom: "Centre Auto-Plus Dixinn",
      date: "2025-11-20",
      heure: "14:00",
      langue: "fr",
      statut: "echoue",
      score: 30,
      totalQuestions: 40,
      dateInscription: "2025-11-15"
    },
    score: 30,
    totalQuestions: 40,
    reussi: false,
    details: [
      { categorie: "Signalisation", total: 12, correct: 8 },
      { categorie: "Sécurité", total: 8, correct: 6 },
      { categorie: "Priorité", total: 6, correct: 4 },
      { categorie: "Réglementation", total: 8, correct: 6 },
      { categorie: "Vitesse", total: 4, correct: 4 },
      { categorie: "Stationnement", total: 2, correct: 2 }
    ],
    datePassage: "2025-11-20"
  }
];

// ============================================================
// Courses
// ============================================================
export const courses: Course[] = [
  {
    id: "CRS-001",
    titre: "Les panneaux de signalisation",
    description: "Apprenez à reconnaître et comprendre tous les panneaux de signalisation routière en Guinée.",
    categorie: "Signalisation",
    status: "publie",
    imageCover: "/signs/stop.png",
    dureeTotale: 45,
    nbInscrits: 2340,
    rating: 4.8,

    lessons: [
      { id: "LSN-001", titre: "Panneaux d'interdiction", description: "Forme circulaire, bord rouge", type: "sign", contenu: "Les panneaux d'interdiction sont circulaires avec un bord rouge.", signImage: "/signs/sens-interdit.png", duree: 10, ordre: 1 },
      { id: "LSN-002", titre: "Panneaux d'obligation", description: "Forme circulaire, fond bleu", type: "sign", contenu: "Les panneaux d'obligation sont circulaires avec fond bleu.", signImage: "/signs/sens-obligatoire.png", duree: 10, ordre: 2 },
      { id: "LSN-003", titre: "Panneaux de danger", description: "Forme triangulaire, bord rouge", type: "sign", contenu: "Les panneaux de danger sont triangulaires avec bord rouge.", signImage: "/signs/virage-dangereux.png", duree: 10, ordre: 3 },
      { id: "LSN-004", titre: "Panneaux d'indication", description: "Forme rectangulaire ou carrée", type: "sign", contenu: "Les panneaux d'indication sont rectangulaires ou carrés.", signImage: "/signs/passage-pietons.png", duree: 10, ordre: 4 },
      { id: "LSN-005", titre: "Quiz signalisation", description: "Testez vos connaissances", type: "quiz", contenu: "Quiz sur les panneaux de signalisation.", duree: 5, ordre: 5 }
    ]
  },
  {
    id: "CRS-002",
    titre: "Règles de priorité",
    description: "Maîtrisez les règles de priorité : carrefours, ronds-points, passages piétons.",
    categorie: "Priorité",
    status: "publie",
    imageCover: "/scenarios/intersection-conakry.png",
    dureeTotale: 35,
    nbInscrits: 1890,
    rating: 4.6,

    lessons: [
      { id: "LSN-006", titre: "Priorité à droite", description: "La règle fondamentale", type: "text", contenu: "En l'absence de signalisation, la priorité est à droite.", duree: 10, ordre: 1 },
      { id: "LSN-007", titre: "Les ronds-points", description: "Comment aborder un rond-point", type: "sign", contenu: "Les véhicules dans le rond-point ont la priorité.", signImage: "/signs/rond-point.png", duree: 10, ordre: 2 },
      { id: "LSN-008", titre: "Passages piétons en situation", description: "Cas pratiques", type: "interactive", contenu: "Exercices interactifs sur les passages piétons.", scenarioImage: "/scenarios/passage-pietons-approche.png", duree: 15, ordre: 3 }
    ]
  },
  {
    id: "CRS-003",
    titre: "Conduite en sécurité",
    description: "Vitesse, distance de sécurité, équipements obligatoires et conduite par intempéries.",
    categorie: "Sécurité",
    status: "publie",
    imageCover: "/scenarios/depassement.png",
    dureeTotale: 50,
    nbInscrits: 3120,
    rating: 4.9,

    lessons: [
      { id: "LSN-009", titre: "Limitations de vitesse", description: "Vitesse maximale par type de route", type: "sign", contenu: "Limitation de vitesse : 50 km/h en ville, 90 km/h sur route nationale.", signImage: "/signs/limitation-50.png", duree: 10, ordre: 1 },
      { id: "LSN-010", titre: "Distance de sécurité", description: "La règle des 2 secondes", type: "video", contenu: "Vidéo explicative sur la distance de sécurité.", duree: 10, ordre: 2 },
      { id: "LSN-011", titre: "Dépassement en sécurité", description: "Quand et comment dépasser", type: "interactive", contenu: "Cas pratiques de dépassement.", scenarioImage: "/scenarios/depassement.png", duree: 15, ordre: 3 },
      { id: "LSN-012", titre: "Conduite par intempéries", description: "Pluie, brouillard, nuit", type: "text", contenu: "Adaptation de la conduite selon les conditions météo.", duree: 15, ordre: 4 }
    ]
  }
];

// ============================================================
// Helper functions
// ============================================================
export function generateCandidateNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `GN-CODE-2026-${num}`;
}

export function getRandomQuestions(count: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getUpcomingDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() !== 0) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  return dates;
}

export function getQuestionInLanguage(question: Question, _lang: NationalLanguage): Question {
  // Translations temporarily disabled - always return French
  return question;
}

export function getLanguageName(code: NationalLanguage): string {
  const lang = languages.find(l => l.code === code);
  return lang ? lang.name : 'Français';
}

export function getLanguageNativeName(code: NationalLanguage): string {
  const lang = languages.find(l => l.code === code);
  return lang ? lang.nativeName : 'Français';
}
