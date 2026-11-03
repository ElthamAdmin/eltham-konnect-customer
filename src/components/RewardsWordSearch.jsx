import { useState } from "react";
import api from "../api";

export default function RewardsWordSearch({
  game,
  alreadyPlayed,
  onRecorded,
}) {
  const { grid, words, rules } = game.publicConfig || {};

  const valid =
    Array.isArray(grid) &&
    grid.length === 12 &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 12 &&
        row.every((letter) => /^[A-Z]$/.test(letter))
    ) &&
    Array.isArray(words) &&
    words.length >= 3 &&
    words.every(
      (word) => typeof word === "string" && /^[A-Z]{3,12}$/.test(word)
    );

  const [start, setStart] = useState(null);
  const [found, setFound] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const locked = alreadyPlayed || recorded || busy;

  if (!valid) {
    return <p role="alert">This word-search board is unavailable.</p>;
  }

  const selectCell = (row, column) => {
    if (locked) return;

    if (!start) {
      setStart([row, column]);
      setMessage("Now select the last letter of the word.");
      return;
    }

    const end = [row, column];
    const rowDistance = row - start[0];
    const columnDistance = column - start[1];

    if (!rowDistance && !columnDistance) {
      setStart(null);
      setMessage("Selection cancelled.");
      return;
    }

    if (
      rowDistance !== 0 &&
      columnDistance !== 0 &&
      Math.abs(rowDistance) !== Math.abs(columnDistance)
    ) {
      setStart(null);
      setMessage("Select a straight horizontal, vertical or diagonal line.");
      return;
    }

    const length =
      Math.max(Math.abs(rowDistance), Math.abs(columnDistance)) + 1;

    const dr = Math.sign(rowDistance);
    const dc = Math.sign(columnDistance);

    const cells = Array.from({ length }, (_, index) => [
      start[0] + dr * index,
      start[1] + dc * index,
    ]);

    const selected = cells
      .map(([r, c]) => grid[r][c])
      .join("");

    const reversed = [...selected].reverse().join("");

    const word = words.find(
      (candidate) => candidate === selected || candidate === reversed
    );

    setStart(null);

    if (!word) {
      setMessage("That selection is not one of the listed words.");
      return;
    }

    if (found.some((item) => item.word === word)) {
      setMessage(`${word} has already been found.`);
      return;
    }

    setFound((previous) => [
      ...previous,
      { word, start: [...start], end, cells },
    ]);
    setMessage(`Found ${word}!`);
  };

  const highlighted = new Set(
    found.flatMap((item) =>
      item.cells.map(([row, column]) => `${row}-${column}`)
    )
  );

  const submit = async () => {
    if (locked || found.length !== words.length) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await api.post(
        "/api/rewards-hub-games/play",
        {
          gameId: game._id,
          submittedAnswer: JSON.stringify(
            found.map(({ start, end }) => ({ start, end }))
          ),
        }
      );

      const play = response.data?.data?.play;

      if (!response.data?.success || !play) {
        throw new Error(
          "Could not confirm completion. Refresh your game history before retrying."
        );
      }

      setRecorded(true);
      setMessage(response.data.message || "Puzzle completed.");
      onRecorded?.(play);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Could not submit the puzzle."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ek-word-search">
      <style>{`
        .ek-word-search {
          margin-top:16px;
          color:#15345d;
        }
        .ek-word-search-grid {
          display:grid;
          grid-template-columns:repeat(12,minmax(0,1fr));
          width:100%;
          max-width:480px;
          margin:16px auto;
          border:2px solid #0b3d91;
          border-radius:8px;
          overflow:hidden;
        }
        .ek-word-search-grid button {
          width:100%;
          min-width:0;
          min-height:0 !important;
          aspect-ratio:1;
          padding:0;
          border:0;
          border-right:1px solid #dbe3ef;
          border-bottom:1px solid #dbe3ef;
          border-radius:0;
          font-family:inherit;
          font-weight:bold;
          font-size:clamp(12px,2vw,18px);
          cursor:pointer;
          touch-action:manipulation;
        }
        .ek-word-search-grid button:hover {
          transform:none !important;
        }
        .ek-word-search-grid button:disabled {
          opacity:1;
          cursor:default;
        }
        .ek-word-search-grid button:focus-visible {
          outline:3px solid #f15a24;
          outline-offset:-3px;
        }
        .ek-word-search-words {
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          padding:0;
          list-style:none;
        }
        .ek-word-search-words li {
          padding:6px 10px;
          border-radius:20px;
          border:1px solid #dbe3ef;
          font-size:13px;
        }
        .ek-word-search-actions {
          display:flex;
          justify-content:center;
          flex-wrap:wrap;
          gap:10px;
        }
        .ek-word-search-actions button {
          min-height:44px;
          padding:10px 14px;
          border:1px solid #0b3d91;
          border-radius:9px;
          background:white;
          color:#0b3d91;
          font:inherit;
          font-weight:bold;
          cursor:pointer;
        }
        .ek-word-search-actions button:disabled {
          opacity:.55;
          cursor:default;
        }
        .ek-word-search-actions .ek-word-search-submit {
          background:#0b3d91;
          color:white;
        }
      `}</style>

      <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
        {rules}
      </p>

      <strong>
        {found.length} of {words.length} words found
      </strong>

      <ul className="ek-word-search-words">
        {words.map((word) => {
          const complete = found.some((item) => item.word === word);

          return (
            <li
              key={word}
              style={{
                backgroundColor: complete ? "#e7f1ff" : "#ffffff",
                textDecoration: complete ? "line-through" : "none",
              }}
            >
              {word}{complete ? " ✓" : ""}
            </li>
          );
        })}
      </ul>

      <div
        className="ek-word-search-grid"
        role="group"
        aria-label="Find-a-Word puzzle"
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((letter, columnIndex) => {
            const first =
              start?.[0] === rowIndex &&
              start?.[1] === columnIndex;

            const complete = highlighted.has(
              `${rowIndex}-${columnIndex}`
            );

            return (
              <button
                type="button"
                key={`${rowIndex}-${columnIndex}`}
                disabled={locked}
                aria-label={
                  `Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter}` +
                  (complete ? ", found word" : "")
                }
                aria-pressed={first}
                onClick={() => selectCell(rowIndex, columnIndex)}
                style={{
                  backgroundColor: first
                    ? "#f15a24"
                    : complete
                      ? "#dceaff"
                      : "#ffffff",
                  color: first ? "#ffffff" : "#0b3d91",
                }}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      {alreadyPlayed || recorded ? (
        <p style={{ fontWeight: "bold", textAlign: "center" }}>
          Your play has been recorded.
        </p>
      ) : (
        <div className="ek-word-search-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setStart(null);
              setFound([]);
              setMessage("");
            }}
          >
            Reset selections
          </button>

          <button
            type="button"
            className="ek-word-search-submit"
            disabled={busy || found.length !== words.length}
            onClick={submit}
          >
            {busy ? "Checking…" : "Submit completed puzzle"}
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          style={{
            padding: "12px",
            backgroundColor: "#fff3e9",
            borderRadius: "9px",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      )}
    </section>
  );
}