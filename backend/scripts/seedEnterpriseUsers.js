const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Organization = require('../src/models/Organization');
const Subscription = require('../src/models/Subscription');

const DEFAULT_PASSWORD = 'Admin@123';

const usersToSeed = [
  { name: 'Super Admin', email: 'siddhanthardik@gmail.com', role: 'super_admin' },
  { name: 'Demo Owner', email: 'owner@demo.com', role: 'owner' },
  { name: 'Demo Admin', email: 'admin@demo.com', role: 'admin' },
  { name: 'Demo Manager', email: 'manager@demo.com', role: 'manager' },
  { name: 'Demo Agent', email: 'agent@demo.com', role: 'agent' },
  { name: 'Demo Viewer', email: 'viewer@demo.com', role: 'viewer' }
];

(async () => {
  try {
    const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp';
    await mongoose.connect(mongo, {});
    console.log('MongoDB connected for seeding enterprise users...');

    // 1. Ensure "Demo Enterprise" organization exists
    let org = await Organization.findOne({ name: 'Demo Enterprise' });
    if (!org) {
      org = new Organization({
        name: 'Demo Enterprise',
        email: 'billing@demo.com',
        website: 'https://demo.enterprise',
        timezone: 'UTC',
        language: 'en'
      });
      await org.save();
      console.log('Created organization: Demo Enterprise');
    }

    // 2. Hash default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 3. Seed users
    for (const u of usersToSeed) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = new User({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          organizationId: org._id,
          isActive: true
        });
        await user.save();
        console.log(`Seeded new user: ${u.email} (${u.role})`);
      } else {
        // Upgrade role/pass and associate with organization
        user.role = u.role;
        user.password = hashedPassword;
        user.organizationId = org._id;
        user.isActive = true;
        await user.save();
        console.log(`Updated existing user details: ${u.email} (${u.role})`);
      }

      // If this is the owner, make sure they are set as the ownerId in the organization record
      if (u.role === 'owner') {
        org.ownerId = user._id;
        await org.save();
        console.log(`Assigned ownerId of Demo Enterprise to ${u.email}`);
      }
    }

    // 4. Ensure an Enterprise subscription exists for Demo Enterprise
    let sub = await Subscription.findOne({ organizationId: org._id });
    if (!sub) {
      sub = new Subscription({
        organizationId: org._id,
        plan: 'enterprise',
        status: 'active',
        billingCycle: 'monthly',
        maxContacts: 100000,
        maxCampaignsPerMonth: 500,
        maxUsers: 50,
        maxTemplates: 200,
        maxMessagesPerMonth: 1000000,
        currentContacts: 1240, // some nice mocked real counts for the gauges
        currentCampaignsThisMonth: 12,
        currentUsers: 6,
        currentMessagesThisMonth: 452000
      });
      await sub.save();
      console.log('Created Enterprise subscription for Demo Enterprise');
    } else {
      // Ensure it has nice full enterprise limits
      sub.plan = 'enterprise';
      sub.status = 'active';
      sub.maxContacts = 100000;
      sub.maxMessagesPerMonth = 1000000;
      await sub.save();
      console.log('Verified Enterprise subscription limits');
    }

    console.log('Enterprise seeding completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
