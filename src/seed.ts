import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from './shared/prisma.service.js';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gearup.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = 'Platform Administrator';

  console.log('--- Database Seeding Initialized ---');
  console.log(`Target Admin Email: ${adminEmail}`);

  // 1. Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (existingAdmin) {
    console.log(`An admin account already exists in the database: ${existingAdmin.email}`);
    console.log('Skipping admin seeding to prevent duplicates.');
    return;
  }

  // Double check if the specific email is taken
  const emailTaken = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (emailTaken) {
    console.error(`Error: The email '${adminEmail}' is already registered with another role.`);
    process.exit(1);
  }

  // 2. Hash password
  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 3. Create admin user
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

  console.log('\n--- Seeding Completed Successfully! ---');
  console.log(`Admin Email    : ${admin.email}`);
  console.log(`Admin Password : ${adminPassword}`);
  console.log('Use these credentials to test admin restricted APIs.');
}

main()
  .catch((error) => {
    console.error('Seeding process encountered an error:', error);
    process.exit(1);
  });
