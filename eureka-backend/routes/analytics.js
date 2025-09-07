// routes/analytics.js
const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// Get analytics trends
router.get('/trends', async (req, res) => {
  try {
    // Get popular tags
    const popularTags = await Document.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get yearly stats
    const yearlyStats = await Document.aggregate([
      {
        $addFields: {
          yearTag: {
            $arrayElemAt: [
              { $filter: {
                input: "$tags",
                as: "tag",
                cond: { $regexMatch: { input: "$$tag", regex: /^year-/ } }
              }},
              0
            ]
          }
        }
      },
      { $group: { 
        _id: "$yearTag", 
        count: { $sum: 1 } 
      }},
      { $sort: { _id: 1 } }
    ]);

    // Get common keywords from extracted text
    const commonKeywords = await Document.aggregate([
      { $match: { extractedText: { $exists: true, $ne: "" } } },
      { $project: { words: { $split: ["$extractedText", " "] } } },
      { $unwind: "$words" },
      { $match: { words: { $regex: /^[a-zA-Z]{4,}$/ } } },
      { $group: { _id: { $toLower: "$words" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      popularTags,
      yearlyStats,
      commonKeywords
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    });
  }
});

// Get timeline data
router.get('/timeline', async (req, res) => {
  try {
    const timelineData = await Document.aggregate([
      {
        $addFields: {
          year: {
            $year: "$uploadedAt"
          },
          month: {
            $month: "$uploadedAt"
          }
        }
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month"
          },
          count: { $sum: 1 },
          totalSize: { $sum: "$size" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json(timelineData);
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch timeline data',
      details: error.message 
    });
  }
});

module.exports = router;