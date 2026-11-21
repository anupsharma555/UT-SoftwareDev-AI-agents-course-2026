import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchThreadById } from '../../services/threadService';
import { fetchCommentsForThread, postComment } from '../../services/commentService';

import ThreadCard from '../../components/ThreadList/ThreadCard';
import CommentList from '../../components/Comment/CommentList';
import CommentForm from '../../components/Comment/CommentForm';
import { Container, Card } from "react-bootstrap";
import './ThreadPage.css';

export default function ThreadPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();

  const [commentText, setCommentText] = useState('');
  const [thread, setThread] = useState(null);
  const [threadComments, setThreadComments] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState(null);

  useEffect(() => {
    const loadThreadData = async () => {
      if (!threadId) return;
      
      setThreadLoading(true);
      setThreadError(null);
      
      try {
        // Fetch thread and comments in parallel
        const [threadData, commentsData] = await Promise.all([
          fetchThreadById(threadId),
          fetchCommentsForThread(threadId)
        ]);
        
        setThread(threadData);
        setThreadComments(commentsData || []);
      } catch (err) {
        setThreadError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load thread');
      } finally {
        setThreadLoading(false);
      }
    };
    
    loadThreadData();
  }, [threadId]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    try {
      const newComment = await postComment({ threadId, content: commentText });
      
      // Add the new comment to the list
      setThreadComments([...threadComments, newComment]);
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment');
    }
  };

  const handleThreadVoteUpdate = (updatedThreadId, newVoteCount) => {
    if (thread && thread._id === updatedThreadId) {
      setThread({ ...thread, voteCount: newVoteCount });
    }
  };

  if (threadError) {
    return <div className="container my-5 text-danger">{threadError}</div>;
  }

  if (threadLoading || !thread) {
    return <div className="container my-5 text-muted">Loading thread...</div>;
  }

  return (
    <Container className="thread-container">
      {/* Thread Card */}
      <div className="mb-4">
        <ThreadCard thread={thread} goBack={() => navigate(-1)} onVoteUpdate={handleThreadVoteUpdate} />
      </div>

      {/* Post Comment Input */}
      <CommentForm 
        commentText={commentText}
        onCommentChange={(e) => setCommentText(e.target.value)}
        onPostComment={handlePostComment}
        disabled={!commentText.trim()}
      />

      {/* Comments Section */}
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
