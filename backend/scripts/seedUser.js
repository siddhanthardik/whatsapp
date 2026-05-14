const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');

(async () => {
  try {
    const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp';
    await mongoose.connect(mongo, {});
    console.log('MongoDB connected');

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set in .env');
      process.exit(1);
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      console.log('User already exists:', existing.email);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password here and insert raw document to avoid potential pre-save hook issues
    const hashed = await bcrypt.hash(password, 10);
    const doc = {
      name: 'Seed Admin',
      email: String(email).toLowerCase(),
      password: hashed,
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await User.collection.insertOne(doc);

    console.log('Created super_admin user:', doc.email);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
