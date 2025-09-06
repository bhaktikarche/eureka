// Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import SummaryComponent from "./SummaryComponent";
import DocumentCard from "./DocumentCard";
import PageViewer from "./PageViewer";
import "./Dashboard.css";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [advancedSummaryDoc, setAdvancedSummaryDoc] = useState(null);
  const [pageViewerDoc, setPageViewerDoc] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL;

  // Fetch uploaded files
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/files`);
      setFiles(res.data);
    } catch (err) {
      console.error("Error fetching files:", err);
      toast.error("Error fetching files");
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/analytics/trends`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Analytics error:", error);
      toast.error("Failed to load analytics");
    }
  };

  useEffect(() => {
    fetchFiles();
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab]);

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      document.getElementById("fileInput").value = "";
      toast.success("File uploaded successfully!");
      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(
        "Upload failed: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please upload a document file (PDF, DOC, DOCX, TXT, RTF)");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    toast.success(`Selected: ${selectedFile.name}`);
  };

  // Basic summary
  const handleGetSummary = async (docId, docName) => {
    try {
      setSummaryData({ loading: true, document: { filename: docName } });
      const response = await axios.get(`${API_BASE}/document/${docId}/summary`);
      setSummaryData(response.data);
    } catch (error) {
      console.error("Summary error:", error);
      toast.error("Failed to generate summary");
      setSummaryData(null);
    }
  };

  // Advanced summary (open SummaryComponent modal)
  const handleOpenAdvancedSummary = (docId, docName) => {
    setAdvancedSummaryDoc({ documentId: docId, documentName: docName });
  };

  // Delete file handler
  const handleDeleteFile = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      await axios.delete(`${API_BASE}/files/${docId}`);
      toast.success("Document deleted successfully!");
      fetchFiles(); // Refresh the file list

      // Close modals if the deleted doc is open
      if (summaryData?.document?._id === docId) setSummaryData(null);
      if (advancedSummaryDoc?.documentId === docId) setAdvancedSummaryDoc(null);
      if (pageViewerDoc?.documentId === docId) setPageViewerDoc(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const closeAdvancedSummary = () => setAdvancedSummaryDoc(null);

  // Basic search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { q: searchQuery },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  // Handle page viewer
  const handleViewPage = (document, pageNumber = 1) => {
    setPageViewerDoc({
      documentId: document._id,
      documentName: document.originalName,
      pageNumber,
    });
  };

  // Render Upload tab
  const renderUploadTab = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h3>📤 Upload New Document</h3>
        <p>Upload PDF, DOC, DOCX, TXT, or RTF files (max 10MB)</p>
      </div>

      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-container">
          <label htmlFor="fileInput" className="file-input-label">
            {file ? file.name : "Choose File"}
          </label>
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
        <button
          type="submit"
          disabled={!file || loading}
          className="upload-btn"
        >
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      <div className="recent-uploads">
        <div className="section-header">
          <h4>Recently Uploaded Files</h4>
          <span className="badge">{files.length} files</span>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <p>No files uploaded yet</p>
            <p className="subtext">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="files-grid">
            {files.slice(0, 6).map((file) => (
              <DocumentCard
                key={file._id}
                document={file}
                onView={(doc) =>
                  window.open(`${API_BASE}/uploads/${doc.filename}`, "_blank")
                }
                onViewPage={handleViewPage}
                onQuickSummary={handleGetSummary}
                onAdvancedSummary={handleOpenAdvancedSummary}
                onDelete={handleDeleteFile} // ✅ Pass delete handler here
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Search tab
  const renderSearchTab = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h3>🔍 Search Documents</h3>
        <p>Search through all uploaded documents</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Enter search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" disabled={searching} className="search-btn">
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="section-header">
            <h4>Search Results ({searchResults.length})</h4>
          </div>

          <div className="files-grid">
            {searchResults.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                onView={(doc) =>
                  window.open(`${API_BASE}/uploads/${doc.filename}`, "_blank")
                }
                onViewPage={handleViewPage}
                onQuickSummary={handleGetSummary}
                onAdvancedSummary={handleOpenAdvancedSummary}
                onDelete={handleDeleteFile} // ✅ Pass delete handler here
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Analytics tab
  const renderAnalyticsTab = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h3>📊 Analytics & Insights</h3>
        <p>Document statistics and trends</p>
      </div>

      {analytics ? (
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Popular Program Areas</h4>
            <div className="stats-list">
              {analytics.popularTags.slice(0, 5).map((tag, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-label">{tag._id}</span>
                  <span className="stat-value">{tag.count} documents</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <h4>Yearly Distribution</h4>
            <div className="stats-list">
              {analytics.yearlyStats.map((year, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-label">
                    {year._id.replace("year-", "")}
                  </span>
                  <span className="stat-value">{year.count} files</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <h4>Common Keywords</h4>
            <div className="keywords-cloud">
              {analytics.commonKeywords.slice(0, 10).map((word, index) => (
                <span
                  key={index}
                  className="keyword"
                  style={{ fontSize: `${12 + word.count / 3}px` }}
                >
                  {word._id}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-state">
          <p>Loading analytics...</p>
        </div>
      )}
    </div>
  );

  // Render Summary Modal (quick summary)
  const renderSummaryModal = () => {
    if (!summaryData) return null;

    if (summaryData.loading) {
      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Generating Summary</h3>
            <p>
              Please wait while we generate a summary for{" "}
              {summaryData.document.filename}
            </p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="modal-overlay" onClick={() => setSummaryData(null)}>
        <div
          className="modal-content summary-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{summaryData.document.filename}</h3>
            <button className="close-btn" onClick={() => setSummaryData(null)}>
              ×
            </button>
          </div>

          {summaryData.statistics && (
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Original Size</span>
                <span className="stat-value">
                  {summaryData.statistics.originalLength} chars
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Summary Size</span>
                <span className="stat-value">
                  {summaryData.statistics.summaryLength} chars
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Compression</span>
                <span className="stat-value">
                  {summaryData.statistics.compressionRatio}%
                </span>
              </div>
            </div>
          )}

          <div className="summary-content">
            <h4>Summary</h4>
            <p>{summaryData.summary}</p>
          </div>

          <div className="modal-actions">
            <button
              onClick={() => navigator.clipboard.writeText(summaryData.summary)}
              className="btn btn-primary"
            >
              📋 Copy Summary
            </button>
            <button
              onClick={() => setSummaryData(null)}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" />

      <header className="dashboard-header">
        <div className="header-content">
          <h1>📚 Eureka Document Intelligence</h1>
          <p>
            Upload, search, and summarize your documents with AI-powered
            insights
          </p>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === "upload" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("upload")}
        >
          <span className="nav-icon">📤</span>
          <span className="nav-text">Upload</span>
        </button>
        <button
          className={activeTab === "search" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("search")}
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-text">Search</span>
        </button>
        <button
          className={activeTab === "analytics" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("analytics")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Analytics</span>
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === "upload" && renderUploadTab()}
        {activeTab === "search" && renderSearchTab()}
        {activeTab === "analytics" && renderAnalyticsTab()}
      </main>

      {renderSummaryModal()}

      {/* Advanced Summary Modal */}
      {advancedSummaryDoc && (
        <SummaryComponent
          documentId={advancedSummaryDoc.documentId}
          documentName={advancedSummaryDoc.documentName}
          onClose={closeAdvancedSummary}
        />
      )}

      {/* Page Viewer Modal */}
      {pageViewerDoc && (
        <PageViewer
          documentId={pageViewerDoc.documentId}
          documentName={pageViewerDoc.documentName}
          initialPage={pageViewerDoc.pageNumber}
          onClose={() => setPageViewerDoc(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
