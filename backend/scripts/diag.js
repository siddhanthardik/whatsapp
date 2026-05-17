const mongoose = require('mongoose');
require('dotenv').config();

const ContactGroup = require('../src/models/ContactGroup');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log('MongoDB connected');

    const totalGroups = await ContactGroup.countDocuments();
    console.log('Total contact groups in DB:', totalGroups);

    const groups = await ContactGroup.find({}).lean();
    console.log('Groups in DB:', JSON.stringify(groups, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Diagnosis failed:', err);
    process.exit(1);
  }
})();
