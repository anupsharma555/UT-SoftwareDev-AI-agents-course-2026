import { Navbar, Container, Button } from "react-bootstrap";
import './Header.css';

function Header({ onNavigate, darkMode, onToggleDarkMode }) {
  const isAuthenticated = false;

  const handleLogin = () => {
    console.log('Login clicked');
    onNavigate('login');
  };

  const handleSignup = () => {
    console.log('Signup clicked');
    onNavigate('register');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    onNavigate('login');
  };

  return (
    <header>
      <Navbar className="header-navbar shadow-sm">
        <Container className="header-container d-flex justify-content-between align-items-center">
          <h1 className="header-logo">ThreadHive</h1>
          <div className="d-flex align-items-center">
            <button
              className="dark-mode-toggle"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            {isAuthenticated ? (
              <Button className="btn-header btn-primary" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <>
                <Button className="btn-header btn-outline me-2" onClick={handleLogin}>
                  Login
                </Button>
                <Button className="btn-header btn-primary" onClick={handleSignup}>
                  Register
                </Button>
              </>
            )}
          </div>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
