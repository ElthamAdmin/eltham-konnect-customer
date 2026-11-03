import { useState } from "react";
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

  const [board, setBoard] = useState(() =>
    validBoard ? original.map((row) => [...row]) : []
  );
  const [busy, setBusy] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [message, setMessage] = useState("");

  const locked = alreadyPlayed || recorded || busy;

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

  const submit = async () => {
    if (locked) return;

    if (board.some((row) => row.some((value) => value === 0))) {
      setMessage("Fill every empty square before submitting.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await api.post(
        "/api/rewards-hub-games/play",
        {
          gameId: game._id,
          submittedAnswer: JSON.stringify(board),
        }
      );

      const play = response.data?.data?.play;

      if (!response.data?.success || !play) {
        throw new Error(
          "Could not confirm completion. Refresh your game history before retrying."
        );
      }

      setRecorded(true);
      setMessage(
        response.data.message || "Sudoku completed successfully."
      );
      onRecorded?.(play);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Could not submit the board."
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (locked) return;
    setBoard(original.map((row) => [...row]));
    setMessage("");
  };

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
        {game.publicConfig.rules}
        {" "}Select an empty square and enter a number.
        Clear a square with Backspace or Delete.
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

      {alreadyPlayed || recorded ? (
        <p style={{ fontWeight: "bold", textAlign: "center" }}>
          Your play has been recorded.
        </p>
      ) : (
        <div className="ek-sudoku-actions">
          <button
            type="button"
            disabled={busy}
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