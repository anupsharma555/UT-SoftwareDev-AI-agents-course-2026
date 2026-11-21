import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaPaperPlane } from 'react-icons/fa';

import { postQuestion } from '../../reducers/questionSlice.js';
import { improveQuestion } from '../../services/questionService.js';

import { Alert, Col, Container, Form, Button, Card, Row } from 'react-bootstrap';
import './PostQuestion.css';

const Suggestion = ({ field, value, onAccept, onReject }) => {
  if (!value) return null;

  return (
    <Alert variant="info" className="mt-3 mb-0">
      <strong>Suggested {field}</strong>
      <p className="mb-2 mt-1">{value}</p>
      <div className="d-flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="success"
          aria-label={`Accept suggested ${field}`}
          onClick={onAccept}
        >
          Accept
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline-secondary"
          aria-label={`Reject suggested ${field}`}
          onClick={onReject}
        >
          Reject
        </Button>
      </div>
    </Alert>
  );
};

const PostQuestion = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);

  const handleImprove = async () => {
    setIsImproving(true);
    setImproveError('');

    try {
      const result = await improveQuestion(
        { title, description, tags },
        userInfo?.token,
      );
      setSuggestions(result);
    } catch (error) {
      setImproveError(
        error.response?.data?.message ||
          'Could not optimize this question. Please try again.',
      );
    } finally {
      setIsImproving(false);
    }
  };

  const handleSuggestion = (field, accept) => {
    if (accept) {
      const setters = {
        title: setTitle,
        description: setDescription,
        tags: setTags,
      };
      setters[field](suggestions[field]);
    }
    setSuggestions((current) => ({ ...current, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(postQuestion({ title, description, tags }));
      
      if (postQuestion.fulfilled.match(result)) {
        const newQuestion = result.payload;
        alert('Question posted successfully!');
        navigate(`/question/${newQuestion._id}`);
      }
    } catch (error) {
      console.error('Error posting question:', error);
      alert('Failed to post question. Please try again.');
    }
  };

  return (
    <Container className="py-3 px-2 py-sm-4 px-sm-3 pq-page-container">
      <Row className="justify-content-center">
         <Col xs={12} lg={10} xl={9}>
            <Card className="mb-4 pq-header-card">
              <Card.Body className="p-3 p-sm-4">
                  <Card.Title as="h2" className="pq-title">
                    Ask a Question
                  </Card.Title>
                  <p className="text-muted mb-0">Be specific and imagine you're asking another person</p>
              </Card.Body>
            </Card>

            <Card className="pq-body-card">
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label htmlFor="title" className="pq-label">
                      Title
                    </Form.Label>
                    <Form.Control
                      type="text"
                      id="title"
                      name="title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setSuggestions((current) =>
                          current ? { ...current, title: null } : current,
                        );
                      }}
                      placeholder="What's your programming question?"
                      required
                      className="pq-input"
                    />
                    <Suggestion
                      field="title"
                      value={suggestions?.title}
                      onAccept={() => handleSuggestion('title', true)}
                      onReject={() => handleSuggestion('title', false)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label htmlFor="description" className="pq-label">
                      Description
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      id="description"
                      name="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setSuggestions((current) =>
                          current ? { ...current, description: null } : current,
                        );
                      }}
                      placeholder="Provide more details about your question..."
                      rows={10}
                      required
                      className="pq-textarea"
                    />
                    <Suggestion
                      field="description"
                      value={suggestions?.description}
                      onAccept={() => handleSuggestion('description', true)}
                      onReject={() => handleSuggestion('description', false)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label htmlFor="tags" className="pq-label">
                      Tags (comma-separated)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      id="tags"
                      name="tags"
                      value={tags}
                      onChange={(e) => {
                        setTags(e.target.value);
                        setSuggestions((current) =>
                          current ? { ...current, tags: null } : current,
                        );
                      }}
                      placeholder="e.g., javascript, react, css"
                      className="pq-input"
                    />
                    <Form.Text className="text-muted">
                      Add up to 5 tags to describe what your question is about
                    </Form.Text>
                    <Suggestion
                      field="tags"
                      value={suggestions?.tags}
                      onAccept={() => handleSuggestion('tags', true)}
                      onReject={() => handleSuggestion('tags', false)}
                    />
                  </Form.Group>

                  {improveError && (
                    <Alert variant="danger" role="alert">
                      {improveError}
                    </Alert>
                  )}
                  <Button
                    type="button"
                    variant="outline-primary"
                    className="w-100 mb-3"
                    onClick={handleImprove}
                    disabled={
                      !userInfo?.token ||
                      isImproving ||
                      !title.trim() ||
                      !description.trim()
                    }
                  >
                    {isImproving ? 'Optimizing question...' : 'Optimize question with AI'}
                  </Button>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="w-100 pq-btn"
                  >
                    <FaPaperPlane className="me-2" />
                    Post Question
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
    </Container>
  );
};

export default PostQuestion;