// services/userService.js
import { users } from "../../data/dummyData"; // Replace later with Axios

export function getUserName(userId) {
  // Dummy logic for now. Replace with actual API call later.
  const user = users.find((u) => u._id === userId);
  return user ? user.name : "Unknown";
}
