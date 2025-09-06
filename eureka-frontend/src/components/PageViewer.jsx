// Create PageViewer.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PageViewer.css";

const PageViewer = ({ documentId, documentName, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageContent, setPageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchTotalPages();
  }, []);

  useEffect(() => {
    fetchPageContent(currentPage);
  }, [currentPage]);

  const fetchTotalPages = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/document/${documentId}/pages`
      );
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error("Error fetching page count:", err);
      setError("Failed to load document information");
    }
  };

  const fetchPageContent = async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_BASE}/document/${documentId}/page/${pageNum}`
      );

      setPageContent(response.data.content);
    } catch (err) {
      console.error("Error fetching page:", err);
      setError(err.response?.data?.error || "Failed to load page content");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const goToPrevious = () => goToPage(currentPage - 1);
  const goToNext = () => goToPage(currentPage + 1);

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Error Loading Document</h3>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="error-message">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content page-viewer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            {documentName} - Page {currentPage}
          </h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="page-navigation">
          <button
            onClick={goToPrevious}
            disabled={currentPage <= 1}
            className="nav-btn"
          >
            ← Previous
          </button>

          <div className="page-info">
            <span>Page </span>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              min="1"
              max={totalPages}
              className="page-input"
            />
            <span> of {totalPages}</span>
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage >= totalPages}
            className="nav-btn"
          >
            Next →
          </button>
        </div>

        <div className="page-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading page {currentPage}...</p>
            </div>
          ) : (
            <div className="text-content">
              {pageContent ? (
                <pre>{pageContent}</pre>
              ) : (
                <p className="no-content">
                  No text content available on this page.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageViewer;
