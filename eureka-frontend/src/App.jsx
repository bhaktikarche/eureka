import { useState } from "react";
import "./App.css";
import UploadComponent from "./components/UploadComponent";
import AdvancedSearch from "./components/AdvancedSearch";
import SearchComponent from "./components/SearchComponent";

function App() {
  const [currentView, setCurrentView] = useState("upload");

  return (
    <>
      <div className="app">
        <nav className="app-nav">
          <button
            className={currentView === "search" ? "active" : ""}
            onClick={() => setCurrentView("search")}
          >
            🔍 Basic Search
          </button>
          <button
            className={currentView === "advanced" ? "active" : ""}
            onClick={() => setCurrentView("advanced")}
          >
            📊 Advanced Search
          </button>
          <button
            className={currentView === "upload" ? "active" : ""}
            onClick={() => setCurrentView("upload")}
          >
            📤 Upload
          </button>
        </nav>

        <main className="app-main">
          {currentView === "search" && <SearchComponent />}
          {currentView === "advanced" && <AdvancedSearch />}
          {currentView === "upload" && <UploadComponent />}
        </main>
      </div>
    </>
  );
}

export default App;
