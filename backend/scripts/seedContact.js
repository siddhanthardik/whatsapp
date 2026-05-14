const mongoose = require('mongoose');
require('dotenv').config();

const Contact = require('../src/models/Contact');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp', {
      // keep defaults
    });
    console.log('MongoDB connected');

    const sample = {
      name: 'Test Contact',
      phoneNumber: '+15551234567',
      organizationId: null,
      // Leave lists empty or provide valid ContactList ObjectIds if available
      lists: [],
      // Use allowed enum values from the Contact model
      optInStatus: 'opted_in',
      optInSource: 'api',
      optInTimestamp: new Date(),
      // contact model doesn't have metadata; use customFields for extra data
      customFields: { seededAt: new Date().toISOString() },
    };

    const existing = await Contact.findOne({ phoneNumber: sample.phoneNumber });
    if (existing) {
      console.log('Contact already exists:', existing._id.toString());
    } else {
      const c = new Contact(sample);
      await c.save();
      console.log('Inserted contact:', c._id.toString());
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
