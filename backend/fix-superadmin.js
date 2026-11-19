const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'perkumpulan@theprakarsa.org';
  const newPassword = 'prakarsa123';
  
  console.log(`Mengatur password untuk: ${email}...`);
  
  const passwordHash = await bcrypt.hash(newPassword, 10);

  let role = await prisma.role.findFirst({ where: { name: 'Superadmin' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'Superadmin' } });
  }

  const user = await prisma.user.upsert({
    where: { email: email },
    update: {
      password: passwordHash,
    },
    create: {
      name: 'The PRAKARSA (Superadmin)',
      email: email,
      password: passwordHash,
      roleId: role.id,
    },
  });

  console.log(`✅ SUKSES! Login dengan ${user.email} dan password: ${newPassword}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
