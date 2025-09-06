// components/SummaryComponent.jsx
import React, { useState } from "react";
import axios from "axios";
import "./SummaryComponent.css";

const SummaryComponent = ({ documentId, documentName, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    length: 500,
    type: "intro",
    includeStats: true,
  });

  const API_BASE = import.meta.env.VITE_API_URL;

  const generateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_BASE}/document/${documentId}/summary/advanced`,
        { params: options }
      );
      setSummary(response.data);
    } catch (err) {
      console.error("Summary generation error:", err);
      setError(err.response?.data?.error || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="summary-modal-overlay" onClick={onClose}>
      <div
        className="summary-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="summary-modal-header">
          <h3>📋 Generate Summary</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="summary-modal-body">
          <div className="document-info">
            <h4>{documentName}</h4>
          </div>

          <div className="summary-options">
            <h5>Summary Options</h5>
            <div className="option-group">
              <label>
                Summary Length:
                <input
                  type="number"
                  value={options.length}
                  onChange={(e) =>
                    handleOptionChange("length", parseInt(e.target.value))
                  }
                  min="100"
                  max="2000"
                />
              </label>
            </div>

            <div className="option-group">
              <label>
                Summary Type:
                <select
                  value={options.type}
                  onChange={(e) => handleOptionChange("type", e.target.value)}
                >
                  <option value="intro">Introduction</option>
                  <option value="keypoints">Key Points</option>
                  <option value="overview">Overview</option>
                </select>
              </label>
            </div>

            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.includeStats}
                  onChange={(e) =>
                    handleOptionChange("includeStats", e.target.checked)
                  }
                />
                Include Statistics
              </label>
            </div>
          </div>

          <button
            onClick={generateSummary}
            disabled={loading}
            className="generate-summary-btn"
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>

          {error && <div className="error-message">❌ {error}</div>}

          {summary && (
            <div className="summary-result">
              <h5>Generated Summary</h5>
              {summary.statistics && (
                <div className="summary-stats">
                  <p>
                    <strong>Original:</strong>{" "}
                    {summary.statistics.originalLength} characters
                  </p>
                  <p>
                    <strong>Summary:</strong> {summary.statistics.summaryLength}{" "}
                    characters
                  </p>
                  <p>
                    <strong>Compression:</strong>{" "}
                    {summary.statistics.compressionRatio}%
                  </p>
                </div>
              )}
              <div className="summary-text">
                <p>{summary.summary}</p>
              </div>
              <div className="summary-actions">
                <button
                  onClick={() => navigator.clipboard.writeText(summary.summary)}
                  className="copy-btn"
                >
                  📋 Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryComponent;
