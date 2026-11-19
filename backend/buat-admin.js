const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // 1. Buat Role ADMIN dulu
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  // 2. Buat User dan hubungkan ke Role
  const passwordHash = await bcrypt.hash('Barkah123@@', 10);
  
  const newUser = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'perkumpulan@theprakarsa.org',
      password: passwordHash,
      roleId: roleAdmin.id,
    },
  });

  console.log('✅ User & Role berhasil dibuat:', newUser.email);
}

main()
  .catch((e) => {
    console.error('❌ Gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
