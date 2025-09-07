// components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { documentAPI } from "../utils/api";
import DocumentCard from "./DocumentCard";
import "./Dashboard.css";

const Dashboard = ({ onDocumentSelect }) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const fetchFiles = async () => {
    try {
      const response = await documentAPI.getAll();
      setFiles(response.data);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await documentAPI.upload(formData);
      setFile(null);
      document.getElementById("fileInput").value = "";
      alert("✅ File uploaded successfully!");
      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      await documentAPI.delete(docId);
      alert("🗑️ Document deleted successfully!");
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Failed to delete document");
    }
  };

  const handleDocumentClick = (document) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
    navigate(`/document/${document._id}`);
  };

  const handleViewPage = (document) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
    navigate(`/document/${document._id}?view=pages`);
  };

  const handleQuickSummary = async (id, name) => {
    try {
      const response = await documentAPI.getSummary(id);
      alert(`Summary for ${name}:\n\n${response.data.summary}`);
    } catch (error) {
      console.error("Summary error:", error);
      alert("❌ Failed to get summary");
    }
  };

  const handleAdvancedSummary = async (id, name) => {
    try {
      const response = await documentAPI.getSummary(id, { detailed: true });
      alert(`Advanced Summary for ${name}:\n\n${response.data.summary}`);
    } catch (error) {
      console.error("Advanced summary error:", error);
      alert("❌ Failed to get advanced summary");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>📚 Eureka Document Intelligence</h1>
        <p>Upload, search, and manage your documents</p>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === "upload" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("upload")}
        >
          📤 Upload
        </button>
        <button
          className={activeTab === "browse" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("browse")}
        >
          📂 Browse
        </button>
        <button className="nav-btn" onClick={() => navigate("/search")}>
          🔍 Search
        </button>
        <button
          className="nav-btn"
          onClick={() => navigate("/advanced-search")}
        >
          📊 Advanced
        </button>
        <button className="nav-btn" onClick={() => navigate("/chat")}>
          💬 Chat
        </button>
      </nav>

      <main className="dashboard-main">
        {/* ✅ Upload Tab */}
        {activeTab === "upload" && (
          <div className="upload-section">
            <h3>Upload New Document</h3>
            <p>Select and upload a file directly from here.</p>

            {/* Hidden file input */}
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />

            {/* Choose file button */}
            <button
              className="nav-button"
              onClick={() => document.getElementById("fileInput").click()}
              disabled={loading}
            >
              {loading ? "Uploading..." : "📁 Choose File"}
            </button>

            {/* Show selected file + upload button */}
            {file && (
              <div style={{ marginTop: "15px" }}>
                <p>
                  Selected: <strong>{file.name}</strong> (
                  {(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="upload-button"
                >
                  {loading ? "Uploading..." : "🚀 Upload"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ✅ Browse Tab */}
        {activeTab === "browse" && (
          <div className="browse-section">
            <h3>Your Documents ({files.length})</h3>
            <div className="documents-grid">
              {files.map((file) => (
                <DocumentCard
                  key={file._id}
                  document={file}
                  onView={() => handleDocumentClick(file)}
                  onViewPage={() => handleViewPage(file)}
                  onQuickSummary={() =>
                    handleQuickSummary(file._id, file.originalName)
                  }
                  onAdvancedSummary={() =>
                    handleAdvancedSummary(file._id, file.originalName)
                  }
                  onDelete={() => handleDeleteFile(file._id)}
                  onClick={() => handleDocumentClick(file)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
