import { useCallback, useRef, useState } from "react";
import { rephraseText } from "../../services/threadService";
import { handleApiError } from "../../utils/handleApiError";

// Per-field rephrase state. Never touches the field's text itself: the caller
// applies `suggestion` only when the user accepts it.
export default function useRephrase() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const request = useCallback(async (text) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await rephraseText(text);
      if (id === requestId.current) setSuggestion(result);
    } catch (err) {
      if (id === requestId.current) setError(handleApiError(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Dismiss suggestion/error and ignore any in-flight response.
  const reset = useCallback(() => {
    requestId.current++;
    setLoading(false);
    setSuggestion(null);
    setError(null);
  }, []);

  return { loading, suggestion, error, request, reset };
}
