import React, { useState } from 'react';
import { Container, Card, Form, Button, Spinner } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import './Auth.css';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await register(form);
      alert('Registration successful!');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="auth-container d-flex align-items-center justify-content-center py-5"
    >
      <Card className="auth-card shadow-lg border-0 rounded-4 p-4 p-md-5">
        <h2 className="auth-title">Register</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingName"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingName" className="auth-form-label">Name</label>
          </Form.Floating>

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
            <label htmlFor="floatingEmail" className="auth-form-label">Email</label>
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
            <label htmlFor="floatingPassword" className="auth-form-label">Password</label>
          </Form.Floating>

          {error && <div className="auth-error">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" role="status" />
            ) : (
              <>
                <i className="bi bi-person-plus-fill me-2"></i>Register
              </>
            )}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}

export default Register;
