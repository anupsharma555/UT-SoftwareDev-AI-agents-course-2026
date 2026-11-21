import { useState } from 'react';
import { Card, Row, Col, Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaUser, FaClock } from 'react-icons/fa';
import { voteAnswer, editAnswer } from '../../reducers/questionSlice';
import { formatDate } from '../../utils/timeFormat';
import VoteButtons from '../Shared/VoteButtons';
import { summarizeAnswers } from '../../services/aiService';
import './AnswerList.css';

const AnswerList = ({ answers, question }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState('');

  const startEditing = (answer) => {
    setEditingId(answer._id);
    setDraftText(answer.answerText);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftText('');
  };

  const handleSaveAnswer = async (answerId) => {
    const result = await dispatch(
      editAnswer({ answerId, answerText: draftText }),
    );
    if (editAnswer.fulfilled.match(result)) {
      cancelEditing();
    } else {
      alert(result.payload || 'Failed to update answer. Please try again.');
    }
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    try {
      const data = await summarizeAnswers(question?.title, question?.description, answers, userInfo?.token);
      setSummary(data.summary);
      setSummaryVisible(true);
    } catch (err) {
      alert('Failed to summarize answers. Please try again.');
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <Card className="alist-card">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0 alist-title">
            {answers?.length || 0} {answers?.length === 1 ? 'Answer' : 'Answers'}
          </h4>
          {answers?.length >= 3 && !summaryVisible && !!userInfo && (
            <Button
              size="sm"
              variant="outline-secondary"
              className="alist-summarize-btn"
              onClick={handleSummarize}
              disabled={summaryLoading}
            >
              {summaryLoading ? 'Summarizing...' : 'Summarize Answers'}
            </Button>
          )}
        </div>

        {summaryVisible && summary && (
          <div className="alist-summary-banner mb-3">
            <div className="alist-summary-header">
              <span className="alist-summary-label">AI Summary</span>
              <Button
                size="sm"
                variant="link"
                className="alist-summary-dismiss"
                onClick={() => setSummaryVisible(false)}
              >
                Dismiss
              </Button>
            </div>
            <p className="alist-summary-text mb-0">{summary}</p>
          </div>
        )}

        {answers && answers.length > 0 ? (
          answers.map((answer) => (
            <Card
              key={answer._id}
              className="mb-1 alist-answer-card"
            >
              <Card.Body className="p-2">
                <Row>
                  {/* Voting Controls */}
                  <Col xs="auto" className="d-flex flex-column align-items-center align-self-start pe-3">
                    <VoteButtons
                      voteCount={answer.voteCount}
                      authorId={answer.author?._id}
                      onVote={(voteType) => dispatch(voteAnswer({ answer, voteType }))}
                      variant="outline-secondary"
                      upClassName="alist-vote-btn alist-vote-btn-up"
                      downClassName="alist-vote-btn alist-vote-btn-down"
                      countClassName="alist-vote-count"
                      upIconClassName="alist-icon-up"
                      downIconClassName="alist-icon-down"
                      itemType="answer"
                    />
                  </Col>

                  {/* Answer Content */}
                  <Col>
                    {editingId === answer._id ? (
                      <>
                        <Form.Group className="mb-2">
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            aria-label="Edit answer"
                          />
                        </Form.Group>
                        <div className="d-flex gap-2 mb-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveAnswer(answer._id)}
                            disabled={!draftText.trim()}
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
                      <div className="mb-2 alist-content">
                        {answer.answerText}
                      </div>
                    )}
                    <div className="mt-2 d-flex align-items-center gap-2 alist-meta">
                      <FaUser className="alist-icon-sm" />
                      <span>Answered by </span>
                      <strong className="alist-author">{answer.author?.name}</strong>
                      {answer.createdAt && (
                        <>
                          <span className="mx-2">•</span>
                          <FaClock className="alist-icon-sm" />
                          <span>{formatDate(answer.createdAt)}</span>
                        </>
                      )}
                      {answer.isEdited && (
                        <span
                          className="alist-edited-badge"
                          title="This answer has been edited"
                        >
                          edited
                        </span>
                      )}
                      {!!userInfo &&
                        userInfo.userId === answer.author?._id &&
                        editingId !== answer._id && (
                          <Button
                            variant="link"
                            size="sm"
                            className="alist-edit-btn p-0 ms-auto"
                            onClick={() => startEditing(answer)}
                          >
                            Edit
                          </Button>
                        )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="mb-0 alist-meta">No answers yet. Be the first to answer!</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AnswerList;
