const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDatabase = require('../src/config/database');
const User = require('../src/models/User');

const demoUsers = [
  {
    fullName: 'Demo Customer',
    email: 'customer@example.com',
    password: '123456',
    role: 'customer',
  },
  {
    fullName: 'Demo Admin',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
  },
];

async function seedUsers() {
  await connectDatabase();

  for (const user of demoUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await User.updateOne(
      { email: user.email },
      {
        $set: {
          fullName: user.fullName,
          email: user.email,
          password: hashedPassword,
          role: user.role,
        },
      },
      { upsert: true }
    );
  }

  console.log('Demo users seeded:');
  for (const user of demoUsers) {
    console.log(`- ${user.role}: ${user.email} / ${user.password}`);
  }
}

seedUsers()
  .catch((error) => {
    console.error('Failed to seed demo users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
