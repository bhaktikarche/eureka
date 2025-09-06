// components/AdvancedSearch.jsx
import React, { useState } from "react";
import axios from "axios";
import "./AdvancedSearch.css";

const AdvancedSearch = () => {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [donorFilter, setDonorFilter] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleAdvancedSearch = async (e) => {
    e.preventDefault();
    setSearching(true);

    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (yearFilter) params.append("year", yearFilter);
      if (programFilter) params.append("programArea", programFilter);
      if (donorFilter) params.append("donor", donorFilter);

      const response = await axios.get(
        `http://localhost:5000/search/advanced?${params}`
      );
      setResults(response.data);
    } catch (error) {
      console.error("Advanced search error:", error);
      alert("Search failed: " + (error.response?.data?.error || error.message));
    } finally {
      setSearching(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/analytics/trends"
      );
      setAnalytics(response.data);
      setShowAnalytics(true);
    } catch (error) {
      console.error("Analytics error:", error);
      alert(
        "Failed to load analytics: " +
          (error.response?.data?.error || error.message)
      );
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

  return (
    <div className="advanced-search-container">
      <h2>🔍 Advanced Search & Analytics</h2>

      <div className="search-controls">
        <button onClick={loadAnalytics} className="analytics-btn">
          📊 Show Trends & Analytics
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

        <button type="submit" disabled={searching} className="search-button">
          {searching ? "Searching..." : "Advanced Search"}
        </button>
      </form>

      {showAnalytics && analytics && (
        <div className="analytics-panel">
          <h3>📈 Document Analytics & Trends</h3>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Popular Program Areas</h4>
              <ul>
                {analytics.popularTags.slice(0, 5).map((tag, index) => (
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
                {analytics.yearlyStats.map((year, index) => (
                  <li key={index}>
                    <span className="year">
                      {year._id.replace("year-", "")}
                    </span>
                    <span className="year-count">({year.count} files)</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="analytics-card">
              <h4>Common Keywords</h4>
              <div className="keywords-cloud">
                {analytics.commonKeywords.slice(0, 10).map((word, index) => (
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
              <li key={doc._id} className="result-item">
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
                  href={`http://localhost:5000/uploads/${doc.filename}`}
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
      </div>
    </div>
  );
};

export default AdvancedSearch;
