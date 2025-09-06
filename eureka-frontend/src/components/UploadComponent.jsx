// eureka-frontend/src/components/UploadComponent.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UploadComponent.css";

const UploadComponent = () => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/files");
      setFiles(res.data);
    } catch (err) {
      console.error("Error fetching files:", err);
      setUploadStatus("Error fetching files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadStatus("Please select a file first");
      return;
    }

    setLoading(true);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setUploadStatus("File uploaded successfully!");
      fetchFiles(); // Refresh the file list
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadStatus("File size must be less than 10MB");
        return;
      }
      
      // Check file type (allow common document types)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setUploadStatus("Please upload a document file (PDF, DOC, DOCX, TXT, RTF)");
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus(`Selected: ${selectedFile.name}`);
    }
  };

  return (
    <div className="upload-container">
      <h2>📂 Eureka File Upload</h2>
      
      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-container">
          <input 
            type="file" 
            onChange={handleFileChange} 
            className="file-input"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="file-input-label">
            Choose File
          </label>
          {file && <span className="file-name">{file.name}</span>}
        </div>
        
        <button 
          type="submit" 
          disabled={!file || loading}
          className="upload-button"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {uploadStatus && <div className="status-message">{uploadStatus}</div>}

      <div className="uploaded-files">
        <h3>Uploaded Files</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <ul className="file-list">
            {files.map((f) => (
              <li key={f._id} className="file-item">
                <a 
                  href={`http://localhost:5000/${f.path}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="file-link"
                >
                  {f.filename}
                </a>
                <span className="file-date">
                  Uploaded: {new Date(f.uploadedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UploadComponent;