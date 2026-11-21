import { Container, Card, Form, Button, Spinner } from "react-bootstrap";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();

  useEffect(() => {
    // Check if user was redirected due to expired token
    if (location.state?.expired) {
      setInfo("Your session has expired. Please log in again.");
    }
  }, [location]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await login(form);

      loginUser(data);

      // Navigate to home
      alert("Login successful!");
      navigate("/");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="auth-container d-flex align-items-center justify-content-center"
    >
      <Card className="auth-card shadow-lg border-0 rounded-4 p-4 p-md-5">
        <h2 className="auth-title">Login</h2>

        <Form onSubmit={handleSubmit}>
          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingEmail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingEmail" className="auth-form-label">
              Email
            </label>
          </Form.Floating>

          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingPassword"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingPassword" className="auth-form-label">
              Password
            </label>
          </Form.Floating>

          {info && <div className="auth-info">{info}</div>}
          {error && <div className="auth-error">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" />
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>Login
              </>
            )}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}

export default Login;
