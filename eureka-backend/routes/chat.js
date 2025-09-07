// routes/chat.js
const express = require('express');
const router = express.Router();
const { processQuery } = require('../utils/queryProcessor');
const { generateResponse } = require('../utils/aiResponseGenerator');

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Process the query to understand user intent
    const queryAnalysis = await processQuery(message);
    
    // Generate appropriate response based on query type
    const response = await generateResponse(message, queryAnalysis, history);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process your request',
      details: error.message 
    });
  }
});

module.exports = router;