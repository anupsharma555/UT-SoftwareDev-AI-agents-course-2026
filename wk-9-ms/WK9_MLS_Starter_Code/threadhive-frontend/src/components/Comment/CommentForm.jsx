import { Card, Form, Button } from "react-bootstrap";
import RephraseControls from '../Rephrase/RephraseControls';
import useRephrase from '../Rephrase/useRephrase';
import './CommentForm.css';

export default function CommentForm({ commentText, onCommentChange, onPostComment, onReplaceText, disabled }) {
  const rephrase = useRephrase();
  const acceptRephrase = (value) => {
    if (onReplaceText) onReplaceText(value);
    else if (onCommentChange) onCommentChange({ target: { value } });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onPostComment) {
      onPostComment();
    }
  };

  return (
    <Card className="add-comment-section mb-4 border-0">
      <Card.Body>
        <h5 className="add-comment-title">Add a Comment</h5>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="commentTextarea" className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Write a comment..."
              value={commentText}
              onChange={onCommentChange}
              required
              className="comment-textarea"
            />
          </Form.Group>
          <RephraseControls
            label="comment"
            text={commentText}
            rephrase={rephrase}
            onAccept={acceptRephrase}
          />
          <Button 
            variant="primary" 
            type="submit" 
            disabled={disabled || !commentText?.trim()}
            className="post-comment-btn"
          >
            📝 Post Comment
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
