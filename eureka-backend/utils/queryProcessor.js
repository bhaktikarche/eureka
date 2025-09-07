// utils/queryProcessor.js
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

const processQuery = async (query) => {
  const tokens = tokenizer.tokenize(query.toLowerCase());
  
  // Enhanced intent detection with better patterns
  const intents = {
    search: ['find', 'search', 'look for', 'where is', 'locate', 'show me', 'documents about', 'files about'],
    summarize: ['summarize', 'summary', 'brief', 'overview', 'sum up', 'tl;dr'],
    retrieve: ['get', 'retrieve', 'open', 'view', 'show', 'see'],
    count: ['how many', 'count', 'total', 'number of'],
    filetype: ['pdf', 'word', 'excel', 'spreadsheet', 'powerpoint', 'presentation', 'image', 'picture'],
    page: ['page', 'pg', 'on page', 'at page'],
    tag: ['tag', 'category', 'categorize', 'organize', 'group']
  };
  
  let detectedIntent = 'general';
  let detectedParams = {};
  
  // Check for specific intents with better pattern matching
  if (/\b(how many|count|total|number of)\b/.test(query.toLowerCase())) {
    detectedIntent = 'count';
  } else if (/\b(pdf|word|excel|spreadsheet|powerpoint|presentation|image|picture)\b/.test(query.toLowerCase())) {
    detectedIntent = 'filetype';
    detectedParams.filetype = query.match(/\b(pdf|word|excel|spreadsheet|powerpoint|presentation|image|picture)\b/i)[0];
  } else {
    // Check other intents
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
        detectedIntent = intent;
        break;
      }
    }
  }
  
  // Extract document names or specific references with improved regex
  const documentPattern = /(?:document|file|pdf|report|paper)\s+(?:called|named|titled)?\s*["'«»“”]([^"',.!?]+)["'«»“”]|(?:find|show|get)\s+([^.!?]+?)(?:document|file|pdf)/i;
  const documentMatch = query.match(documentPattern);
  if (documentMatch) {
    detectedParams.document = (documentMatch[1] || documentMatch[2]).trim();
  }
  
  // Extract page numbers
  const pagePattern = /(?:page|pg\.?)\s+(\d+)/i;
  const pageMatch = query.match(pagePattern);
  if (pageMatch) {
    detectedParams.page = parseInt(pageMatch[1]);
  }
  
  // Extract size queries
  const sizePattern = /(larger|bigger|greater|smaller)\s+than\s+(\d+)\s*(mb|kb|gb)/i;
  const sizeMatch = query.match(sizePattern);
  if (sizeMatch) {
    detectedParams.sizeComparison = sizeMatch[1];
    detectedParams.sizeValue = parseInt(sizeMatch[2]);
    detectedParams.sizeUnit = sizeMatch[3];
  }
  
  return {
    intent: detectedIntent,
    parameters: detectedParams,
    originalQuery: query
  };
};

module.exports = { processQuery };