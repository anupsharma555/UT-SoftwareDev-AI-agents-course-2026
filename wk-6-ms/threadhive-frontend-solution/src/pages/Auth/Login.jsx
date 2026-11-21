import React, { useState } from 'react';
import { Container, Card, Form, Button } from "react-bootstrap";
import './Auth.css';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    console.log('Login Attempt:', form);
    setForm({ email: '', password: '' });
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

          <Button type="submit" variant="primary" className="auth-submit-btn">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Login
          </Button>
        </Form>
      </Card>
    </Container>

  );
}

export default Login;
