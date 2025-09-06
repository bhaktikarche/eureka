// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import UploadComponent from './components/UploadComponent';
import SearchComponent from './components/SearchComponent';
import AdvancedSearch from './components/AdvancedSearch';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<UploadComponent />} />
      <Route path="/search" element={<SearchComponent />} />
      <Route path="/advanced" element={<AdvancedSearch />} />
    </Routes>
  );
}

export default App;
