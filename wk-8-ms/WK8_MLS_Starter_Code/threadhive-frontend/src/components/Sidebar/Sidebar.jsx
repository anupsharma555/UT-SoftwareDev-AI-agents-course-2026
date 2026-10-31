import { useNavigate, useLocation } from "react-router-dom";
import { Nav, ListGroup } from "react-bootstrap";
import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
      />
      <aside
        id="sidebar-navigation"
        className={`sidebar ${!isOpen ? 'mobile-hidden' : ''}`}
        aria-label="Sidebar"
        inert={!isOpen}
      >
        <Nav className="flex-column" aria-label="Sidebar navigation">
          {/* Menu Section */}
          <div className="mb-4">
            <h2 className="text-uppercase fw-bold small mb-2 px-3" style={{ color: 'var(--text-muted)' }}>Menu</h2>
            <ListGroup variant="flush">
              <ListGroup.Item
                as="button"
                type="button"
                action
                active={isActive("/home")}
                onClick={() => handleNavigation("/home")}
                aria-current={isActive("/home") ? "page" : undefined}
                className="border-0 rounded mx-2"
              >
                🏠 Home
              </ListGroup.Item>
              <ListGroup.Item
                as="button"
                type="button"
                action
                active={isActive("/profile")}
                onClick={() => handleNavigation("/profile")}
                aria-current={isActive("/profile") ? "page" : undefined}
                className="border-0 rounded mx-2"
              >
                👤 Profile
              </ListGroup.Item>
            </ListGroup>
          </div>
        </Nav>
      </aside>
    </>
  );
}

export default Sidebar;
