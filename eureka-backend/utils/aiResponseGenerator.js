// utils/aiResponseGenerator.js
const Document = require("../models/Document");

// Generate AI response based on query
const generateResponse = async (query, analysis, history = []) => {
  const { intent, parameters } = analysis;
  
  try {
    switch (intent) {
      case 'search':
        return await handleSearchQuery(query, parameters);
        
      case 'summarize':
        return await handleSummarizeQuery(query, parameters);
        
      case 'retrieve':
        return await handleRetrieveQuery(query, parameters);
        
      case 'count':
        return await handleCountQuery(query, parameters);
        
      case 'filetype':
        return await handleFiletypeQuery(query, parameters);
        
      default:
        return await handleGeneralQuery(query, parameters);
    }
  } catch (error) {
    console.error('Response generation error:', error);
    return "I encountered an error processing your request. Please try again or rephrase your question.";
  }
};

// Handle search queries
const handleSearchQuery = async (query, parameters) => {
  const searchTerms = parameters.document || query.replace(/\b(search|find|look for|show me|documents about|files about)\b/gi, '').trim();
  
  const searchResults = await Document.find({
    $or: [
      { originalName: { $regex: searchTerms, $options: 'i' } },
      { extractedText: { $regex: searchTerms, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerms, 'i')] } }
    ]
  }).limit(5);
  
  if (searchResults.length === 0) {
    return `I couldn't find any documents matching "${searchTerms}". Try different keywords or upload the document first.`;
  }
  
  let response = `I found ${searchResults.length} document(s) related to "${searchTerms}":\n\n`;
  searchResults.forEach((doc, index) => {
    response += `${index + 1}. **${doc.originalName}**\n`;
    response += `   - Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}\n`;
    response += `   - Type: ${doc.mimetype}\n`;
    response += `   - Size: ${(doc.size / (1024 * 1024)).toFixed(2)} MB\n`;
    if (doc.tags && doc.tags.length > 0) {
      response += `   - Tags: ${doc.tags.join(', ')}\n`;
    }
    response += `   - [View Document](/document/${doc._id})\n\n`;
  });
  
  return response;
};

// Handle count queries
const handleCountQuery = async (query, parameters) => {
  const totalCount = await Document.countDocuments();
  
  if (query.toLowerCase().includes('total') || query.toLowerCase().includes('how many')) {
    return `You have ${totalCount} documents in your library.`;
  }
  
  // Count by file type if specified
  if (parameters.filetype) {
    let mimePattern;
    switch(parameters.filetype.toLowerCase()) {
      case 'pdf':
        mimePattern = /pdf/;
        break;
      case 'word':
        mimePattern = /word/;
        break;
      case 'excel':
      case 'spreadsheet':
        mimePattern = /spreadsheet/;
        break;
      case 'powerpoint':
      case 'presentation':
        mimePattern = /presentation/;
        break;
      case 'image':
      case 'picture':
        mimePattern = /image/;
        break;
      default:
        mimePattern = new RegExp(parameters.filetype, 'i');
    }
    
    const typeCount = await Document.countDocuments({ 
      mimetype: { $regex: mimePattern } 
    });
    
    return `You have ${typeCount} ${parameters.filetype} files in your library.`;
  }
  
  // Count by size if specified
  if (parameters.sizeComparison && parameters.sizeValue && parameters.sizeUnit) {
    const sizeInBytes = parameters.sizeValue * 
      (parameters.sizeUnit === 'kb' ? 1024 : 
       parameters.sizeUnit === 'mb' ? 1024 * 1024 : 
       parameters.sizeUnit === 'gb' ? 1024 * 1024 * 1024 : 1);
    
    const comparisonOperator = parameters.sizeComparison === 'larger' || 
                              parameters.sizeComparison === 'bigger' || 
                              parameters.sizeComparison === 'greater' ? '$gt' : '$lt';
    
    const sizeCount = await Document.countDocuments({ 
      size: { [comparisonOperator]: sizeInBytes } 
    });
    
    return `You have ${sizeCount} files ${parameters.sizeComparison} than ${parameters.sizeValue}${parameters.sizeUnit}.`;
  }
  
  return `You have ${totalCount} documents in your library.`;
};

// Handle filetype queries
const handleFiletypeQuery = async (query, parameters) => {
  let mimePattern;
  switch(parameters.filetype.toLowerCase()) {
    case 'pdf':
      mimePattern = /pdf/;
      break;
    case 'word':
      mimePattern = /word/;
      break;
    case 'excel':
    case 'spreadsheet':
      mimePattern = /spreadsheet/;
      break;
    case 'powerpoint':
    case 'presentation':
      mimePattern = /presentation/;
      break;
    case 'image':
    case 'picture':
      mimePattern = /image/;
      break;
    default:
      mimePattern = new RegExp(parameters.filetype, 'i');
  }
  
  const files = await Document.find({ 
    mimetype: { $regex: mimePattern } 
  }).limit(10);
  
  if (files.length === 0) {
    return `I couldn't find any ${parameters.filetype} files in your library.`;
  }
  
  let response = `I found ${files.length} ${parameters.filetype} files:\n\n`;
  files.forEach((file, index) => {
    response += `${index + 1}. **${file.originalName}**\n`;
    response += `   - Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}\n`;
    response += `   - Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB\n`;
    response += `   - [View Document](/document/${file._id})\n\n`;
  });
  
  return response;
};

// Handle summarize queries
const handleSummarizeQuery = async (query, parameters) => {
  // Implementation remains similar to your existing code
  const docToSummarize = await Document.findOne({
    $or: [
      { originalName: { $regex: parameters.document || query, $options: 'i' } },
      { extractedText: { $regex: parameters.document || query, $options: 'i' } }
    ]
  });
  
  if (!docToSummarize) {
    return "I couldn't find a document to summarize. Please specify which document you'd like me to summarize.";
  }
  
  if (!docToSummarize.extractedText) {
    return `The document "${docToSummarize.originalName}" doesn't have extractable text content.`;
  }
  
  const text = docToSummarize.extractedText;
  const summary = generateSummary(text);
  
  return `Here's a summary of **${docToSummarize.originalName}**:\n\n${summary}\n\n[View full document](/document/${docToSummarize._id})`;
};

// Handle retrieve queries
const handleRetrieveQuery = async (query, parameters) => {
  // Implementation remains similar to your existing code
  const retrievedDoc = await Document.findOne({
    $or: [
      { originalName: { $regex: parameters.document || query, $options: 'i' } },
      { extractedText: { $regex: parameters.document || query, $options: 'i' } }
    ]
  });
  
  if (!retrievedDoc) {
    return "I couldn't find that document. Please check the name or upload it first.";
  }
  
  return `I found the document **${retrievedDoc.originalName}**. You can [view it here](/document/${retrievedDoc._id}) or ask me to summarize it.`;
};

// Handle general queries
const handleGeneralQuery = async (query, parameters) => {
  // For general queries, try to find any relevant documents
  const searchTerms = query.replace(/\b(what|who|when|where|why|how|is|are|can|do)\b/gi, '').trim();
  
  if (searchTerms.length > 3) {
    const searchResults = await Document.find({
      $or: [
        { originalName: { $regex: searchTerms, $options: 'i' } },
        { extractedText: { $regex: searchTerms, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerms, 'i')] } }
      ]
    }).limit(3);
    
    if (searchResults.length > 0) {
      let response = `I found ${searchResults.length} document(s) that might answer your question:\n\n`;
      searchResults.forEach((doc, index) => {
        response += `${index + 1}. **${doc.originalName}**\n`;
        response += `   - [View Document](/document/${doc._id})\n\n`;
      });
      return response;
    }
  }
  
  // Default response if no documents found
  return "I'm your AI librarian assistant! I can help you:\n\n- Search for documents 📄\n- Summarize content 📝\n- Retrieve specific files 🔍\n- Answer questions about your documents 💬\n\nTry asking me something like:\n- \"How many documents do I have?\"\n- \"Find my annual report\"\n- \"Show me Excel files\"\n- \"Summarize the research paper\"\n- \"Show me documents about healthcare\"";
};

// Simple text summarization function (unchanged)
const generateSummary = (text, maxLength = 500) => {
  if (!text || text.length === 0) {
    return "No text available for summarization.";
  }

  let summary = "";
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    if (summary.length + sentence.length > maxLength) {
      break;
    }
    summary += sentence + ". ";
  }

  return summary.trim() || text.substring(0, maxLength) + "...";
};

module.exports = { generateResponse, generateSummary };