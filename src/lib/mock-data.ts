import { Question, Centre, Region, ExamResult } from './types';

export const questions: Question[] = [
  {
    id: 1,
    texte: "Que signifie un panneau de forme circulaire avec un bord rouge et un fond blanc ?",
    options: ["Interdiction", "Obligation", "Indication", "Danger"],
    bonneReponse: 0,
    categorie: "Signalisation",
    explication: "Un panneau circulaire avec bord rouge indique une interdiction."
  },
  {
    id: 2,
    texte: "Quelle est la vitesse maximale autorisée en agglomération en Guinée ?",
    options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"],
    bonneReponse: 1,
    categorie: "Vitesse",
    explication: "La vitesse maximale en agglomération est de 50 km/h en Guinée."
  },
  {
    id: 3,
    texte: "Que doit faire un conducteur lorsqu'il approche d'un passage piéton ?",
    options: ["Accélérer pour passer rapidement", "Ralentir et céder le passage si nécessaire", "Klaxonner pour prévenir les piétons", "Continuer à la même vitesse"],
    bonneReponse: 1,
    categorie: "Priorité",
    explication: "Le conducteur doit ralentir et céder le passage aux piétons sur un passage piéton."
  },
  {
    id: 4,
    texte: "Quel est le taux d'alcoolémie maximal autorisé pour conduire en Guinée ?",
    options: ["0,2 g/l", "0,5 g/l", "0,8 g/l", "1,0 g/l"],
    bonneReponse: 1,
    categorie: "Réglementation",
    explication: "Le taux d'alcoolémie maximal autorisé est de 0,5 g/l en Guinée."
  },
  {
    id: 5,
    texte: "Un panneau triangulaire avec un bord rouge indique :",
    options: ["Une interdiction", "Une obligation", "Un danger", "Une indication"],
    bonneReponse: 2,
    categorie: "Signalisation",
    explication: "Un panneau triangulaire avec bord rouge signale un danger."
  },
  {
    id: 6,
    texte: "Quel document est obligatoire pour conduire un véhicule en Guinée ?",
    options: ["Carte d'identité uniquement", "Permis de conduire et carte grise", "Passeport", "Attestation de domicile"],
    bonneReponse: 1,
    categorie: "Réglementation",
    explication: "Le permis de conduire et la carte grise sont obligatoires."
  },
  {
    id: 7,
    texte: "Que signifie un feu orange clignotant ?",
    options: ["Arrêt obligatoire", "Feu en panne", "Prudence, passage à caractère dangereux", "Priorité à droite"],
    bonneReponse: 2,
    categorie: "Signalisation",
    explication: "Un feu orange clignotant indique la prudence à un passage dangereux."
  },
  {
    id: 8,
    texte: "À quelle distance minimum devez-vous stationner d'un passage piéton ?",
    options: ["3 mètres", "5 mètres", "10 mètres", "15 mètres"],
    bonneReponse: 1,
    categorie: "Stationnement",
    explication: "Il est interdit de stationner à moins de 5 mètres d'un passage piéton."
  },
  {
    id: 9,
    texte: "Qui a la priorité à un carrefour sans signalisation en Guinée ?",
    options: ["Le véhicule le plus rapide", "Le véhicule venant de droite", "Le véhicule venant de gauche", "Le plus gros véhicule"],
    bonneReponse: 1,
    categorie: "Priorité",
    explication: "La priorité à droite s'applique en l'absence de signalisation."
  },
  {
    id: 10,
    texte: "Quel est l'âge minimal pour obtenir le permis de conduire catégorie B en Guinée ?",
    options: ["16 ans", "18 ans", "20 ans", "21 ans"],
    bonneReponse: 1,
    categorie: "Réglementation",
    explication: "L'âge minimal pour le permis B est de 18 ans."
  },
  {
    id: 11,
    texte: "Que signifie un panneau rectangulaire avec fond bleu ?",
    options: ["Interdiction", "Indication ou obligation", "Danger", "Travaux"],
    bonneReponse: 1,
    categorie: "Signalisation",
    explication: "Un panneau rectangulaire bleu indique une obligation ou une indication."
  },
  {
    id: 12,
    texte: "La ceinture de sécurité est obligatoire :",
    options: ["Uniquement à l'avant", "Uniquement sur autoroute", "Pour tous les occupants", "Seulement pour le conducteur"],
    bonneReponse: 2,
    categorie: "Sécurité",
    explication: "La ceinture de sécurité est obligatoire pour tous les occupants du véhicule."
  },
  {
    id: 13,
    texte: "Que faire en cas d'accident avec des blessés ?",
    options: ["Continuer votre route", "S'arrêter, sécuriser, alerter les secours", "Déplacer les blessés immédiatement", "Appeler uniquement la police"],
    bonneReponse: 1,
    categorie: "Sécurité",
    explication: "Il faut s'arrêter, sécuriser le lieu et alerter les secours (SAMU : 115)."
  },
  {
    id: 14,
    texte: "Quel est le sens de circulation en Guinée ?",
    options: ["Gauche", "Droite", "Les deux selon les routes", "Pas de règle définie"],
    bonneReponse: 1,
    categorie: "Réglementation",
    explication: "La Guinée circule à droite, comme la majorité des pays d'Afrique de l'Ouest."
  },
  {
    id: 15,
    texte: "La distance de sécurité recommandée entre deux véhicules en mouvement est de :",
    options: ["1 seconde", "2 secondes", "5 secondes", "10 secondes"],
    bonneReponse: 1,
    categorie: "Sécurité",
    explication: "La règle des 2 secondes est recommandée pour maintenir une distance de sécurité."
  },
  {
    id: 16,
    texte: "Que signifie un panneau rond avec fond bleu et une flèche blanche pointant vers le haut ?",
    options: ["Interdiction de tourner", "Obligation d'aller tout droit", "Sens unique", "Fin d'interdiction"],
    bonneReponse: 1,
    categorie: "Signalisation",
    explication: "Un panneau rond bleu avec flèche blanche vers le haut = obligation d'aller tout droit."
  },
  {
    id: 17,
    texte: "Quand faut-il utiliser les feux de détresse ?",
    options: ["Pour se garer", "En cas de danger sur la route ou véhicule en panne", "Pour dire merci", "La nuit uniquement"],
    bonneReponse: 1,
    categorie: "Sécurité",
    explication: "Les feux de détresse sont utilisés pour signaler un danger ou un véhicule en panne."
  },
  {
    id: 18,
    texte: "Un véhicule d'urgence avec gyrophaire approche. Que devez-vous faire ?",
    options: ["Accélérer pour passer", "Vous arrêter ou vous ranger sur le côté", "Ignorer et continuer", "Klaxonner en retour"],
    bonneReponse: 1,
    categorie: "Priorité",
    explication: "Il faut céder le passage aux véhicules d'urgence en se rangeant sur le côté."
  },
  {
    id: 19,
    texte: "Que signifie une ligne blanche continue au milieu de la chaussée ?",
    options: ["On peut la franchir pour doubler", "Interdiction de la franchir", "Fin de route", "Zone de stationnement"],
    bonneReponse: 1,
    categorie: "Signalisation",
    explication: "Une ligne blanche continue ne peut pas être franchie."
  },
  {
    id: 20,
    texte: "Quelle est la sanction pour conduite sans permis en Guinée ?",
    options: ["Avertissement", "Amende et/ou peine de prison", "Retrait de points", "Stage obligatoire"],
    bonneReponse: 1,
    categorie: "Réglementation",
    explication: "La conduite sans permis est punie d'une amende et/ou d'une peine de prison."
  },
  {
    id: 21,
    texte: "Que signifie un panneau en forme de losange ?",
    options: ["Interdiction", "Obligation", "Indication", "Priorité"],
    bonneReponse: 3,
    categorie: "Signalisation",
    explication: "Un panneau en losange indique une priorité (ex: priorité à l'intersection)."
  },
  {
    id: 22,
    texte: "Quel est le numéro d'urgence médicale en Guinée ?",
    options: ["15", "115", "17", "18"],
    bonneReponse: 1,
    categorie: "Sécurité",
    explication: "Le SAMU en Guinée est joignable au 115."
  },
  {
    id: 23,
    texte: "Dans un rond-point, qui a la priorité ?",
    options: ["Les véhicules entrant", "Les véhicules circulant dans le rond-point", "Les piétons", "Les véhicules les plus rapides"],
    bonneReponse: 1,
    categorie: "Priorité",
    explication: "Les véhicules circulant dans le rond-point ont la priorité sur ceux qui y entrent."
  },
  {
    id: 24,
    texte: "La catégorie A du permis de conduire concerne :",
    options: ["Les voitures", "Les motocyclettes", "Les camions", "Les autobus"],
    bonneReponse: 1,
    categorie: "Réglementation",
    explication: "La catégorie A est pour les motocyclettes."
  },
  {
    id: 25,
    texte: "Que signifie un panneau de signalisation de forme carrée ?",
    options: ["Danger", "Indication ou information", "Interdiction", "Obligation"],
    bonneReponse: 1,
    categorie: "Signalisation",
    explication: "Un panneau carré indique une information ou une indication."
  },
  {
    id: 26,
    texte: "Le dépassement d'un autre véhicule s'effectue par :",
    options: ["La droite", "La gauche", "Le côté le plus proche", "Les deux côtés"],
    bonneReponse: 1,
    categorie: "Réglementation",
    explication: "Le dépassement s'effectue normalement par la gauche."
  },
  {
    id: 27,
    texte: "Quel équipement est obligatoire dans un véhicule en Guinée ?",
    options: ["GPS", "Trousse de premiers secours et extincteur", "Caméra de recul", "Climatisation"],
    bonneReponse: 1,
    categorie: "Sécurité",
    explication: "La trousse de premiers secours et l'extincteur sont obligatoires."
  },
  {
    id: 28,
    texte: "Quelle est la vitesse maximale sur route nationale en Guinée ?",
    options: ["80 km/h", "90 km/h", "110 km/h", "130 km/h"],
    bonneReponse: 1,
    categorie: "Vitesse",
    explication: "La vitesse maximale sur route nationale est de 90 km/h."
  },
  {
    id: 29,
    texte: "Un panneau avec un triangle blanc sur fond bleu indique :",
    options: ["Fin de priorité", "Priorité à l'intersection", "Cédez le passage", "Sens interdit"],
    bonneReponse: 1,
    categorie: "Signalisation",
    explication: "Le panneau priorité à l'intersection a un triangle blanc sur fond bleu."
  },
  {
    id: 30,
    texte: "En cas de brouillard dense, quel feux devez-vous allumer ?",
    options: ["Feux de croisement", "Feux de brouillard avant et arrière", "Feux de route", "Feux de détresse uniquement"],
    bonneReponse: 1,
    categorie: "Sécurité",
    explication: "Par brouillard dense, les feux de brouillard avant et arrière doivent être allumés."
  }
];

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
    actif: true
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
    actif: true
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
    actif: true
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
    actif: true
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
    actif: true
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
    actif: true
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
    actif: true
  }
];

export const regions: Region[] = [
  {
    id: "REG-01",
    nom: "Conakry",
    villes: [
      {
        id: "VIL-01",
        nom: "Conakry",
        centres: centres.filter(c => c.region === "Conakry")
      }
    ]
  },
  {
    id: "REG-02",
    nom: "Kankan",
    villes: [
      {
        id: "VIL-04",
        nom: "Kankan",
        centres: centres.filter(c => c.region === "Kankan")
      }
    ]
  },
  {
    id: "REG-03",
    nom: "Nzérékoré",
    villes: [
      {
        id: "VIL-05",
        nom: "Nzérékoré",
        centres: centres.filter(c => c.region === "Nzérékoré")
      }
    ]
  },
  {
    id: "REG-04",
    nom: "Kindia",
    villes: [
      {
        id: "VIL-06",
        nom: "Kindia",
        centres: centres.filter(c => c.region === "Kindia")
      }
    ]
  },
  {
    id: "REG-05",
    nom: "Boké",
    villes: [
      {
        id: "VIL-07",
        nom: "Boké",
        centres: centres.filter(c => c.region === "Boké")
      }
    ]
  }
];

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
