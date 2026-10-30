import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  // ==================== ROLES ====================
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  await prisma.role.upsert({
    where: { name: 'staff' },
    update: {},
    create: { name: 'staff' },
  });

  // ==================== ADMIN USER ====================
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@prakarsa.local' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@prakarsa.local',
      password,
      roleId: adminRole.id,
    },
  });

  // ==================== DIVISI (hanya 1: Umum) ====================
  await prisma.division.upsert({
    where: { code: 'UMM' },
    update: {},
    create: { name: 'Umum', code: 'UMM' },
  });

  // ==================== KATEGORI (8 klasifikasi) ====================
  const categories = [
    { name: 'Tanah', code: 'TAN' },
    { name: 'Bangunan', code: 'BAN' },
    { name: 'Kendaraan', code: 'KEN' },
    { name: 'Barang Elektronik', code: 'ELE' },
    { name: 'Furniture', code: 'FUR' },
    { name: 'Komputer', code: 'KOM' },
    { name: 'Audio Visual / Multimedia', code: 'MUL' },
    { name: 'Software', code: 'SOF' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // ==================== LOKASI DEFAULT ====================
  const locations = [
    { name: 'Ruang Direktur', building: 'Kantor', floor: '1' },
    { name: 'Ruang Meeting', building: 'Kantor', floor: '1' },
    { name: 'Ruang Finance', building: 'Kantor', floor: '1' },
    { name: 'Ruang Manager', building: 'Kantor', floor: '2' },
    { name: 'Ruang Staf', building: 'Kantor', floor: '2' },
    { name: 'Ruang Receptionist', building: 'Kantor', floor: '1' },
    { name: 'Ruang Perpustakaan', building: 'Kantor', floor: '1' },
    { name: 'Ruang Makan', building: 'Kantor', floor: '1' },
    { name: 'Ruang Tamu Lt 2', building: 'Kantor', floor: '2' },
    { name: 'Dapur', building: 'Kantor', floor: '1' },
  ];
  for (const l of locations) {
    await prisma.location.create({ data: l }).catch(() => {});
  }

  // ==================== EMPLOYEE DEFAULT ====================
  await prisma.employee.upsert({
    where: { nik: 'EMP001' },
    update: {},
    create: {
      nik: 'EMP001',
      name: 'Administrator',
      department: 'Umum',
      position: 'Administrator',
    },
  });

  console.log('✅ Seed selesai');
  console.log('   Admin: admin@prakarsa.local / admin123');
  console.log('   Divisi: Umum (UMM)');
  console.log('   Kategori: 8 (TAN, BAN, KEN, ELE, FUR, KOM, MUL, SOF)');
  console.log('   Lokasi: 10');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
