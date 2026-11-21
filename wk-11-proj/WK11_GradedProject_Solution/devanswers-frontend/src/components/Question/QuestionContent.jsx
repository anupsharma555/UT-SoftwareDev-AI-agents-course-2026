import { useState } from 'react';
import { Card, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaUser, FaClock } from 'react-icons/fa';
import { voteQuestion, editQuestion } from '../../reducers/questionSlice';
import { formatDate } from '../../utils/timeFormat';
import VoteButtons from '../Shared/VoteButtons';
import BookmarkButton from '../Shared/BookmarkButton';
import './QuestionContent.css';

const QuestionContent = ({ question }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);

  const isOwner = !!userInfo && userInfo.userId === question.author?._id;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description);
  const [tags, setTags] = useState('');

  const startEditing = () => {
    setTitle(question.title);
    setDescription(question.description);
    setTags(question.tags?.map((t) => t.name).join(', ') || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const isSaveDisabled = !title.trim() || !description.trim();

  const handleSave = async () => {
    const result = await dispatch(
      editQuestion({ questionId: question._id, title, description, tags }),
    );
    if (editQuestion.fulfilled.match(result)) {
      setIsEditing(false);
    } else {
      alert(result.payload || 'Failed to update question. Please try again.');
    }
  };

  return (
    <>
      {/* Question Header */}
      <Card className="mb-4 qcontent-header-card">
        <Card.Body className="p-3 p-sm-4">
          {isEditing ? (
            <Form.Group className="mb-3">
              <Form.Label className="qcontent-edit-label">Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Edit title"
              />
            </Form.Group>
          ) : (
            <Card.Title as="h2" className="mb-3 qcontent-title">
              {question.title}
            </Card.Title>
          )}
          <div className="d-flex flex-wrap align-items-center gap-3 gap-sm-4 qcontent-meta">
            <span className="d-flex align-items-center gap-2">
              <FaClock />
              Asked {formatDate(question.createdAt)}
            </span>
            {question.isEdited && (
              <span className="qcontent-edited-badge" title="This post has been edited">
                edited{question.editedAt ? ` ${formatDate(question.editedAt)}` : ''}
              </span>
            )}
            {isOwner && !isEditing && (
              <Button
                size="sm"
                variant="outline-secondary"
                className="ms-auto qcontent-edit-btn"
                onClick={startEditing}
              >
                Edit
              </Button>
            )}
          </div>
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
              <BookmarkButton questionId={question._id} className="mt-3 qcontent-bookmark-btn" />
            </Col>

            {/* Main Content */}
            <Col>
              {isEditing ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="qcontent-edit-label">
                      Description
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      aria-label="Edit description"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="qcontent-edit-label">
                      Tags (comma-separated)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      aria-label="Edit tags"
                    />
                  </Form.Group>
                  <div className="d-flex gap-2 mb-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaveDisabled}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
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
