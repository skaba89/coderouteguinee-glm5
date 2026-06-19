import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// ─── Secure password management ───────────────────────────
// In production: passwords MUST come from environment variables
// In development/demo: auto-generated secure passwords are printed once
function getSeedPassword(envVar: string, role: string): string {
  const envPassword = process.env[envVar]
  if (envPassword) {
    console.log(`  Using password from env ${envVar} for ${role}`)
    return envPassword
  }
  // Generate a secure random password for demo/development
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@'
  let password = ''
  const bytes = randomBytes(16)
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length]
  }
  // Ensure it meets complexity requirements
  if (!/[A-Z]/.test(password)) password = 'A' + password.slice(1)
  if (!/[a-z]/.test(password)) password = password.slice(0, -1) + 'a'
  if (!/[0-9]/.test(password)) password = password.slice(0, -2) + '3'
  console.log(`  [DEMO] Generated password for ${role}: ${password}`)
  console.log(`  [SECURITY] Set env ${envVar} to use a fixed password in production`)
  return password
}

async function main() {
  console.log('Seeding database...');

  // ─── Clean existing data ─────────────────────────────────
  console.log('Cleaning existing data...');
  await prisma.reponse.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.dailyStat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.question.deleteMany();
  await prisma.centre.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ────────────────────────────────────────────────
  console.log('Creating users...');
  const saltRounds = 10;

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@coderoute-gn.org',
      passwordHash: await bcrypt.hash(getSeedPassword('SEED_ADMIN_PASSWORD', 'super-admin'), saltRounds),
      nom: 'Admin',
      prenom: 'System',
      dateNaissance: '1980-01-01',
      numeroIdentite: 'GN-ADMIN-001',
      telephone: '+224 621 00 00 01',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'super-admin',
      numeroUnique: 'GN-CODE-2024-000001',
      langueMaternelle: 'fr',
      actif: true,
    },
  });

  const inspectorUser = await prisma.user.create({
    data: {
      email: 'inspecteur@coderoute-gn.org',
      passwordHash: await bcrypt.hash(getSeedPassword('SEED_INSPECTOR_PASSWORD', 'administration'), saltRounds),
      nom: 'Camara',
      prenom: 'Ibrahima',
      dateNaissance: '1975-05-15',
      numeroIdentite: 'GN-INSP-001',
      telephone: '+224 622 00 00 02',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'administration',
      numeroUnique: 'GN-CODE-2024-000002',
      langueMaternelle: 'fr',
      actif: true,
    },
  });

  const centreManagerUser = await prisma.user.create({
    data: {
      email: 'centre@coderoute-gn.org',
      passwordHash: await bcrypt.hash(getSeedPassword('SEED_CENTRE_PASSWORD', 'centre-agree'), saltRounds),
      nom: 'Bah',
      prenom: 'Fatoumata',
      dateNaissance: '1985-03-20',
      numeroIdentite: 'GN-CENTRE-001',
      telephone: '+224 623 00 00 03',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'centre-agree',
      numeroUnique: 'GN-CODE-2024-000003',
      langueMaternelle: 'fr',
      actif: true,
    },
  });

  const candidat1 = await prisma.user.create({
    data: {
      email: 'candidat@demo.gn',
      passwordHash: await bcrypt.hash(getSeedPassword('SEED_CANDIDAT_PASSWORD', 'candidat'), saltRounds),
      nom: 'Diallo',
      prenom: 'Mamadou',
      dateNaissance: '1995-08-10',
      numeroIdentite: 'GN-12345678',
      telephone: '+224 622 12 34 56',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'candidat',
      numeroUnique: 'GN-CODE-2024-000004',
      langueMaternelle: 'fr',
      actif: true,
    },
  });

  const candidat2 = await prisma.user.create({
    data: {
      email: 'aicha@demo.gn',
      passwordHash: await bcrypt.hash(getSeedPassword('SEED_CANDIDAT_PASSWORD', 'candidat'), saltRounds),
      nom: 'Sow',
      prenom: 'Aicha',
      dateNaissance: '1998-02-14',
      numeroIdentite: 'GN-87654321',
      telephone: '+224 628 98 76 54',
      ville: 'Kankan',
      region: 'Kankan',
      categoriePermis: 'B',
      role: 'candidat',
      numeroUnique: 'GN-CODE-2024-000005',
      langueMaternelle: 'fr',
      actif: true,
    },
  });

  const candidat3 = await prisma.user.create({
    data: {
      email: 'ousmane@demo.gn',
      passwordHash: await bcrypt.hash(getSeedPassword('SEED_CANDIDAT_PASSWORD', 'candidat'), saltRounds),
      nom: 'Traore',
      prenom: 'Ousmane',
      dateNaissance: '1992-11-30',
      numeroIdentite: 'GN-11223344',
      telephone: '+224 625 11 22 33',
      ville: 'Nzerekore',
      region: 'Nzerekore',
      categoriePermis: 'C',
      role: 'candidat',
      numeroUnique: 'GN-CODE-2024-000006',
      langueMaternelle: 'fr',
      actif: true,
    },
  });

  // ─── Centres ──────────────────────────────────────────────
  console.log('Creating centres...');
  const centres = await Promise.all([
    prisma.centre.create({
      data: {
        nom: 'Centre d\'Examen de Kaloum',
        ville: 'Conakry',
        region: 'Conakry',
        adresse: 'Avenue de la République, Kaloum',
        capacite: 40,
        telephone: '+224 621 00 10 01',
        email: 'kaloum@coderoute-gn.org',
        actif: true,
        accredDateDebut: '2024-01-01',
        accredDateFin: '2026-12-31',
        accredStatut: 'actif',
        accredScore: 92.5,
        equipements: JSON.stringify(['Salle informatique', 'Vidéoprojecteur', 'Climatisation', 'Accessibilité PMR']),
        languesDisponibles: JSON.stringify(['fr']),
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre d\'Examen de Dixinn',
        ville: 'Conakry',
        region: 'Conakry',
        adresse: 'Route du Niger, Dixinn',
        capacite: 30,
        telephone: '+224 622 00 10 02',
        email: 'dixinn@coderoute-gn.org',
        actif: true,
        accredDateDebut: '2024-03-01',
        accredDateFin: '2026-03-01',
        accredStatut: 'actif',
        accredScore: 88.0,
        equipements: JSON.stringify(['Salle informatique', 'Vidéoprojecteur', 'Climatisation']),
        languesDisponibles: JSON.stringify(['fr']),
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre d\'Examen de Kankan',
        ville: 'Kankan',
        region: 'Kankan',
        adresse: 'Boulevard de l\'Indépendance, Kankan',
        capacite: 25,
        telephone: '+224 623 00 10 03',
        email: 'kankan@coderoute-gn.org',
        actif: true,
        accredDateDebut: '2024-06-01',
        accredDateFin: '2026-06-01',
        accredStatut: 'actif',
        accredScore: 85.0,
        equipements: JSON.stringify(['Salle informatique', 'Vidéoprojecteur']),
        languesDisponibles: JSON.stringify(['fr']),
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre d\'Examen de N\'Zerekore',
        ville: 'Nzerekore',
        region: 'Nzerekore',
        adresse: 'Route de la Préfecture, Nzerekore',
        capacite: 20,
        telephone: '+224 624 00 10 04',
        email: 'nzerekore@coderoute-gn.org',
        actif: true,
        accredDateDebut: '2024-01-15',
        accredDateFin: '2026-01-15',
        accredStatut: 'actif',
        accredScore: 80.0,
        equipements: JSON.stringify(['Salle informatique', 'Vidéoprojecteur']),
        languesDisponibles: JSON.stringify(['fr']),
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre d\'Examen de Kindia',
        ville: 'Kindia',
        region: 'Kindia',
        adresse: 'Avenue Sékou Touré, Kindia',
        capacite: 25,
        telephone: '+224 625 00 10 05',
        email: 'kindia@coderoute-gn.org',
        actif: true,
        accredDateDebut: '2024-02-01',
        accredDateFin: '2026-02-01',
        accredStatut: 'actif',
        accredScore: 82.0,
        equipements: JSON.stringify(['Salle informatique', 'Climatisation']),
        languesDisponibles: JSON.stringify(['fr']),
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre d\'Examen de Labe',
        ville: 'Labe',
        region: 'Labe',
        adresse: 'Centre Ville, Labe',
        capacite: 20,
        telephone: '+224 626 00 10 06',
        email: 'labe@coderoute-gn.org',
        actif: true,
        accredDateDebut: '2024-04-01',
        accredDateFin: '2026-04-01',
        accredStatut: 'en_renouvellement',
        accredScore: 78.0,
        equipements: JSON.stringify(['Salle informatique']),
        languesDisponibles: JSON.stringify(['fr']),
      },
    }),
    prisma.centre.create({
      data: {
        nom: 'Centre d\'Examen de Boké',
        ville: 'Boke',
        region: 'Boke',
        adresse: 'Quartier administratif, Boké',
        capacite: 15,
        telephone: '+224 627 00 10 07',
        email: 'boke@coderoute-gn.org',
        actif: true,
        accredDateDebut: '2023-06-01',
        accredDateFin: '2025-06-01',
        accredStatut: 'expire',
        accredScore: 72.0,
        equipements: JSON.stringify(['Salle informatique']),
        languesDisponibles: JSON.stringify(['fr']),
      },
    }),
  ]);

  // ─── Questions ────────────────────────────────────────────
  console.log('Creating questions...');
  const questionData = [
    // Signalisation
    { texte: "Que signifie un panneau octogonal rouge ?", options: JSON.stringify(["Arrêt obligatoire", "Cédez le passage", "Sens interdit", "Priorité à droite"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/stop.png", explication: "Le panneau STOP (octogonal rouge) impose un arrêt absolu avant de continuer.", tags: JSON.stringify(["panneau", "stop", "arrêt"]) },
    { texte: "Que signifie un panneau circulaire avec bord rouge ?", options: JSON.stringify(["Interdiction", "Obligation", "Indication", "Danger"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/sens-interdit.png", explication: "Un panneau circulaire avec bord rouge indique une interdiction.", tags: JSON.stringify(["panneau", "interdiction"]) },
    { texte: "Que signifie un panneau triangulaire inversé pointe en bas ?", options: JSON.stringify(["Arrêt", "Cédez le passage", "Priorité à droite", "Danger"]), bonneReponse: 1, categorie: "Signalisation", difficulte: "moyen", mediaType: "sign", signImage: "/signs/cedezer-passage.png", explication: "Le panneau triangulaire inversé impose de laisser passer les autres véhicules.", tags: JSON.stringify(["panneau", "cédez le passage"]) },
    { texte: "Un panneau en losange indique :", options: JSON.stringify(["Interdiction", "Obligation", "Indication", "Priorité"]), bonneReponse: 3, categorie: "Signalisation", difficulte: "moyen", mediaType: "sign", signImage: "/signs/priorite-droite.png", explication: "Le panneau en losange indique une priorité à l'intersection.", tags: JSON.stringify(["panneau", "priorité"]) },
    { texte: "Un panneau circulaire avec un chiffre et un bord rouge signifie :", options: JSON.stringify(["Vitesse limitée", "Vitesse minimale", "Vitesse recommandée", "Fin de limitation"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/limitation-50.png", explication: "Un panneau circulaire avec bord rouge et chiffre indique une limitation de vitesse maximale.", tags: JSON.stringify(["panneau", "vitesse"]) },
    { texte: "Que signifie un panneau bleu circulaire ?", options: JSON.stringify(["Interdiction", "Obligation", "Indication", "Fin d'interdiction"]), bonneReponse: 1, categorie: "Signalisation", difficulte: "moyen", mediaType: "sign", signImage: "/signs/obligation-droite.png", explication: "Un panneau bleu circulaire indique une obligation.", tags: JSON.stringify(["panneau", "obligation"]) },
    { texte: "Un panneau triangulaire rouge pointe en haut indique :", options: JSON.stringify(["Interdiction", "Obligation", "Danger", "Priorité"]), bonneReponse: 2, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/danger.png", explication: "Un panneau triangulaire rouge pointe en haut signale un danger.", tags: JSON.stringify(["panneau", "danger"]) },
    { texte: "Que signifie un panneau avec une croix rouge ?", options: JSON.stringify(["Interdiction de stationner", "Interdiction de s'arrêter", "Sens interdit", "Fin de route"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/interdiction-stationner.png", explication: "Le panneau avec croix rouge interdit le stationnement.", tags: JSON.stringify(["panneau", "stationnement"]) },
    // ─── SCÉNARIOS PHOTO (situations réelles de conduite en Guinée) ───
    { texte: "Vous approchez de cette intersection à Kaloum. Qui a la priorité ?", options: JSON.stringify(["Le véhicule venant de droite", "Vous, car vous êtes sur l'axe principal", "Les piétons uniquement", "Celui qui klaxonne en premier"]), bonneReponse: 0, categorie: "Priorités", difficulte: "moyen", mediaType: "scenario", scenarioImage: "/scenarios/intersection-kaloum.png", explication: "En l'absence de signalisation de priorité à cette intersection de Kaloum, la règle de la priorité à droite s'applique. Le véhicule venant de votre droite a la priorité.", tags: JSON.stringify(["priorité", "intersection", "Conakry", "Kaloum"]) },
    { texte: "Dans ce rond-point à Kankan, vous voulez y entrer. Que faites-vous ?", options: JSON.stringify(["Céder le passage aux véhicules déjà dans le rond-point", "Entrer en force car j'ai la priorité", "Klaxonner et avancer", "Attendre que le rond-point soit vide"]), bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "scenario", scenarioImage: "/scenarios/rond-point-kankan.png", explication: "Dans un rond-point, les véhicules qui y circulent ont toujours la priorité sur ceux qui veulent y entrer. Vous devez céder le passage.", tags: JSON.stringify(["priorité", "rond-point", "Kankan"]) },
    { texte: "Vous approchez de ce passage piétons près du marché. Que faites-vous ?", options: JSON.stringify(["Ralentir et céder le passage aux piétons", "Accélérer pour passer avant eux", "Klaxonner pour les faire avancer", "Continuer à la même vitesse"]), bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "scenario", scenarioImage: "/scenarios/passage-pietons-marche.png", explication: "Aux abords du marché, de nombreux piétons traversent. Vous devez ralentir et céder le passage aux piétons engagés ou prêts à s'engager sur le passage.", tags: JSON.stringify(["priorité", "piéton", "marché", "Conakry"]) },
    { texte: "Vous roulez sur cette route nationale derrière un camion. Le dépassement est-il autorisé ici ?", options: JSON.stringify(["Oui, la ligne est discontinue et la visibilité est bonne", "Non, jamais sur route nationale", "Oui, mais seulement à 50 km/h", "Oui, uniquement la nuit"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "scenario", scenarioImage: "/scenarios/route-nationale-depassement.png", explication: "Sur cette route nationale, la ligne discontinue et la bonne visibilité autorisent le dépassement. Vérifiez vos rétroviseurs, mettez le clignotant et déboîtez seulement après avoir vérifié la voie libre.", tags: JSON.stringify(["conduite", "dépassement", "route nationale"]) },
    { texte: "Dans cette situation de nuit à Conakry, quels feux devez-vous utiliser ?", options: JSON.stringify(["Feux de croisement (codes)", "Feux de route (pleins phares)", "Feux de détresse uniquement", "Aucun feu, l'éclairage public suffit"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "scenario", scenarioImage: "/scenarios/conduite-nuit-conakry.png", explication: "En ville la nuit, les feux de croisement (codes) suffisent pour ne pas éblouir les autres conducteurs. Les feux de route sont réservés aux routes non éclairées.", tags: JSON.stringify(["conduite", "nuit", "feux", "Conakry"]) },
    { texte: "Vous roulez sous une pluie intense comme sur cette image. Quelle attitude adopter ?", options: JSON.stringify(["Réduire la vitesse et augmenter la distance de sécurité", "Maintenir la vitesse limite autorisée", "Rouler au milieu de la route", "Allumer les feux de détresse en roulant"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "scenario", scenarioImage: "/scenarios/route-pluie.png", explication: "Sur route mouillée, la distance de freinage est allongée et l'adhérence réduite. Réduisez votre vitesse et augmentez la distance de sécurité à au moins 3 secondes.", tags: JSON.stringify(["sécurité", "pluie", "vitesse"]) },
    { texte: "Vous approchez de cette zone scolaire à Dixinn. Quelle est la conduite à tenir ?", options: JSON.stringify(["Ralentir et être prêt à freiner", "Maintenir sa vitesse, les enfants savent faire attention", "Klaxonner pour prévenir", "Accélérer pour passer vite"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "scenario", scenarioImage: "/scenarios/zone-scolaire-dixinn.png", explication: "Aux abords des écoles, les enfants peuvent surgir imprévisiblement. Ralentissez à 30 km/h maximum, soyez prêt à freiner et respectez les panneaux de zone scolaire.", tags: JSON.stringify(["sécurité", "école", "enfant", "Dixinn"]) },
    { texte: "Vous approchez de ce carrefour à feux. Le feu passe au orange. Que faites-vous ?", options: JSON.stringify(["Vous arrêter si vous pouvez le faire en sécurité", "Accélérer pour passer avant le rouge", "Continuer à la même vitesse", "Faire un arrêt brutal"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "scenario", scenarioImage: "/scenarios/carrefour-feux.png", explication: "Au feu orange, vous devez vous arrêter si vous pouvez le faire en sécurité, sans freinage d'urgence. Si vous êtes déjà engagé ou trop proche pour vous arrêter, continuez prudemment.", tags: JSON.stringify(["signalisation", "feu", "carrefour", "Conakry"]) },
    { texte: "Vous approchez de ce péage sur la RN1. Comment devez-vous procéder ?", options: JSON.stringify(["Ralentir, choisir une voie et payer le montant affiché", "Klaxonner pour passer sans payer", "Forcer le passage", "Faire demi-tour"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "scenario", scenarioImage: "/scenarios/peage-rn1.png", explication: "Aux péages, ralentissez, choisissez votre voie à l'avance, payez le montant affiché et attendez que la barrière se lève. Repartez prudemment.", tags: JSON.stringify(["conduite", "péage", "RN1"]) },
    { texte: "Vous approchez de ce pont à Conakry. Quelle précaution prendre ?", options: JSON.stringify(["Maintenir une vitesse constante et respecter les distances", "Accélérer pour passer plus vite", "Klaxonner en permanence", "Rouler sur la voie de gauche"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "scenario", scenarioImage: "/scenarios/pont-tombo.png", explication: "Sur les ponts, la circulation est souvent dense. Maintenez une vitesse constante, respectez les distances de sécurité et ne changez pas de voie inutilement.", tags: JSON.stringify(["conduite", "pont", "Conakry"]) },
    { texte: "Dans cette zone de marché très fréquentée, quelle vitesse est appropriée ?", options: JSON.stringify(["Marche pas à pas, moins de 20 km/h", "50 km/h, la vitesse urbaine normale", "30 km/h maximum", "70 km/h pour sortir vite de la zone"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "scenario", scenarioImage: "/scenarios/zone-marche-pietons.png", explication: "Dans une zone de marché très fréquentée avec piétons et motos, roulez en marche pas à pas (moins de 20 km/h), prêt à freiner à tout instant. La prudence prime sur la vitesse.", tags: JSON.stringify(["conduite", "marché", "piéton", "vitesse"]) },
    { texte: "Sur cette route rurale, des animaux traversent. Que faites-vous ?", options: JSON.stringify(["Ralentir, voire s'arrêter et attendre que la voie soit libre", "Accélérer pour effrayer les animaux", "Klaxonner longuement et forcer le passage", "Contourner les animaux à grande vitesse"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "scenario", scenarioImage: "/scenarios/route-rurale-animaux.png", explication: "Sur les routes rurales de Guinée, les animaux (bovins, caprins) peuvent traverser à tout moment. Ralentissez, voire arrêtez-vous, et ne reprenez la route que lorsque la voie est totalement libre.", tags: JSON.stringify(["sécurité", "route rurale", "animaux"]) },
    // ─── QUESTIONS VIDÉO (séquences animées type Ornikal) ───
    { texte: "Regardez la vidéo. À cet intersection de Kaloum, qui a la priorité ?", options: JSON.stringify(["Le véhicule venant de droite", "Vous, car la voie est principale", "Le véhicule le plus rapide", "Les motos toujours"]), bonneReponse: 0, categorie: "Priorités", difficulte: "moyen", mediaType: "video", videoUrl: "/videos/scenario-intersection.mp4", scenarioImage: "/scenarios/intersection-kaloum.png", explication: "Cette séquence vidéo montre une intersection sans signalisation de priorité à Kaloum. La règle de priorité à droite s'applique : le véhicule venant de votre droite a la priorité.", tags: JSON.stringify(["priorité", "intersection", "vidéo", "Kaloum"]) },
    { texte: "Dans cette vidéo de rond-point à Kankan, quand pouvez-vous y entrer ?", options: JSON.stringify(["Quand aucun véhicule n'est en train de circuler dans le rond-point", "Dès que j'arrive, j'ai la priorité", "Quand je klaxonne", "Après 1 minute d'attente maximum"]), bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "video", videoUrl: "/videos/scenario-rond-point.mp4", scenarioImage: "/scenarios/rond-point-kankan.png", explication: "La vidéo montre que les véhicules dans le rond-point ont la priorité. Vous ne pouvez y entrer que lorsqu'aucun véhicule n'est en train d'y circuler, en cédant le passage à gauche.", tags: JSON.stringify(["priorité", "rond-point", "vidéo", "Kankan"]) },
    { texte: "Dans cette vidéo, des piétons traversent près du marché. Que devez-vous faire ?", options: JSON.stringify(["M'arrêter et les laisser passer complètement", "Continuer en klaxonnant", "Forcer le passage doucement", "Contourner par la gauche à vive allure"]), bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "video", videoUrl: "/videos/scenario-pietons.mp4", scenarioImage: "/scenarios/passage-pietons-marche.png", explication: "Cette séquence montre des piétons traversant près du marché. Vous devez vous arrêter complètement et les laisser passer avant de repartir prudemment.", tags: JSON.stringify(["priorité", "piéton", "vidéo", "marché"]) },
    { texte: "Dans cette vidéo de dépassement sur route nationale, quand est-il sûr de dépasser ?", options: JSON.stringify(["Lorsque la voie est libre, la visibilité bonne et la signalisation l'autorise", "Dès que le véhicule devant est lent", "Quand le véhicule devant clignote", "Dès qu'il y a une ligne continue"]), bonneReponse: 0, categorie: "Conduite", difficulte: "difficile", mediaType: "video", videoUrl: "/videos/scenario-depassement.mp4", scenarioImage: "/scenarios/route-nationale-depassement.png", explication: "Cette séquence montre les conditions d'un dépassement sûr : voie libre, visibilité suffisante, ligne autorisant le dépassement. Vérifiez rétroviseurs, signalez, déboîtez, dépassez, reprenez votre voie.", tags: JSON.stringify(["conduite", "dépassement", "vidéo", "route nationale"]) },
    { texte: "Cette vidéo montre une conduite de nuit à Conakry. Quels feux utiliser ?", options: JSON.stringify(["Feux de croisement (codes) en ville", "Feux de route (pleins phares)", "Feux de brouillard", "Aucun feu"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "video", videoUrl: "/videos/scenario-nuit.mp4", scenarioImage: "/scenarios/conduite-nuit-conakry.png", explication: "Cette séquence de nuit à Conakry montre un éclairage urbain suffisant. Les feux de croisement (codes) sont appropriés pour ne pas éblouir les autres conducteurs en ville.", tags: JSON.stringify(["conduite", "nuit", "feux", "vidéo", "Conakry"]) },
    { texte: "Dans cette vidéo sous la pluie, quelle distance de sécurité adopter ?", options: JSON.stringify(["Au moins 3 secondes, voire plus", "1 seconde, comme sur route sèche", "2 secondes, la règle normale", "0 seconde, en collant le véhicule"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "video", videoUrl: "/videos/scenario-pluie.mp4", scenarioImage: "/scenarios/route-pluie.png", explication: "Sur route mouillée comme dans cette vidéo, la distance de freinage est multipliée par 2. Adoptez au moins 3 secondes de distance de sécurité et réduisez votre vitesse.", tags: JSON.stringify(["sécurité", "pluie", "vidéo", "distance"]) },
    // Priorités
    { texte: "À une intersection sans panneau, qui a la priorité ?", options: JSON.stringify(["Le véhicule venant de droite", "Le véhicule venant de gauche", "Le véhicule le plus rapide", "Le véhicule le plus lourd"]), bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "text", explication: "En l'absence de signalisation, la priorité est à droite.", tags: JSON.stringify(["priorité", "intersection", "droite"]) },
    { texte: "Dans un rond-point, qui a la priorité ?", options: JSON.stringify(["Les véhicules déjà dans le rond-point", "Les véhicules entrant", "Les véhicules venant de droite", "Les piétons"]), bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "text", explication: "Dans un rond-point, les véhicules circulant à l'intérieur ont la priorité.", tags: JSON.stringify(["priorité", "rond-point"]) },
    { texte: "Un véhicule d'urgence avec sirène approche. Que devez-vous faire ?", options: JSON.stringify(["Accélérer pour passer", "Vous arrêter sur le côté", "Continuer normalement", "Faire un demi-tour"]), bonneReponse: 1, categorie: "Priorités", difficulte: "facile", mediaType: "text", explication: "Vous devez vous arrêter sur le côté pour laisser passer les véhicules d'urgence.", tags: JSON.stringify(["priorité", "urgence"]) },
    { texte: "Qui a la priorité à un passage piéton ?", options: JSON.stringify(["Le piéton", "Le véhicule", "Celui qui arrive le premier", "Le véhicule le plus rapide"]), bonneReponse: 0, categorie: "Priorités", difficulte: "facile", mediaType: "text", explication: "Le piéton a toujours la priorité aux passages piétons.", tags: JSON.stringify(["priorité", "piéton"]) },
    // Conduite
    { texte: "Quelle est la vitesse maximale en agglomération en Guinée ?", options: JSON.stringify(["50 km/h", "60 km/h", "40 km/h", "80 km/h"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "La vitesse maximale en agglomération est de 50 km/h en Guinée.", tags: JSON.stringify(["vitesse", "agglomération"]) },
    { texte: "Quelle est la distance de sécurité minimale sur route sèche ?", options: JSON.stringify(["2 secondes", "1 seconde", "3 secondes", "5 secondes"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "text", explication: "La distance de sécurité minimale est de 2 secondes sur route sèche.", tags: JSON.stringify(["sécurité", "distance"]) },
    { texte: "Quand devez-vous allumer vos feux de croisement ?", options: JSON.stringify(["La nuit et en tunnel", "Uniquement la nuit", "En cas de pluie uniquement", "Jamais en ville"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "Les feux de croisement sont obligatoires la nuit et en tunnel.", tags: JSON.stringify(["feux", "nuit"]) },
    { texte: "Quelle est la limite d'alcoolémie en Guinée pour conduire ?", options: JSON.stringify(["0.5 g/l", "0.8 g/l", "0.2 g/l", "0 g/l"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "text", explication: "La limite d'alcoolémie est de 0.5 g/l de sang en Guinée.", tags: JSON.stringify(["alcool", "conduite"]) },
    // Sécurité
    { texte: "Le port de la ceinture de sécurité est obligatoire :", options: JSON.stringify(["Pour tous les occupants, à l'avant et à l'arrière", "Uniquement pour le conducteur", "Uniquement à l'avant", "Uniquement sur autoroute"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "La ceinture de sécurité est obligatoire pour tous les occupants du véhicule.", tags: JSON.stringify(["sécurité", "ceinture"]) },
    { texte: "Que devez-vous faire en cas de crevaison sur autoroute ?", options: JSON.stringify(["Ranger le véhicule sur la bande d'arrêt d'urgence", "Continuer doucement", "Changer le pneu sur la voie de gauche", "Faire signe aux autres véhicules"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "text", explication: "En cas de crevaison, rangez-vous sur la bande d'arrêt d'urgence.", tags: JSON.stringify(["sécurité", "autoroute", "crevaison"]) },
    { texte: "Quel est le taux d'alcool maximal pour un jeune conducteur ?", options: JSON.stringify(["0.2 g/l", "0.5 g/l", "0.8 g/l", "0 g/l"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "text", explication: "Pour les jeunes conducteurs, le taux maximal est de 0.2 g/l.", tags: JSON.stringify(["alcool", "jeune conducteur"]) },
    { texte: "En cas d'accident avec blessé, que devez-vous faire en premier ?", options: JSON.stringify(["Secourir les blessés et appeler les secours", "Appeler votre assurance", "Déplacer les véhicules", "Prendre des photos"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "La priorité est de secourir les blessés et d'appeler les secours (18 ou 112).", tags: JSON.stringify(["sécurité", "accident"]) },
    // Infractions
    { texte: "Quel est le montant de l'amende pour excès de vitesse en Guinée ?", options: JSON.stringify(["De 25 000 à 100 000 GNF", "50 000 GNF fixe", "200 000 GNF", "1 000 000 GNF"]), bonneReponse: 0, categorie: "Infractions", difficulte: "difficile", mediaType: "text", explication: "L'amende pour excès de vitesse varie de 25 000 à 100 000 GNF selon le dépassement.", tags: JSON.stringify(["infraction", "vitesse", "amende"]) },
    { texte: "Conduire sans permis est puni de :", options: JSON.stringify(["Amende et emprisonnement", "Simple amende", "Retrait de points", "Travaux d'intérêt général"]), bonneReponse: 0, categorie: "Infractions", difficulte: "moyen", mediaType: "text", explication: "Conduire sans permis est puni d'une amende et potentiellement d'emprisonnement.", tags: JSON.stringify(["infraction", "permis"]) },
    { texte: "Le non-port de la ceinture est sanctionné par :", options: JSON.stringify(["Une amende forfaitaire", "Un retrait de permis", "Une mise en fourrière", "Rien"]), bonneReponse: 0, categorie: "Infractions", difficulte: "facile", mediaType: "text", explication: "Le non-port de la ceinture est sanctionné par une amende forfaitaire.", tags: JSON.stringify(["infraction", "ceinture"]) },
    // Signalisation avancée
    { texte: "Un panneau carré bleu indique :", options: JSON.stringify(["Une indication", "Une obligation", "Une interdiction", "Un danger"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "moyen", mediaType: "text", explication: "Un panneau carré bleu est un panneau d'indication (direction, services, etc.).", tags: JSON.stringify(["panneau", "indication"]) },
    { texte: "Un panneau rond bleu avec une flèche blanche pointant vers le haut signifie :", options: JSON.stringify(["Tout droit obligatoire", "Sens unique", "Route prioritaire", "Fin d'obligation"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "moyen", mediaType: "text", explication: "Ce panneau indique l'obligation d'aller tout droit.", tags: JSON.stringify(["panneau", "obligation", "direction"]) },
    { texte: "Un panneau avec un 'H' bleu indique :", options: JSON.stringify(["Hôpital", "Hôtel", "Halte", "Autoroute"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "difficile", mediaType: "text", explication: "Le panneau 'H' bleu indique la proximité d'un hôpital.", tags: JSON.stringify(["panneau", "indication", "hôpital"]) },
    // Conduite avancée
    { texte: "Quel est l'angle mort d'un véhicule ?", options: JSON.stringify(["La zone non visible dans les rétroviseurs", "L'avant du véhicule", "Le coffre", "Le toit"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "text", explication: "L'angle mort est la zone autour du véhicule non visible dans les rétroviseurs.", tags: JSON.stringify(["conduite", "angle mort", "sécurité"]) },
    { texte: "Comment franchir un passage à niveau non gardé ?", options: JSON.stringify(["S'arrêter, écouter et regarder avant de traverser", "Accélérer pour passer vite", "Klaxonner et passer", "Attendre qu'un autre véhicule passe"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "text", explication: "À un passage à niveau non gardé, il faut s'arrêter, écouter et regarder.", tags: JSON.stringify(["conduite", "passage à niveau"]) },
    { texte: "Quelle distance de freinage est nécessaire à 90 km/h sur route mouillée ?", options: JSON.stringify(["Environ 75 mètres", "Environ 40 mètres", "Environ 20 mètres", "Environ 100 mètres"]), bonneReponse: 0, categorie: "Conduite", difficulte: "difficile", mediaType: "text", explication: "Sur route mouillée à 90 km/h, la distance de freinage est d'environ 75 mètres.", tags: JSON.stringify(["conduite", "freinage", "pluie"]) },
    // Sécurité avancée
    { texte: "Un triangle de pré-signalisation doit être placé à quelle distance ?", options: JSON.stringify(["Au moins 30 mètres du véhicule", "5 mètres", "10 mètres", "50 mètres"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "text", explication: "Le triangle de pré-signalisation doit être placé à au moins 30 mètres du véhicule.", tags: JSON.stringify(["sécurité", "panne", "triangle"]) },
    { texte: "Quand devez-vous utiliser les feux de détresse ?", options: JSON.stringify(["En cas de panne ou d'accident", "Quand il pleut", "La nuit", "En ville"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "facile", mediaType: "text", explication: "Les feux de détresse sont utilisés en cas de panne, d'accident ou de ralentissement brusque.", tags: JSON.stringify(["sécurité", "feux", "détresse"]) },
    { texte: "Quel est l'âge minimum pour conduire un scooter en Guinée ?", options: JSON.stringify(["16 ans", "14 ans", "18 ans", "21 ans"]), bonneReponse: 0, categorie: "Conduite", difficulte: "moyen", mediaType: "text", explication: "L'âge minimum pour conduire un scooter (permis AM) est de 16 ans.", tags: JSON.stringify(["conduite", "âge", "scooter"]) },
    { texte: "Que signifie un feu clignotant orange à un carrefour ?", options: JSON.stringify(["Cédez le passage", "Arrêt absolu", "Priorité", "Route barrée"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "moyen", mediaType: "text", explication: "Un feu orange clignotant signifie cédez le passage.", tags: JSON.stringify(["feu", "signalisation"]) },
    { texte: "En cas de brouillard dense, quels feux devez-vous allumer ?", options: JSON.stringify(["Feux de brouillard arrière et avant", "Feux de croisement uniquement", "Feux de route", "Feux de détresse"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "difficile", mediaType: "text", explication: "Par brouillard dense, allumez les feux de brouillard avant et arrière.", tags: JSON.stringify(["sécurité", "brouillard", "feux"]) },
    { texte: "Quelle est la sanction pour conduite en état d'ivresse en Guinée ?", options: JSON.stringify(["Amende, retrait de permis et prison possible", "Simple amende", "Retrait de points uniquement", "Travaux d'intérêt général"]), bonneReponse: 0, categorie: "Infractions", difficulte: "moyen", mediaType: "text", explication: "La conduite en état d'ivresse est sévèrement punie : amende, retrait de permis et prison possible.", tags: JSON.stringify(["infraction", "alcool", "sanction"]) },
    { texte: "Un panneau rond avec un fond blanc et une bordure rouge contenant un 'P' barré signifie :", options: JSON.stringify(["Interdiction de stationner", "Parking", "Parc", "Péage"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "facile", mediaType: "sign", signImage: "/signs/interdiction-stationner.png", explication: "Ce panneau interdit le stationnement dans la zone.", tags: JSON.stringify(["panneau", "stationnement", "interdiction"]) },
    { texte: "Comment effectuer un dépassement correct ?", options: JSON.stringify(["Vérifier les rétroviseurs, mettre le clignotant, déboîter et doubler", "Accélérer et déboîter", "Klaxonner et doubler", "Déboîter sans préavis"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "Un dépassement correct nécessite : vérification rétroviseurs, clignotant, déboîtement, dépassement.", tags: JSON.stringify(["conduite", "dépassement"]) },
    { texte: "Quelle est la vitesse maximale sur autoroute en Guinée ?", options: JSON.stringify(["110 km/h", "130 km/h", "90 km/h", "100 km/h"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "La vitesse maximale sur autoroute en Guinée est de 110 km/h.", tags: JSON.stringify(["vitesse", "autoroute"]) },
    { texte: "Un enfant de moins de 10 ans peut-il s'asseoir à l'avant ?", options: JSON.stringify(["Non, il doit être à l'arrière dans un siège adapté", "Oui, s'il est attaché", "Oui, s'il est grand", "Ça dépend du véhicule"]), bonneReponse: 0, categorie: "Sécurité", difficulte: "moyen", mediaType: "text", explication: "Les enfants de moins de 10 ans doivent être installés à l'arrière dans un dispositif adapté.", tags: JSON.stringify(["sécurité", "enfant", "siège auto"]) },
    { texte: "Que signifie un marquage au sol continu ?", options: JSON.stringify(["Interdiction de franchir la ligne", "Dépassement dangereux", "Séparation de voies", "Fin de voie"]), bonneReponse: 0, categorie: "Signalisation", difficulte: "moyen", mediaType: "text", explication: "Une ligne continue ne peut pas être franchie. Le dépassement est interdit.", tags: JSON.stringify(["signalisation", "marquage", "ligne continue"]) },
    { texte: "Le permis B permet de conduire :", options: JSON.stringify(["Les véhicules de moins de 3,5 tonnes", "Tous les véhicules", "Les motos", "Les camions"]), bonneReponse: 0, categorie: "Conduite", difficulte: "facile", mediaType: "text", explication: "Le permis B autorise la conduite de véhicules d'un poids total autorisé en charge inférieur à 3,5 tonnes.", tags: JSON.stringify(["permis", "catégorie B"]) },
  ];

  for (const q of questionData) {
    await prisma.question.create({
      data: {
        texte: q.texte,
        options: q.options,
        bonneReponse: q.bonneReponse,
        categorie: q.categorie,
        difficulte: q.difficulte,
        mediaType: q.mediaType,
        signImage: q.signImage || null,
        scenarioImage: q.scenarioImage || null,
        videoUrl: q.videoUrl || null,
        explication: q.explication,
        points: 1,
        tempsEstime: 20,
        tags: q.tags,
        actif: true,
      },
    });
  }

  // ─── Exam Sessions ────────────────────────────────────────
  console.log('Creating exam sessions...');
  await prisma.examSession.create({
    data: {
      candidatId: candidat1.id,
      centreId: centres[0].id,
      centreNom: centres[0].nom,
      date: '2026-01-15',
      heure: '09:00',
      langue: 'fr',
      statut: 'reussi',
      score: 38,
      totalQuestions: 40,
      dureeEffective: 1800,
      dateInscription: new Date('2026-01-01'),
    },
  });

  await prisma.examSession.create({
    data: {
      candidatId: candidat1.id,
      centreId: centres[1].id,
      centreNom: centres[1].nom,
      date: '2026-02-20',
      heure: '14:00',
      langue: 'fr',
      statut: 'echoue',
      score: 30,
      totalQuestions: 40,
      dureeEffective: 2100,
      dateInscription: new Date('2026-02-10'),
    },
  });

  await prisma.examSession.create({
    data: {
      candidatId: candidat2.id,
      centreId: centres[2].id,
      centreNom: centres[2].nom,
      date: '2026-03-01',
      heure: '10:00',
      langue: 'fr',
      statut: 'reussi',
      score: 36,
      totalQuestions: 40,
      dureeEffective: 1650,
      dateInscription: new Date('2026-02-20'),
    },
  });

  // ─── Courses ──────────────────────────────────────────────
  console.log('Creating courses...');
  const course1 = await prisma.course.create({
    data: {
      titre: 'Signalisation routière — Les fondamentaux',
      description: 'Apprenez à reconnaître et interpréter tous les panneaux de signalisation routière. Ce cours couvre les panneaux de danger, d\'interdiction, d\'obligation et d\'indication, illustrés par des situations réelles rencontrées sur les routes de Guinée.',
      categorie: 'Signalisation',
      status: 'publie',
      imageCover: '/courses/cover-signalisation.png',
      dureeTotale: 45,
      nbInscrits: 234,
      rating: 4.8,
    },
  });

  await prisma.lesson.createMany({
    data: [
      { courseId: course1.id, titre: 'Panneaux de danger', description: 'Les panneaux triangulaires qui signalent les dangers', type: 'sign', contenu: 'Les panneaux de danger sont de forme triangulaire avec la pointe en haut. Ils ont un fond blanc avec une bordure rouge. Ils alertent le conducteur d\'un danger potentiel sur la route : virages, dos d\'âne, passage piétons, école, etc. En Guinée, on les rencontre fréquemment sur les routes nationales et en zone urbaine.', ordre: 1, duree: 10, signImage: '/signs/virage-dangereux.png' },
      { courseId: course1.id, titre: 'Panneaux d\'interdiction', description: 'Les panneaux circulaires avec bord rouge', type: 'sign', contenu: 'Les panneaux d\'interdiction sont circulaires avec un fond blanc et une bordure rouge. Ils interdisent une action spécifique aux conducteurs : sens interdit, limitation de vitesse, interdiction de dépasser, interdiction de stationner. Leur non-respect est sanctionné par le code pénal routier guinéen.', ordre: 2, duree: 10, signImage: '/signs/sens-interdit.png' },
      { courseId: course1.id, titre: 'Panneaux d\'obligation', description: 'Les panneaux bleus circulaires', type: 'sign', contenu: 'Les panneaux d\'obligation sont circulaires avec un fond bleu. Ils imposent une action spécifique aux conducteurs : sens obligatoire, vitesse minimale, round-point obligatoire. Ils indiquent ce que vous DEVEZ faire, contrairement aux panneaux d\'interdiction qui indiquent ce que vous NE devez PAS faire.', ordre: 3, duree: 10, signImage: '/signs/sens-obligatoire.png' },
      { courseId: course1.id, titre: 'Signalisation en situation à Conakry', description: 'Reconnaître les panneaux en milieu urbain', type: 'interactive', contenu: 'Cette leçon interactive vous présente des situations réelles rencontrées à Conakry et dans les grandes villes de Guinée. Observez l\'image et identifiez les panneaux de signalisation présents. Particularité urbaine : la densité de panneaux est élevée, la priorité entre panneaux contradictoires va au plus restrictif.', ordre: 4, duree: 12, scenarioImage: '/scenarios/carrefour-feux.png' },
      { courseId: course1.id, titre: 'Quiz — Signalisation', description: 'Testez vos connaissances', type: 'quiz', contenu: 'Quiz de 10 questions sur la signalisation routière. Validez vos acquis avant de passer à la suite.', ordre: 5, duree: 15 },
    ],
  });

  const course2 = await prisma.course.create({
    data: {
      titre: 'Règles de priorité — Maîtrisez les intersections',
      description: 'Comprenez parfaitement les règles de priorité aux intersections, ronds-points et passages piétons. Un cours essentiel pour réussir l\'examen, illustré par des situations réelles de Conakry, Kankan et d\'autres villes guinéennes.',
      categorie: 'Priorités',
      status: 'publie',
      imageCover: '/courses/cover-priorites.png',
      dureeTotale: 30,
      nbInscrits: 189,
      rating: 4.6,
    },
  });

  await prisma.lesson.createMany({
    data: [
      { courseId: course2.id, titre: 'Priorité à droite', description: 'La règle fondamentale', type: 'text', contenu: 'En l\'absence de signalisation, la priorité est toujours à droite. Cette règle s\'applique dans les carrefours sans panneaux de priorité, très fréquents dans les quartiers résidentiels de Conakry comme à Kaloum ou Dixinn. Le conducteur doit céder le passage à tout véhicule venant de sa droite.', ordre: 1, duree: 8 },
      { courseId: course2.id, titre: 'Ronds-points en situation', description: 'Priorité dans les giratoires', type: 'video', contenu: 'Vidéo explicative tournée à un rond-point de Kankan. Dans un rond-point, les véhicules circulant à l\'intérieur ont toujours la priorité sur les véhicules entrants. Le clignotant gauche signale votre intention de sortir. À l\'entrée, ralentissez, vérifiez la voie de gauche et entrez prudemment.', ordre: 2, duree: 8, mediaUrl: '/videos/scenario-rond-point.mp4', scenarioImage: '/scenarios/rond-point-kankan.png' },
      { courseId: course2.id, titre: 'Passages piétons en situation', description: 'Priorité aux piétons près du marché', type: 'interactive', contenu: 'Le piéton a toujours la priorité aux passages piétons. Le conducteur doit ralentir et s\'arrêter si nécessaire. Cette leçon interactive présente une situation réelle près du Grand Marché de Conakry où de nombreux piétons traversent. Soyez particulièrement vigilants aux femmes avec enfants et aux vendeurs ambulants.', ordre: 3, duree: 7, scenarioImage: '/scenarios/passage-pietons-marche.png' },
      { courseId: course2.id, titre: 'Intersections urbaines à Conakry', description: 'Cas pratique à Kaloum', type: 'video', contenu: 'Vidéo d\'une intersection à Kaloum. Observez la circulation des taxis jaunes, motos et piétons. La règle de priorité à droite s\'applique en l\'absence de panneaux ou feux. Dans les faits à Conakry, la prudence et la courtoisie sont essentielles face à la densité du trafic.', ordre: 4, duree: 7, mediaUrl: '/videos/scenario-intersection.mp4', scenarioImage: '/scenarios/intersection-kaloum.png' },
      { courseId: course2.id, titre: 'Quiz — Priorités', description: 'Vérifiez votre compréhension', type: 'quiz', contenu: 'Quiz de 8 questions sur les règles de priorité.', ordre: 5, duree: 7 },
    ],
  });

  const course3 = await prisma.course.create({
    data: {
      titre: 'Sécurité routière — Les bonnes pratiques',
      description: 'Découvrez toutes les règles de sécurité routière : ceinture, vitesse, alcool, distance de sécurité et conduite par mauvais temps. Illustré par des vidéos et situations réelles de conduite en Guinée.',
      categorie: 'Sécurité',
      status: 'publie',
      imageCover: '/courses/cover-securite.png',
      dureeTotale: 60,
      nbInscrits: 156,
      rating: 4.9,
    },
  });

  await prisma.lesson.createMany({
    data: [
      { courseId: course3.id, titre: 'La ceinture de sécurité', description: 'Obligatoire pour tous', type: 'text', contenu: 'Le port de la ceinture de sécurité est obligatoire pour tous les occupants du véhicule, à l\'avant comme à l\'arrière. La ceinture réduit de 50% le risque de décès en cas d\'accident. En Guinée, le non-port est sanctionné d\'une amende forfaitaire. Ajustez la ceinture basse sur le bassin, plate contre les épaules, sans torsion.', ordre: 1, duree: 10 },
      { courseId: course3.id, titre: 'Vitesse et distances', description: 'Adapter sa vitesse', type: 'sign', contenu: 'La vitesse doit être adaptée aux conditions de la route. Respectez les limitations : 50 km/h en agglomération, 90 km/h sur route nationale, 110 km/h sur autoroute. Maintenez une distance de sécurité de 2 secondes minimum sur route sèche, 3 secondes sur route mouillée.', ordre: 2, duree: 15, signImage: '/signs/limitation-50.png' },
      { courseId: course3.id, titre: 'Conduite sous la pluie', description: 'Vidéo — Route mouillée', type: 'video', contenu: 'Vidéo d\'une conduite sous pluie intense. Observez la réduction de visibilité et l\'adhérence réduite. Sur route mouillée, la distance de freinage est multipliée par 2. Réduisez votre vitesse de 20%, augmentez la distance de sécurité à 3 secondes minimum, et n\'utilisez jamais les feux de détresse en roulant. Allumez vos feux de croisement, même en journée.', ordre: 3, duree: 12, mediaUrl: '/videos/scenario-pluie.mp4', scenarioImage: '/scenarios/route-pluie.png' },
      { courseId: course3.id, titre: 'Alcool et conduite', description: 'Les dangers de l\'alcool au volant', type: 'text', contenu: 'L\'alcool réduit les réflexes et altère le jugement. La limite légale est de 0.5 g/l en Guinée (0.2 g/l pour les jeunes conducteurs). Ne conduisez jamais après avoir bu. Un verre standard fait grimper le taux à 0.2-0.3 g/l. Prévoyez un conducteur désigné, un taxi, ou dormez sur place. Les sanctions sont lourdes : amende, retrait de permis, et peine de prison en cas de récidive.', ordre: 4, duree: 10 },
      { courseId: course3.id, titre: 'Zones scolaires — Sécurité des enfants', description: 'Vigilance près des écoles', type: 'video', contenu: 'Vidéo d\'une zone scolaire à Dixinn. Aux abords des écoles, ralentissez à 30 km/h maximum. Les enfants peuvent surgir imprévisiblement entre deux véhicules. Soyez particulièrement vigilant aux heures d\'entrée et de sortie (7-8h, 12-13h, 17-18h). Respectez les panneaux jaune fluorescent de zone scolaire.', ordre: 5, duree: 13, mediaUrl: '/videos/scenario-ecole.mp4', scenarioImage: '/scenarios/zone-scolaire-dixinn.png' },
      { courseId: course3.id, titre: 'Conduite de nuit à Conakry', description: 'Adapter ses feux', type: 'video', contenu: 'Vidéo de conduite nocturne à Conakry. En ville, l\'éclairage public est généralement suffisant : utilisez les feux de croisement (codes). Les feux de route (pleins phares) sont réservés aux routes non éclairées et doivent être rabattus au croisement d\'un autre véhicule. Vérifiez la propreté de vos phares et pare-brise avant chaque trajet nocturne.', ordre: 6, duree: 12, mediaUrl: '/videos/scenario-nuit.mp4', scenarioImage: '/scenarios/conduite-nuit-conakry.png' },
      { courseId: course3.id, titre: 'Quiz — Sécurité', description: 'Test final du cours', type: 'quiz', contenu: 'Quiz de 12 questions sur la sécurité routière.', ordre: 7, duree: 13 },
    ],
  });

  // ─── Daily Stats ──────────────────────────────────────────
  console.log('Creating daily stats...');
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const exams = Math.floor(Math.random() * 15) + 5;
    const passed = Math.floor(exams * (0.55 + Math.random() * 0.25));
    const failed = exams - passed;
    const avgScore = Math.round((55 + Math.random() * 30) * 100) / 100;

    await prisma.dailyStat.create({
      data: {
        date: dateStr,
        exams,
        passed,
        failed,
        cancelled: Math.floor(Math.random() * 3),
        avgScore,
        revenue: exams * 50000,
      },
    });
  }

  // ─── Fraud Alerts ─────────────────────────────────────────
  console.log('Creating fraud alerts...');
  await prisma.fraudAlert.createMany({
    data: [
      { type: 'Double inscription', description: 'Même numéro d\'identité utilisé pour deux comptes différents', severity: 'high', status: 'active', candidatId: candidat3.id, details: JSON.stringify({ field: 'numeroIdentite', value: 'GN-11223344' }) },
      { type: 'Comportement anormal', description: 'Temps de réponse anormalement rapide (2s par question)', severity: 'medium', status: 'investigating', sessionId: null, details: JSON.stringify({ avgTime: 2, threshold: 5 }) },
      { type: 'Identité suspecte', description: 'Photo non conforme aux normes', severity: 'low', status: 'resolved', candidatId: candidat2.id, details: JSON.stringify({ reason: 'Photo trop sombre' }) },
    ],
  });

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('   👤 Admin:     admin@coderoute-gn.org / Admin@2024');
  console.log('   👤 Inspecteur: inspecteur@coderoute-gn.org / Inspect@2024');
  console.log('   👤 Centre:    centre@coderoute-gn.org / Centre@2024');
  console.log('   👤 Candidat:  candidat@demo.gn / Candidat@2024');
  console.log('   👤 Candidat:  aicha@demo.gn / Candidat@2024');
  console.log('   👤 Candidat:  ousmane@demo.gn / Candidat@2024');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
