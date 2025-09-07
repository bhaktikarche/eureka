// components/DocumentCard.jsx
import React from "react";

const DocumentCard = ({
  document,
  onView,
  onViewPage,
  onQuickSummary,
  onAdvancedSummary,
  onDelete,
  onClick, // ✅ Add onClick prop
}) => {
  return (
    <div
      className="document-card"
      onClick={onClick} // ✅ Use onClick prop
      style={{
        border: "1px solid #ddd",
        padding: "16px",
        borderRadius: "8px",
        cursor: "pointer",
        margin: "10px",
        transition: "all 0.2s ease",
      }}
    >
      <h3>{document.originalName}</h3>
      <p>Size: {(document.size / 1024 / 1024).toFixed(2)} MB</p>
      <p>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</p>

      <div className="document-actions" style={{ marginTop: "10px" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(document);
          }}
        >
          👁️ View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewPage(document);
          }}
        >
          📄 Pages
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickSummary(document._id, document.originalName);
          }}
        >
          📝 Summary
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdvancedSummary(document._id, document.originalName);
          }}
        >
          🎯 Advanced
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(document._id);
          }}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
