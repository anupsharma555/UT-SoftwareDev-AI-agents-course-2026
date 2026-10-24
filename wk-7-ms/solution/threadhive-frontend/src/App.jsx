import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/User/Home';
import ThreadPage from './pages/User/ThreadPage';
import Profile from './pages/User/Profile';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="app-layout">
            <Header />
            <div className="app-container">
              <main className="main-center-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/home" />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/thread/:threadId"
                    element={
                      <PrivateRoute>
                        <ThreadPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/home"
                    element={
                      <PrivateRoute>
                        <Home />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </main>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
