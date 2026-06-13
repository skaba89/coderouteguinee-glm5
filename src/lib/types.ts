export type UserRole = 'candidat' | 'auto-ecole' | 'centre-agree' | 'administration';

export type ExamStatus = 'passe' | 'reussi' | 'echoue' | 'programme' | 'en_cours';

export type ViewType =
  | 'landing'
  | 'candidate-dashboard'
  | 'exam-booking'
  | 'exam-taking'
  | 'results'
  | 'admin-dashboard'
  | 'practice-test';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroIdentite: string;
  telephone: string;
  email: string;
  ville: string;
  categoriePermis: string;
  role: UserRole;
  numeroUnique: string;
  photo?: string;
}

export interface Question {
  id: number;
  texte: string;
  options: string[];
  bonneReponse: number;
  categorie: string;
  image?: string;
  explication?: string;
}

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

export interface ExamSession {
  id: string;
  candidatId: string;
  centreId: string;
  centreNom: string;
  date: string;
  heure: string;
  statut: ExamStatus;
  score?: number;
  totalQuestions: number;
  reponses?: number[];
  dateInscription: string;
}

export interface ExamResult {
  id: string;
  session: ExamSession;
  score: number;
  totalQuestions: number;
  reussi: boolean;
  details: CategoryResult[];
  datePassage: string;
}

export interface CategoryResult {
  categorie: string;
  total: number;
  correct: number;
}

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
}
