import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Row, Col, Form, Button } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { saveUser } from "../../reducers/authSlice";
import "./Profile.css";

function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user) ?? {};
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    bio: user.bio ?? "",
    location: user.location ?? "",
    website: user.website ?? "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    dispatch(saveUser(form));
    setEditing(false);
  };

  return (
    <Container className="mt-3 mb-4">
      <Button
        variant="link"
        className="profile-back-btn p-0"
        onClick={() => navigate("/home")}
      >
        ← Back to Home
      </Button>

      <Card className="profile-card border-0 shadow-sm">
        <Card.Body className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {form.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
          </div>
          <div className="profile-info-section">
            <div className="profile-title-row">
              <h1 className="profile-name">{form.name ?? "User"}</h1>
              <div>
                {editing ? (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={handleSave}
                    >
                      <span aria-hidden="true">✓</span> Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing(false)}
                    >
                      <span aria-hidden="true">✕</span> Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <span aria-hidden="true">✏️</span> Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {!editing ? (
              <div className="profile-fields">
                <div className="profile-field" role="group" aria-labelledby="profile-name-label">
                  <div className="profile-field-label" id="profile-name-label">Full Name</div>
                  <p className="profile-field-value">
                    {form.name ?? <span className="empty">Not provided</span>}
                  </p>
                </div>
                <div className="profile-field" role="group" aria-labelledby="profile-email-label">
                  <div className="profile-field-label" id="profile-email-label">Email Address</div>
                  <p className="profile-field-value">
                    {form.email ?? <span className="empty">Not provided</span>}
                  </p>
                </div>
                <div className="profile-field" style={{ gridColumn: "1 / -1" }} role="group" aria-labelledby="profile-bio-label">
                  <div className="profile-field-label" id="profile-bio-label">Bio</div>
                  <p className="profile-field-value">
                    {form.bio ?? (
                      <span className="empty">No bio added yet</span>
                    )}
                  </p>
                </div>
                <div className="profile-field" role="group" aria-labelledby="profile-location-label">
                  <div className="profile-field-label" id="profile-location-label">Location</div>
                  <p className="profile-field-value">
                    {form.location ?? (
                      <span className="empty">Not provided</span>
                    )}
                  </p>
                </div>
                <div className="profile-field" role="group" aria-labelledby="profile-website-label">
                  <div className="profile-field-label" id="profile-website-label">Website</div>
                  <p className="profile-field-value">
                    {form.website ?? (
                      <span className="empty">Not provided</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <Form>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label htmlFor="profile-name" className="profile-field-label">
                      Full Name
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      id="profile-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label htmlFor="profile-email" className="profile-field-label">
                      Email Address
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      id="profile-email"
                      name="email"
                      value={form.email}
                      disabled
                      title="Email cannot be changed"
                    />
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label htmlFor="profile-bio" className="profile-field-label">Bio</Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      id="profile-bio"
                      as="textarea"
                      rows={3}
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label htmlFor="profile-location" className="profile-field-label">
                      Location
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      id="profile-location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label htmlFor="profile-website" className="profile-field-label">
                      Website
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      id="profile-website"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </Col>
                </Row>
              </Form>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Profile;
