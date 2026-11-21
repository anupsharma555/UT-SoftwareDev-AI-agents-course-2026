import { Button, Card, Container, Form } from "react-bootstrap";
import "./Auth.css";

export default function ForgotPassword() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <Container
      fluid
      className="auth-container d-flex align-items-center justify-content-center"
    >
      <Card className="auth-card shadow-lg border-0 rounded-4 p-4 p-md-5">
        <h2 className="auth-title">Forgot Password</h2>
        <p className="text-muted text-center mb-4">
          Enter the email address associated with your account.
        </p>
        <Form onSubmit={handleSubmit}>
          <Form.Floating className="mb-4">
            <Form.Control
              id="resetEmail"
              name="email"
              type="email"
              placeholder=" "
              autoComplete="email"
              required
              className="auth-form-control"
            />
            <label htmlFor="resetEmail" className="auth-form-label">
              Email address
            </label>
          </Form.Floating>

          <Button type="submit" variant="primary" className="auth-submit-btn">
            Send reset link
          </Button>
        </Form>
      </Card>
    </Container>
  );
}
