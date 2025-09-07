// components/AdvancedSearch.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { documentAPI, analyticsAPI } from "../utils/api";
import "./AdvancedSearch.css";

const AdvancedSearch = ({ onDocumentSelect }) => {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [donorFilter, setDonorFilter] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load search from URL on mount
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const year = searchParams.get("year") || "";
    const program = searchParams.get("programArea") || "";
    const donor = searchParams.get("donor") || "";

    setQuery(q);
    setYearFilter(year);
    setProgramFilter(program);
    setDonorFilter(donor);

    if (q || year || program || donor) {
      handleAdvancedSearch(null, { q, year, programArea: program, donor });
    }
    // eslint-disable-next-line
  }, []);

  // Advanced search handler
  const handleAdvancedSearch = async (e, prefilledParams = null) => {
    if (e) e.preventDefault();
    setSearching(true);
    setError("");

    try {
      const params = prefilledParams || {
        q: query,
        year: yearFilter,
        programArea: programFilter,
        donor: donorFilter,
      };

      // Update URL query params
      setSearchParams(
        Object.fromEntries(Object.entries(params).filter(([k, v]) => v !== ""))
      );

      // Try advanced search first
      try {
        const response = await documentAPI.advancedSearch(params);
        setResults(response.data);
      } catch (searchError) {
        console.error("Advanced search error:", searchError);
        
        // Fallback to client-side filtering if advanced search fails
        if (searchError.response?.status === 404) {
          const allResponse = await documentAPI.getAll();
          const allDocuments = allResponse.data;
          
          // Client-side filtering
          const filteredResults = allDocuments.filter(doc => {
            const matchesQuery = !params.q || 
              doc.originalName.toLowerCase().includes(params.q.toLowerCase()) ||
              (doc.extractedText && doc.extractedText.toLowerCase().includes(params.q.toLowerCase()));
            
            const matchesYear = !params.year || 
              (doc.uploadedAt && new Date(doc.uploadedAt).getFullYear().toString() === params.year);
            
            // For programArea and donor, we'll check tags or other metadata
            const matchesProgram = !params.programArea || 
              (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(params.programArea.toLowerCase())));
            
            const matchesDonor = !params.donor || 
              (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(params.donor.toLowerCase())));
            
            return matchesQuery && matchesYear && matchesProgram && matchesDonor;
          });
          
          setResults(filteredResults);
          setError("Using client-side filtering as advanced search is unavailable");
        } else {
          throw searchError;
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed: " + (error.response?.data?.error || error.message));
    } finally {
      setSearching(false);
    }
  };

  // Load analytics/trends
  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.getTrends();
      setAnalytics(response.data);
      setShowAnalytics(true);
    } catch (error) {
      console.error("Analytics error:", error);
      setError("Failed to load analytics: " + (error.response?.data?.error || error.message));
    }
  };

  // Highlight search terms in text - FIXED: Return object with __html property
  const highlightText = (text, query) => {
    if (!text || !query) return { __html: text || '' };

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

  // Reset / Go Back
  const handleReset = () => {
    setQuery("");
    setYearFilter("");
    setProgramFilter("");
    setDonorFilter("");
    setResults([]);
    setSearchParams({});
    setError("");
    navigate("/search");
  };

  const handleDocumentClick = (document) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
    navigate(`/document/${document._id}`);
  };

  return (
    <div className="advanced-search-container">
      <h2>🔍 Advanced Search & Analytics</h2>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="search-controls">
        <button onClick={loadAnalytics} className="analytics-btn">
          📊 Show Trends & Analytics
        </button>
        <button onClick={() => navigate("/dashboard")} className="nav-button">
          📂 Dashboard
        </button>
      </div>

      <form onSubmit={handleAdvancedSearch} className="advanced-search-form">
        <div className="search-fields">
          <div className="field-group">
            <label>Keywords Search:</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all document content..."
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <div className="field-group">
              <label>Year:</label>
              <input
                type="number"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                placeholder="2023"
                min="2000"
                max={new Date().getFullYear()}
                className="filter-input"
              />
            </div>

            <div className="field-group">
              <label>Program Area:</label>
              <input
                type="text"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                placeholder="education, health, etc."
                className="filter-input"
              />
            </div>

            <div className="field-group">
              <label>Donor/Organization:</label>
              <input
                type="text"
                value={donorFilter}
                onChange={(e) => setDonorFilter(e.target.value)}
                placeholder="Ford Foundation, NIH, etc."
                className="filter-input"
              />
            </div>
          </div>
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={searching} className="search-button">
            {searching ? "Searching..." : "Advanced Search"}
          </button>
          <button type="button" onClick={handleReset} className="reset-button">
            🔙 Reset / Go Back
          </button>
        </div>
      </form>

      {showAnalytics && analytics && (
        <div className="analytics-panel">
          <h3>📈 Document Analytics & Trends</h3>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Popular Program Areas</h4>
              <ul>
                {analytics.popularTags?.slice(0, 5).map((tag, index) => (
                  <li key={index}>
                    <span className="tag-name">{tag._id}</span>
                    <span className="tag-count">({tag.count} documents)</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="analytics-card">
              <h4>Yearly Distribution</h4>
              <ul>
                {analytics.yearlyStats?.map((year, index) => (
                  <li key={index}>
                    <span className="year">
                      {year._id?.replace("year-", "")}
                    </span>
                    <span className="year-count">({year.count} files)</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="analytics-card">
              <h4>Common Keywords</h4>
              <div className="keywords-cloud">
                {analytics.commonKeywords?.slice(0, 10).map((word, index) => (
                  <span
                    key={index}
                    className="keyword"
                    style={{ fontSize: `${10 + word.count / 2}px` }}
                  >
                    {word._id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="search-results">
        <h3>Search Results ({results.length})</h3>
        {results.length === 0 ? (
          <div className="no-results">
            <p>No documents found matching your criteria.</p>
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
      </div>
    </div>
  );
};

export default AdvancedSearch;