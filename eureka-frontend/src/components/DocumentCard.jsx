// DocumentCard.jsx
import React from "react";
import "./DocumentCard.css";

const DocumentCard = ({ document, onQuickSummary, onAdvancedSummary, onView }) => {
  return (
    <div className="document-card">
      <div className="card-header">
        <h4 className="document-title">{document.originalName}</h4>
        <span className="file-type">{document.mimetype.split('/')[1]?.toUpperCase()}</span>
      </div>
      
      <div className="card-content">
        <div className="document-meta">
          <span className="file-size">{(document.size / 1024 / 1024).toFixed(2)} MB</span>
          <span className="upload-date">{new Date(document.uploadedAt).toLocaleDateString()}</span>
        </div>
        
        <div className="tags-container">
          {document.tags?.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
          {document.tags?.length > 3 && (
            <span className="tag-more">+{document.tags.length - 3} more</span>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="btn btn-primary"
          onClick={() => onView(document)}
          title="View Document"
        >
          📄 View
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => onQuickSummary(document._id, document.originalName)}
          title="Quick Summary"
        >
          📝 Quick Summary
        </button>
        <button 
          className="btn btn-tertiary"
          onClick={() => onAdvancedSummary(document._id, document.originalName)}
          title="Advanced Summary Options"
        >
          🎛️ Advanced
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;