// routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const pdfParse = require("pdf-parse");

const Document = require("../models/Document");
const { generateTagsFromFilename } = require("../utils/autoTagger");
const { extractTextFromFile } = require("../utils/textExtractor");

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName =
      Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only document files are allowed."),
        false
      );
    }
  },
});

// File upload
// routes/upload.js
// ... other code ...

// File upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Upload request received");
    
    if (!req.file) {
      console.log("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify file was actually saved to disk
    if (!fs.existsSync(req.file.path)) {
      console.log("File upload failed - file not saved to disk:", req.file.path);
      return res.status(500).json({ error: "File upload failed - could not save file" });
    }

    let extractedText = "";
    try {
      console.log("Attempting to extract text from file:", req.file.mimetype);
      extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
      console.log("Text extraction successful, length:", extractedText.length);
    } catch (extractError) {
      console.error("Text extraction failed:", extractError);
      extractedText = "";
    }

    const tags = generateTagsFromFilename(req.file.originalname);
    console.log("Generated tags:", tags);

    const newDoc = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      extractedText: extractedText.substring(0, 10000),
      tags: tags,
    });

    await newDoc.save();
    console.log("Document saved to database:", newDoc._id);
    
    res.status(201).json(newDoc);
  } catch (err) {
    console.error("Upload error:", err);
    
    // Clean up the uploaded file if something went wrong
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: "Failed to upload document",
      message: err.message 
    });
  }
});

// ... rest of the code ...

module.exports = router;