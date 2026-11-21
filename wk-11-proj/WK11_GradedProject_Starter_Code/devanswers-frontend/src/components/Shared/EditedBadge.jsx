import { formatDate } from '../../utils/timeFormat';
import './EditedBadge.css';

/**
 * "(edited)" indicator for questions and answers. Renders nothing for posts that were never edited.
 * Hovering shows when the edit happened.
 */
const EditedBadge = ({ editedAt, className = '' }) => {
  if (!editedAt) {
    return null;
  }

  const time = new Date(editedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const label = `Edited ${formatDate(editedAt)} at ${time}`;

  return (
    <span className={`text-muted fst-italic edited-badge ${className}`} title={label} aria-label={label}>
      (edited)
    </span>
  );
};

export default EditedBadge;
