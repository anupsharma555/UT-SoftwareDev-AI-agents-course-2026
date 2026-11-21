import { Alert, Button, Spinner } from "react-bootstrap";

// Button + suggestion box for one field. `onAccept(text)` receives the
// rephrased text; the original is only replaced when the user accepts.
export default function RephraseControls({ label, text, rephrase, onAccept }) {
  const { loading, suggestion, error, request, reset } = rephrase;

  return (
    <div className="rephrase-controls mb-2" data-testid={`rephrase-${label}`}>
      <Button
        type="button"
        variant="outline-primary"
        size="sm"
        onClick={() => request(text)}
        disabled={loading || !text?.trim()}
        aria-label={`Rephrase ${label} with AI`}
      >
        {loading ? (
          <>
            <Spinner as="span" animation="border" size="sm" className="me-1" />
            Rephrasing...
          </>
        ) : (
          "✨ Rephrase with AI"
        )}
      </Button>

      {error && (
        <Alert variant="danger" dismissible onClose={reset} className="mt-2 mb-0">
          {error}
        </Alert>
      )}

      {suggestion && (
        <div className="rephrase-suggestion mt-2 p-2 border rounded">
          <div className="small text-muted mb-1">Suggested rewrite</div>
          <div data-testid={`rephrase-suggestion-${label}`} style={{ whiteSpace: "pre-wrap" }}>
            {suggestion}
          </div>
          <div className="mt-2 d-flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="success"
              onClick={() => {
                onAccept(suggestion);
                reset();
              }}
            >
              Accept
            </Button>
            <Button type="button" size="sm" variant="outline-secondary" onClick={reset}>
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
