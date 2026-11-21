const API_BASE_URL = "http://localhost:5000/api";
// const API_BASE_URL = "https://w04-mls.onrender.com/api";

// Utility function to make fetch requests
export const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || "API Error");
    error.response = {
      status: response.status,
      data: errorData,
    };
    throw error;
  }

  return response.json();
};

export default fetchAPI;
