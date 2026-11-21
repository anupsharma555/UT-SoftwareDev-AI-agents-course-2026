import { Button } from "react-bootstrap";

export default function VoteButtons({ count, onUpvote, onDownvote }) {
  return (
    <>
      <Button 
        variant="light" 
        size="sm" 
        onClick={onUpvote} 
        aria-label="Upvote"
      >
        <i className="bi bi-arrow-up"></i>
      </Button>
      <span className="mx-2 fw-bold">{count}</span>
      <Button 
        variant="light" 
        size="sm" 
        onClick={onDownvote} 
        aria-label="Downvote"
      >
        <i className="bi bi-arrow-down"></i>
      </Button>
    </>
  );
}
