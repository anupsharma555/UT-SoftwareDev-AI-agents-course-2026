import { useState } from 'react';
import { Card, Row, Col, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaUser, FaClock, FaPencilAlt } from 'react-icons/fa';
import { voteQuestion, updateQuestion } from '../../reducers/questionSlice';
import { formatDate } from '../../utils/timeFormat';
import VoteButtons from '../Shared/VoteButtons';
import BookmarkButton from '../Shared/BookmarkButton';
import EditedBadge from '../Shared/EditedBadge';
import './QuestionContent.css';

const tagsToString = (tags = []) =>
  tags.map((tag) => tag?.name ?? tag).filter(Boolean).join(', ');

// Mirrors the server rules, so blank content is blocked before any request is sent.
const validateQuestionEdit = ({ title, description, tags }) => {
  if (!title.trim()) return 'Title is required';
  if (!description.trim()) return 'Description is required';
  if (!tags.split(',').some((tag) => tag.trim())) return 'At least one tag is required';
  return null;
};

const QuestionContent = ({ question }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);
  // Only the author gets the edit control. The server enforces this too.
  const isAuthor = !!userInfo && !!question.author?._id && question.author._id === userInfo.userId;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', tags: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDraft({
      title: question.title ?? '',
      description: question.description ?? '',
      tags: tagsToString(question.tags),
    });
    setError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
  };

  const handleChange = (e) => {
    setDraft({ ...draft, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validateQuestionEdit(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await dispatch(
        updateQuestion({
          questionId: question._id,
          title: draft.title.trim(),
          description: draft.description.trim(),
          tags: draft.tags,
        }),
      ).unwrap();
      setIsEditing(false);
    } catch (err) {
      // Keep the form open with the user's input so nothing is lost.
      setError(typeof err === 'string' ? err : 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Question Header */}
      <Card className="mb-4 qcontent-header-card">
        <Card.Body className="p-3 p-sm-4">
          {isEditing ? (
            <Form onSubmit={handleSave} noValidate aria-label="Edit question">
              {error && <Alert variant="danger" className="py-2">{error}</Alert>}
              <Form.Group className="mb-3" controlId="edit-question-title">
                <Form.Label>Title</Form.Label>
                <Form.Control name="title" value={draft.title} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="edit-question-description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="description"
                  value={draft.description}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="edit-question-tags">
                <Form.Label>Tags</Form.Label>
                <Form.Control
                  name="tags"
                  value={draft.tags}
                  onChange={handleChange}
                  placeholder="Comma-separated, e.g. react, redux"
                />
              </Form.Group>
              <div className="d-flex gap-2 justify-content-end">
                <Button variant="outline-secondary" onClick={cancelEditing} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner animation="border" size="sm" /> : 'Save'}
                </Button>
              </div>
            </Form>
          ) : (
            <>
              <div className="d-flex align-items-start justify-content-between gap-2">
                <Card.Title as="h2" className="mb-3 qcontent-title">
                  {question.title}
                </Card.Title>
                {isAuthor && (
                  <Button
                    variant="link"
                    className="p-0 text-decoration-none qcontent-edit-btn"
                    onClick={startEditing}
                    aria-label="Edit question"
                    title="Edit question"
                  >
                    <FaPencilAlt />
                  </Button>
                )}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-3 gap-sm-4 qcontent-meta">
                <span className="d-flex align-items-center gap-2">
                  <FaClock />
                  Asked {formatDate(question.createdAt)}
                </span>
                <EditedBadge editedAt={question.editedAt} />
                <BookmarkButton questionId={question._id} />
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Question Content */}
      <Card className="mb-4 qcontent-body-card">
        <Card.Body className="p-3 p-sm-4">
          <Row>
            {/* Voting Controls */}
            <Col xs="auto" className="d-flex flex-column align-items-center pe-3 pe-sm-4">
              <VoteButtons
                voteCount={question.voteCount}
                authorId={question.author?._id}
                onVote={(voteType) => dispatch(voteQuestion({ question, voteType }))}
                variant="outline-secondary"
                upClassName="mb-2 qcontent-vote-btn"
                downClassName="mt-2 qcontent-vote-btn"
                countClassName="qcontent-vote-count"
                upIconClassName="qcontent-icon-up"
                downIconClassName="qcontent-icon-down"
                itemType="question"
              />
            </Col>

            {/* Main Content */}
            <Col>
              {!isEditing && (
                <>
                  <div className="mb-4 qcontent-description">
                    {question.description}
                  </div>

                  <div className="mb-4">
                    {question.tags?.map((tag) => (
                      <Badge
                        key={tag._id}
                        className="me-2 mb-2 qcontent-tag-badge"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              <div
                className="d-flex align-items-center gap-2 qcontent-author-row"
              >
                <FaUser className="qcontent-icon-sm" />
                <span>Posted by </span>
                <strong className="qcontent-author-name">{question.author?.name}</strong>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default QuestionContent;
