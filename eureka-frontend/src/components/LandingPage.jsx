// components/LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-container">
            <img src="/logo.png" alt="Eureka Logo" className="logo-img" />
            <h1 className="logo-text">Eureka</h1>
          </div>
          <p className="tagline">
            A personal trustworthy AI librarian with photographic memory… and consult for your clients even while you sleep.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h2>Transform Your Document Management</h2>
              <p>
                Upload, organize, search, summarize, and retrieve knowledge from
                your personal library with AI-powered intelligence.
              </p>
              <div className="cta-buttons">
                <button
                  className="cta-primary"
                  onClick={() => navigate("/chat")}
                >
                  🚀 Start Chatting
                </button>
                <button
                  className="cta-secondary"
                  onClick={() => navigate("/dashboard")}
                >
                  📂 Go to Dashboard
                </button>
              </div>
            </div>
            <div className="hero-image">
              <img
                src="/librarian.jpg"
                alt="Eureka AI Librarian"
                className="librarian-img"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h3>✨ Powerful Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h4>Intelligent Search</h4>
              <p>
                Find exactly what you need with AI-powered semantic search
                across all your documents.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h4>Smart Summarization</h4>
              <p>Get concise summaries of lengthy documents in seconds.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏷️</div>
              <h4>Auto-Tagging</h4>
              <p>Automatically categorize and tag your documents with ease.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗣️</div>
              <h4>Voice Commands</h4>
              <p>Interact naturally using voice commands and responses.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
