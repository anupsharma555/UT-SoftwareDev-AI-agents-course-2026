import { Button } from "react-bootstrap";

export default function VoteButtons({ count, onUpvote, onDownvote, btnClassName, countClassName }) {
  return (
    <>
      <Button variant="light" size="sm" onClick={onUpvote} aria-label="Upvote" className={btnClassName}>
        <i className="bi bi-arrow-up"></i>
      </Button>
      <div className={countClassName}>{count}</div>
      <Button variant="light" size="sm" onClick={onDownvote} aria-label="Downvote" className={btnClassName}>
        <i className="bi bi-arrow-down"></i>
      </Button>
    </>
  );
}
