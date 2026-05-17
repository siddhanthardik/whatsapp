const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

(async () => {
  try {
    const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp';
    await mongoose.connect(mongo, {});
    console.log('MongoDB connected for user roles migration...');

    // 1. Upgrade primary administrator
    const primaryEmail = 'siddhanthardik@gmail.com';
    const primaryUser = await User.findOne({ email: primaryEmail });
    if (primaryUser) {
      primaryUser.role = 'super_admin';
      await primaryUser.save();
      console.log(`Successfully migrated primary user ${primaryEmail} to role: super_admin`);
    } else {
      console.log(`Primary user ${primaryEmail} not found, skipping.`);
    }

    // 2. Identify all organization creators/owners
    const orgs = await Organization.find({});
    const ownerIds = orgs.map(o => o.ownerId ? o.ownerId.toString() : null).filter(Boolean);
    console.log(`Found ${ownerIds.length} active organizations to assign owners.`);

    let ownersAssigned = 0;
    for (const ownerId of ownerIds) {
      const ownerUser = await User.findById(ownerId);
      if (ownerUser && ownerUser.email !== primaryEmail) {
        ownerUser.role = 'owner';
        await ownerUser.save();
        ownersAssigned++;
      }
    }
    console.log(`Assigned role: owner to ${ownersAssigned} organization creators.`);

    // 3. Migrate all other users to default role: agent
    const otherUsers = await User.find({
      email: { $ne: primaryEmail },
      _id: { $nin: ownerIds }
    });

    let agentsAssigned = 0;
    for (const u of otherUsers) {
      if (u.role !== 'agent') {
        u.role = 'agent';
        await u.save();
        agentsAssigned++;
      }
    }
    console.log(`Migrated ${agentsAssigned} other users to role: agent (default).`);

    console.log('User roles migration completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
