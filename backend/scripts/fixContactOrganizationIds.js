const mongoose = require('mongoose');
require('dotenv').config();

const Contact = require('../src/models/Contact');
const ContactGroup = require('../src/models/ContactGroup');
const Organization = require('../src/models/Organization');

function normalizePhone(phone) {
  if (!phone) return null;
  let s = String(phone).trim();
  let cleaned = s.replace(/[^\d+]/g, '');
  if (/^\d{7,15}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  if (!/^\+\d{7,15}$/.test(cleaned)) return null;
  return cleaned;
}

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is missing from env!');
      process.exit(1);
    }
    
    await mongoose.connect(uri, {});
    console.log('MongoDB connected successfully');

    // 1. Resolve destination organization (Demo Enterprise)
    const targetOrgId = '6a099f864dd753840796ebbd';
    let targetOrg = await Organization.findById(targetOrgId);
    if (!targetOrg) {
      targetOrg = await Organization.findOne({ name: /Enterprise/i });
    }
    if (!targetOrg) {
      targetOrg = await Organization.findOne();
    }
    if (!targetOrg) {
      console.log('No organization found. Creating default enterprise organization...');
      targetOrg = new Organization({
        name: 'Demo Enterprise',
        timezone: 'Asia/Kolkata',
      });
      await targetOrg.save();
    }

    const destOrgId = targetOrg._id;
    console.log(`Targeting migration to Organization: ${targetOrg.name} (${destOrgId})`);

    // 2. Migrate and normalize Contact Groups
    const groups = await ContactGroup.find({});
    console.log(`Found ${groups.length} total contact groups in DB`);
    let groupsUpdatedCount = 0;
    for (const g of groups) {
      if (String(g.organizationId) !== String(destOrgId)) {
        // Check for duplicate group name in target org
        const duplicateGroup = await ContactGroup.findOne({
          organizationId: destOrgId,
          name: { $regex: new RegExp(`^${g.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          _id: { $ne: g._id }
        });
        
        if (duplicateGroup) {
          console.log(`Group "${g.name}" already exists in target org. Re-mapping contacts from legacy group ${g._id} to existing group ${duplicateGroup._id}`);
          // Move contacts inside this group to the existing group
          await Contact.updateMany(
            { groupIds: g._id },
            { $addToSet: { groupIds: duplicateGroup._id }, $pull: { groupIds: g._id } }
          );
          // Delete legacy group
          await ContactGroup.findByIdAndDelete(g._id);
        } else {
          g.organizationId = destOrgId;
          await g.save();
          groupsUpdatedCount++;
        }
      }
    }
    console.log(`Successfully migrated ${groupsUpdatedCount} contact groups`);

    // 3. Migrate, normalize, and deduplicate Contacts
    const contacts = await Contact.find({});
    console.log(`Found ${contacts.length} total contacts in DB`);
    
    let contactsMigrated = 0;
    let contactsMerged = 0;
    let invalidContactsRemoved = 0;

    for (const c of contacts) {
      const phoneNorm = normalizePhone(c.phoneNumber);
      if (!phoneNorm) {
        console.log(`Removing invalid phone/orphaned contact: ${c.name || 'Unknown'} (${c.phoneNumber})`);
        await Contact.findByIdAndDelete(c._id);
        invalidContactsRemoved++;
        continue;
      }

      // Normalize phone number in-place
      c.phoneNumber = phoneNorm;

      // Check if this contact needs organization re-scoping
      if (String(c.organizationId) !== String(destOrgId)) {
        // Look up if a contact with this same phone number already exists in target org
        const existingInTarget = await Contact.findOne({
          organizationId: destOrgId,
          phoneNumber: phoneNorm,
          _id: { $ne: c._id }
        });

        if (existingInTarget) {
          console.log(`Phone ${phoneNorm} exists in target org. Merging tags and groups from contact ${c._id} into existing contact ${existingInTarget._id}`);
          // Merge tags and groupIds
          const mergedTags = Array.from(new Set([...(existingInTarget.tags || []), ...(c.tags || [])]));
          const mergedGroups = Array.from(new Set([
            ...(existingInTarget.groupIds || []).map(id => id.toString()),
            ...(c.groupIds || []).map(id => id.toString())
          ])).map(id => new mongoose.Types.ObjectId(id));

          existingInTarget.tags = mergedTags;
          existingInTarget.groupIds = mergedGroups;
          if (!existingInTarget.name && c.name) existingInTarget.name = c.name;
          if (!existingInTarget.email && c.email) existingInTarget.email = c.email;

          await existingInTarget.save();
          
          // Delete duplicate legacy contact
          await Contact.findByIdAndDelete(c._id);
          contactsMerged++;
        } else {
          // No duplicate exists, safely update the organization scope
          c.organizationId = destOrgId;
          await c.save();
          contactsMigrated++;
        }
      } else {
        // Just save to apply phone format normalization if needed
        await c.save();
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Contact groups migrated/updated: ${groupsUpdatedCount}`);
    console.log(`Contacts migrated: ${contactsMigrated}`);
    console.log(`Contacts merged into existing target: ${contactsMerged}`);
    console.log(`Invalid contacts removed: ${invalidContactsRemoved}`);
    console.log('-------------------------\n');

    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
