// App.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import DocumentViewer from './components/DocumentViewer';
import LandingPage from './components/LandingPage';
import SearchComponent from './components/SearchComponent';
import AdvancedSearch from './components/AdvancedSearch';
import UploadComponent from './components/UploadComponent';
// import './App.css';

function App() {
  const [selectedDocument, setSelectedDocument] = useState(null);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route 
          path="/dashboard" 
          element={<Dashboard onDocumentSelect={setSelectedDocument} />} 
        />
        <Route 
          path="/search" 
          element={<SearchComponent onDocumentSelect={setSelectedDocument} />} 
        />
        <Route 
          path="/advanced-search" 
          element={<AdvancedSearch onDocumentSelect={setSelectedDocument} />} 
        />
        <Route 
          path="/upload" 
          element={<UploadComponent />} 
        />
        <Route 
          path="/document/:id" 
          element={<DocumentViewer />} 
        />
      </Routes>
    </div>
  );
}

export default App;