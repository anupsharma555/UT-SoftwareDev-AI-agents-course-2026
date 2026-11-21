import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';
import ThreadList from '../../components/ThreadList/ThreadList';
import { searchThreadsThunk } from '../../reducers/searchSlice';
import './SearchResults.css';

export default function SearchResults() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { results, loading, error } = useSelector((state) => state.search);

  useEffect(() => {
    dispatch(searchThreadsThunk(query));
  }, [dispatch, query]);

  return (
    <div className="search-results-wrapper">
      <Container fluid className="px-0">
        <h1 className="search-results-heading">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>

        {loading ? (
          <Card.Text className="search-results-state text-muted">
            Searching…
          </Card.Text>
        ) : error ? (
          <Card.Text className="search-results-state text-danger">
            Error: {error}
          </Card.Text>
        ) : results.length > 0 ? (
          <ThreadList threadsToDisplay={results} />
        ) : (
          <Card.Text className="search-results-state text-muted">
            No results for "{query}".
          </Card.Text>
        )}
      </Container>
    </div>
  );
}
