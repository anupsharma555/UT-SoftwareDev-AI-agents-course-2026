import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import "./App.css"
import Home from './pages/User/Home';

function App() {
  const [, setCurrentPage] = useState('login');
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });

  useEffect(() => {
    // Apply dark mode to the document
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="app-layout">
      <Header onNavigate={setCurrentPage} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      <main className="main-center-content">

        {/* Auth Pages */}
        {/* <Login /> */}
        {/* <Register /> */}

        {/* User Pages */}
        <Home />

      </main>
      <Footer />
    </div>
  );
}

export default App;
