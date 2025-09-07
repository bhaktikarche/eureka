// components/UploadComponent.jsx
import React, { useState, useRef } from "react";
import { documentAPI } from "../utils/api";
import "./UploadComponent.css";

const UploadComponent = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // File size validation (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage("File size must be less than 10MB");
      return;
    }

    // File type validation
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage("Please upload a document file (PDF, DOC, DOCX, TXT, RTF)");
      return;
    }

    setFile(selectedFile);
    setMessage("");
  };

  // Upload file
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("Uploading...");

      const response = await documentAPI.upload(formData);
      
      setMessage("✅ File uploaded successfully!");
      setFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(
        err.response?.data?.error || "❌ Error uploading file. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // Handle click on the custom upload area
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileChange({ target: { files: droppedFiles } });
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Document</h2>

      {/* File drop zone */}
      <div 
        className="file-drop-zone"
        onClick={handleUploadAreaClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.rtf"
          style={{ display: 'none' }}
        />
        
        <div className="drop-zone-content">
          <div className="upload-icon">📁</div>
          <p className="drop-zone-text">
            {file ? file.name : "Click to browse or drag & drop a file"}
          </p>
          <p className="drop-zone-subtext">
            Supported formats: PDF, DOC, DOCX, TXT, RTF (Max 10MB)
          </p>
        </div>
      </div>

      {/* File info and upload button */}
      {file && (
        <div className="file-actions">
          <div className="file-info">
            <span className="file-name">{file.name}</span>
            <span className="file-size">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-button"
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UploadComponent;