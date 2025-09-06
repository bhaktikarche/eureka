// models/Document.js - UPDATED
const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  extractedText: { type: String, default: "" },
  tags: [{ type: String }]
});

// Create text index - UPDATED SYNTAX
DocumentSchema.index({
  filename: 'text',
  originalName: 'text', 
  extractedText: 'text',
  tags: 'text'
});

module.exports = mongoose.model("Document", DocumentSchema);