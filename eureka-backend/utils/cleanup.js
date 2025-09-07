// utils/cleanup.js (create this file)
const mongoose = require('mongoose');
const fs = require('fs');
const Document = require('../models/Document');

const cleanupOrphanedDocuments = async () => {
  try {
    console.log('Starting cleanup of orphaned documents...');
    
    const documents = await Document.find();
    let cleanedCount = 0;
    
    for (const doc of documents) {
      if (!fs.existsSync(doc.path)) {
        console.log(`Removing orphaned document: ${doc.originalName}`);
        await Document.findByIdAndDelete(doc._id);
        cleanedCount++;
      }
    }
    
    console.log(`Cleanup completed. Removed ${cleanedCount} orphaned documents.`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup if this script is called directly
if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGO_URI)
    .then(() => cleanupOrphanedDocuments())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { cleanupOrphanedDocuments };