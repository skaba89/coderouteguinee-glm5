import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const exams = await prisma.examSession.count();
  const questions = await prisma.question.count();
  const courses = await prisma.course.count();
  const lessons = await prisma.lesson.count();
  const bookings = await prisma.booking.count();
  const centres = await prisma.centre.count();
  const autoEcoles = 0; // Auto-ecole: pas de modèle séparé (rôle sur User)

  const mediaStats = await prisma.question.groupBy({
    by: ['categorie'],
    _count: true,
  });

  const withAudio = await prisma.question.count({ where: { audioFr: { not: null } } });
  const withVideo = await prisma.question.count({ where: { videoUrl: { not: null } } });
  const withSign = await prisma.question.count({ where: { signImage: { not: null } } });
  const withScenario = await prisma.question.count({ where: { scenarioImage: { not: null } } });
  const withAnyMedia = await prisma.question.count({
    where: {
      OR: [
        { videoUrl: { not: null } },
        { signImage: { not: null } },
        { scenarioImage: { not: null } },
      ],
    },
  });

  const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: true });

  console.log('=== DB STATS ===');
  console.log(`Users: ${users}`);
  console.log(`  by role:`, usersByRole.map(r => `${r.role}=${r._count}`).join(', '));
  console.log(`Exams: ${exams}`);
  console.log(`Questions: ${questions} (média: ${withAnyMedia}, vidéo: ${withVideo}, sign: ${withSign}, scenario: ${withScenario}, audioFr: ${withAudio})`);
  console.log(`Courses: ${courses}, Lessons: ${lessons}`);
  console.log(`Bookings: ${bookings}`);
  console.log(`Centres: ${centres}, Auto-écoles: ${autoEcoles}`);
  console.log(`By category:`, mediaStats.map(c => `${c.category}=${c._count}`).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
