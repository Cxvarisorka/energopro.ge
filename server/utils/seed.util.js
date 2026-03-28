const path = require('path');
const crypto = require('crypto');
const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const User = require('../models/user.model');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB'); // eslint-disable-line no-console

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email); // eslint-disable-line no-console
      process.exit(0);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@energopro.ge';
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'admin',
    });

    console.log('Admin user created:', admin.email); // eslint-disable-line no-console
    if (!process.env.ADMIN_PASSWORD) {
      console.log('Generated password:', adminPassword); // eslint-disable-line no-console
      console.log('IMPORTANT: Save this password now and set ADMIN_PASSWORD env var for future seeds.'); // eslint-disable-line no-console
    }
    console.log('IMPORTANT: Change this password after first login!'); // eslint-disable-line no-console
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message); // eslint-disable-line no-console
    process.exit(1);
  }
};

seedAdmin();
