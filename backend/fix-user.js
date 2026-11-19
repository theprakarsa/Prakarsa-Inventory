const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'agus@theprakarsa.com';
  const newPassword = '12345678';
  
  console.log(`Sedang mengatur ulang password untuk: ${email}...`);
  
  // Hash password baru
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Cari role staff
  let role = await prisma.role.findFirst({ where: { name: 'staff' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'staff' } });
  }

  // Update atau Buat user
  const user = await prisma.user.upsert({
    where: { email: email },
    update: {
      password: passwordHash,
    },
    create: {
      name: 'Agus Susanto',
      email: email,
      password: passwordHash,
      roleId: role.id,
    },
  });

  console.log(`✅ SUKSES! Password untuk ${user.email} sekarang adalah: ${newPassword}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
