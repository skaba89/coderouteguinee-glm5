// ============================================================
// CodeRoute Guinée — Institutional SaaS Data Model
// ============================================================

// --- Languages ---
export type NationalLanguage = 'fr';
// Local languages temporarily disabled — will be re-enabled as improvements:
// | 'ss' | 'fu' | 'ml'

export interface LanguageConfig {
  code: NationalLanguage;
  name: string;
  nativeName: string;
  flag: string;
  regions: string[];
  population: string;
}

// --- User & Roles ---
export type UserRole = 'candidat' | 'auto-ecole' | 'centre-agree' | 'administration' | 'super-admin';

export type ExamStatus = 'passe' | 'reussi' | 'echoue' | 'programme' | 'en_cours' | 'annule';

export type ViewType =
  | 'landing'
  | 'candidate-dashboard'
  | 'exam-booking'
  | 'exam-taking'
  | 'results'
  | 'admin-dashboard'
  | 'auto-ecole-dashboard'
  | 'centre-dashboard'
  | 'practice-test'
  | 'courses'
  | 'center-management'
  | 'fraud-monitoring'
  | 'analytics'
  | 'settings';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroIdentite: string;
  telephone: string;
  email: string;
  ville: string;
  region: string;
  categoriePermis: string;
  role: UserRole;
  numeroUnique: string;
  langueMaternelle: NationalLanguage; // Currently always 'fr'
  photo?: string;
  createdAt?: string;
  lastLogin?: string;
}

// --- Question & Multimedia ---
export type MediaType = 'text' | 'sign' | 'scenario' | 'video' | 'sign+scenario';

// QuestionTranslation — reserved for future local language support
// export interface QuestionTranslation {
//   texte: string;
//   options: string[];
//   explication: string;
// }

export interface Question {
  id: number;
  texte: string;
  options: string[];
  bonneReponse: number;
  categorie: string;
  difficulte: 'facile' | 'moyen' | 'difficile';
  mediaType: MediaType;
  signImage?: string;
  scenarioImage?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  audioFr?: string;
  // translations: Partial<Record<NationalLanguage, QuestionTranslation>>; // TODO: re-enable for local languages
  explication: string;
  points: number;
  tempsEstime: number; // seconds
  tags: string[];
  actif: boolean;
}

// --- Course & Learning ---
export type CourseStatus = 'brouillon' | 'publie' | 'archive';
export type LessonType = 'video' | 'sign' | 'text' | 'quiz' | 'interactive';

export interface Lesson {
  id: string;
  titre: string;
  description: string;
  type: LessonType;
  contenu: string;
  mediaUrl?: string;
  signImage?: string;
  scenarioImage?: string;
  duree: number; // minutes
  ordre: number;
  // translations: Partial<Record<NationalLanguage, { titre: string; description: string; contenu: string }>>; // TODO: re-enable
}

export interface Course {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  status: CourseStatus;
  lessons: Lesson[];
  imageCover?: string;
  dureeTotale: number;
  nbInscrits: number;
  rating: number;
  // translations: Partial<Record<NationalLanguage, { titre: string; description: string }>>; // TODO: re-enable
}

// --- Center & Regions ---
export interface Centre {
  id: string;
  nom: string;
  ville: string;
  region: string;
  adresse: string;
  capacite: number;
  telephone: string;
  email: string;
  actif: boolean;
  accreditation?: {
    dateDebut: string;
    dateFin: string;
    statut: 'actif' | 'en_renouvellement' | 'expire' | 'suspendu';
    scoreQualite: number;
  };
  equipements?: string[];
  languesDisponibles: NationalLanguage[];
}

export interface Region {
  id: string;
  nom: string;
  villes: Ville[];
}

export interface Ville {
  id: string;
  nom: string;
  centres: Centre[];
}

// --- Exam ---
export interface ExamSession {
  id: string;
  candidatId: string;
  centreId: string;
  centreNom: string;
  date: string;
  heure: string;
  langue: NationalLanguage; // Currently always 'fr'
  statut: ExamStatus;
  score?: number;
  totalQuestions: number;
  reponses?: number[];
  dateInscription: string;
  ipAdresse?: string;
  navigateur?: string;
  dureeEffective?: number;
  alertesFraude?: FraudAlert[];
}

export interface ExamResult {
  id: string;
  session: ExamSession;
  score: number;
  totalQuestions: number;
  reussi: boolean;
  details: CategoryResult[];
  datePassage: string;
  certificatUrl?: string;
}

export interface CategoryResult {
  categorie: string;
  total: number;
  correct: number;
}

// --- Fraud ---
export type FraudSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type FraudStatus = 'active' | 'investigating' | 'resolved' | 'dismissed';

export interface FraudAlert {
  id: string;
  type: string;
  description: string;
  severity: FraudSeverity;
  status: FraudStatus;
  candidatId?: string;
  centreId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

// --- Booking ---
export interface BookingStep1 {
  region: string;
  ville: string;
}

export interface BookingStep2 {
  centreId: string;
  centreNom: string;
}

export interface BookingStep3 {
  date: string;
  heure: string;
}

export interface BookingData {
  step1: BookingStep1;
  step2: BookingStep2;
  step3: BookingStep3;
  langue: NationalLanguage; // Currently always 'fr'
}

// --- Analytics ---
export interface DailyStat {
  date: string;
  exams: number;
  passed: number;
  failed: number;
  cancelled: number;
  avgScore: number;
}

export interface RegionalStat {
  region: string;
  centres: number;
  candidates: number;
  examsPassed: number;
  successRate: number;
  revenue: number;
}

// --- Tenant (SaaS Multi-tenant) ---
export interface Tenant {
  id: string;
  nom: string;
  pays: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  domain?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  actif: boolean;
  createdAt: string;
  expiresAt: string;
}
