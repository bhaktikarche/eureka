// eureka-backend/server.js (FINAL VERSION)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const pdfParse = require("pdf-parse");

const Document = require("./models/Document");

const app = express();
app.use(
  cors({
    origin: "https://your-frontend-url.netlify.app", // Replace with deployed frontend URL
    credentials: true,
  })
);

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Ensure text index is created
mongoose.connection.once("open", async () => {
  console.log("✅ MongoDB Connected");

  try {
    await mongoose.model("Document").createIndexes();
    console.log("✅ Text search indexes created");
  } catch (err) {
    console.log("ℹ️ Text indexes may already exist:", err.message);
  }
});

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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

// Text extraction using XPDF pdftotext
// REPLACE your current extractTextFromFile function with this debug version
const extractTextFromFile = async (filePath, mimetype) => {
  try {
    if (mimetype === "application/pdf") {
      console.log("Processing PDF file with pdf-parse...");
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      console.log(`pdf-parse extracted ${data.text.length} characters`);
      return data.text;
    } else if (mimetype === "text/plain") {
      return fs.readFileSync(filePath, "utf8");
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      console.log("DOCX extraction not implemented yet");
      return "";
    } else if (mimetype === "application/msword") {
      console.log("DOC extraction not implemented yet");
      return "";
    } else if (mimetype === "application/rtf") {
      const content = fs.readFileSync(filePath, "utf8");
      return content
        .replace(/\\[a-z]+\*?\d*(\s|$)/g, " ")
        .replace(/\{[^}]*\}/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } else {
      console.log(`Text extraction not supported for file type: ${mimetype}`);
      return "";
    }
  } catch (error) {
    console.warn("Text extraction failed:", error.message);
    return "";
  }
};

// Helper function to generate tags from filename
function generateTagsFromFilename(filename) {
  const tags = [];
  const currentYear = new Date().getFullYear();

  const yearMatch = filename.match(/(20\d{2})/);
  if (yearMatch) {
    tags.push(`year-${yearMatch[1]}`);
  } else {
    tags.push(`year-${currentYear}`);
  }

  const programKeywords = [
    "education",
    "health",
    "research",
    "policy",
    "grant",
    "report",
  ];
  programKeywords.forEach((keyword) => {
    if (filename.toLowerCase().includes(keyword)) {
      tags.push(keyword);
    }
  });

  return tags;
}

// Routes
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const extractedText = await extractTextFromFile(
      req.file.path,
      req.file.mimetype
    );
    const tags = generateTagsFromFilename(req.file.originalname);

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
    res.status(201).json(newDoc);
  } catch (err) {
    console.error("Upload error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});

app.get("/files", async (req, res) => {
  try {
    const files = await Document.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Delete a document and its file
app.delete("/files/:id", async (req, res) => {
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

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    uploadsDir: uploadsDir,
    uploadsDirExists: fs.existsSync(uploadsDir),
  });
});

app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const documents = await Document.find({
      extractedText: { $regex: q, $options: "i" }, // case-insensitive regex search
    }).sort({ uploadedAt: -1 });

    res.json(documents);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/files/by-tag/:tag", async (req, res) => {
  try {
    const { tag } = req.params;
    const documents = await Document.find({ tags: tag }).sort({
      uploadedAt: -1,
    });
    res.json(documents);
  } catch (err) {
    console.error("Filter error:", err);
    res.status(500).json({ error: "Filter failed" });
  }
});

// Advanced search with analytics
app.get("/search/advanced", async (req, res) => {
  try {
    const { q, year, programArea, donor } = req.query;

    let query = {};

    if (q && q.trim() !== "") {
      query.extractedText = { $regex: q, $options: "i" };
    }

    if (year) {
      query.tags = { $in: [`year-${year}`] };
    }

    if (programArea) {
      query.tags = query.tags || {};
      query.tags.$in = query.tags.$in || [];
      query.tags.$in.push(programArea.toLowerCase());
    }

    if (donor) {
      query.$or = [
        { originalName: new RegExp(donor, "i") },
        { tags: donor.toLowerCase() },
      ];
    }

    const documents = await Document.find(query).sort({ uploadedAt: -1 });

    res.json(documents);
  } catch (err) {
    console.error("Advanced search error:", err);
    res.status(500).json({ error: "Advanced search failed" });
  }
});

// Get search analytics and trends
app.get("/analytics/trends", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const tagStats = await Document.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: { $not: /^year-/ } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
    ]);

    const yearStats = await Document.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: /^year-/ } },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const commonWords = await Document.aggregate([
      { $match: { extractedText: { $ne: "" } } },
      { $project: { words: { $split: ["$extractedText", " "] } } },
      { $unwind: "$words" },
      {
        $match: {
          words: {
            $not: /^[0-9]+$/,
            $regex: /^[a-z]{4,}$/i,
          },
        },
      },
      {
        $group: {
          _id: { $toLower: "$words" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      popularTags: tagStats,
      yearlyStats: yearStats,
      commonKeywords: commonWords,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
});

// Get documents by year for timeline view
app.get("/analytics/timeline", async (req, res) => {
  try {
    const timelineData = await Document.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: /^year-/ } },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
          documents: {
            $push: {
              id: "$_id",
              name: "$originalName",
              type: "$mimetype",
              size: "$size",
              uploadedAt: "$uploadedAt",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json(timelineData);
  } catch (err) {
    console.error("Timeline error:", err);
    res.status(500).json({ error: "Failed to generate timeline" });
  }
});

// Add this debug endpoint to server.js (before the PORT declaration)
app.get("/debug/document/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      filename: document.filename,
      originalName: document.originalName,
      extractedTextLength: document.extractedText?.length || 0,
      extractedTextPreview:
        document.extractedText?.substring(0, 200) || "No text",
      tags: document.tags,
      hasTextIndex: !!document.extractedText,
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: "Debug failed" });
  }
});

// Add this debug endpoint to check text extraction
app.get("/debug/extraction/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check if file exists
    const fileExists = fs.existsSync(document.path);

    res.json({
      filename: document.filename,
      originalName: document.originalName,
      mimetype: document.mimetype,
      fileExists: fileExists,
      extractedTextLength: document.extractedText?.length || 0,
      extractedTextPreview:
        document.extractedText?.substring(0, 500) || "No text extracted",
      tags: document.tags,
      uploadDate: document.uploadedAt,
    });
  } catch (err) {
    console.error("Extraction debug error:", err);
    res.status(500).json({ error: "Extraction debug failed" });
  }
});

// Add this endpoint to check index status
app.get("/debug/indexes", async (req, res) => {
  try {
    const indexes = await Document.collection.getIndexes();
    res.json({
      indexes: indexes,
      textIndexes: Object.values(indexes).filter(
        (index) => index.key && Object.values(index.key).includes("text")
      ),
    });
  } catch (err) {
    console.error("Index debug error:", err);
    res.status(500).json({ error: "Index check failed" });
  }
});

// Add this test endpoint
app.get("/debug/search-test", async (req, res) => {
  try {
    // Test with a simple search that should work
    const testDocuments = await Document.find(
      { $text: { $search: "test" } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5);

    // Also try to find any document with text
    const anyDocument = await Document.findOne({ extractedText: { $ne: "" } });

    res.json({
      testSearchResults: testDocuments.length,
      anyDocumentWithText: !!anyDocument,
      sampleDocument: anyDocument
        ? {
            id: anyDocument._id,
            name: anyDocument.originalName,
            textLength: anyDocument.extractedText.length,
          }
        : null,
    });
  } catch (err) {
    console.error("Search test error:", err);
    res.status(500).json({ error: "Search test failed: " + err.message });
  }
});

// Add this debug endpoint to see what's happening with search
app.get("/debug/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({
        error: "Please provide a search query with ?q=your_query",
      });
    }

    console.log(`\n=== Search Debug for: "${q}" ===`);

    // 1. Check if any documents have text
    const totalDocs = await Document.countDocuments();
    const docsWithText = await Document.countDocuments({
      extractedText: { $exists: true, $ne: "" },
    });

    console.log(`Total documents: ${totalDocs}`);
    console.log(`Documents with extracted text: ${docsWithText}`);

    // 2. Check what MongoDB is actually doing with the search
    let searchResults;
    try {
      searchResults = await Document.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } });

      console.log(`Search found: ${searchResults.length} documents`);
    } catch (searchError) {
      console.log(`Search error: ${searchError.message}`);
      searchResults = [];
    }

    // 3. Manual text search as fallback
    const manualResults = await Document.find({
      $or: [
        { originalName: new RegExp(q, "i") },
        { filename: new RegExp(q, "i") },
        { extractedText: new RegExp(q, "i") },
      ],
    });

    console.log(`Manual search found: ${manualResults.length} documents`);

    // 4. Check if the specific text exists anywhere
    const textExists = await Document.findOne({
      extractedText: new RegExp("Types of Artificial Neural Network", "i"),
    });

    res.json({
      query: q,
      textIndexStatus: {
        totalDocuments: totalDocs,
        documentsWithText: docsWithText,
        hasTextIndex: true, // Assuming it exists
      },
      searchResults: {
        textSearchCount: searchResults.length,
        textSearchDocuments: searchResults.map((doc) => ({
          id: doc._id,
          name: doc.originalName,
          score: doc._doc.score,
        })),
      },
      manualSearchResults: {
        count: manualResults.length,
        documents: manualResults.map((doc) => ({
          id: doc._id,
          name: doc.originalName,
          hasText: !!doc.extractedText && doc.extractedText.length > 0,
        })),
      },
      specificTextExists: !!textExists,
      debugAdvice:
        docsWithText === 0
          ? "No documents have extracted text. Check PDF text extraction."
          : "Documents have text but search may not be working properly.",
    });
  } catch (err) {
    console.error("Search debug error:", err);
    res.status(500).json({ error: "Search debug failed" });
  }
});

app.get("/test-pdftotext", async (req, res) => {
  try {
    // Test if pdftotext is accessible from Node.js
    const { stdout, stderr } = await execPromise("pdftotext -v");

    res.json({
      success: true,
      version: stdout,
      error: stderr,
      path: process.env.PATH,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      path: process.env.PATH,
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
