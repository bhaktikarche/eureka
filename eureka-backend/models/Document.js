// models/Document.js
const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  text: { type: String, required: true },
  note: String,
  position: {
    startIndex: Number,
    endIndex: Number,
    page: Number
  },
  color: { type: String, default: '#ffeb3b' },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const pageSchema = new mongoose.Schema({
  pageNumber: { type: Number, required: true },
  content: { type: String, default: '' },
  annotations: [annotationSchema]
});

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  extractedText: { type: String, default: '' },
  pages: [pageSchema],
  tags: [{ type: String }],
  uploadedAt: { type: Date, default: Date.now }
});

// Text index for search
documentSchema.index({
  filename: 'text',
  originalName: 'text',
  extractedText: 'text',
  tags: 'text'
});

// Method to add annotation to a specific page
documentSchema.methods.addAnnotation = function(pageNumber, annotationData) {
  let page = this.pages.find(p => p.pageNumber === pageNumber);
  
  if (!page) {
    // Create page if it doesn't exist
    page = { pageNumber, content: this.extractedText, annotations: [] };
    this.pages.push(page);
  }
  
  page.annotations.push(annotationData);
  return this.save();
};

// Method to get annotations for a specific page
documentSchema.methods.getAnnotations = function(pageNumber) {
  const page = this.pages.find(p => p.pageNumber === pageNumber);
  return page ? page.annotations : [];
};

module.exports = mongoose.model('Document', documentSchema);