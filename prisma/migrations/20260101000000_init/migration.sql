-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('candidat', 'auto_ecole', 'centre_agree', 'administration', 'super_admin');

-- CreateEnum
CREATE TYPE "CentreAccredStatut" AS ENUM ('actif', 'en_renouvellement', 'expire', 'suspendu');

-- CreateEnum
CREATE TYPE "QuestionCategorie" AS ENUM ('Signalisation', 'Priorites', 'Conduite', 'Securite', 'Infractions');

-- CreateEnum
CREATE TYPE "QuestionDifficulte" AS ENUM ('facile', 'moyen', 'difficile');

-- CreateEnum
CREATE TYPE "ExamStatut" AS ENUM ('programme', 'en_cours', 'passe', 'reussi', 'echoue', 'annule');

-- CreateEnum
CREATE TYPE "PaymentStatut" AS ENUM ('en_attente', 'confirme', 'echoue', 'rembourse');

-- CreateEnum
CREATE TYPE "PaymentMoyen" AS ENUM ('mobile_money', 'cash', 'carte');

-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "FraudStatus" AS ENUM ('active', 'investigating', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('brouillon', 'publie', 'archive');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('email', 'sms');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TEXT NOT NULL,
    "numeroIdentite" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'Conakry',
    "categoriePermis" TEXT NOT NULL DEFAULT 'B',
    "role" "UserRole" NOT NULL DEFAULT 'candidat',
    "numeroUnique" TEXT NOT NULL,
    "langueMaternelle" TEXT NOT NULL DEFAULT 'fr',
    "photo" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Centre" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL DEFAULT 30,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "accredDateDebut" TEXT,
    "accredDateFin" TEXT,
    "accredStatut" "CentreAccredStatut" NOT NULL DEFAULT 'actif',
    "accredScore" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "equipements" JSONB,
    "languesDisponibles" JSONB NOT NULL DEFAULT '["fr"]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Centre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "texte" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "bonneReponse" INTEGER NOT NULL,
    "categorie" "QuestionCategorie" NOT NULL,
    "difficulte" "QuestionDifficulte" NOT NULL DEFAULT 'facile',
    "mediaType" TEXT NOT NULL DEFAULT 'text',
    "signImage" TEXT,
    "scenarioImage" TEXT,
    "videoUrl" TEXT,
    "audioFr" TEXT,
    "explication" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "tempsEstime" INTEGER NOT NULL DEFAULT 20,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "candidatId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "centreNom" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "heure" TEXT NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "statut" "ExamStatut" NOT NULL DEFAULT 'programme',
    "score" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 40,
    "dureeEffective" INTEGER,
    "dateInscription" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAdresse" TEXT,
    "navigateur" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reponse" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "reponseDonnee" INTEGER NOT NULL,
    "correcte" BOOLEAN NOT NULL,
    "tempsReponse" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "candidatId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "centreNom" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "heure" TEXT NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "categoriePermis" TEXT NOT NULL DEFAULT 'B',
    "montant" INTEGER NOT NULL DEFAULT 350000,
    "moyenPaiement" "PaymentMoyen" NOT NULL DEFAULT 'mobile_money',
    "numeroPaiement" TEXT,
    "referencePaiement" TEXT,
    "statutPaiement" "PaymentStatut" NOT NULL DEFAULT 'en_attente',
    "numeroConvocation" TEXT,
    "qrCodeData" TEXT,
    "confirmee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FraudSeverity" NOT NULL DEFAULT 'medium',
    "status" "FraudStatus" NOT NULL DEFAULT 'active',
    "candidatId" TEXT,
    "centreId" TEXT,
    "sessionId" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,
    "resolvedAt" TIMESTAMPTZ(6),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStat" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "centreId" TEXT,
    "exams" INTEGER NOT NULL DEFAULT 0,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "cancelled" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'publie',
    "imageCover" TEXT,
    "dureeTotale" INTEGER NOT NULL DEFAULT 0,
    "nbInscrits" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "contenu" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "signImage" TEXT,
    "scenarioImage" TEXT,
    "duree" INTEGER NOT NULL DEFAULT 5,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TwoFactorSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'info',
    "userId" TEXT,
    "userRole" TEXT,
    "targetId" TEXT,
    "targetType" TEXT,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifConfig" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "categoriePermis" TEXT NOT NULL DEFAULT 'B',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "modifiePar" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TarifConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_numeroIdentite_key" ON "User"("numeroIdentite");

-- CreateIndex
CREATE UNIQUE INDEX "User_numeroUnique_key" ON "User"("numeroUnique");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_numeroUnique_idx" ON "User"("numeroUnique");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_actif_idx" ON "User"("actif");

-- CreateIndex
CREATE INDEX "Centre_region_idx" ON "Centre"("region");

-- CreateIndex
CREATE INDEX "Centre_ville_idx" ON "Centre"("ville");

-- CreateIndex
CREATE INDEX "Centre_actif_idx" ON "Centre"("actif");

-- CreateIndex
CREATE INDEX "Centre_accredStatut_idx" ON "Centre"("accredStatut");

-- CreateIndex
CREATE INDEX "Question_categorie_idx" ON "Question"("categorie");

-- CreateIndex
CREATE INDEX "Question_actif_idx" ON "Question"("actif");

-- CreateIndex
CREATE INDEX "Question_difficulte_idx" ON "Question"("difficulte");

-- CreateIndex
CREATE INDEX "ExamSession_candidatId_idx" ON "ExamSession"("candidatId");

-- CreateIndex
CREATE INDEX "ExamSession_centreId_idx" ON "ExamSession"("centreId");

-- CreateIndex
CREATE INDEX "ExamSession_statut_idx" ON "ExamSession"("statut");

-- CreateIndex
CREATE INDEX "ExamSession_date_idx" ON "ExamSession"("date");

-- CreateIndex
CREATE INDEX "Reponse_sessionId_idx" ON "Reponse"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reponse_sessionId_questionId_key" ON "Reponse"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "Booking_candidatId_idx" ON "Booking"("candidatId");

-- CreateIndex
CREATE INDEX "Booking_centreId_idx" ON "Booking"("centreId");

-- CreateIndex
CREATE INDEX "Booking_statutPaiement_idx" ON "Booking"("statutPaiement");

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "Booking"("date");

-- CreateIndex
CREATE INDEX "FraudAlert_status_idx" ON "FraudAlert"("status");

-- CreateIndex
CREATE INDEX "FraudAlert_severity_idx" ON "FraudAlert"("severity");

-- CreateIndex
CREATE INDEX "FraudAlert_candidatId_idx" ON "FraudAlert"("candidatId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_date_key" ON "DailyStat"("date");

-- CreateIndex
CREATE INDEX "DailyStat_date_idx" ON "DailyStat"("date");

-- CreateIndex
CREATE INDEX "DailyStat_centreId_idx" ON "DailyStat"("centreId");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "Course_categorie_idx" ON "Course"("categorie");

-- CreateIndex
CREATE INDEX "Lesson_courseId_idx" ON "Lesson"("courseId");

-- CreateIndex
CREATE INDEX "Lesson_ordre_idx" ON "Lesson"("ordre");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorSecret_userId_key" ON "TwoFactorSecret"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorSecret_userId_idx" ON "TwoFactorSecret"("userId");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_type_idx" ON "NotificationLog"("type");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TarifConfig_cle_key" ON "TarifConfig"("cle");

-- CreateIndex
CREATE INDEX "TarifConfig_cle_idx" ON "TarifConfig"("cle");

-- CreateIndex
CREATE INDEX "TarifConfig_categoriePermis_idx" ON "TarifConfig"("categoriePermis");

-- CreateIndex
CREATE INDEX "TarifConfig_actif_idx" ON "TarifConfig"("actif");

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reponse" ADD CONSTRAINT "Reponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reponse" ADD CONSTRAINT "Reponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

