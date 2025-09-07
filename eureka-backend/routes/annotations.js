const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// Add annotation to a document page
router.post('/:id/annotations', async (req, res) => {
  try {
    const { text, note, position, color, tags, pageNumber } = req.body;
    const doc = await Document.findById(req.params.id);
    
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const annotation = { 
      text, 
      note: note || '', 
      position, 
      color: color || '#ffeb3b', 
      tags: tags || [] 
    };

    // Use the schema method to add annotation
    await doc.addAnnotation(pageNumber, annotation);
    
    res.status(201).json(annotation);
  } catch (err) {
    console.error('Annotation error:', err);
    res.status(500).json({ error: 'Failed to add annotation' });
  }
});

// Get annotations for a specific page
router.get('/:id/annotations', async (req, res) => {
  try {
    const { page } = req.query;
    const pageNumber = parseInt(page) || 1;
    
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Use the schema method to get annotations
    const annotations = doc.getAnnotations(pageNumber);
    
    res.json(annotations);
  } catch (err) {
    console.error('Fetch annotations error:', err);
    res.status(500).json({ error: 'Failed to fetch annotations' });
  }
});

// Get all annotations for a document
router.get('/:id/annotations/all', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Collect annotations from all pages
    const allAnnotations = doc.pages.flatMap(page => 
      page.annotations.map(ann => ({
        ...ann.toObject(),
        pageNumber: page.pageNumber
      }))
    );
    
    res.json(allAnnotations);
  } catch (err) {
    console.error('Fetch all annotations error:', err);
    res.status(500).json({ error: 'Failed to fetch annotations' });
  }
});

// Delete an annotation
router.delete('/:id/annotations/:annotationId', async (req, res) => {
  try {
    const { id, annotationId } = req.params;
    
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Find and remove the annotation from any page
    for (let page of doc.pages) {
      const annotationIndex = page.annotations.findIndex(
        ann => ann._id.toString() === annotationId
      );
      
      if (annotationIndex !== -1) {
        page.annotations.splice(annotationIndex, 1);
        await doc.save();
        return res.json({ message: 'Annotation deleted successfully' });
      }
    }
    
    res.status(404).json({ error: 'Annotation not found' });
  } catch (err) {
    console.error('Delete annotation error:', err);
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});

module.exports = router;