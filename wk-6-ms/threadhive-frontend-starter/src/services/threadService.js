// services/threadService.js
import { threads } from "../../data/dummyData";

export async function fetchRecentThreads() {
  // Dummy logic for now. Replace with actual API call later.
  const sorted = [...threads].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  return sorted;
}
