import { useEffect, useState } from "react";
import { fetchRecentThreads } from "../../services/threadService";
import ThreadList from "../../components/ThreadList/ThreadList";
import CreateThreadForm from "../../components/Forms/CreateThreadForm";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { handleApiError } from "../../utils/handleApiError";
import "./Home.css";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadThreads = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchRecentThreads();
        setThreads(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, []);

  const handleVoteUpdate = (threadId, newVoteCount) => {
    setThreads(
      threads.map((thread) =>
        thread._id === threadId
          ? { ...thread, voteCount: newVoteCount }
          : thread,
      ),
    );
  };

  return (
    <div className="home-wrapper">
      <Container fluid className="home-content">
        <Card className="border-0 rounded-3 shadow-sm mb-3">
          <Card.Body className="p-3 p-md-4">
            <Row className="align-items-center mb-3">
              <Col>
                <h1
                  className="fs-4 fs-md-3 fw-bold mb-0"
                  style={{ color: "var(--text-dark)" }}
                >
                  🏠 Home Feed
                </h1>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => setShowForm((visible) => !visible)}
                >
                  {showForm ? "✕ Close" : "➕ Create"}
                </Button>
              </Col>
            </Row>

            {showForm && (
              <CreateThreadForm onClose={() => setShowForm(false)} />
            )}

            {loading ? (
              <Card.Text className="text-muted text-center py-4">
                Loading threads...
              </Card.Text>
            ) : error ? (
              <Card.Text className="text-danger text-center py-4">
                Error: {error}
              </Card.Text>
            ) : threads.length > 0 ? (
              <ThreadList threads={threads} onVoteUpdate={handleVoteUpdate} />
            ) : (
              <Card.Text className="text-muted text-center py-4">
                No threads found.
              </Card.Text>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
