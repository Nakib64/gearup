import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from './shared/prisma.service.js';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gearup.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = 'Platform Administrator';

  console.log('--- Database Seeding Initialized ---');

  // 1. Seed Admin User
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (existingAdmin) {
    console.log(`Admin account already exists: ${existingAdmin.email}`);
  } else {
    // Double check if the email is taken
    const emailTaken = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (emailTaken) {
      console.error(`Error: The email '${adminEmail}' is already registered with another role.`);
      process.exit(1);
    }

    console.log('Hashing admin password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    console.log('Creating admin record...');
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`Admin user created: ${admin.email}`);
  }

  // 2. Seed Default Categories
  console.log('\nSeeding categories...');
  const categories = [
    { name: 'Camping & Hiking', description: 'Tents, sleeping bags, backpacks, and outdoor survival gear.' },
    { name: 'Cycling', description: 'Mountain bikes, road bikes, helmets, and cycling accessories.' },
    { name: 'Water Sports', description: 'Kayaks, paddleboards, surfboards, life jackets, and snorkels.' },
    { name: 'Winter Sports', description: 'Skis, snowboards, boots, goggles, and winter apparel.' },
    { name: 'Fitness & Gym', description: 'Dumbbells, barbells, yoga mats, resistance bands, and home gym gear.' },
    { name: 'Climbing', description: 'Harnesses, climbing shoes, ropes, carabiners, and helmets.' }
  ];

  let seededCategoriesCount = 0;
  for (const cat of categories) {
    const exists = await prisma.category.findUnique({
      where: { name: cat.name },
    });

    if (!exists) {
      await prisma.category.create({
        data: cat,
      });
      seededCategoriesCount++;
      console.log(`- Seeded: ${cat.name}`);
    }
  }

  console.log(`\n--- Seeding Completed Successfully! ---`);
  console.log(`Admin Email    : ${adminEmail}`);
  console.log(`Admin Password : ${adminPassword}`);
  console.log(`Categories     : Seeded ${seededCategoriesCount} new categories.`);
}

main()
  .catch((error) => {
    console.error('Seeding process encountered an error:', error);
    process.exit(1);
  });
