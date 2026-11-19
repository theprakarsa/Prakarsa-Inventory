import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.update({
    where: { email: 'admin@prakarsa.local' },
    data: { password: hash, isActive: true },
  });
  console.log('✅ Password admin berhasil direset ke: admin123');
  console.log('   Email:', admin.email);
}

main().finally(() => prisma.$disconnect());
