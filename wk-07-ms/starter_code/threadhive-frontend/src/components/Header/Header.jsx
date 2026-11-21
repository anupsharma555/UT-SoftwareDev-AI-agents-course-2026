import { Navbar, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const displayName = user?.name?.trim() || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/register");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  return (
    <Navbar className="header-navbar shadow-sm">
      <Container
        fluid
        className="header-container d-flex justify-content-between align-items-center"
      >
        <div className="d-flex align-items-center">
          <h1 className="header-logo" onClick={() => navigate("/home")}>
            ThreadHive
          </h1>
        </div>
        <div className="d-flex align-items-center">
          {token ? (
            <>
              <Button
                variant="link"
                className="user-profile-btn"
                onClick={handleProfile}
                aria-label={`Open profile for ${displayName}`}
              >
                <span className="user-avatar">{initial}</span>
                <span className="user-name">{displayName}</span>
              </Button>
              <Button className="btn-header btn-primary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                className="btn-header btn-outline me-2"
                onClick={handleLogin}
              >
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
  );
}

export default Header;
