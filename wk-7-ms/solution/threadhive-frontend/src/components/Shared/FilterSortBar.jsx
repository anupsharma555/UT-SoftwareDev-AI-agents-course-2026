import { Row, Col, ButtonGroup, Button } from "react-bootstrap";

export default function FilterSortBar({ sortBy, onSortChange }) {
  const handleSortChange = (newSortBy) => {
    onSortChange(newSortBy);
  };

  return (
    <Row className="mb-3">
      <Col>
        <div className="d-flex align-items-center gap-2">
          <span className="small fw-semibold" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
          <ButtonGroup size="sm">
            <Button
              variant={sortBy === 'newest' ? 'primary' : 'outline-secondary'}
              onClick={() => handleSortChange('newest')}
              style={{
                backgroundColor: sortBy === 'newest' ? 'var(--primary-blue)' : 'transparent',
                borderColor: 'var(--border-light)',
                color: sortBy === 'newest' ? 'white' : 'var(--text-dark)',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              🆕 Newest
            </Button>
            <Button
              variant={sortBy === 'most-upvoted' ? 'primary' : 'outline-secondary'}
              onClick={() => handleSortChange('most-upvoted')}
              style={{
                backgroundColor: sortBy === 'most-upvoted' ? 'var(--primary-blue)' : 'transparent',
                borderColor: 'var(--border-light)',
                color: sortBy === 'most-upvoted' ? 'white' : 'var(--text-dark)',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              🔥 Most Upvoted
            </Button>
          </ButtonGroup>
        </div>
      </Col>
    </Row>
  );
}
