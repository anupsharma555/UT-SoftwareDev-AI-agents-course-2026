import React, { useState } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import "./App.css"

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  return (
    <div className="app-layout">
      <Header onNavigate={setCurrentPage} />
      <main className="main-center-content">
        {currentPage === 'login' ? <Login /> : <Register />}
      </main>
      <Footer />
    </div>
  );
}

export default App;
