// routes/documents.js
const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const { generateSummary } = require("../utils/aiResponseGenerator");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const fs = require("fs");

// Get all files
router.get("/files", async (req, res) => {
  try {
    const files = await Document.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Get single document by ID
router.get("/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    
    res.json(document);
  } catch (err) {
    console.error("Error fetching document:", err);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// Delete a document
router.delete("/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete the file from disk
    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }

    // Remove from MongoDB
    await Document.findByIdAndDelete(id);

    res.json({ message: "Document deleted successfully", id });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Search documents
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const documents = await Document.find({
      $text: { $search: q }
    }).sort({ uploadedAt: -1 });

    res.json(documents);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Advanced search
router.get("/search/advanced", async (req, res) => {
  try {
    const { q, year, programArea, donor } = req.query;

    const query = {};

    // Text search
    if (q && q.trim() !== "") {
      query.$text = { $search: q };
    }

    // Tags search (year + programArea)
    const tagFilters = [];
    if (year) tagFilters.push(`year-${year}`);
    if (programArea) tagFilters.push(programArea.toLowerCase());
    if (tagFilters.length > 0) {
      query.tags = { $all: tagFilters };
    }

    // Donor search
    if (donor) {
      const donorRegex = new RegExp(donor, "i");
      query.$or = [{ originalName: donorRegex }, { tags: donorRegex }];
    }

    const documents = await Document.find(query).sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (err) {
    console.error("Advanced search error:", err);
    res.status(500).json({ error: "Advanced search failed" });
  }
});

// Document summary
router.get("/document/:id/summary", async (req, res) => {
  try {
    const { id } = req.params;
    const { length } = req.query;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!document.extractedText || document.extractedText.trim() === "") {
      return res.status(400).json({
        error: "No text content available for this document",
        suggestion: "Re-upload the document to extract text",
      });
    }

    const maxLength = length ? parseInt(length) : 500;
    const summary = generateSummary(document.extractedText, maxLength);

    res.json({
      success: true,
      document: {
        id: document._id,
        filename: document.originalName,
        uploadDate: document.uploadedAt,
        fileType: document.mimetype,
      },
      summary: summary,
      statistics: {
        originalLength: document.extractedText.length,
        summaryLength: summary.length,
        compressionRatio: Math.round(
          (summary.length / document.extractedText.length) * 100
        ),
      },
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      message: error.message,
    });
  }
});

// Get total pages of a PDF
router.get("/document/:id/pages", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (doc.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Not a PDF document" });
    }

    const data = new Uint8Array(fs.readFileSync(doc.path));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    res.json({ totalPages: pdf.numPages });
  } catch (err) {
    console.error("Error fetching total pages:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get text content of a specific page
router.get("/document/:id/page/:pageNumber", async (req, res) => {
  try {
    const { id, pageNumber } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (doc.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Not a PDF document" });
    }

    const data = new Uint8Array(fs.readFileSync(doc.path));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(parseInt(pageNumber));
    const content = await page.getTextContent();

    const pageText = content.items.map((item) => item.str).join(" ");
    res.json({ content: pageText });
  } catch (err) {
    console.error("Error fetching page:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get total pages of a PDF
router.get("/document/:id/pages", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (doc.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Not a PDF document" });
    }

    // Check if file exists before trying to read it
    if (!fs.existsSync(doc.path)) {
      return res.status(404).json({ 
        error: "File not found on server",
        message: "The uploaded file appears to have been deleted or moved"
      });
    }

    const data = new Uint8Array(fs.readFileSync(doc.path));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    res.json({ totalPages: pdf.numPages });
  } catch (err) {
    console.error("Error fetching total pages:", err);
    
    if (err.code === 'ENOENT') {
      return res.status(404).json({ 
        error: "File not found",
        message: "The requested document file does not exist on the server"
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Get text content of a specific page
router.get("/document/:id/page/:pageNumber", async (req, res) => {
  try {
    const { id, pageNumber } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (doc.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Not a PDF document" });
    }

    // Check if file exists before trying to read it
    if (!fs.existsSync(doc.path)) {
      return res.status(404).json({ 
        error: "File not found on server",
        message: "The uploaded file appears to have been deleted or moved"
      });
    }

    const data = new Uint8Array(fs.readFileSync(doc.path));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(parseInt(pageNumber));
    const content = await page.getTextContent();

    const pageText = content.items.map((item) => item.str).join(" ");
    res.json({ content: pageText });
  } catch (err) {
    console.error("Error fetching page:", err);
    
    if (err.code === 'ENOENT') {
      return res.status(404).json({ 
        error: "File not found",
        message: "The requested document file does not exist on the server"
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// ... rest of the code ...

module.exports = router;