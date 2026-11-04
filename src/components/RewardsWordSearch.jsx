import { useRef, useState } from "react";
import api from "../api";

export default function RewardsWordSearch({
  game,
  alreadyPlayed,
  onRecorded,
}) {
    const { grid, words } = game.publicConfig || {};

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

    const [storageKey] = useState(() => {
    let ekonId = "customer";

    try {
      const customer = JSON.parse(
        localStorage.getItem("ek_customer_data") || "null"
      );
      ekonId = customer?.ekonId || ekonId;
    } catch {
      // Customer authentication is enforced by the API.
    }

    return `ek-word-search-pending:${ekonId}:${game._id}`;
  });

  const [recovery] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) || "null"
      );

      if (
        !valid ||
        saved?.gameId !== String(game._id) ||
        typeof saved.attemptId !== "string" ||
        !/^[a-zA-Z0-9_-]{16,100}$/.test(saved.attemptId) ||
        typeof saved.submittedAnswer !== "string" ||
        saved.submittedAnswer.length > 2000
      ) {
        return null;
      }

      const selections = JSON.parse(saved.submittedAnswer);

      if (
        !Array.isArray(selections) ||
        selections.length !== words.length
      ) {
        return null;
      }

      const restored = [];
      const seenWords = new Set();

      for (const selection of selections) {
        const first = selection?.start;
        const last = selection?.end;

        if (
          ![first, last].every(
            (point) =>
              Array.isArray(point) &&
              point.length === 2 &&
              point.every(
                (value) =>
                  Number.isInteger(value) &&
                  value >= 0 &&
                  value < 12
              )
          )
        ) {
          return null;
        }

        const rowDistance = last[0] - first[0];
        const columnDistance = last[1] - first[1];

        if (
          (!rowDistance && !columnDistance) ||
          (
            rowDistance !== 0 &&
            columnDistance !== 0 &&
            Math.abs(rowDistance) !== Math.abs(columnDistance)
          )
        ) {
          return null;
        }

        const length =
          Math.max(
            Math.abs(rowDistance),
            Math.abs(columnDistance)
          ) + 1;

        const cells = Array.from({ length }, (_, index) => [
          first[0] + Math.sign(rowDistance) * index,
          first[1] + Math.sign(columnDistance) * index,
        ]);

        const text = cells.map(([r, c]) => grid[r][c]).join("");
        const reversed = [...text].reverse().join("");

        const word = words.find(
          (candidate) => candidate === text || candidate === reversed
        );

        if (!word || seenWords.has(word)) return null;

        seenWords.add(word);
        restored.push({
          word,
          start: first,
          end: last,
          cells,
        });
      }

      return {
        attempt: {
          gameId: String(game._id),
          attemptId: saved.attemptId,
          submittedAnswer: saved.submittedAnswer,
        },
        found: restored,
      };
    } catch {
      return null;
    }
  });

  const [start, setStart] = useState(null);
  const [found, setFound] = useState(recovery?.found || []);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [retryPending, setRetryPending] = useState(
    Boolean(recovery)
  );

  const requestBusyRef = useRef(false);
  const pendingAttemptRef = useRef(recovery?.attempt || null);

  const play = result?.play;
  const recorded = Boolean(play);
  const locked = recorded || busy || retryPending;

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

    const clearSavedAttempt = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // A remaining saved ID safely returns its existing result.
    }
  };

  const submit = async () => {
    if (recorded || busy || requestBusyRef.current) return;

    if (
      !pendingAttemptRef.current &&
      found.length !== words.length
    ) {
      setMessage("Find every listed word before submitting.");
      return;
    }

    requestBusyRef.current = true;
    setBusy(true);
    setMessage("");

    let confirmedPlay = null;

    try {
      let attempt = pendingAttemptRef.current;

      if (!attempt) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);

        attempt = {
          gameId: String(game._id),
          attemptId: Array.from(
            bytes,
            (byte) => byte.toString(16).padStart(2, "0")
          ).join(""),
          submittedAnswer: JSON.stringify(
            found.map(({ start, end }) => ({ start, end }))
          ),
        };

        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(attempt)
          );
        } catch {
          setMessage(
            "This browser could not save your pending puzzle. " +
            "Allow site storage, then try again."
          );
          return;
        }

        pendingAttemptRef.current = attempt;
      }

      setRetryPending(true);

      const response = await api.post(
        "/api/rewards-hub-games/play",
        attempt
      );

      const data = response.data?.data;

      if (!response.data?.success || !data?.play?._id) {
        setMessage(
          "Completion could not be confirmed. Use Check saved " +
          "puzzle to retry the same attempt."
        );
        return;
      }

      confirmedPlay = data.play;
      setResult(data);
      setStart(null);

      clearSavedAttempt();
      pendingAttemptRef.current = null;
      setRetryPending(false);

      setMessage(response.data.message || "Puzzle completed.");
    } catch (error) {
      if (error.response?.status === 400) {
        clearSavedAttempt();
        pendingAttemptRef.current = null;
        setRetryPending(false);
      }

      setMessage(
        error.response?.data?.message ||
          "Completion could not be confirmed. Use Check saved " +
          "puzzle to retry the same attempt."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }

    if (confirmedPlay) {
      onRecorded?.(confirmedPlay);
    }
  };

  const resetSelections = () => {
    if (locked || requestBusyRef.current) return;

    setStart(null);
    setFound([]);
    setMessage("");
  };

  const playAgain = () => {
    if (busy || retryPending || requestBusyRef.current) return;

    setStart(null);
    setFound([]);
    setMessage("");
    setResult(null);
    pendingAttemptRef.current = null;
  };

  const score =
    Number.isSafeInteger(play?.scoreEarned)
      ? play.scoreEarned
      : 0;

  const credited =
    Number.isSafeInteger(play?.pointsAwarded)
      ? play.pointsAwarded
      : 0;


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
                Find every listed word. Select its first letter, then
        its last letter. Words can run horizontally, vertically
        or diagonally, forwards or backwards. Complete the
        puzzle again to earn more game score. Reward limits
        still apply.
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

            {recorded ? (
        <div
          role="status"
          style={{
            padding: "18px",
            border: "1px solid #86efac",
            borderRadius: "12px",
            backgroundColor: "#ecfdf5",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          <strong>Every word found!</strong>

          <p>
            Game score earned: +{score.toLocaleString()}
          </p>

          <p>
            {credited.toLocaleString()} EK Points credited
          </p>

          {play.playMode === "Practice" ? (
            <p>
              Practice completion — no reward awarded.
              Your game score still counts.
            </p>
          ) : null}

          <div className="ek-word-search-actions">
            <button
              type="button"
              className="ek-word-search-submit"
              onClick={playAgain}
            >
              Play again
            </button>
          </div>
        </div>
      ) : (
        <>
          {retryPending ? (
            <p role="status" style={{ lineHeight: 1.6 }}>
              A puzzle is awaiting confirmation. Your selections
              are locked until you check that saved attempt.
            </p>
          ) : alreadyPlayed ? (
            <p style={{ lineHeight: 1.6 }}>
              Your earlier plays remain saved. This is a new
              attempt; reward eligibility is checked on submission.
            </p>
          ) : null}

          <div className="ek-word-search-actions">
            <button
              type="button"
              disabled={busy || retryPending}
              onClick={resetSelections}
            >
              Reset selections
            </button>

            <button
              type="button"
              className="ek-word-search-submit"
              disabled={
                busy ||
                (!retryPending && found.length !== words.length)
              }
              onClick={submit}
            >
              {busy
                ? "Checking…"
                : retryPending
                  ? "Check saved puzzle"
                  : "Submit completed puzzle"}
            </button>
          </div>
        </>
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