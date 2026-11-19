const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('prakarsa123', 10);
  const users = [
    { name: 'Agus Susanto', email: 'agus@theprakarsa.com', role: 'staff' },
    { name: 'Ah Mafutchan', email: 'amafutchan@theprakarsa.com', role: 'staff' },
    { name: 'Ahmad Nabil Putra Priono', email: 'anabil@theprakarsa.com', role: 'staff' },
    { name: 'Ari Wibowo', email: 'awibowo@theprakarsa.com', role: 'staff' },
    { name: 'Azahra Rilies Nabila', email: 'anabila@theprakarsa.com', role: 'staff' },
    { name: 'Bambang Nurjaman', email: 'bambang@theprakarsa.com', role: 'staff' },
    { name: 'Bambang Nurjaman', email: 'bnurjaman@theprakarsa.com', role: 'staff' },
    { name: 'Barkan Dzikrullah', email: 'bdzikrullah@theprakarsa.com', role: 'Admin' },
    { name: 'Bintang Aulia Lutfi', email: 'blutfi@theprakarsa.com', role: 'staff' },
    { name: 'Corelax PRAKARSA', email: 'corelax@theprakarsa.com', role: 'staff' },
    { name: 'Daffa Tora Dewo Kusumo', email: 'dtora@theprakarsa.com', role: 'staff' },
    { name: 'Dea Fajria Tatarizza Japai', email: 'dfajria@theprakarsa.com', role: 'staff' },
    { name: 'Dwi Rahayu Ningrum', email: 'drahayu@theprakarsa.com', role: 'staff' },
    { name: 'Eka Afrina', email: 'eafrina@theprakarsa.com', role: 'staff' },
    { name: 'Emma Seruni Ketaren', email: 'eketaren@theprakarsa.com', role: 'staff' },
    { name: 'Erlin Setyowati', email: 'esetyowati@theprakarsa.com', role: 'staff' },
    { name: 'Hendrik Nixon Fernando', email: 'hfernando@theprakarsa.com', role: 'staff' },
    { name: 'Herni Ramdaningrum', email: 'hramdaningrum@theprakarsa.com', role: 'staff' },
    { name: 'Heryanah', email: 'heryanah@theprakarsa.com', role: 'staff' },
    { name: 'Jati Pramono', email: 'jpramono@theprakarsa.com', role: 'staff' },
    { name: 'Jim Toar Matuli', email: 'jim@theprakarsa.com', role: 'staff' },
    { name: 'Lia Mawarni Banjarnahor', email: 'lbanjarnahor@theprakarsa.com', role: 'staff' },
    { name: 'Muhammad Fari Sabila Rosyad', email: 'mfarkhan@theprakarsa.com', role: 'staff' },
    { name: 'Muhammad Pan Agung Saputro', email: 'mpandu@theprakarsa.com', role: 'staff' },
    { name: 'Noreply PRAKARSA', email: 'noreply@theprakarsa.com', role: 'staff' },
    { name: 'Pierre Bernando Ballo', email: 'pballo@theprakarsa.com', role: 'staff' },
    { name: 'Raisa Gischa Putri Shahira', email: 'raisag@theprakarsa.com', role: 'staff' },
    { name: 'Raka Adam', email: 'radam@theprakarsa.com', role: 'staff' },
    { name: 'Ricko Nurmansyah', email: 'rnurmansyah@theprakarsa.com', role: 'staff' },
    { name: 'Rizki Amanda', email: 'ramanda@theprakarsa.com', role: 'staff' },
    { name: 'Roby Rushandie', email: 'rrushandie@theprakarsa.com', role: 'staff' },
    { name: 'Rohmad Aditiya Utama', email: 'rutama@theprakarsa.com', role: 'staff' },
    { name: 'Roy Julifer Silaban', email: 'rsilaban@theprakarsa.com', role: 'staff' },
    { name: 'Samiaji Pratama', email: 'spratama@theprakarsa.com', role: 'staff' },
    { name: 'Sebaris Brin', email: 'sebarisbrin@theprakarsa.com', role: 'staff' },
    { name: 'Shofie Azzahrah', email: 'sazzahrah@theprakarsa.com', role: 'staff' },
    { name: 'The PRAKARSA', email: 'perkumpulan@theprakarsa.com', role: 'Superadmin' },
    { name: 'Ulifyanti Buchori', email: 'ubuchori@theprakarsa.com', role: 'staff' },
    { name: 'Victoria Fangggidae', email: 'vfanggidae@theprakarsa.com', role: 'staff' },
    { name: 'Widyadhana Paramita', email: 'wdpramita@theprakarsa.com', role: 'staff' },
    { name: 'Yuanda Pangi Harahap', email: 'yharahap@theprakarsa.com', role: 'staff' },
    { name: 'Zoom', email: 'zoom2@theprakarsa.com', role: 'staff' },
    { name: 'Ema Kurnia Anninisa', email: 'eanninisa@theprakarsa.com', role: 'staff' }
  ];

  for (let u of users) {
    let roleRecord = await prisma.role.findFirst({ where: { name: u.role } });
    if (!roleRecord) roleRecord = await prisma.role.create({ data: { name: u.role } });

    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: passwordHash, roleId: roleRecord.id }
    });
    console.log('✅ ' + u.email + ' (' + u.role + ')');
  }
  console.log('\n🎉 Semua User berhasil dibuat! Password: prakarsa123');
}
main().catch(console.error).finally(() => prisma.$disconnect());
