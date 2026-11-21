import { Button } from 'react-bootstrap';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../../reducers/bookmarkSlice';

/**
 * Shared bookmark toggle used by QuestionCard and QuestionContent.
 * Renders nothing for logged-out visitors; shows a filled icon when the
 * question is in the user's saved set and an outline icon otherwise.
 */
const BookmarkButton = ({ questionId, className = '' }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const savedIds = useSelector((state) => state.bookmark.savedIds);

  if (!userInfo) {
    return null;
  }

  const isSaved = savedIds.includes(questionId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await dispatch(toggleBookmark({ questionId })).unwrap();
    } catch (error) {
      alert(`Failed to ${isSaved ? 'unsave' : 'save'} question: ${error}`);
    }
  };

  return (
    <Button
      variant="link"
      onClick={handleClick}
      className={`p-0 text-decoration-none ${className}`}
      aria-label={isSaved ? 'Saved' : 'Save'}
      title={isSaved ? 'Saved' : 'Save'}
      aria-pressed={isSaved}
    >
      {isSaved ? <FaBookmark /> : <FaRegBookmark />}
    </Button>
  );
};

export default BookmarkButton;
