import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Spinner, Button, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';

import { fetchQuestionById } from '../../reducers/questionSlice.js';
import QuestionContent from '../../components/Question/QuestionContent.jsx';
import AnswerList from '../../components/Answer/AnswerList.jsx';
import AnswerForm from '../../components/Answer/AnswerForm.jsx';
import { summarizeAnswers } from '../../services/questionService.js';
import './QuestionDetail.css';

const MIN_ANSWERS_TO_SUMMARIZE = 3;

const QuestionDetail = () => {
  const { id } = useParams();

  const dispatch = useDispatch();
  const { currentQuestion, loading, error } = useSelector((state) => state.question);
  const token = useSelector((state) => state.user.userInfo?.token);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    dispatch(fetchQuestionById(id));
    setSummary(null);
    setSummaryError(null);
  }, [id, dispatch]);

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummaryError(null);
    try {
      setSummary(await summarizeAnswers(id, token));
    } catch (err) {
      setSummaryError(err.response?.data?.message || 'Could not summarize the answers. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const canSummarize =
    Boolean(token) && (currentQuestion?.answers?.length || 0) >= MIN_ANSWERS_TO_SUMMARIZE;

  if (loading) {
    return (
      <Container className="qd-loading-container">
        <Spinner />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="qd-loading-container">
        <p>Error loading question: {error}</p>
      </Container>
    );
  }

  if (!currentQuestion) {
    return (
      <Container className="qd-loading-container">
        <p>Question not found.</p>
      </Container>
    );
  }

  return (
    <Container className="qd-container">
      <Row className="justify-content-center">
        <Col xs={12} lg={10} xl={8}>
          <QuestionContent
            question={currentQuestion}
          />
          
          {canSummarize && !summary && (
            <Button
              variant="outline-primary"
              size="sm"
              className="mb-3"
              onClick={handleSummarize}
              disabled={summarizing}
            >
              {summarizing ? 'Summarizing...' : 'Summarize Answers'}
            </Button>
          )}
          {summaryError && (
            <Alert variant="danger" dismissible onClose={() => setSummaryError(null)}>
              {summaryError}
            </Alert>
          )}
          {summary && (
            <Alert variant="info" dismissible onClose={() => setSummary(null)}>
              <Alert.Heading as="h6">TL;DR</Alert.Heading>
              <p className="mb-0">{summary}</p>
            </Alert>
          )}

          <AnswerList
            answers={currentQuestion.answers}
          />
          
          <AnswerForm
            questionId={id}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default QuestionDetail;