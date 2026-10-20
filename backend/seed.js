const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27020/ticketa';

async function seed() {
  console.log(`\n========================================`);
  console.log(`Seeding Ticketa on: ${DB_URI}`);
  console.log(`========================================`);

  await mongoose.connect(DB_URI);
  const db = mongoose.connection.db;

  const usersCol = db.collection('users');
  const eventsCol = db.collection('events');
  const reservationsCol = db.collection('reservations');

  const hashPassword = async (pass) => bcrypt.hash(pass, 10);

  // 1. Users
  console.log('Seeding Users...');
  const adminPassword = await hashPassword('Admin123456!');
  const participantPassword = await hashPassword('Password123456!');

  const usersData = [
    { username: 'Admin Ticketa', email: 'admin@ticketa.com', password: adminPassword, role: 'admin' },
    { username: 'Sarah Events', email: 'events.manager@ticketa.com', password: adminPassword, role: 'admin' },
    { username: 'Demo Participant', email: 'participant@ticketa.com', password: participantPassword, role: 'participant' },
    { username: 'Mehdi Alami', email: 'mehdi.alami@gmail.com', password: participantPassword, role: 'participant' },
    { username: 'Yasmine Tazi', email: 'yasmine.tazi@gmail.com', password: participantPassword, role: 'participant' },
    { username: 'Karim Benani', email: 'karim.benani@gmail.com', password: participantPassword, role: 'participant' },
    { username: 'Salma Chraibi', email: 'salma.chraibi@gmail.com', password: participantPassword, role: 'participant' },
  ];

  const userMap = {};
  for (const u of usersData) {
    const res = await usersCol.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          username: u.username,
          password: u.password,
          role: u.role,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );
    userMap[u.email] = res._id || (await usersCol.findOne({ email: u.email }))._id;
  }

  // 2. Events
  console.log('Seeding Events...');
  const adminId = userMap['admin@ticketa.com'];

  const now = new Date();
  const addDays = (d) => {
    const target = new Date(now);
    target.setDate(target.getDate() + d);
    return target;
  };

  const eventsData = [
    {
      title: 'North Africa Tech Summit 2026',
      description: 'The premier conference for emerging tech, AI engineering, cloud microservices, and tech startups in the MENA region.',
      location: 'Hyatt Regency, Casablanca',
      date: addDays(25),
      totalTickets: 250,
      availableTickets: 215,
      price: 250,
      status: 'published',
      createdBy: adminId,
    },
    {
      title: 'Casablanca Jazz & Soul Night',
      description: 'An open-air evening featuring international acoustic jazz quartets, neo-soul vocalists, and fusion ensembles.',
      location: 'Théâtre Mohammed VI, Casablanca',
      date: addDays(7),
      totalTickets: 120,
      availableTickets: 84,
      price: 150,
      status: 'published',
      createdBy: adminId,
    },
    {
      title: 'Modern Frontend & Design Systems Masterclass',
      description: 'Hands-on deep dive into building accessible design tokens, micro-frontends, Tailwind v4 styling, and Next.js 15 SSR.',
      location: 'Technopark Auditorium, Casablanca',
      date: addDays(14),
      totalTickets: 60,
      availableTickets: 22,
      price: 0,
      status: 'published',
      createdBy: adminId,
    },
    {
      title: 'Marrakech Palm Grove Half-Marathon',
      description: 'Annual 21K scenic athletic run through the historic Marrakech palm groves with timing chips and medals for finishers.',
      location: 'Palmerais Gate 3, Marrakech',
      date: addDays(40),
      totalTickets: 300,
      availableTickets: 260,
      price: 180,
      status: 'published',
      createdBy: adminId,
    },
    {
      title: 'National Esports League Championship',
      description: 'Grand finals featuring top competitive squads battling in Valorant, Rocket League, and EA FC 26 on the main stage.',
      location: 'Mohammed V Sports Arena, Casablanca',
      date: addDays(18),
      totalTickets: 450,
      availableTickets: 390,
      price: 80,
      status: 'published',
      createdBy: adminId,
    },
    {
      title: 'Future AI & Robotics Global Expo (Draft)',
      description: 'Next-generation industrial automation, humanoid robotics showcases, and academic AI keynotes.',
      location: 'Casablanca Finance City Tower',
      date: addDays(90),
      totalTickets: 150,
      availableTickets: 150,
      price: 350,
      status: 'draft',
      createdBy: adminId,
    },
  ];

  const eventMap = {};
  for (const ev of eventsData) {
    const res = await eventsCol.findOneAndUpdate(
      { title: ev.title },
      {
        $set: {
          description: ev.description,
          location: ev.location,
          date: ev.date,
          totalTickets: ev.totalTickets,
          availableTickets: ev.availableTickets,
          price: ev.price,
          status: ev.status,
          createdBy: ev.createdBy,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );
    eventMap[ev.title] = res._id || (await eventsCol.findOne({ title: ev.title }))._id;
  }

  // 3. Reservations
  console.log('Seeding Reservations...');
  const reservationsPlan = [
    { userEmail: 'participant@ticketa.com', eventTitle: 'North Africa Tech Summit 2026', status: 'confirmed' },
    { userEmail: 'participant@ticketa.com', eventTitle: 'Casablanca Jazz & Soul Night', status: 'confirmed' },
    { userEmail: 'participant@ticketa.com', eventTitle: 'Marrakech Palm Grove Half-Marathon', status: 'pending' },
    { userEmail: 'mehdi.alami@gmail.com', eventTitle: 'North Africa Tech Summit 2026', status: 'confirmed' },
    { userEmail: 'mehdi.alami@gmail.com', eventTitle: 'Modern Frontend & Design Systems Masterclass', status: 'confirmed' },
    { userEmail: 'yasmine.tazi@gmail.com', eventTitle: 'Casablanca Jazz & Soul Night', status: 'confirmed' },
    { userEmail: 'yasmine.tazi@gmail.com', eventTitle: 'National Esports League Championship', status: 'pending' },
    { userEmail: 'karim.benani@gmail.com', eventTitle: 'North Africa Tech Summit 2026', status: 'confirmed' },
    { userEmail: 'karim.benani@gmail.com', eventTitle: 'Marrakech Palm Grove Half-Marathon', status: 'confirmed' },
    { userEmail: 'salma.chraibi@gmail.com', eventTitle: 'Modern Frontend & Design Systems Masterclass', status: 'confirmed' },
    { userEmail: 'salma.chraibi@gmail.com', eventTitle: 'Casablanca Jazz & Soul Night', status: 'refused' },
  ];

  for (const r of reservationsPlan) {
    const userId = userMap[r.userEmail];
    const eventId = eventMap[r.eventTitle];

    await reservationsCol.findOneAndUpdate(
      { user: userId, event: eventId },
      {
        $set: {
          status: r.status,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }

  console.log('\n========================================');
  console.log(' ALL TICKETA DATA SEEDED SUCCESSFULLY!');
  console.log('========================================');
  console.log('Admin:       admin@ticketa.com       / Admin123456!');
  console.log('Manager:     events.manager@ticketa.com / Admin123456!');
  console.log('Participant: participant@ticketa.com / Password123456!');
  console.log('========================================\n');

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
