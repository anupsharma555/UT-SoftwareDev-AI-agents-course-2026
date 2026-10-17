import { useEffect, useState } from 'react';
import { fetchCommentsForThread } from '../../services/commentService';
import CommentList from '../../components/Comment/CommentList';
import CommentForm from '../../components/Comment/CommentForm';
import ThreadCard from '../../components/ThreadList/ThreadCard';
import { Container, Card } from "react-bootstrap";
import './ThreadPage.css';

export default function ThreadPage({ thread, goBack }) {
  const [threadComments, setThreadComments] = useState([]);

  useEffect(() => {
    fetchCommentsForThread(thread._id).then(setThreadComments);
  }, [thread._id]);

  return (
    <Container className="thread-container">
      <div className="mb-4">
        <ThreadCard thread={thread} goBack={goBack} />
      </div>

      <CommentForm />

      <section>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="comments-header-title">💬 Comments</h3>
          <span className="comments-count">{threadComments.length} total</span>
        </div>

        {threadComments.length > 0 ? (
          <CommentList comments={threadComments} />
        ) : (
          <Card className="no-comments-card border-0 shadow-sm text-center">
            <Card.Body>
              <Card.Text className="no-comments-text mb-0">
                No comments yet. Be the first!
              </Card.Text>
            </Card.Body>
          </Card>
        )}
      </section>
    </Container>
  );
}
