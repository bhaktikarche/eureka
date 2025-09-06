// DocumentCard.jsx
import React, { useEffect, useRef, useState } from "react";
import "./DocumentCard.css";

const DocumentCard = ({
  document,
  onQuickSummary,
  onAdvancedSummary,
  onView,
  onViewPage,
  onDelete, // Delete callback
}) => {
  const tagsContainerRef = useRef(null);
  const [showPageOptions, setShowPageOptions] = useState(false);

  // Format tags (year, donor)
  useEffect(() => {
    if (tagsContainerRef.current) {
      const tags = tagsContainerRef.current.querySelectorAll(".tag");
      tags.forEach((tag) => {
        if (tag.textContent.includes("year-")) {
          tag.classList.add("year-tag");
          tag.textContent = tag.textContent.replace("year-", "");
        }
        if (tag.textContent.includes("donor-")) {
          tag.classList.add("donor-tag");
          tag.textContent = tag.textContent.replace("donor-", "");
        }
      });
    }
  }, [document.tags]);

  return (
    <div className="document-card">
      <div className="card-header">
        <h4 className="document-title">{document.originalName}</h4>
        <span className="file-type">{document.mimetype.split("/")[1]?.toUpperCase()}</span>
      </div>

      <div className="card-content">
        <div className="document-meta">
          <span className="file-size">{(document.size / 1024 / 1024).toFixed(2)} MB</span>
          <span className="upload-date">{new Date(document.uploadedAt).toLocaleDateString()}</span>
        </div>

        <div className="tags-container" ref={tagsContainerRef}>
          {document.tags?.slice(0, 4).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
          {document.tags?.length > 4 && (
            <span className="tag-more">+{document.tags.length - 4} more</span>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="btn btn-primary"
          onClick={() => onView(document)}
          title="View Full Document"
        >
          📄 View
        </button>

        <div className="page-view-dropdown">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPageOptions(!showPageOptions)}
            title="View Specific Page"
          >
            📑 Pages
          </button>

          {showPageOptions && (
            <div className="page-options">
              <button onClick={() => onViewPage(document, 1)}>Page 1</button>
              <button onClick={() => onViewPage(document, 2)}>Page 2</button>
              <button onClick={() => onViewPage(document, 3)}>Page 3</button>
              <div className="custom-page-input">
                <input
                  type="number"
                  placeholder="Page #"
                  min="1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const pageNum = parseInt(e.target.value);
                      if (pageNum > 0) {
                        onViewPage(document, pageNum);
                        setShowPageOptions(false);
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          className="btn btn-tertiary"
          onClick={() => onAdvancedSummary(document._id, document.originalName)}
          title="Advanced Summary Options"
        >
          🎛️ Advanced
        </button>

        <button
          className="btn btn-danger"
          onClick={() => onDelete(document._id, document.originalName)}
          title="Delete Document"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
