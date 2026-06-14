import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clean existing data ───────────────────────────
  await prisma.reponse.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.dailyStat.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.question.deleteMany();
  await prisma.centre.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Admin User ─────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@coderoute-gn.org',
      passwordHash: await bcrypt.hash('demo123', 10),
      nom: 'Admin',
      prenom: 'System',
      dateNaissance: '1980-01-01',
      numeroIdentite: 'GN-ADMIN-001',
      telephone: '+224 620 00 00 00',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'super-admin',
      numeroUnique: 'GN-CODE-2026-000001',
      langueMaternelle: 'fr',
    },
  });

  // ─── Create Demo Candidate ─────────────────────────
  const candidateUser = await prisma.user.create({
    data: {
      email: 'candidat@demo.gn',
      passwordHash: await bcrypt.hash('demo123', 10),
      nom: 'Diallo',
      prenom: 'Mamadou',
      dateNaissance: '1995-03-15',
      numeroIdentite: 'GN-12345678',
      telephone: '+224 622 00 00 00',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'candidat',
      numeroUnique: 'GN-CODE-2026-789012',
      langueMaternelle: 'fr',
    },
  });

  // ─── Create Centres ────────────────────────────────
  const centres = await Promise.all([
    prisma.centre.create({
      data: {
        nom: 'Centre RouteSafe Kaloum',
        ville: 'Conakry',
        region: 'Conakry',
        adresse: 'Avenue de la République, Kaloum',
        capacite: 50,
        telephone: '+224 621 00 01 00',
        email: 'kaloum@routesafe-gn.com',
        accredDateDebut: '2025-06-01',
        accredDateFin: '2027-06-01',
        accredStatut: 'actif',
        accredScore: 92,
        equipements: '["Salle informatique", "Projecteur", "Webcam surveillance"]',
        languesDisponibles: '["fr"]',
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre Auto-Plus Dixinn',
        ville: 'Conakry',
        region: 'Conakry',
        adresse: 'Boulevard du Commerce, Dixinn',
        capacite: 35,
        telephone: '+224 621 00 02 00',
        email: 'dixinn@autoplus-gn.com',
        accredDateDebut: '2025-09-01',
        accredDateFin: '2027-09-01',
        accredStatut: 'actif',
        accredScore: 88,
        equipements: '["Salle informatique", "Audio"]',
        languesDisponibles: '["fr"]',
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre Permis Express Matam',
        ville: 'Conakry',
        region: 'Conakry',
        adresse: 'Route du Niger, Matam',
        capacite: 40,
        telephone: '+224 621 00 03 00',
        email: 'matam@permisexpress-gn.com',
        accredDateDebut: '2025-03-01',
        accredDateFin: '2026-03-01',
        accredStatut: 'en_renouvellement',
        accredScore: 75,
        equipements: '["Salle informatique"]',
        languesDisponibles: '["fr"]',
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre Permis Kankan',
        ville: 'Kankan',
        region: 'Kankan',
        adresse: 'Avenue Sékou Touré, Kankan',
        capacite: 30,
        telephone: '+224 621 00 04 00',
        email: 'kankan@permis-gn.com',
        accredDateDebut: '2025-01-01',
        accredDateFin: '2027-01-01',
        accredStatut: 'actif',
        accredScore: 85,
        equipements: '["Salle informatique", "Projecteur"]',
        languesDisponibles: '["fr"]',
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre Routier Nzérékoré',
        ville: 'Nzérékoré',
        region: 'Nzérékoré',
        adresse: 'Route de la Forestière, Nzérékoré',
        capacite: 25,
        telephone: '+224 621 00 05 00',
        email: 'nzerekore@routier-gn.com',
        accredDateDebut: '2025-04-01',
        accredDateFin: '2027-04-01',
        accredStatut: 'actif',
        accredScore: 80,
        equipements: '["Salle informatique"]',
        languesDisponibles: '["fr"]',
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre Auto-École Kindia',
        ville: 'Kindia',
        region: 'Kindia',
        adresse: 'Avenue de l\'Indépendance, Kindia',
        capacite: 20,
        telephone: '+224 621 00 06 00',
        email: 'kindia@autoecole-gn.com',
        accredDateDebut: '2025-07-01',
        accredDateFin: '2027-07-01',
        accredStatut: 'actif',
        accredScore: 78,
        equipements: '["Salle informatique"]',
        languesDisponibles: '["fr"]',
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre Routier Boké',
        ville: 'Boké',
        region: 'Boké',
        adresse: 'Quartier Centre, Boké',
        capacite: 20,
        telephone: '+224 621 00 07 00',
        email: 'boke@routier-gn.com',
        accredDateDebut: '2024-12-01',
        accredDateFin: '2026-12-01',
        accredStatut: 'actif',
        accredScore: 72,
        equipements: '["Salle informatique"]',
        languesDisponibles: '["fr"]',
      },
    }),
  ]);

  // ─── Create Questions ──────────────────────────────
  const questionsData = [
    { texte: "Que signifie ce panneau ?", options: '["Arrêt obligatoire", "Cédez le passage", "Sens interdit", "Priorité à droite"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/stop.png", explication: "Le panneau STOP (octogonal rouge) impose un arrêt absolu avant de continuer.", points: 1, tempsEstime: 20, tags: '["panneau", "stop", "arrêt"]' },
    { texte: "Que signifie ce panneau ?", options: '["Interdiction", "Obligation", "Indication", "Danger"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/sens-interdit.png", explication: "Un panneau circulaire avec bord rouge indique une interdiction. Ici, sens interdit.", points: 1, tempsEstime: 20, tags: '["panneau", "interdiction", "sens interdit"]' },
    { texte: "Que signifie ce panneau ?", options: '["Cédez le passage", "Stop", "Priorité à droite", "Sens unique"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/cede-passage.png", explication: "Le triangle inversé blanc avec bord rouge vous impose de céder le passage.", points: 1, tempsEstime: 20, tags: '["panneau", "cédez", "priorité"]' },
    { texte: "Que signifie ce panneau ?", options: '["Virage dangereux à gauche", "Virage dangereux à droite", "Route sinueuse", "Chicane"]', bonneReponse: 1, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/virage-droit.png", explication: "Le panneau triangulaire signale un virage dangereux à droite.", points: 1, tempsEstime: 20, tags: '["panneau", "danger", "virage"]' },
    { texte: "Que signifie ce panneau ?", options: '["Vitesse limitée à 50 km/h", "Vitesse minimale 50 km/h", "Vitesse recommandée 50 km/h", "Zone 50"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/vitesse-limitee.png", explication: "Le panneau circulaire avec chiffre indique la vitesse maximale autorisée.", points: 1, tempsEstime: 20, tags: '["panneau", "vitesse", "limitation"]' },
    { texte: "Que signifie ce panneau ?", options: '["Stationnement interdit", "Arrêt interdit", "Stationnement autorisé", "Zone de livraison"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "moyen", mediaType: "sign", signImage: "/signs/stationnement-interdit.png", explication: "Le panneau rond avec bord rouge barré indique un stationnement interdit.", points: 1, tempsEstime: 25, tags: '["panneau", "stationnement", "interdiction"]' },
    { texte: "Que signifie ce panneau ?", options: '["Priorité à droite", "Cédez le passage", "Route prioritaire", "Priorité ponctuelle"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "moyen", mediaType: "sign", signImage: "/signs/priorite-droite.png", explication: "Le panneau triangulaire blanc indique que vous devez céder le passage aux véhicules venant de droite.", points: 1, tempsEstime: 25, tags: '["panneau", "priorité", "droite"]' },
    { texte: "Que signifie ce panneau ?", options: '["Sens obligatoire tout droit", "Sens unique", "Interdiction de tourner", "Route sans issue"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/sens-obligatoire.png", explication: "Le panneau rond bleu avec flèche indique la direction obligatoire.", points: 1, tempsEstime: 20, tags: '["panneau", "obligation", "direction"]' },
    { texte: "Que signifie ce panneau ?", options: '["Passage piétons", "École", "Zone résidentielle", "Travaux"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/passage-pietons.png", explication: "Le panneau triangulaire signale un passage pour piétons.", points: 1, tempsEstime: 20, tags: '["panneau", "piétons", "passage"]' },
    { texte: "Que signifie ce panneau ?", options: '["Travaux en cours", "Route barrée", "Déviation", "Chantier interdit"]', bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/travaux.png", explication: "Le panneau triangulaire orange signale des travaux sur la chaussée.", points: 1, tempsEstime: 20, tags: '["panneau", "travaux", "danger"]' },
    // Priorités
    { texte: "À une intersection sans panneaux, qui a la priorité ?", options: '["Le véhicule venant de droite", "Le véhicule venant de gauche", "Le véhicule le plus rapide", "Celui qui klaxonne en premier"]', bonneReponse: 0, categorie: "Priorités", difficulte: "moyen", mediaType: "text", explication: "En l'absence de signalisation, la priorité à droite s'applique toujours.", points: 1, tempsEstime: 30, tags: '["priorité", "intersection", "règle"]' },
    { texte: "Vous arrivez à un rond-point. Qui a la priorité ?", options: '["Les véhicules déjà engagés", "Les véhicules entrant", "Le véhicule le plus gros", "Celui venant de droite"]', bonneReponse: 0, categorie: "Priorités", difficulte: "moyen", mediaType: "text", explication: "Dans un rond-point, les véhicules déjà engagés ont toujours la priorité.", points: 1, tempsEstime: 25, tags: '["priorité", "rond-point", "circulation"]' },
    { texte: "Un bus sort d'un arrêt. Qui est prioritaire ?", options: '["Le bus", "Vous", "Celui qui va le plus vite", "Le véhicule le plus petit"]', bonneReponse: 0, categorie: "Priorités", difficulte: "moyen", mediaType: "text", explication: "Les bus en manœuvre de sortie d'arrêt ont la priorité.", points: 1, tempsEstime: 25, tags: '["priorité", "bus", "transport"]' },
    { texte: "Un véhicule d'urgence avec sirène approche. Que faites-vous ?", options: '["Vous serrez à droite et vous arrêtez", "Vous accélérez", "Vous continuez normalement", "Vous vous arrêtez au milieu"]', bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "text", explication: "Vous devez faciliter le passage des véhicules d'urgence en serrant à droite.", points: 1, tempsEstime: 20, tags: '["priorité", "urgence", "sécurité"]' },
    { texte: "À un feu jaune fixe, que devez-vous faire ?", options: '["Vous arrêter sauf si vous ne pouvez pas le faire en sécurité", "Accélérer pour passer", "Ralentir seulement", "Klaxonner"]', bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "text", explication: "Le feu jaune impose l'arrêt, sauf si vous êtes trop près pour vous arrêter en sécurité.", points: 1, tempsEstime: 20, tags: '["feu", "priorité", "arrêt"]' },
    // Sécurité
    { texte: "Quelle est la vitesse maximale en ville en Guinée ?", options: '["50 km/h", "60 km/h", "40 km/h", "80 km/h"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "La vitesse maximale en agglomération en Guinée est de 50 km/h.", points: 1, tempsEstime: 15, tags: '["vitesse", "ville", "réglementation"]' },
    { texte: "Le port de la ceinture de sécurité est obligatoire :", options: '["À l\'avant et à l\'arrière", "Seulement à l\'avant", "Seulement sur autoroute", "Jamais obligatoire"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "La ceinture est obligatoire pour tous les passagers, avant et arrière.", points: 1, tempsEstime: 15, tags: '["ceinture", "sécurité", "obligation"]' },
    { texte: "Quelle est la distance de sécurité minimale sur route mouillée ?", options: '["Le double de la distance normale", "La même distance", "La moitié", "Pas de distance minimale"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "text", explication: "Sur route mouillée, la distance de sécurité doit être doublée.", points: 1, tempsEstime: 25, tags: '["sécurité", "distance", "route mouillée"]' },
    { texte: "Que signifie un triangle de présignalisation placé sur la route ?", options: '["Un véhicule en panne ou un accident", "Un parking", "Un arrêt de bus", "Un passage piétons"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "Le triangle de présignalisation signale un danger (panne, accident) sur la route.", points: 1, tempsEstime: 20, tags: '["sécurité", "signalisation", "danger"]' },
    { texte: "Quand devez-vous utiliser les feux de détresse ?", options: '["En cas de panne ou d\'arrêt d\'urgence", "Pour saluer quelqu\'un", "La nuit en ville", "Quand il pleut"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "Les feux de détresse sont réservés aux situations d'urgence (panne, accident).", points: 1, tempsEstime: 15, tags: '["feux", "détresse", "urgence"]' },
    { texte: "En cas de crevaison, que devez-vous faire ?", options: '["Tenir le volant fermement et freiner progressivement", "Freiner brusquement", "Accélérer", "Lâcher le volant"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "text", explication: "En cas de crevaison, tenez fermement le volant et freinez progressivement sans mouvement brusque.", points: 1, tempsEstime: 30, tags: '["sécurité", "crevaison", "conduite"]' },
    { texte: "Quel est le taux d'alcoolémie maximal autorisé en Guinée ?", options: '["0,5 g/l", "0,8 g/l", "0,2 g/l", "Zéro"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "text", explication: "Le taux maximal d'alcoolémie autorisé est de 0,5 g par litre de sang.", points: 1, tempsEstime: 20, tags: '["alcool", "sécurité", "réglementation"]' },
    { texte: "Un enfant de moins de 10 ans peut-il s'asseoir à l'avant ?", options: '["Non, il doit être à l\'arrière avec un dispositif adapté", "Oui, sans condition", "Oui, avec la ceinture", "Seulement sur autoroute"]', bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "Les enfants de moins de 10 ans doivent voyager à l'arrière avec un dispositif de retenue adapté.", points: 1, tempsEstime: 20, tags: '["enfants", "sécurité", "siège auto"]' },
    // Conduite
    { texte: "Comment dépassez-vous un cycliste ?", options: '["En laissant au moins 1 mètre de distance latérale", "En le frôlant", "En klaxonnant", "En le dépassant par la droite"]', bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "scenario", scenarioImage: "/scenarios/depassement-cycliste.png", explication: "Vous devez laisser au moins 1 mètre de distance latérale lors du dépassement d'un cycliste.", points: 1, tempsEstime: 30, tags: '["dépassement", "cycliste", "sécurité"]' },
    { texte: "Avant de changer de voie, vous devez :", options: '["Vérifier les angles morts et mettre le clignotant", "Klaxonner", "Freiner", "Accélérer"]', bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "Avant tout changement de voie, vérifiez les angles morts et actionnez le clignotant.", points: 1, tempsEstime: 20, tags: '["conduite", "changement voie", "sécurité"]' },
    { texte: "La nuit, un véhicule arrive en face. Que faites-vous ?", options: '["Passer en feux de croisement", "Garder les pleins phares", "Éteindre les feux", "Clignoter"]', bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "Vous devez passer en feux de croisement pour ne pas éblouir le conducteur opposé.", points: 1, tempsEstime: 15, tags: '["feux", "nuit", "conduite"]' },
    { texte: "Dans un embouteillage, un véhicule cherche à s'insérer. Vous devez :", options: '["Le laisser passer", "Accélérer pour bloquer", "Klaxonner", "Ignorer"]', bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "La courtoisie routière recommande de laisser les véhicules s'insérer en cas d'embouteillage.", points: 1, tempsEstime: 20, tags: '["conduite", "courtoisie", "circulation"]' },
    { texte: "Vous arrivez sur un accident. Que faites-vous en premier ?", options: '["Sécuriser les lieux et appeler les secours", "Continuer votre chemin", "Prendre des photos", "Toucher les blessés"]', bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "La première action est de sécuriser les lieux (triangle, feux détresse) puis appeler les secours (112).", points: 1, tempsEstime: 25, tags: '["accident", "secours", "sécurité"]' },
    // Infractions
    { texte: "Quel est le montant de l'amende pour excès de vitesse en Guinée ?", options: '["Variable selon l\'excès, de 25 000 à 500 000 GNF", "5 000 GNF fixe", "Pas d\'amende", "1 000 000 GNF"]', bonneReponse: 0, categorie: "Infractions", difficulte: "difficile", mediaType: "text", explication: "L'amende pour excès de vitesse varie de 25 000 à 500 000 GNF selon l'importance du dépassement.", points: 2, tempsEstime: 30, tags: '["infraction", "vitesse", "amende"]' },
    { texte: "Conduire sans permis est puni de :", options: '["Une amende et/ou de l\'emprisonnement", "Un simple avertissement", "Rien", "La confiscation du véhicule seulement"]', bonneReponse: 0, categorie: "Infractions", difficulte: "moyen", mediaType: "text", explication: "La conduite sans permis est un délit passible d'amende et/ou d'emprisonnement.", points: 2, tempsEstime: 25, tags: '["infraction", "permis", "délit"]' },
    { texte: "Le non-respect d'un feu rouge entraîne :", options: '["Une amende et un retrait de points", "Un avertissement", "Rien si la voie est libre", "La confiscation du véhicule"]', bonneReponse: 0, categorie: "Infractions", difficulte: "facile", mediaType: "text", explication: "Le franchissement d'un feu rouge est passible d'amende et de retrait de points sur le permis.", points: 2, tempsEstime: 20, tags: '["infraction", "feu rouge", "amende"]' },
    { texte: "Stationner sur un passage piétons est :", options: '["Toujours interdit", "Autorisé la nuit", "Autorisé 5 minutes", "Autorisé si pas de piétons"]', bonneReponse: 0, categorie: "Infractions", difficulte: "facile", mediaType: "text", explication: "Le stationnement sur un passage piétons est toujours interdit.", points: 1, tempsEstime: 15, tags: '["infraction", "stationnement", "piétons"]' },
    { texte: "Quel document devez-vous obligatoirement avoir en conduisant ?", options: '["Le permis de conduire", "Seulement la carte grise", "Aucun document", "Le reçu d\'assurance suffit"]', bonneReponse: 0, categorie: "Infractions", difficulte: "facile", mediaType: "text", explication: "Le permis de conduire est obligatoire. Vous devez aussi avoir la carte grise et l'assurance.", points: 1, tempsEstime: 15, tags: '["infraction", "documents", "permis"]' },
    { texte: "L'usage du téléphone au volant est :", options: '["Interdit même avec kit mains libres", "Autorisé avec kit mains libres", "Toujours autorisé", "Interdit seulement en ville"]', bonneReponse: 0, categorie: "Infractions", difficulte: "moyen", mediaType: "text", explication: "L'usage du téléphone au volant est interdit, même avec un kit mains libres peut être dangereux. La loi guinéenne l'interdit.", points: 2, tempsEstime: 25, tags: '["infraction", "téléphone", "sécurité"]' },
    { texte: "Que se passe-t-il en cas de délit de fuite ?", options: '["Peine de prison et amende", "Simple amende", "Rien si pas de blessé", "Permis suspendu 1 mois"]', bonneReponse: 0, categorie: "Infractions", difficulte: "moyen", mediaType: "text", explication: "Le délit de fuite est un délit grave passible de peine d'emprisonnement et d'amende.", points: 2, tempsEstime: 25, tags: '["infraction", "fuite", "délit"]' },
  ];

  for (const q of questionsData) {
    await prisma.question.create({ data: q });
  }

  // ─── Create Courses ────────────────────────────────
  const course1 = await prisma.course.create({
    data: {
      titre: 'Signalisation routière',
      description: 'Apprenez à reconnaître et interpréter tous les panneaux de signalisation routière guinéens.',
      categorie: 'Signalisation',
      status: 'publie',
      dureeTotale: 45,
      nbInscrits: 1234,
      rating: 4.8,
      lessons: {
        create: [
          { titre: 'Panneaux de danger', description: 'Les triangles rouges qui signalent les dangers.', type: 'sign', contenu: 'Les panneaux de danger ont une forme triangulaire avec un bord rouge. Ils signalent un danger permanent ou temporaire sur la route.', signImage: '/signs/virage-droit.png', duree: 10, ordre: 1 },
          { titre: 'Panneaux d\'interdiction', description: 'Les cercles rouges qui interdisent certaines actions.', type: 'sign', contenu: 'Les panneaux d\'interdiction sont circulaires avec un bord rouge. Ils indiquent une interdiction.', signImage: '/signs/sens-interdit.png', duree: 10, ordre: 2 },
          { titre: 'Panneaux d\'obligation', description: 'Les cercles bleus qui imposent une direction.', type: 'sign', contenu: 'Les panneaux d\'obligation sont circulaires et bleus. Ils imposent un comportement.', signImage: '/signs/sens-obligatoire.png', duree: 10, ordre: 3 },
          { titre: 'Quiz : Signalisation', description: 'Testez vos connaissances sur les panneaux.', type: 'quiz', contenu: 'Identifiez les panneaux et leur signification.', duree: 15, ordre: 4 },
        ],
      },
    },
  });

  const course2 = await prisma.course.create({
    data: {
      titre: 'Priorités et intersections',
      description: 'Maîtrisez les règles de priorité et de circulation aux intersections.',
      categorie: 'Priorités',
      status: 'publie',
      dureeTotale: 35,
      nbInscrits: 892,
      rating: 4.5,
      lessons: {
        create: [
          { titre: 'La priorité à droite', description: 'Règle fondamentale en l\'absence de signalisation.', type: 'text', contenu: 'En l\'absence de signalisation, la priorité à droite s\'applique. Tout véhicule venant de votre droite a la priorité.', duree: 10, ordre: 1 },
          { titre: 'Les ronds-points', description: 'Comment circuler dans un carrefour giratoire.', type: 'text', contenu: 'Dans un rond-point, les véhicules déjà engagés ont la priorité. Mettez votre clignotant gauche pour entrer, droit pour sortir.', duree: 10, ordre: 2 },
          { titre: 'Scénario : Intersection complexe', description: 'Analysez une situation réelle d\'intersection.', type: 'sign', contenu: 'Observez le scénario et déterminez qui a la priorité.', scenarioImage: '/scenarios/intersection.png', duree: 15, ordre: 3 },
        ],
      },
    },
  });

  const course3 = await prisma.course.create({
    data: {
      titre: 'Sécurité et conduite responsable',
      description: 'Les règles essentielles pour conduire en toute sécurité en Guinée.',
      categorie: 'Sécurité',
      status: 'publie',
      dureeTotale: 40,
      nbInscrits: 1056,
      rating: 4.7,
      lessons: {
        create: [
          { titre: 'Vitesse et distances', description: 'Les limitations de vitesse et distances de sécurité.', type: 'text', contenu: 'En ville : 50 km/h. Sur route : 90 km/h. Sur autoroute : 110 km/h. Distance de sécurité : au moins 2 secondes.', duree: 10, ordre: 1 },
          { titre: 'Équipement obligatoire', description: 'Ce que doit avoir votre véhicule.', type: 'text', contenu: 'Triangle de présignalisation, gilet réfléchissant, trousse de premiers secours, roue de secours, extincteur.', duree: 10, ordre: 2 },
          { titre: 'Conduite par mauvais temps', description: 'Comment adapter sa conduite quand il pleut.', type: 'text', contenu: 'Réduisez votre vitesse, doublez la distance de sécurité, allumez vos feux de croisement.', signImage: '/signs/vitesse-limitee.png', duree: 10, ordre: 3 },
          { titre: 'Quiz : Sécurité', description: 'Vérifiez vos connaissances en sécurité routière.', type: 'quiz', contenu: 'Questions sur la sécurité et la conduite responsable.', duree: 10, ordre: 4 },
        ],
      },
    },
  });

  // ─── Create some Exam Sessions for the demo user ───
  await prisma.examSession.createMany({
    data: [
      {
        candidatId: candidateUser.id,
        centreId: centres[0].id,
        centreNom: centres[0].nom,
        date: '2026-02-15',
        heure: '09:00',
        langue: 'fr',
        statut: 'reussi',
        score: 38,
        totalQuestions: 40,
        dureeEffective: 1650,
        dateInscription: new Date('2026-02-01'),
      },
      {
        candidatId: candidateUser.id,
        centreId: centres[1].id,
        centreNom: centres[1].nom,
        date: '2026-01-20',
        heure: '14:00',
        langue: 'fr',
        statut: 'echoue',
        score: 30,
        totalQuestions: 40,
        dureeEffective: 1800,
        dateInscription: new Date('2026-01-10'),
      },
    ],
  });

  // ─── Create sample Fraud Alerts ────────────────────
  await prisma.fraudAlert.createMany({
    data: [
      {
        type: 'Identité suspecte',
        description: 'Photo du candidat ne correspond pas à la pièce d\'identité présentée',
        severity: 'critical',
        status: 'active',
        candidatId: candidateUser.id,
        centreId: centres[0].id,
      },
      {
        type: 'Comportement anormal',
        description: 'Temps de réponse moyen de 3.2s — seuil normal: 8-15s',
        severity: 'high',
        status: 'investigating',
        centreId: centres[1].id,
      },
      {
        type: 'Double inscription',
        description: 'Même numéro d\'identité détecté dans deux centres différents',
        severity: 'critical',
        status: 'active',
      },
    ],
  });

  // ─── Create Daily Stats (last 30 days) ─────────────
  const stats = [];
  for (let i = 30; i >= 1; i--) {
    const date = new Date(2026, 2, i); // March 2026
    const dateStr = date.toISOString().split('T')[0];
    const exams = 100 + Math.floor(Math.random() * 60);
    const passed = Math.floor(exams * (0.6 + Math.random() * 0.15));
    stats.push({
      date: dateStr,
      exams,
      passed,
      failed: exams - passed,
      cancelled: Math.floor(Math.random() * 5),
      avgScore: Math.round((60 + Math.random() * 20) * 10) / 10,
      revenue: exams * 50000,
    });
  }
  await prisma.dailyStat.createMany({ data: stats });

  console.log(`✅ Seed completed!`);
  console.log(`   - 2 users (admin + candidate)`);
  console.log(`   - 7 centres`);
  console.log(`   - ${questionsData.length} questions`);
  console.log(`   - 3 courses with lessons`);
  console.log(`   - 2 exam sessions`);
  console.log(`   - 3 fraud alerts`);
  console.log(`   - 30 daily stats`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
