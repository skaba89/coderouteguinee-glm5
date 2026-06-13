import { Question, Centre, Region, ExamResult, LanguageConfig, NationalLanguage, Course } from './types';

// ============================================================
// Language Configuration
// ============================================================
export const languages: LanguageConfig[] = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    regions: ['Toutes les régions'],
    population: 'Langue officielle'
  },
  {
    code: 'ss',
    name: 'Soussou',
    nativeName: 'Sossoxui',
    flag: '🌊',
    regions: ['Conakry', 'Kindia', 'Boké'],
    population: '~3 millions'
  },
  {
    code: 'fu',
    name: 'Poular',
    nativeName: 'Pulaar',
    flag: '⛰️',
    regions: ['Labé', 'Mamou', 'Faranah'],
    population: '~5 millions'
  },
  {
    code: 'ml',
    name: 'Malinké',
    nativeName: 'Maninka',
    flag: '🌳',
    regions: ['Kankan', 'Kouroussa', 'Siguiri'],
    population: '~4 millions'
  }
];

// ============================================================
// Question Bank — 40 questions with multimedia & translations
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré béré yé?", options: ["Kan béré béré", "Yé béré diya", "Béré télé", "Béré wo ma"], explication: "Banna STOP béré béré kan fô i na taga." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Darto saawata", "Hokku laawol", "Laawol haɗaaŋol", "Laawol aranal"], explication: "Panel STOP (octogonal boɗejo) wadde dartol saawata so'a yahde." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Ka bɔ tɛ", "Ka sɔrɔ tɛ", "Tɛ bɛna", "Tɛ kanu"], explication: "Tɔgɔrɔ STOP (kɛrɛ kɔnɔ) bɛna ka bɔ tɛ kɔrɔ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["I ti béré", "I ma béré", "I béré xumu", "I béré dji"], explication: "Banna kɛrɛ béré xumu i ti béré. Béré télé." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Haɗere", "Wadde", "Habrude", "Kulol"], explication: "Panel nguuru boɗejo holno haɗere. Ɗoo laawol haɗaaŋol." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Ka banna", "Ka wuli", "Ka caya", "Ka tariku"], explication: "Tɔgɔrɔ kɔnɔ ka banna. Tɛ bɛna banna." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["Kan béré", "Yé béré diya", "Béré wo ma", "Béré xili"], explication: "Banna kɛrɛ kɔnɔ yé béré diya." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Darto", "Hokku laawol", "Laawol aranal", "Kulol"], explication: "Panel nguuru tolnaaɗo hokkata laawol." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Ka bɔ tɛ", "Ka sɔrɔ tɛ", "Tɛ kanu", "Ka tariku"], explication: "Tɔgɔrɔ kɔnɔ ka sɔrɔ tɛ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["I ti béré", "I ma béré", "I béré xumu", "I béré wo ma"], explication: "Banna losange kɔnɔ béré wo ma." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Haɗere", "Wadde", "Habrude", "Laawol aranal"], explication: "Panel diamaŋ holno laawol aranal." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Ka banna", "Ka wuli", "Ka caya", "Tɛ kanu"], explication: "Tɔgɔrɔ losange kɔnɔ tɛ kanu." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["Yɛrɛyɛrɛ ma 50 km/h", "Yɛrɛyɛrɛ piti 50 km/h", "Yɛrɛyɛrɛ diya 50 km/h", "Yɛrɛyɛrɛ banna ta"], explication: "Banna kɛrɛ bɛ yɛrɛyɛrɛ ma 50 km/h." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Yaawol haa 50 km/h", "Yaawol lesdi 50 km/h", "Yaawol wasiya 50 km/h", "Fin yaawol"], explication: "Panel nguuru boɗejo holno yaawol haa 50 km/h." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Yɛlɛ ma 50 km/h", "Yɛlɛ piti 50 km/h", "Yɛlɛ diya 50 km/h", "Yɛlɛ banna ta"], explication: "Tɔgɔrɔ kɔnɔ yɛlɛ ma 50 km/h." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["I ti yɛrɛ siri", "Tɛ bɛna kɛrɛ banna", "Kɛrɛ xili", "I ti banna ta"], explication: "Banna kɔnɔ i ti yɛrɛ siri." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Haɗere yahde lesdi", "Laawol haɗaaŋol loɗbe", "Kulol loɗɗe", "Fin haɗere"], explication: "Panel ngal haɗata yahde lesdi." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Ka banna yɛlɛ siri", "Tɛ bɛna kɛrɛ banna", "Kɛrɛ tariku", "Ka banna ta"], explication: "Tɔgɔrɔ kɔnɔ ka banna yɛlɛ siri." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["Moussou béré ta", "Sikolo kɔnɔ", "Parki", "Bisi kan béré"], explication: "Banna bulu kɔnɔ moussou béré ta." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Laawol yahde", "Nokku janngirde", "Parki", "Basaare"], explication: "Panel bulo holno laawol yahde." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Mɔgɔ ta", "Kalan kɔnɔ", "Parki", "Basi kanu"], explication: "Tɔgɔrɔ bulu kɔnɔ mɔgɔ ta." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["I ma wuli wo ma", "Béré wo ma piti", "Wo ma xili", "I ti wuli"], explication: "Banna kɛrɛ bulu kɔnɔ béré piti." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Wadde fayta", "Laawol wadde fayta", "Kulol fayta", "Haɗere fayta"], explication: "Panel nguuru bulo holno laawol wadde." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Ka wuli wo ma", "Tɛ wo ma piti", "Wo ma tariku", "Ka banna wuli"], explication: "Tɔgɔrɔ kɔnɔ tɛ wo ma piti." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["Kɛrɛ xili", "Rond-point", "Carrefour", "Béré sili"], explication: "Banna kɛrɛ xili kɔnɔ i ma yɛrɛ diya." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Fayta kulol", "Rond-point", "Carol", "Laawol ɓuuɓol"], explication: "Panel nguuru kulol holno fayta kulol." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Kɛrɛ tariku", "Rond-point", "Carrefour", "Tɛ sili"], explication: "Tɔgɔrɔ kɔnɔ kɛrɛ tariku, i ma yɛlɛ diya." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I mousou banna béré yé?", options: ["Béré tɛlɛ", "Rond-point", "Carrefour 4 béré", "Yé béré diya"], explication: "Banna bulu kɔnɔ rond-point." },
      fu: { texte: "Ko panel ngal holno wadde?", options: ["Laawol haɗaaŋol", "Rond-point", "Carol 4 laawol", "Hokku laawol"], explication: "Panel bulo holno rond-point." },
      ml: { texte: "N tɔgɔrɔ kɛrɛ tɛ?", options: ["Tɛ bɛna", "Rond-point", "Carrefour 4 tɛ", "Ka sɔrɔ tɛ"], explication: "Tɔgɔrɔ bulu kɔnɔ rond-point." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I bɛrɛ intersection na. Mousou béré wo ma?", options: ["I, bɛrɛ i na wo ma bɛ", "Kɛrɛ bulu, a bɛrɛ rond-point kɔnɔ", "Moussou bɛrɛ", "Mousou fɛnɛ na bɛrɛ"], explication: "Rond-point kɔnɔ kɛrɛ bɛrɛ rond-point na béré wo ma." },
      fu: { texte: "Aɗa sosa carol ngal. Hommbo laawol aranal?", options: ["Aɗa, aɗa arda e ñaamo", "Kaaɗe bulu, e nder rond-point", "Yahɓe tan", "Moƴƴino arata"], explication: "E nder rond-point, kaaɗe nder mayre laawol aranal." },
      ml: { texte: "I bɛrɛ carrefour na. Mɔgɔ tɛ kanu?", options: ["I, bɛrɛ i na wo ma", "Kɛrɛ bulu, a bɛrɛ rond-point kɔnɔ", "Mɔgɔ wɛrɛ kanu", "Mɔgɔ fɛnɛ na bɛrɛ"], explication: "Rond-point kɔnɔ kɛrɛ bɛrɛ a na tɛ kanu." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I bɛrɛ xili na, i ma kɛ?", options: ["Yɛrɛ kɛ i na tɛli", "Yɛrɛ diya yé moussou béré", "Klaksoni i na fɔ moussou", "Taga yɛrɛ kelen na"], explication: "Moussou béré ta na i ma yɛrɛ diya yé moussou béré." },
      fu: { texte: "E nder ngonka ngal, ko haɗa waɗde?", options: ["Yaawna ngam yahde", "Leeltina hokku yahɓe laawol", "Fiyu hoore", "Jokku e yaawre ndee"], explication: "So aɗa sosa laawol yahɓe, aɗa haɗa leeltina." },
      ml: { texte: "I bɛrɛ xili na, i ma kɛ?", options: ["Yɛlɛ tɛ i na tɛli", "Yɛlɛ diya ka mɔgɔ sɔrɔ", "Klaksoni i na fɔ mɔgɔ", "Taga yɛlɛ kelen na"], explication: "Mɔgɔ ta na i ma yɛlɛ diya ka mɔgɔ sɔrɔ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I bɛrɛ xili na, yɛrɛ siri ma kɛ?", options: ["Awo, béré bɛ xɔlɔmɛ", "Dɛ, i ma ye bɛ diya", "Awo, fɔ 80 km/h", "Awo, kamyon ma yɛrɛ diya"], explication: "Yɛrɛ siri bɛna i ma ye diya." },
      fu: { texte: "E nder ngonka ngal, yahde lesdi ina yaawi?", options: ["Eey, laawol ngol ina heewi", "Alaa, yi'ete ina ŋakki", "Eey, kono tan e 80 km/h", "Eey, so loɗɗe ndee ina leelti"], explication: "Yahde lesdi haɗaa so yi'ete ŋakki." },
      ml: { texte: "I bɛrɛ xili na, yɛlɛ siri ma kɛ?", options: ["Awo, tɛ bɛ xɔlɔmɛ", "Dɛ, i ma ye bɛ diya", "Awo, fɔ 80 km/h", "Awo, kamyon ma yɛlɛ diya"], explication: "Yɛlɛ siri bɛna i ma ye diya." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Yɛrɛyɛrɛ ma xɔlɔmɛ Guinée agglomération kɔnɔ?", options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"], explication: "Yɛrɛyɛrɛ ma 50 km/h agglomération kɔnɔ." },
      fu: { texte: "Yaawol ɓurɗo saɗde e nder gure e Gine?", options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"], explication: "Yaawol ɓurɗo saɗde e nder gure ko 50 km/h." },
      ml: { texte: "Yɛlɛ ma xɔlɔmɛ Guinée dugu kɔnɔ?", options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"], explication: "Yɛlɛ ma 50 km/h dugu kɔnɔ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Alcoolémie ma xɔlɔmɛ Guinée kɔnɔ?", options: ["0,2 g/l", "0,5 g/l", "0,8 g/l", "1,0 g/l"], explication: "Alcoolémie ma 0,5 g/l Guinée kɔnɔ." },
      fu: { texte: "Alkool ɓurɗo saɗde e laawol e Gine?", options: ["0,2 g/l", "0,5 g/l", "0,8 g/l", "1,0 g/l"], explication: "Alkool ɓurɗo saɗde ko 0,5 g/l." },
      ml: { texte: "Alcoolémie ma xɔlɔmɛ Guinée kɔnɔ?", options: ["0,2 g/l", "0,5 g/l", "0,8 g/l", "1,0 g/l"], explication: "Alcoolémie ma 0,5 g/l." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Kɛrɛ kɛ i ma sɔrɔ Guinée kɔnɔ?", options: ["Karti idéntité dɛrɛ", "Permis yé karti grise", "Paspɔr", "Karti xɔlɔ"], explication: "Permis yé karti grise bɛ i ma sɔrɔ." },
      fu: { texte: "Ko ɓataake haɗaɗo ngam yahde e Gine?", options: ["Kartal anndinde tan", "Yamiroore e kartal boɗeelo", "Paaspoota", "Seedantaagal hoɗde"], explication: "Yamiroore e kartal boɗeelo ko haɗaɗe." },
      ml: { texte: "Kɛrɛ kɛ i ma sɔrɔ Guinée kɔnɔ?", options: ["Karti idéntité dɛrɛ", "Permis yé karti wulojɛ", "Paspɔr", "Karti xɔlɔ"], explication: "Permis yé karti wulojɛ bɛ i ma sɔrɔ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Lamɛ orange clignotant i mousou?", options: ["Kan béré", "Lamɛ xili", "Xili béré kɔnɔ", "Béré wo ma"], explication: "Lamɛ orange clignotant xili bɛrɛ kɔnɔ." },
      fu: { texte: "Lamol oraaɗo wiyeteengo holno wadde?", options: ["Darto saawata", "Lamol bonɗol", "Reeno, laawol kulol", "Laawol aranal"], explication: "Lamol oraaɗo holno reeno e laawol kulol." },
      ml: { texte: "Lamɛ ɔrɛnj clignotant i mousou?", options: ["Ka bɔ tɛ", "Lamɛ xili", "Xili bɛrɛ kɔnɔ", "Tɛ kanu"], explication: "Lamɛ ɔrɛnj clignotant xili bɛrɛ kɔnɔ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I ma parki moussou béré ta kɔnɔ mɛtri?", options: ["3 mɛtri", "5 mɛtri", "10 mɛtri", "15 mɛtri"], explication: "I ti parki 5 mɛtri moussou béré ta na." },
      fu: { texte: "Ko keeweendi ɓurndi famɗude ngam parkaade ɓadi laawol yahɓe?", options: ["3 meete", "5 meete", "10 meete", "15 meete"], explication: "Haɗaa parkaade ɓadi laawol yahɓe ko 5 meete." },
      ml: { texte: "I ma parki mɔgɔ ta na mɛtri?", options: ["3 mɛtri", "5 mɛtri", "10 mɛtri", "15 mɛtri"], explication: "I ti parki 5 mɛtri mɔgɔ ta na." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Mousou béré wo ma carrefour kɔnɔ banna tɛ?", options: ["Kɛrɛ yɛrɛ tɛli", "Kɛrɛ wo ma bɛ", "Kɛrɛ numan ma bɛ", "Kɛrɛ baba"], explication: "Béré wo ma bɛ carrefour kɔnɔ banna tɛ." },
      fu: { texte: "Hommbo laawol aranal e carol tawa alaa maandeeji?", options: ["Kaaɗe ɓurɗe yaawde", "Kaaɗe ummiiɗe e ñaamo", "Kaaɗe ummiiɗe e nano", "Kaaɗe ɓurɗe mawnude"], explication: "Laawol aranal e ñaamo e tawa alaa maandeeji." },
      ml: { texte: "Mɔgɔ tɛ kanu carrefour kɔnɔ banna tɛ?", options: ["Kɛrɛ yɛlɛ tɛli", "Kɛrɛ wo ma bɛ", "Kɛrɛ numan ma bɛ", "Kɛrɛ baba"], explication: "Tɛ kanu wo ma carrefour kɔnɔ banna tɛ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Mɔgɔ ma awa permis B Guinée kɔnɔ?", options: ["16 awa", "18 awa", "20 awa", "21 awa"], explication: "Mɔgɔ ma 18 awa permis B." },
      fu: { texte: "Duuɓi ɓurɗi famɗude ngam heɓde yamiroore B e Gine?", options: ["16 duuɓi", "18 duuɓi", "20 duuɓi", "21 duuɓi"], explication: "Duube 18 ko ɓuri famɗude ngam yamiroore B." },
      ml: { texte: "Mɔgɔ ma awa permis B Guinée kɔnɔ?", options: ["16 awa", "18 awa", "20 awa", "21 awa"], explication: "Mɔgɔ ma 18 awa permis B." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Banna rectangle bulu i mousou?", options: ["I ti béré", "I béré xumu walima i ma béré", "Béré xili", "Tɛ kɛ"], explication: "Banna rectangle bulu i béré xumu walima i ma béré." },
      fu: { texte: "Panel tobeeki bulo holno?", options: ["Haɗere", "Habrude walla wadde", "Kulol", "Golle"], explication: "Panel tobeeki bulo holno wadde walla habrude." },
      ml: { texte: "Tɔgɔrɔ rectangle bulu i mousou?", options: ["Ka banna", "Ka caya walima ka wuli", "Ka tariku", "Tɛ kɛ"], explication: "Tɔgɔrɔ rectangle bulu i mousou ka caya walima ka wuli." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Ceinture i ma bɛ?", options: ["Xɔlɔma dɛrɛ", "Autoroute dɛrɛ", "Mɔgɔ bɛɛ", "Kɛrɛ kɛlɛ dɛrɛ"], explication: "Ceinture bɛ i ma mɔgɔ bɛɛ." },
      fu: { texte: "Sarworgal ina waɗa:", options: ["Yeeso tan", "Laawol mawngol tan", "Yimɓe fof e nder kaɓirgal", "Koolaaɗo tan"], explication: "Sarworgal ina waɗa yimɓe fof." },
      ml: { texte: "Ceinture i ma bɛ?", options: ["Xɔlɔma dɛrɛ", "Autoroute dɛrɛ", "Mɔgɔ bɛɛ", "Kɛrɛ kɛlɛ dɛrɛ"], explication: "Ceinture bɛ i ma mɔgɔ bɛɛ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I ma kɛ aksida kɔnɔ moussou bɛ sɔrɔ?", options: ["Taga tɛ", "Kan, xili, fɔ samu", "Siri moussou tɛli", "Fɔ polis dɛrɛ"], explication: "I ma kan, xili, fɔ samu (115)." },
      fu: { texte: "Ko waɗde so aksida waɗi yimɓe njiɓɓi?", options: ["Jokku yahde", "Darto, reeno, neldu ballal", "Ritin yimɓe ɓe", "Nodda polis tan"], explication: "Darto, reeno, neldu ballal (115)." },
      ml: { texte: "I ma kɛ aksida kɔnɔ mɔgɔ bɛ sɔrɔ?", options: ["Taga tɛ", "Ka bɔ, ka xili, ka fɔ samu", "Ka siri mɔgɔ tɛli", "Ka fɔ polis dɛrɛ"], explication: "I ma ka bɔ, ka xili, ka fɔ samu (115)." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Béré tɛ Guinée kɔnɔ?", options: ["Numan", "Wo ma", "Bɛɛ la kɛrɛ", "Banna tɛ"], explication: "Guinée bɛ wo ma." },
      fu: { texte: "Ko laawol yahde e Gine?", options: ["Nano", "Ñaamo", "Goɗɗum e laawol", "Alaa sariya"], explication: "Gine yahata e ñaamo." },
      ml: { texte: "Tɛ bɛ Guinée kɔnɔ?", options: ["Numan", "Wo ma", "Bɛɛ la kɛrɛ", "Banna tɛ"], explication: "Guinée bɛ wo ma." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Kɛrɛ mɛrɛ diya mɛrɛ kɔnɔ?", options: ["1 sɛkɔnd", "2 sɛkɔnd", "5 sɛkɔnd", "10 sɛkɔnd"], explication: "2 sɛkɔnd bɛ i ma kɛrɛ diya." },
      fu: { texte: "Ko keeweendi reenoɓe hakkunde kaaɗe ɗiɗi?", options: ["1 sekonde", "2 sekonde", "5 sekonde", "10 sekonde"], explication: "Sekonde 2 ko reenoɓe hakkunde kaaɗe." },
      ml: { texte: "Kɛrɛ mɛrɛ diya kɛrɛ kɔnɔ?", options: ["1 sɛkɔnd", "2 sɛkɔnd", "5 sɛkɔnd", "10 sɛkɔnd"], explication: "2 sɛkɔnd bɛ i ma kɛrɛ diya." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Banna kɛrɛ bulu flèche wo ma i mousou?", options: ["I ti wuli", "I ma tɛli", "Béré kɛlɛ", "I ti banna ta"], explication: "Banna kɛrɛ bulu kɔnɔ i ma tɛli." },
      fu: { texte: "Panel nguuru bulo feewuɗo holno?", options: ["Haɗere fayta", "Wadde yahde yeeso", "Laawol gootol", "Fin haɗere"], explication: "Panel nguuru bulo holno wadde yahde yeeso." },
      ml: { texte: "Tɔgɔrɔ kɛrɛ bulu flèche wo ma i mousou?", options: ["Ka banna wuli", "Ka wuli tɛli", "Tɛ kɛlɛ", "Ka banna ta"], explication: "Tɔgɔrɔ kɔnɔ ka wuli tɛli." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "I ma lamɛ xili sɛrɛ?", options: ["Parki na", "Xili walima kɛrɛ xili", "Fɔ barika", "Su na dɛrɛ"], explication: "Lamɛ xili bɛ fɔ xili walima kɛrɛ xili." },
      fu: { texte: "Ko waɗde huutoraade lamɗe caɗeele?", options: ["Ngam parkaade", "So kulol walla kaaɗe njaɓii", "Ngam yettaade", "Hitaande tan"], explication: "Lamɗe caɗeele huutortee ngam kulol walla kaaɗe njaɓii." },
      ml: { texte: "I ma lamɛ xili sɛrɛ?", options: ["Parki na", "Xili walima kɛrɛ xili", "Fɔ barika", "Su na dɛrɛ"], explication: "Lamɛ xili bɛ fɔ xili walima kɛrɛ xili." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Kɛrɛ urgence gyrophaire bɛ. I ma kɛ?", options: ["Yɛrɛ tɛli", "Kan walima siri kɔlɔma", "Taga tɛ", "Klaksoni"], explication: "I ma sɔrɔ kɛrɛ urgence bɛ." },
      fu: { texte: "Kaaɗe caɗeele njaajotooɗe njiytii. Ko haɗa waɗde?", options: ["Yaawna ngam yahde", "Darto walla fayto e daande", "Yaajde e yahde", "Fiyu hoore"], explication: "Haɗa hokkude laawol kaaɗe caɗeele." },
      ml: { texte: "Kɛrɛ urgence gyrophaire bɛ. I ma kɛ?", options: ["Yɛlɛ tɛli", "Ka bɔ walima ka siri kɔlɔma", "Taga tɛ", "Klaksoni"], explication: "I ma sɔrɔ kɛrɛ urgence bɛ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Ligne blanche kɛrɛ kɔnɔ i mousou?", options: ["I ma siri", "I ti siri", "Tɛ banna ta", "Parki kɔnɔ"], explication: "Ligne blanche bɛ i ti siri." },
      fu: { texte: "Dariindi ɓaleeri jokkondiri e nder laawol holno?", options: ["Ena waawi taƴde", "Haɗaa taƴde", "Fin laawol", "Nokku parkaade"], explication: "Dariindi ɓaleeri haɗaa taƴde." },
      ml: { texte: "Ligne blanche kɛrɛ kɔnɔ i mousou?", options: ["I ma siri", "I ti siri", "Tɛ banna ta", "Parki kɔnɔ"], explication: "Ligne blanche bɛ i ti siri." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Sanction permis tɛ Guinée kɔnɔ?", options: ["Xɛrɛfɔ", "Amende walima kasu", "Pɔinti bɔ", "Fɔrmasiɔn"], explication: "Permis tɛ bɛ amende walima kasu." },
      fu: { texte: "Ko lelta yahde tawa alaa yamiroore e Gine?", options: ["Jaŋde", "Lelda e/walla kasu", "Momde dottaaɗe", "Janngude"], explication: "Yahde tawa alaa yamiroore ko lelda e kasu." },
      ml: { texte: "Sanction permis tɛ Guinée kɔnɔ?", options: ["Xɛrɛfɔ", "Amende walima kasu", "Pɔinti bɔ", "Fɔrmasiɔn"], explication: "Permis tɛ bɛ amende walima kasu." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Numéro urgence médicale Guinée kɔnɔ?", options: ["15", "115", "17", "18"], explication: "SAMU Guinée bɛ 115." },
      fu: { texte: "Ko limre caɗeele safaara e Gine?", options: ["15", "115", "17", "18"], explication: "SAMU e Gine ko 115." },
      ml: { texte: "Numéro urgence médicale Guinée kɔnɔ?", options: ["15", "115", "17", "18"], explication: "SAMU Guinée bɛ 115." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Rond-point kɔnɔ mousou béré wo ma?", options: ["Kɛrɛ bɛ tɛ", "Kɛrɛ rond-point kɔnɔ", "Moussou", "Kɛrɛ yɛrɛ tɛli"], explication: "Kɛrɛ rond-point kɔnɔ bɛ béré wo ma." },
      fu: { texte: "E nder rond-point, hommbo laawol aranal?", options: ["Kaaɗe naatooɗe", "Kaaɗe e nder rond-point", "Yahɓe", "Kaaɗe ɓurɗe yaawde"], explication: "Kaaɗe e nder rond-point ina njogii laawol aranal." },
      ml: { texte: "Rond-point kɔnɔ mɔgɔ tɛ kanu?", options: ["Kɛrɛ bɛ tɛ", "Kɛrɛ rond-point kɔnɔ", "Mɔgɔ", "Kɛrɛ yɛlɛ tɛli"], explication: "Kɛrɛ rond-point kɔnɔ bɛ tɛ kanu." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Permis A i mousou?", options: ["Kɛrɛ", "Moto", "Kamyon", "Bisi"], explication: "Permis A bɛ moto." },
      fu: { texte: "Yamiroore A ko fii:", options: ["Kaaɗe", "Moota", "Loruuji", "Basi"], explication: "Yamiroore A ko fii moota." },
      ml: { texte: "Permis A i mousou?", options: ["Kɛrɛ", "Moto", "Kamyon", "Bisi"], explication: "Permis A bɛ moto." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Siri kɛrɛ i ma siri sɛrɛ?", options: ["Numan", "Wo ma", "Kɔlɔma kɛlɛ", "Bɛɛ kɔlɔma"], explication: "Siri bɛ wo ma." },
      fu: { texte: "Yahde lesdi waɗata e:", options: ["Ñaamo", "Nano", "Ɓadiɗum", "Goɗɗum kaaɗe"], explication: "Yahde lesdi waɗata e nano." },
      ml: { texte: "Siri kɛrɛ i ma siri sɛrɛ?", options: ["Numan", "Wo ma", "Kɔlɔma kɛlɛ", "Bɛɛ kɔlɔma"], explication: "Siri bɛ wo ma." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Kɛrɛ kɛ i ma sɔrɔ Guinée kɔnɔ?", options: ["GPS", "Trousse yé extincteur", "Kamera", "Climatisation"], explication: "Trousse yé extincteur bɛ i ma sɔrɔ." },
      fu: { texte: "Ko huutoraade haɗaɗo e nder kaaɗe e Gine?", options: ["GPS", "Trousse safrirde e jaagnoowo", "Kamera", "Wulnde"], explication: "Trousse safrirde e jaagnoowo ko haɗaɗe." },
      ml: { texte: "Kɛrɛ kɛ i ma sɔrɔ Guinée kɔnɔ?", options: ["GPS", "Trousse yé extincteur", "Kamera", "Climatisation"], explication: "Trousse yé extincteur bɛ i ma sɔrɔ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Yɛrɛyɛrɛ ma xɔlɔmɛ route nationale kɔnɔ?", options: ["80 km/h", "90 km/h", "110 km/h", "130 km/h"], explication: "Yɛrɛyɛrɛ ma 90 km/h route nationale kɔnɔ." },
      fu: { texte: "Yaawol ɓurɗo saɗde e laawol ngenndiwal e Gine?", options: ["80 km/h", "90 km/h", "110 km/h", "130 km/h"], explication: "Yaawol ɓurɗo saɗde e laawol ngenndiwal ko 90 km/h." },
      ml: { texte: "Yɛlɛ ma xɔlɔmɛ tɛ nasyonali kɔnɔ?", options: ["80 km/h", "90 km/h", "110 km/h", "130 km/h"], explication: "Yɛlɛ ma 90 km/h tɛ nasyonali kɔnɔ." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Brouillard kɔnɔ lamɛ sɛrɛ i ma allumer?", options: ["Lamɛ croisement", "Lamɛ brouillard xɔlɔma yé numan", "Lamɛ route", "Lamɛ xili dɛrɛ"], explication: "Brouillard kɔnɔ lamɛ brouillard bɛ allumer." },
      fu: { texte: "So loope heewi, ko lamɗe haɗa fuɗɗaade?", options: ["Lamɗe naatgol", "Lamɗe loope yeeso e caggal", "Lamɗe laawol", "Lamɗe caɗeele tan"], explication: "So loope heewi lamɗe loope yeeso e caggal." },
      ml: { texte: "Brouillard kɔnɔ lamɛ sɛrɛ i ma allumer?", options: ["Lamɛ croisement", "Lamɛ brouillard xɔlɔma yé numan", "Lamɛ route", "Lamɛ xili dɛrɛ"], explication: "Brouillard kɔnɔ lamɛ brouillard bɛ allumer." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Banna kɛrɛ xili i mousou?", options: ["I ti béré", "I ma béré", "Béré xili", "I béré xumu"], explication: "Banna kɛrɛ xili bɛ béré xili." },
      fu: { texte: "Panel nguuru boɗejo holno?", options: ["Haɗere", "Wadde", "Kulol", "Habrude"], explication: "Panel nguuru boɗejo holno kulol." },
      ml: { texte: "Tɔgɔrɔ kɛrɛ tariku i mousou?", options: ["Ka banna", "Ka wuli", "Ka tariku", "Ka caya"], explication: "Tɔgɔrɔ kɔnɔ ka tariku." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Alcoolémie ma xɔlɔmɛ kɛrɛ professionnel kɔnɔ?", options: ["0,1 g/l", "0,2 g/l", "0,5 g/l", "0,8 g/l"], explication: "Kɛrɛ professionnel alcoolémie ma 0,2 g/l." },
      fu: { texte: "Alkool ɓurɗo saɗde ngam kaaɗe gollorɗe?", options: ["0,1 g/l", "0,2 g/l", "0,5 g/l", "0,8 g/l"], explication: "Alkool ɓurɗo saɗde ngam kaaɗe gollorɗe ko 0,2 g/l." },
      ml: { texte: "Alcoolémie ma xɔlɔmɛ kɛrɛ professionnel kɔnɔ?", options: ["0,1 g/l", "0,2 g/l", "0,5 g/l", "0,8 g/l"], explication: "Kɛrɛ professionnel alcoolémie ma 0,2 g/l." }
    }
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
    actif: true,
    translations: {
      ss: { texte: "Banna kɛrɛ blanche bulu kɔnɔ i mousou?", options: ["Béré ta", "Béré wo ma intersection", "Yé béré diya", "Béré tɛlɛ"], explication: "Banna kɔnɔ béré wo ma intersection." },
      fu: { texte: "Panel nguuru daneejo e bulo holno?", options: ["Fin laawol aranal", "Laawol aranal e carol", "Hokku laawol", "Laawol haɗaaŋol"], explication: "Panel ngal holno laawol aranal e carol." },
      ml: { texte: "Tɔgɔrɔ blanche bulu kɔnɔ i mousou?", options: ["Tɛ banna ta", "Tɛ kanu carrefour", "Ka sɔrɔ tɛ", "Tɛ bɛna"], explication: "Tɔgɔrɔ kɔnɔ tɛ kanu carrefour." }
    }
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
    languesDisponibles: ["fr", "ss", "fu", "ml"]
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
    languesDisponibles: ["fr", "ss"]
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
    languesDisponibles: ["fr", "ss", "fu"]
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
    languesDisponibles: ["fr", "ml"]
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
    languesDisponibles: ["fr"]
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
    languesDisponibles: ["fr", "ss"]
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
    languesDisponibles: ["fr", "ss"]
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
      langue: "ss",
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
    translations: {
      ss: { titre: "Banna béré xili", description: "I kan banna béré xili bɛɛ Guinée kɔnɔ." },
      fu: { titre: "Maandeeji laawol", description: "Janngo maandeeji laawol fof e Gine." },
      ml: { titre: "Tɔgɔrɔ bɛɛ", description: "I kan tɔgɔrɔ bɛɛ Guinée kɔnɔ." }
    },
    lessons: [
      { id: "LSN-001", titre: "Panneaux d'interdiction", description: "Forme circulaire, bord rouge", type: "sign", contenu: "Les panneaux d'interdiction sont circulaires avec un bord rouge.", signImage: "/signs/sens-interdit.png", duree: 10, ordre: 1, translations: { ss: { titre: "Banna i ti", description: "Kɛrɛ xumu, bord xili", contenu: "Banna i ti bɛ kɛrɛ xumu bord xili." } } },
      { id: "LSN-002", titre: "Panneaux d'obligation", description: "Forme circulaire, fond bleu", type: "sign", contenu: "Les panneaux d'obligation sont circulaires avec fond bleu.", signImage: "/signs/sens-obligatoire.png", duree: 10, ordre: 2, translations: {} },
      { id: "LSN-003", titre: "Panneaux de danger", description: "Forme triangulaire, bord rouge", type: "sign", contenu: "Les panneaux de danger sont triangulaires avec bord rouge.", signImage: "/signs/virage-dangereux.png", duree: 10, ordre: 3, translations: {} },
      { id: "LSN-004", titre: "Panneaux d'indication", description: "Forme rectangulaire ou carrée", type: "sign", contenu: "Les panneaux d'indication sont rectangulaires ou carrés.", signImage: "/signs/passage-pietons.png", duree: 10, ordre: 4, translations: {} },
      { id: "LSN-005", titre: "Quiz signalisation", description: "Testez vos connaissances", type: "quiz", contenu: "Quiz sur les panneaux de signalisation.", duree: 5, ordre: 5, translations: {} }
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
    translations: {
      ss: { titre: "Béré wo ma sariya", description: "I kan béré wo ma sariya bɛɛ." },
      fu: { titre: "Sariya laawol aranal", description: "Heɓtu sariya laawol aranal." },
      ml: { titre: "Tɛ kanu sariya", description: "I kan tɛ kanu sariya bɛɛ." }
    },
    lessons: [
      { id: "LSN-006", titre: "Priorité à droite", description: "La règle fondamentale", type: "text", contenu: "En l'absence de signalisation, la priorité est à droite.", duree: 10, ordre: 1, translations: {} },
      { id: "LSN-007", titre: "Les ronds-points", description: "Comment aborder un rond-point", type: "sign", contenu: "Les véhicules dans le rond-point ont la priorité.", signImage: "/signs/rond-point.png", duree: 10, ordre: 2, translations: {} },
      { id: "LSN-008", titre: "Passages piétons en situation", description: "Cas pratiques", type: "interactive", contenu: "Exercices interactifs sur les passages piétons.", scenarioImage: "/scenarios/passage-pietons-approche.png", duree: 15, ordre: 3, translations: {} }
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
    translations: {
      ss: { titre: "Kɛrɛ xili", description: "Yɛrɛyɛrɛ, kɛrɛ diya, yé xili." },
      fu: { titre: "Yaawre e reeno", description: "Yaawol, keeweendi reeno e huutoraade." },
      ml: { titre: "Kɛrɛ tariku", description: "Yɛlɛ, kɛrɛ diya, yé tariku." }
    },
    lessons: [
      { id: "LSN-009", titre: "Limitations de vitesse", description: "Vitesse maximale par type de route", type: "sign", contenu: "Limitation de vitesse : 50 km/h en ville, 90 km/h sur route nationale.", signImage: "/signs/limitation-50.png", duree: 10, ordre: 1, translations: {} },
      { id: "LSN-010", titre: "Distance de sécurité", description: "La règle des 2 secondes", type: "video", contenu: "Vidéo explicative sur la distance de sécurité.", duree: 10, ordre: 2, translations: {} },
      { id: "LSN-011", titre: "Dépassement en sécurité", description: "Quand et comment dépasser", type: "interactive", contenu: "Cas pratiques de dépassement.", scenarioImage: "/scenarios/depassement.png", duree: 15, ordre: 3, translations: {} },
      { id: "LSN-012", titre: "Conduite par intempéries", description: "Pluie, brouillard, nuit", type: "text", contenu: "Adaptation de la conduite selon les conditions météo.", duree: 15, ordre: 4, translations: {} }
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

export function getQuestionInLanguage(q: Question, lang: NationalLanguage): { texte: string; options: string[]; explication: string } {
  if (lang === 'fr' || !q.translations[lang]) {
    return { texte: q.texte, options: q.options, explication: q.explication };
  }
  const t = q.translations[lang]!;
  return { texte: t.texte, options: t.options, explication: t.explication };
}

export function getLanguageName(code: NationalLanguage): string {
  return languages.find(l => l.code === code)?.name || code;
}

export function getLanguageNativeName(code: NationalLanguage): string {
  return languages.find(l => l.code === code)?.nativeName || code;
}
