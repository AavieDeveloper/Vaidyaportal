import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./HerbModal.css";

/**
 * Bottom-sheet (mobile) / centered dialog (desktop) for adding a
 * herb to a jar — constrained to the engine's known herb
 * vocabulary (`herbPool`), excluding herbs already in that jar.
 */
export default function HerbModal({ open, herbPool, alreadyInJar, onAdd, onClose }) {
  const [query, setQuery] = useState("");

  // Reset search whenever the modal opens
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const options = useMemo(() => {
    if (!open) return [];
    const already = new Set(alreadyInJar || []);
    const q = query.trim().toLowerCase();
    
    // Handle both array and object formats for herbPool
    let herbEntries = [];
    if (Array.isArray(herbPool)) {
      herbEntries = herbPool.map(h => [h, ""]);
    } else if (herbPool && typeof herbPool === 'object') {
      herbEntries = Object.entries(herbPool);
    } else {
      herbEntries = [];
    }
    
    return herbEntries
      .filter(([name]) => !already.has(name))
      .filter(([name]) => name.toLowerCase().includes(q));
  }, [open, herbPool, alreadyInJar, query]);

  if (!open) return null;

  return createPortal(
    <div className="herbModal__overlay" onClick={onClose}>
      <div
        className="herbModal__sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add herb"
      >
        <div className="herbModal__handle" />
        <div className="herbModal__title">Add Herb (AAVIE engine set)</div>
        <input
          className="searchBar"
          placeholder="Search herbs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="herbModal__content">
          {options.length === 0 ? (
            <div className="herbModal__empty">
              No matching herbs outside what's already suggested.
            </div>
          ) : (
            options.map(([name, reason]) => (
              <div
                key={name}
                className="herbRow"
                onClick={() => onAdd(name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onAdd(name);
                }}
              >
                <div style={{ flex: 1 }}>
                  <div className="herbRow__name">{name}</div>
                  <div className="herbRow__sub">{reason || "Standard herb"}</div>
                </div>
                <span className="herbModal__plus">+</span>
              </div>
            ))
          )}
        </div>
        <button className="herbModal__cancel" onClick={onClose} type="button">
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}