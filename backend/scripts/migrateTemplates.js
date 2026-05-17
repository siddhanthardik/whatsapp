#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../src/models/Template');

async function migrateTemplates() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp_platform';
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  try {
    // We use the driver directly because Mongoose schema might prevent us from 
    // seeing `body` if it is defined as an object in the schema but stored as a string in DB.
    const collection = mongoose.connection.db.collection('templates');
    const legacyTemplates = await collection.find({ body: { $type: "string" } }).toArray();

    if (legacyTemplates.length === 0) {
      console.log('No legacy string-body templates found. DB is clean.');
    } else {
      console.log(`Found ${legacyTemplates.length} legacy templates to migrate.`);
      let updatedCount = 0;

      for (const t of legacyTemplates) {
        const bodyText = t.body;

        // Auto-detect dynamic variables list
        const detectedVars = [];
        const regexDetect = /\{\{(\d+)\}\}/g;
        let detectMatch;
        while ((detectMatch = regexDetect.exec(bodyText)) !== null) {
          const varNum = detectMatch[1];
          if (!detectedVars.includes(varNum)) {
            detectedVars.push(varNum);
          }
        }
        detectedVars.sort((a, b) => Number(a) - Number(b));

        const updatedBody = {
          text: bodyText,
          variables: detectedVars
        };

        await collection.updateOne(
          { _id: t._id },
          { $set: { body: updatedBody } }
        );
        updatedCount++;
        console.log(`Migrated template ID: ${t._id}`);
      }

      console.log(`Migration completed successfully. Updated ${updatedCount} templates.`);
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

migrateTemplates();
