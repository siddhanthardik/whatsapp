const mongoose = require('mongoose');
require('dotenv').config();

const Contact = require('../src/models/Contact');
const Organization = require('../src/models/Organization');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp', {});
    console.log('MongoDB connected');

    let org = await Organization.findOne();
    if (!org) {
      // Try to pick a sensible name from any existing user
      const User = require('../src/models/User');
      const u = await User.findOne().lean();
      const name = (u && u.name) ? `${u.name}'s Organization` : 'Default Organization';
      org = new Organization({ name, email: (u && u.email) || null, createdBy: (u && u._id) || null });
      await org.save();
      console.log('No Organization found — created new Organization:', org._id);
    }

    const res = await Contact.updateMany({ organizationId: null }, { $set: { organizationId: org._id } });
    const updated = (res && (res.modifiedCount || res.nModified || res.modified)) || 0;

    console.log(`Updated ${updated} contacts with organizationId: ${org._id}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fix orphaned contacts failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
