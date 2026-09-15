import "./StateViews.css";

export function LoadingView({ label = "Loading…" }) {
  return (
    <div className="stateView">
      <div className="stateView__spinner" aria-hidden="true" />
      <div className="stateView__label">{label}</div>
    </div>
  );
}

export function ErrorView({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="stateView">
      <div className="stateView__label" style={{ color: "var(--red)" }}>
        {message}
      </div>
      {onRetry && (
        <button className="stateView__retry" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}
