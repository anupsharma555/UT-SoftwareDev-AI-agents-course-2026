import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Col, Form, Row } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import "./Profile.css";

function getProfileForm(user) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  };
}

function ProfileField({ label, value, emptyLabel }) {
  return (
    <div className="profile-field">
      <div className="profile-field-label">{label}</div>
      <p className={`profile-field-value${value ? "" : " empty"}`}>
        {value || emptyLabel}
      </p>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => getProfileForm(user));

  useEffect(() => {
    setForm(getProfileForm(user));
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    updateUser({ ...user, ...form });
    setEditing(false);
  };

  const handleCancel = () => {
    setForm(getProfileForm(user));
    setEditing(false);
  };

  const name = user?.name?.trim() || "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="profile-container mt-3 mb-4">
      <button
        type="button"
        className="profile-back-btn"
        onClick={() => navigate("/home")}
      >
        ← Back to Home
      </button>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">{initial}</div>
          </div>
          <div className="profile-info-section">
            <div className="profile-title-row">
              <h2 className="profile-name">{name}</h2>
              {!editing && (
                <button
                  type="button"
                  className="profile-btn profile-btn-primary"
                  onClick={() => setEditing(true)}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <Form onSubmit={handleSave}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label className="profile-field-label">
                      Name
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="profile-field-label">
                      Email
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      name="email"
                      type="email"
                      value={form.email}
                      disabled
                    />
                  </Col>
                  <Col xs={12} className="mb-3">
                    <Form.Label className="profile-field-label">
                      Bio
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      className="profile-form-control"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="profile-field-label">
                      Location
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="profile-field-label">
                      Website
                    </Form.Label>
                    <Form.Control
                      className="profile-form-control"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                    />
                  </Col>
                </Row>
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="profile-btn profile-btn-success"
                  >
                    ✓ Save
                  </button>
                  <button
                    type="button"
                    className="profile-btn profile-btn-secondary"
                    onClick={handleCancel}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </Form>
            ) : (
              <div className="profile-fields">
                <ProfileField
                  label="Full Name"
                  value={user?.name}
                  emptyLabel="Not provided"
                />
                <ProfileField
                  label="Email Address"
                  value={user?.email}
                  emptyLabel="Not provided"
                />
                <ProfileField
                  label="Bio"
                  value={user?.bio}
                  emptyLabel="No bio added yet"
                />
                <ProfileField
                  label="Location"
                  value={user?.location}
                  emptyLabel="Not provided"
                />
                <ProfileField
                  label="Website"
                  value={user?.website}
                  emptyLabel="Not provided"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
