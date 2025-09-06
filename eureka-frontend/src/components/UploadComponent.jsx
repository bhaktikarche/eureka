// eureka-frontend/src/components/UploadComponent.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./UploadComponent.css";
import API from "../api";


const UploadComponent = () => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch uploaded files
  const fetchFiles = async () => {
    try {
      const res = await axios.get("https://eureka-8173.onrender.com/files");
      setFiles(res.data);
    } catch (err) {
      console.error("Error fetching files:", err);
      toast.error("Error fetching files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

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
      await axios.post("https://eureka-8173.onrender.com/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      toast.success("File uploaded successfully!");
      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

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

    setFile(selectedFile);
    toast.success(`Selected: ${selectedFile.name}`);
  };

  // Handle file deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await axios.delete(`https://eureka-8173.onrender.com/files/${id}`);
      toast.success("File deleted successfully!");
      fetchFiles();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete file: " + err.message);
    }
  };

  return (
    <div className="upload-container">
      <Toaster position="top-right" reverseOrder={false} />
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

      <div className="uploaded-files">
        <h3>Uploaded Files</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <ul className="file-list">
            {files.map((f) => (
              <li key={f._id} className="file-item">
                <a
                  href={`https://eureka-8173.onrender.com/${f.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="file-link"
                >
                  {f.originalName}
                </a>
                <span className="file-date">
                  Uploaded: {new Date(f.uploadedAt).toLocaleDateString()}
                </span>
                <span className="file-size">
                  Size: {(f.size / 1024).toFixed(2)} KB
                </span>
                <button
                  onClick={() => handleDelete(f._id)}
                  className="delete-button"
                >
                  ❌ Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UploadComponent;
