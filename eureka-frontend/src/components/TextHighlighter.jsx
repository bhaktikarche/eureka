import React, { useState, useEffect, useRef } from "react";
import { documentAPI } from "../utils/api";
import "./TextHighlighter.css"; // We'll create this CSS file

const TextHighlighter = ({ documentId, pageContent, pageNumber, onAnnotationAdded }) => {
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState("");
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [note, setNote] = useState("");
  const textContainerRef = useRef(null);

  // Load annotations for this page
  useEffect(() => {
    loadAnnotations();
  }, [documentId, pageNumber]);

  // In TextHighlighter.jsx, change the loadAnnotations function:
const loadAnnotations = async () => {
  try {
    // Changed to use params object instead of query string
    const response = await documentAPI.getAnnotations(documentId, { page: pageNumber });
    // Filter out any annotations that don't have proper position data
    const validAnnotations = response.data.filter(ann => 
      ann.position && typeof ann.position.startIndex === 'number'
    );
    setAnnotations(validAnnotations);
  } catch (error) {
    console.error("Failed to load annotations:", error);
  }
};

  const handleMouseUp = (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText) return;

    // Get the position of the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(selectedText);
    setFormPosition({ 
      x: rect.left, 
      y: rect.bottom + window.scrollY + 10 
    });
    setShowAnnotationForm(true);
    setNote("");
  };

  const handleAddAnnotation = async () => {
    if (!selectedText) return;

    try {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Calculate start index in the page content
      const textContainer = textContainerRef.current;
      if (!textContainer) {
        throw new Error("Text container not found");
      }
      
      const preSelectionRange = document.createRange();
      preSelectionRange.selectNodeContents(textContainer);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startIndex = preSelectionRange.toString().length;
      
      const annotationData = {
        text: selectedText,
        note: note,
        position: {
          startIndex: startIndex,
          endIndex: startIndex + selectedText.length,
          page: pageNumber
        },
        color: "#ffeb3b",
        tags: []
      };

      await documentAPI.addAnnotation(documentId, annotationData);
      
      // Refresh annotations
      await loadAnnotations();
      
      // Notify parent component
      if (onAnnotationAdded) {
        onAnnotationAdded();
      }
      
      // Reset form
      setShowAnnotationForm(false);
      setSelectedText("");
      setNote("");
      
      // Clear selection
      selection.removeAllRanges();
      
    } catch (error) {
      console.error("Failed to add annotation:", error);
      alert("Failed to save annotation. Please try again.");
    }
  };

  const handleCancelAnnotation = () => {
    setShowAnnotationForm(false);
    setSelectedText("");
    setNote("");
    window.getSelection().removeAllRanges();
  };

  // Apply highlights to text based on annotations
  const renderHighlightedText = () => {
    if (!pageContent) return null;
    
    // Filter valid annotations
    const validAnnotations = annotations.filter(ann => 
      ann.position && 
      typeof ann.position.startIndex === 'number' && 
      typeof ann.position.endIndex === 'number' &&
      ann.position.startIndex >= 0 &&
      ann.position.endIndex <= pageContent.length
    );
    
    // Sort annotations by start index
    const sortedAnnotations = [...validAnnotations].sort((a, b) => 
      a.position.startIndex - b.position.startIndex
    );
    
    // If no annotations, return plain text
    if (sortedAnnotations.length === 0) {
      return <div className="text-content-plain">{pageContent}</div>;
    }
    
    // Create highlighted content
    let lastIndex = 0;
    const elements = [];
    
    sortedAnnotations.forEach((ann, index) => {
      // Add text before the annotation
      if (ann.position.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {pageContent.slice(lastIndex, ann.position.startIndex)}
          </span>
        );
      }
      
      // Add the highlighted annotation
      elements.push(
        <mark 
          key={`highlight-${index}`}
          className="text-highlight"
          style={{ backgroundColor: ann.color || '#ffeb3b' }}
          data-annotation-id={ann._id}
          onClick={() => handleAnnotationClick(ann)}
        >
          {pageContent.slice(ann.position.startIndex, ann.position.endIndex)}
        </mark>
      );
      
      lastIndex = ann.position.endIndex;
    });
    
    // Add remaining text
    if (lastIndex < pageContent.length) {
      elements.push(
        <span key="text-end">{pageContent.slice(lastIndex)}</span>
      );
    }
    
    return <div className="text-content-highlighted">{elements}</div>;
  };

  const handleAnnotationClick = (annotation) => {
    if (annotation.note) {
      alert(`Annotation Note: ${annotation.note}`);
    }
  };

  return (
    <div className="text-highlighter-container">
      {/* Annotation form */}
      {showAnnotationForm && (
        <div 
          className="annotation-form"
          style={{
            position: 'absolute',
            left: `${formPosition.x}px`,
            top: `${formPosition.y}px`,
            zIndex: 1000
          }}
        >
          <div className="annotation-form-content">
            <h4>Add Annotation</h4>
            <p>Selected text: "{selectedText}"</p>
            <textarea
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <div className="annotation-buttons">
              <button onClick={handleAddAnnotation}>Save</button>
              <button onClick={handleCancelAnnotation}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions for user */}
      <div className="highlight-instructions">
        <p>🔍 Select text to highlight and add annotations</p>
      </div>
      
      {/* Text content with highlights */}
      <div 
        ref={textContainerRef}
        className="page-text-content"
        onMouseUp={handleMouseUp}
      >
        {renderHighlightedText()}
      </div>
    </div>
  );
};

export default TextHighlighter;