// components/SearchComponent.jsx
import React, { useState, useEffect } from "react";
import { documentAPI } from "../utils/api.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./SearchComponent.css";

const SearchComponent = ({ onDocumentSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load query from URL on mount
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q) {
      setQuery(q);
      handleSearch(null, q);
    }
  }, []);

  const handleSearch = async (e, prefilledQuery = null) => {
    if (e) e.preventDefault();
    const searchQuery = prefilledQuery !== null ? prefilledQuery : query.trim();
    if (!searchQuery) return;

    setSearching(true);
    setHasSearched(true);
    setError("");

    try {
      setSearchParams({ q: searchQuery });

      // Try the search endpoint
      const response = await documentAPI.search(searchQuery);
      setResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      
      // If search endpoint fails, try to get all documents and filter client-side
      if (error.response?.status === 404) {
        try {
          const allResponse = await documentAPI.getAll();
          const allDocuments = allResponse.data;
          
          // Simple client-side search
          const filteredResults = allDocuments.filter(doc => 
            doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.extractedText && doc.extractedText.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          
          setResults(filteredResults);
          setError("Using client-side search as server search is unavailable");
        } catch (fallbackError) {
          setError("Search failed. Please try again later.");
          console.error("Fallback search error:", fallbackError);
        }
      } else {
        setError("Search failed: " + (error.response?.data?.error || error.message));
      }
    } finally {
      setSearching(false);
    }
  };

  const highlightText = (text, query) => {
    if (!text || !query) return text;

    const terms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 2);
    
    let highlighted = text;
    terms.forEach((term) => {
      const regex = new RegExp(`(${term})`, "gi");
      highlighted = highlighted.replace(regex, "<mark>$1</mark>");
    });

    return { __html: highlighted };
  };

  const handleReset = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSearchParams({});
    setError("");
  };

  const handleDocumentClick = (document) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
    navigate(`/document/${document._id}`);
  };

  return (
    <div className="search-container">
      <h2>🔍 Search Documents</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all documents..."
          className="search-input"
        />
        <button type="submit" disabled={searching} className="search-button">
          {searching ? "Searching..." : "Search"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard?tab=upload")}
          className="reset-button"
        >
          🔙 Back to Upload
        </button>
      </form>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="search-results">
        {hasSearched && (
          <>
            <h3>Results ({results.length})</h3>
            {results.length === 0 ? (
              <div className="no-results">
                <p>No documents found for "{query}".</p>
                <p>
                  Try different keywords or check if documents have been uploaded.
                </p>
              </div>
            ) : (
              <ul className="results-list">
                {results.map((doc) => (
                  <li
                    key={doc._id}
                    className="result-item"
                    onClick={() => handleDocumentClick(doc)}
                    style={{ cursor: "pointer" }}
                  >
                    <h4>{doc.originalName}</h4>
                    <div className="document-meta">
                      <span>Size: {(doc.size / 1024).toFixed(2)} KB</span>
                      <span>Type: {doc.mimetype}</span>
                      <span>
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {doc.extractedText && (
                      <div
                        className="text-preview"
                        dangerouslySetInnerHTML={highlightText(
                          doc.extractedText.substring(0, 200) + "...",
                          query
                        )}
                      />
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="tags">
                        {doc.tags.map((tag, index) => (
                          <span key={index} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={`${API_BASE}/uploads/${doc.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-link"
                      onClick={(e) => e.stopPropagation()}
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