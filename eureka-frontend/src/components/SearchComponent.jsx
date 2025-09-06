// components/SearchComponent.jsx
import React, { useState } from "react";
import axios from "axios";
import "./SearchComponent.css";
import API from "../api";


const SearchComponent = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const response = await axios.get(`https://eureka-8173.onrender.com/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      if (error.response?.data?.error?.includes('text index')) {
        alert("Search index is still being created. Please wait a moment and try again.");
      } else {
        alert("Search failed: " + (error.response?.data?.error || error.message));
      }
    } finally {
      setSearching(false);
    }
  };

  const highlightText = (text, query) => {
    if (!text || !query) return text;
    
    const terms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    let highlighted = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return { __html: highlighted };
  };

  return (
    <div className="search-container">
      <h2>🔍 Search Documents</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all documents (try keywords from your documents)..."
          className="search-input"
        />
        <button type="submit" disabled={searching} className="search-button">
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="search-results">
        {hasSearched && (
          <>
            <h3>Results ({results.length})</h3>
            {results.length === 0 ? (
              <div className="no-results">
                <p>No documents found for "{query}".</p>
                <p>Try different keywords or check if documents have been uploaded.</p>
              </div>
            ) : (
              <ul className="results-list">
                {results.map((doc) => (
                  <li key={doc._id} className="result-item">
                    <h4>{doc.originalName}</h4>
                    <div className="document-meta">
                      <span>Size: {(doc.size / 1024).toFixed(2)} KB</span>
                      <span>Type: {doc.mimetype}</span>
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    
                    {doc.extractedText && (
                      <div 
                        className="text-preview"
                        dangerouslySetInnerHTML={highlightText(
                          doc.extractedText.substring(0, 200) + '...', 
                          query
                        )}
                      />
                    )}
                    
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="tags">
                        {doc.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    <a 
                      href={`https://eureka-8173.onrender.com/${doc.filename}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-link"
                    >
                      📄 View Full Document
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchComponent;