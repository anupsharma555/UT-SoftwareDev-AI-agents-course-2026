import { useState, useEffect } from 'react';
import { createThread } from '../../services/threadService';
import { fetchSubreddits, createSubreddit } from '../../services/subredditService';
import { Container, Row, Col, Form } from 'react-bootstrap';
import './CreateThreadForm.css';

export default function CreateThreadForm({ onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subredditId, setSubredditId] = useState('');
  const [subreddits, setSubreddits] = useState([]);
  const [newSubredditName, setNewSubredditName] = useState('');
  const [newSubredditDescription, setNewSubredditDescription] = useState('');

  useEffect(() => {
    fetchSubreddits()
      .then(setSubreddits)
      .catch((err) => {
        console.error('Error fetching subreddits:', err);
        setSubreddits([]);
      });
  }, []);

  const handleNewSubredditChange = (e) => {
    const value = e.target.value;
    setNewSubredditName(value);
    if (value.trim()) {
      setSubredditId('');
    }
  };

  const handleSubredditSelect = (e) => {
    const value = e.target.value;
    setSubredditId(value);
    if (value) {
      setNewSubredditName('');
      setNewSubredditDescription('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let subredditToUse = subredditId;

      // Create new subreddit first if needed
      if (newSubredditName.trim()) {
        if (!newSubredditDescription.trim()) {
          alert('Please provide a description for the new subreddit.');
          return;
        }

        const newSubreddit = await createSubreddit({
          name: newSubredditName,
          description: newSubredditDescription,
        });

        subredditToUse = newSubreddit._id;
        setSubreddits((prev) => [...prev, newSubreddit]);
        setSubredditId(newSubreddit._id);
      }

      if (!subredditToUse) {
        alert('Please select or create a subreddit before posting.');
        return;
      }

      // Create thread
      const createdThread = await createThread({
        title,
        content,
        subreddit: subredditToUse,
      });

      // Log before reload so we can see in Network tab
      console.log('Thread created:', createdThread);
      
      // Don't reload - instead close form and let parent refresh
      onClose();
      
      // Small delay to ensure backend has processed, then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Error creating thread:', err);
      console.error('Error response:', err.response);
      alert(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create thread. Please try again.');
    }
  };

  return (
    <Container fluid className="create-thread-form px-0">
      <Row className="justify-content-center">
        <Col xs={12}>
          <h3 className="form-title">✏️ Create New Thread</h3>
          <Form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group-custom">
              <label className="form-label-custom">Thread Title</label>
              <input
                type="text"
                className="form-control-custom"
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Content */}
            <div className="form-group-custom">
              <label className="form-label-custom">Content</label>
              <textarea
                className="form-control-custom form-textarea-custom"
                rows={4}
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* Subreddit Selection */}
            <div className="form-group-custom">
              <label className="form-label-custom">Community</label>
              {subreddits.length > 0 ? (
                <select
                  className="form-control-custom"
                  value={subredditId}
                  onChange={handleSubredditSelect}
                  disabled={!!newSubredditName.trim()}
                >
                  <option value="">Select a community</option>
                  {subreddits.map((sr) => (
                    <option key={sr._id} value={sr._id}>
                      r/{sr.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="form-hint">No communities found.</p>
              )}

              <div className="new-subreddit-section">
                <label className="form-label-custom mb-2">Or Create New Community</label>
                <input
                  type="text"
                  className="form-control-custom mb-2"
                  placeholder={
                    subredditId
                      ? 'Deselect above to create new'
                      : 'Enter community name'
                  }
                  value={newSubredditName}
                  onChange={handleNewSubredditChange}
                  disabled={!!subredditId}
                />
                {newSubredditName && !subredditId && (
                  <textarea
                    className="form-control-custom"
                    rows={2}
                    placeholder="Describe your community"
                    value={newSubredditDescription}
                    onChange={(e) => setNewSubredditDescription(e.target.value)}
                    required
                  />
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="form-btn form-btn-primary">
                📝 Post Thread
              </button>
              <button type="button" className="form-btn form-btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
