import { useRef, useState } from "react";
import api from "../api";

export default function RewardsSudoku({
  game,
  alreadyPlayed,
  onRecorded,
}) {
  const original = game.publicConfig?.board;

  const validBoard =
    Array.isArray(original) &&
    original.length === 9 &&
    original.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 9 &&
        row.every(
          (value) =>
            Number.isInteger(value) &&
            value >= 0 &&
            value <= 9
        )
    );

    const [storageKey] = useState(() => {
    let ekonId = "customer";

    try {
      const customer = JSON.parse(
        localStorage.getItem("ek_customer_data") || "null"
      );
      ekonId = customer?.ekonId || ekonId;
    } catch {
      // Authentication is enforced by the API.
    }

    return `ek-sudoku-pending:${ekonId}:${game._id}`;
  });

  const [recoveredAttempt] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) || "null"
      );

      if (
        !validBoard ||
        saved?.gameId !== String(game._id) ||
        typeof saved.attemptId !== "string" ||
        !/^[a-zA-Z0-9_-]{16,100}$/.test(saved.attemptId) ||
        typeof saved.submittedAnswer !== "string" ||
        saved.submittedAnswer.length > 2000
      ) {
        return null;
      }

      const savedBoard = JSON.parse(saved.submittedAnswer);

      if (
        !Array.isArray(savedBoard) ||
        savedBoard.length !== 9 ||
        !savedBoard.every(
          (row, rowIndex) =>
            Array.isArray(row) &&
            row.length === 9 &&
            row.every(
              (value, columnIndex) =>
                Number.isInteger(value) &&
                value >= 1 &&
                value <= 9 &&
                (
                  original[rowIndex][columnIndex] === 0 ||
                  original[rowIndex][columnIndex] === value
                )
            )
        )
      ) {
        return null;
      }

      return {
        gameId: String(game._id),
        attemptId: saved.attemptId,
        submittedAnswer: saved.submittedAnswer,
      };
    } catch {
      return null;
    }
  });

  const [board, setBoard] = useState(() =>
    recoveredAttempt
      ? JSON.parse(recoveredAttempt.submittedAnswer)
      : validBoard
        ? original.map((row) => [...row])
        : []
  );

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [retryPending, setRetryPending] = useState(
    Boolean(recoveredAttempt)
  );

  const requestBusyRef = useRef(false);
  const pendingAttemptRef = useRef(recoveredAttempt);

  const play = result?.play;
  const recorded = Boolean(play);
  const locked = recorded || busy || retryPending;

  if (!validBoard) {
    return (
      <p role="alert">
        This Sudoku board is unavailable. Please contact support.
      </p>
    );
  }

  const updateCell = (row, column, value) => {
    if (locked || original[row][column] !== 0) return;
    if (!/^[1-9]?$/.test(value)) return;

    setBoard((previous) =>
      previous.map((cells, rowIndex) =>
        rowIndex === row
          ? cells.map((cell, columnIndex) =>
              columnIndex === column
                ? value === "" ? 0 : Number(value)
                : cell
            )
          : cells
      )
    );
    setMessage("");
  };

    const clearSavedAttempt = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Retrying a remaining saved ID returns its existing result.
    }
  };

  const submit = async () => {
    if (recorded || busy || requestBusyRef.current) return;

    if (
      !pendingAttemptRef.current &&
      board.some((row) => row.some((value) => value === 0))
    ) {
      setMessage("Fill every empty square before submitting.");
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
          submittedAnswer: JSON.stringify(board),
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

      clearSavedAttempt();
      pendingAttemptRef.current = null;
      setRetryPending(false);

      setMessage(
        response.data.message || "Sudoku completed successfully."
      );
    } catch (error) {
      if (error.response?.status === 400) {
        // Invalid boards are not recorded. Allow corrections.
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

  const reset = () => {
    if (locked || requestBusyRef.current) return;

    setBoard(original.map((row) => [...row]));
    setMessage("");
  };

  const playAgain = () => {
    if (busy || retryPending || requestBusyRef.current) return;

    setBoard(original.map((row) => [...row]));
    setResult(null);
    setMessage("");
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
    <section className="ek-sudoku">
      <style>{`
        .ek-sudoku {
          margin-top:16px;
          color:#15345d;
        }
        .ek-sudoku-grid {
          display:grid;
          grid-template-columns:repeat(9,minmax(0,1fr));
          width:100%;
          max-width:430px;
          margin:16px auto;
          border:2px solid #0b3d91;
          background:#fff;
        }
        .ek-sudoku-cell {
          width:100%;
          min-width:0;
          aspect-ratio:1;
          border:0;
          border-right:1px solid #d5deed;
          border-bottom:1px solid #d5deed;
          border-radius:0;
          padding:0;
          text-align:center;
          font-family:inherit;
          font-size:clamp(16px,3vw,23px);
          color:#0b3d91;
          background:#fff;
        }
        .ek-sudoku-cell:disabled {
          opacity:1;
          -webkit-text-fill-color:currentColor;
        }
        .ek-sudoku-cell:focus {
          outline:3px solid #f15a24;
          outline-offset:-3px;
          background:#fff3e9;
        }
        .ek-sudoku-actions {
          display:flex;
          justify-content:center;
          flex-wrap:wrap;
          gap:10px;
        }
        .ek-sudoku-actions button {
          min-height:44px;
          padding:10px 16px;
          border:1px solid #0b3d91;
          border-radius:9px;
          background:white;
          color:#0b3d91;
          font:inherit;
          font-weight:bold;
          cursor:pointer;
        }
        .ek-sudoku-actions button:disabled {
          opacity:.6;
          cursor:default;
        }
        .ek-sudoku-actions .ek-sudoku-submit {
          background:#0b3d91;
          color:white;
        }
      `}</style>

      <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                Fill each row, column and 3×3 box with the numbers
        1–9 without repeating a number. Select an empty square
        to enter a number; use Backspace or Delete to clear it.
        Complete the puzzle again to earn more game score.
        Reward limits still apply.
      </p>

      <div
        className="ek-sudoku-grid"
        role="group"
        aria-label="Sudoku puzzle"
      >
        {board.flatMap((row, rowIndex) =>
          row.map((value, columnIndex) => {
            const given = original[rowIndex][columnIndex] !== 0;

            return (
              <input
                key={`${rowIndex}-${columnIndex}`}
                className="ek-sudoku-cell"
                type="text"
                inputMode="numeric"
                pattern="[1-9]"
                maxLength={1}
                autoComplete="off"
                aria-label={
                  `Row ${rowIndex + 1}, column ${columnIndex + 1}` +
                  (given ? `, given ${value}` : "")
                }
                value={value || ""}
                disabled={given || locked}
                onChange={(event) =>
                  updateCell(
                    rowIndex,
                    columnIndex,
                    event.target.value
                  )
                }
                style={{
                  fontWeight: given ? "bold" : "normal",
                  backgroundColor: given ? "#edf3ff" : "#ffffff",
                  borderRight:
                    columnIndex === 2 || columnIndex === 5
                      ? "2px solid #0b3d91"
                      : undefined,
                  borderBottom:
                    rowIndex === 2 || rowIndex === 5
                      ? "2px solid #0b3d91"
                      : undefined,
                }}
              />
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
          <strong>Puzzle completed!</strong>

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

          <div className="ek-sudoku-actions">
            <button
              type="button"
              className="ek-sudoku-submit"
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
              A puzzle is awaiting confirmation. Your board
              is locked until you check that saved attempt.
            </p>
          ) : alreadyPlayed ? (
            <p style={{ lineHeight: 1.6 }}>
              Your earlier plays remain saved. This is a new
              attempt; reward eligibility is checked on submission.
            </p>
          ) : null}

          <div className="ek-sudoku-actions">
            <button
              type="button"
              disabled={busy || retryPending}
              onClick={reset}
            >
              Reset board
            </button>

            <button
              type="button"
              className="ek-sudoku-submit"
              disabled={busy}
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