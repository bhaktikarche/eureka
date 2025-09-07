// components/DocumentViewer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { documentAPI } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import './DocumentViewer.css';
import TextHighlighter from "./TextHighlighter";

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageContent, setPageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('viewer');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [pagesAvailable, setPagesAvailable] = useState(false);

  // Determine where to navigate back to based on the previous page
  const getBackPath = () => {
    const fromBrowse = location.state?.fromBrowse;
    return fromBrowse ? '/browse' : '/dashboard';
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  useEffect(() => {
    if (document?.mimetype === 'application/pdf' && currentPage > 0 && pagesAvailable) {
      fetchPageContent();
    }
  }, [currentPage, document, pagesAvailable]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await documentAPI.getById(id);
      setDocument(response.data);
      
      // Check if PDF and try to get page count, but handle gracefully if endpoint doesn't exist
      if (response.data.mimetype === 'application/pdf') {
        try {
          const pagesResponse = await documentAPI.getPages(id);
          setTotalPages(pagesResponse.data.totalPages);
          setPagesAvailable(true);
        } catch (pagesError) {
          console.warn('Page endpoints not available, using fallback:', pagesError);
          setPagesAvailable(false);
          // Estimate pages based on text length for fallback
          if (response.data.extractedText) {
            const approxPages = Math.max(1, Math.floor(response.data.extractedText.length / 2000));
            setTotalPages(approxPages);
          } else {
            setTotalPages(1);
          }
        }
      }
      
      toast.success('Document loaded successfully');
    } catch (err) {
      console.error('Error fetching document:', err);
      const errorMsg = 'Failed to load document: ' + (err.response?.data?.error || err.message);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPageContent = async () => {
    if (!pagesAvailable) {
      // Fallback: use extracted text for all pages
      if (document?.extractedText) {
        const textLength = document.extractedText.length;
        const approxCharsPerPage = Math.max(1, Math.floor(textLength / totalPages));
        const start = (currentPage - 1) * approxCharsPerPage;
        const end = Math.min(start + approxCharsPerPage, textLength);
        setPageContent(document.extractedText.substring(start, end) || 'Content not available');
      } else {
        setPageContent('Page content not available');
      }
      return;
    }

    try {
      const response = await documentAPI.getPage(id, currentPage);
      setPageContent(response.data.content);
    } catch (err) {
      console.error('Error fetching page content:', err);
      // Fallback to extracted text
      if (document?.extractedText) {
        const textLength = document.extractedText.length;
        const approxCharsPerPage = Math.max(1, Math.floor(textLength / totalPages));
        const start = (currentPage - 1) * approxCharsPerPage;
        const end = Math.min(start + approxCharsPerPage, textLength);
        setPageContent(document.extractedText.substring(start, end) || 'Content not available');
      } else {
        setPageContent('Unable to load page content');
      }
    }
  };

  const fetchSummary = async () => {
    if (summary) return;
    
    try {
      setSummaryLoading(true);
      toast.loading('Generating summary...');
      const response = await documentAPI.getSummary(id, { length: 1000 });
      setSummary(response.data);
      setSummaryLoading(false);
      toast.dismiss();
      toast.success('Summary generated successfully');
    } catch (err) {
      console.error('Error fetching summary:', err);
      setSummaryLoading(false);
      toast.dismiss();
      
      // Fallback: create simple summary from extracted text
      if (document?.extractedText) {
        const text = document.extractedText;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const fallbackSummary = sentences.slice(0, 3).join('. ') + '.';
        
        setSummary({
          summary: fallbackSummary,
          statistics: {
            originalLength: text.length,
            summaryLength: fallbackSummary.length,
            compressionRatio: Math.round((1 - (fallbackSummary.length / text.length)) * 100)
          }
        });
        toast.success('Created basic summary from document text');
      } else {
        toast.error('Failed to generate summary: No text content available');
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDownload = async () => {
  if (!document?.filename) {
    toast.error("Cannot download file");
    return;
  }

  try {
    // Fetch the file as a blob
    const response = await fetch(`http://localhost:5000/uploads/${document.filename}`);
    if (!response.ok) throw new Error("Failed to fetch file");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create temporary link
    const link = document.createElement("a");
    link.href = url;
    link.download = document.originalName || document.filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Download started");
  } catch (error) {
    console.error("Download error:", error);
    toast.error("Failed to download file");
  }
};

  const handleViewOriginal = () => {
    if (document?.filename) {
      window.open(`http://localhost:5000/uploads/${document.filename}`, '_blank');
      toast('Opening original document...', { icon: '📄' });
    } else {
      toast.error('Cannot open document');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'summary' && !summary) {
      fetchSummary();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="document-viewer-loading">
        <div className="spinner"></div>
        <p>Loading document...</p>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-viewer-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(getBackPath())} className="back-button">
          ← Back
        </button>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="document-viewer-error">
        <h2>Document Not Found</h2>
        <button onClick={() => navigate(getBackPath())} className="back-button">
          ← Back
        </button>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="document-viewer">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="viewer-header">
        <button onClick={() => navigate(getBackPath())} className="back-button">
          ← Back
        </button>
        <h1>{document.originalName}</h1>
        <div className="header-actions">
          <button onClick={handleViewOriginal} className="view-original-button">
            📄 View Original
          </button>
          <button onClick={handleDownload} className="download-button">
            📥 Download
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="viewer-tabs">
        <button
          className={activeTab === 'viewer' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('viewer')}
        >
          📖 View Document
        </button>
        <button
          className={activeTab === 'pages' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('pages')}
        >
          📑 Pages
        </button>
        <button
          className={activeTab === 'summary' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('summary')}
        >
          📋 Summary
        </button>
        <button
          className={activeTab === 'analytics' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {/* Content Area */}
      <div className="viewer-content">
        {activeTab === 'analytics' ? (
          <div className="analytics-view">
            <div className="analytics-card">
              <h3>Document Information</h3>
              <div className="analytics-grid">
                <div className="analytics-item">
                  <span className="label">File Name:</span>
                  <span className="value">{document.originalName}</span>
                </div>
                <div className="analytics-item">
                  <span className="label">File Type:</span>
                  <span className="value">{document.mimetype}</span>
                </div>
                <div className="analytics-item">
                  <span className="label">File Size:</span>
                  <span className="value">{formatFileSize(document.size)}</span>
                </div>
                <div className="analytics-item">
                  <span className="label">Uploaded:</span>
                  <span className="value">{formatDate(document.uploadedAt)}</span>
                </div>
                <div className="analytics-item">
                  <span className="label">Tags:</span>
                  <span className="value">
                    {document.tags?.length > 0 ? (
                      <div className="tags-container">
                        {document.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    ) : (
                      'No tags'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'summary' ? (
          <div className="summary-view">
            {summaryLoading ? (
              <div className="summary-loading">
                <div className="spinner"></div>
                <p>Generating summary...</p>
              </div>
            ) : summary ? (
              <div className="summary-card">
                <div className="summary-header">
                  <h3>Document Summary</h3>
                  <div className="summary-stats">
                    <span className="stat">Original: {summary.statistics.originalLength} chars</span>
                    <span className="stat">Summary: {summary.statistics.summaryLength} chars</span>
                    <span className="stat">Compression: {summary.statistics.compressionRatio}%</span>
                  </div>
                </div>
                <div className="summary-content">
                  <p>{summary.summary}</p>
                </div>
              </div>
            ) : (
              <div className="summary-placeholder">
                <div className="summary-icon">📝</div>
                <h3>Document Summary</h3>
                <p>Generate a summary of this document</p>
                <button onClick={fetchSummary} className="generate-summary-btn">
                  Generate Summary
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'pages' ? (
          <div className="pages-view">
            <div className="pages-header">
              <h3>Document Pages</h3>
              <p className="pages-subtitle">Browse through the document pages</p>
              {!pagesAvailable && (
                <p className="pages-warning">⚠️ Using estimated page navigation</p>
              )}
            </div>
            
            {document.mimetype === 'application/pdf' && totalPages > 0 ? (
              <>
                <div className="pages-navigation">
                  <div className="pages-info">
                    <span className="total-pages">{totalPages} pages total</span>
                    <span className="current-page">Currently viewing page {currentPage}</span>
                  </div>
                  
                  <div className="pages-controls">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1}
                      className="page-nav-button"
                    >
                      ← Previous Page
                    </button>
                    
                    <div className="page-selector">
                      <span>Page </span>
                      <select 
                        value={currentPage} 
                        onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                        className="page-dropdown"
                      >
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <option key={page} value={page}>{page}</option>
                        ))}
                      </select>
                      <span> of {totalPages}</span>
                    </div>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="page-nav-button"
                    >
                      Next Page →
                    </button>
                  </div>
                </div>

                <div className="page-content-card">
  <h4>Page {currentPage} Content</h4>

  <TextHighlighter
    documentId={document._id}          // Pass the document ID
    pageContent={pageContent}           // Pass the page content
    pageNumber={currentPage}            // Pass the current page number
    onAnnotationAdded={() => {
      // Optional: refresh annotations or update UI
      console.log("New annotation added to page", currentPage);
    }}
  />
</div>

              </>
            ) : (
              <div className="no-pages-message">
                <div className="no-pages-icon">📄</div>
                <h4>Page navigation not available</h4>
                <p>This document doesn't support page-by-page navigation.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="document-view">
            <div className="viewer-header-section">
              <h2>Document Viewer</h2>
              <p>View and navigate through the document content</p>
              {!pagesAvailable && document.mimetype === 'application/pdf' && (
                <p className="viewer-warning">⚠️ Using basic text navigation</p>
              )}
            </div>
            
            {document.mimetype === 'application/pdf' && totalPages > 0 ? (
              <div className="pdf-viewer-container">
                <div className="viewer-controls">
                  <div className="control-group">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1}
                      className="control-button"
                    >
                      ← Previous
                    </button>
                    <span className="page-indicator">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="control-button"
                    >
                      Next →
                    </button>
                  </div>
                  
                  <div className="jump-to-page">
                    <label htmlFor="pageInput">Jump to page:</label>
                    <input
                      id="pageInput"
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="document-content">
                  <div className="content-header">
                    <h3>Page {currentPage} Content</h3>
                    <button 
                      onClick={() => handleTabChange('pages')}
                      className="view-all-pages-btn"
                    >
                      View All Pages →
                    </button>
                  </div>
                  <div className="text-content">
                    {pageContent || 'Loading content...'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-content-view">
                <h3>Document Content</h3>
                {document.extractedText ? (
                  <div className="document-text">
                    {document.extractedText}
                  </div>
                ) : (
                  <p className="no-content-message">No text content available for this document.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;