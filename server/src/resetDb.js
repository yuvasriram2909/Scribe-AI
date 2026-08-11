import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDb() {
  console.log('Clearing all dummy seed data from database...');

  // Delete dependent tables first
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.email.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.userSignature.deleteMany();
  await prisma.gmailAccount.deleteMany();
  await prisma.user.deleteMany();

  // Create clean user with empty profile signature
  const cleanUser = await prisma.user.create({
    data: {
      name: '',
      email: 'user@example.com',
      signature: {
        create: {
          name: '',
          designation: '',
          company: '',
          phone: '',
          website: '',
          preferredTone: 'Professional',
          enabled: true
        }
      }
    }
  });

  console.log('Database reset complete! Clean user initialized:', cleanUser.id);
}

resetDb()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
