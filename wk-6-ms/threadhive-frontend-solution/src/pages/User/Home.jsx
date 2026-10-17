import { useState, useEffect } from 'react';
import { fetchRecentThreads } from '../../services/threadService.js';
import ThreadPage from './ThreadPage.jsx';
import ThreadList from '../../components/ThreadList/ThreadList.jsx';
import { Container, Card } from "react-bootstrap";
import './Home.css';

export default function Home() {
  const [recentThreads, setRecentThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);

  useEffect(() => {
    fetchRecentThreads().then(setRecentThreads);
  }, []);

  if (selectedThread) {
    return <ThreadPage thread={selectedThread} goBack={() => setSelectedThread(null)} />;
  }

  return (
    <Container className="home-container">
      <Card className="home-card shadow-lg border-0 rounded-4 p-4">
        <h1 className="home-title mb-4 display-6 fw-semibold border-bottom pb-2">
          🧵 Recent Threads
        </h1>
        {recentThreads.length > 0 ? (
          <ThreadList threads={recentThreads} onSelect={setSelectedThread} />
        ) : (
          <div className="text-muted">No threads found.</div>
        )}
      </Card>
    </Container>
  );
}