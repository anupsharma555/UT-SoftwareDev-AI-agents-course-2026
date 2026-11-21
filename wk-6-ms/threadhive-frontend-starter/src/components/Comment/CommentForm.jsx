import { Card, Form, Button } from "react-bootstrap";
import "./CommentForm.css";

export default function CommentForm() {
  const handlePostComment = (event) => {
    event.preventDefault();
    alert("Post Comment clicked!");
  };

  return (
    <Card className="add-comment-section mb-4 border-0">
      <Card.Body>
        <h5 className="add-comment-title">Add a Comment</h5>
        <Form onSubmit={handlePostComment}>
          <Form.Group controlId="commentTextarea" className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Write a comment..."
              required
              className="comment-textarea"
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="post-comment-btn">
            Post Comment
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
