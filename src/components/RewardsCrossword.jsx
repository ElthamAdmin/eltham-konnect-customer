import { useRef, useState } from "react";
import api from "../api";

const entryCells = (entry) =>
  Array.from({ length: entry.length }, (_, index) => [
    entry.row + (entry.direction === "down" ? index : 0),
    entry.column + (entry.direction === "across" ? index : 0),
  ]);

const containsCell = (entry, row, column) =>
  entryCells(entry).some(
    ([r, c]) => r === row && c === column
  );

export default function RewardsCrossword({
  game,
  alreadyPlayed,
  onRecorded,
}) {
  const config = game.publicConfig;

  const valid =
    config?.puzzleVersion === 1 &&
    Number.isInteger(config.rows) &&
    Number.isInteger(config.columns) &&
    config.rows > 0 &&
    config.rows <= 15 &&
    config.columns > 0 &&
    config.columns <= 15 &&
    Array.isArray(config.cells) &&
    config.cells.length === config.rows &&
    config.cells.every(
      (row) =>
        Array.isArray(row) &&
        row.length === config.columns &&
        row.every((cell) => typeof cell === "boolean")
    ) &&
    Array.isArray(config.entries) &&
    config.entries.length > 0 &&
    config.entries.every(
      (entry) =>
        Number.isInteger(entry.row) &&
        Number.isInteger(entry.column) &&
        Number.isInteger(entry.length) &&
        entry.length > 0 &&
        entry.length <= 15 &&
        ["across", "down"].includes(entry.direction) &&
        entryCells(entry).every(
          ([row, column]) =>
            config.cells[row]?.[column] === true
        )
    );

  const makeBoard = () =>
    valid
      ? config.cells.map((row) =>
          row.map((open) => (open ? "" : "#"))
        )
      : [];

  const [board, setBoard] = useState(makeBoard);
  const [activeEntry, setActiveEntry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [message, setMessage] = useState("");

  const inputsRef = useRef({});
  const requestBusyRef = useRef(false);
  const completed = alreadyPlayed || recorded;
  const locked = completed || busy;

  const focusCell = (row, column) => {
    inputsRef.current[`${row},${column}`]?.focus();
  };

  const focusAlongEntry = (row, column, step) => {
    const entry = config.entries[activeEntry];

    if (!entry) return;

    const cells = entryCells(entry);
    const index = cells.findIndex(
      ([r, c]) => r === row && c === column
    );

    const next = cells[index + step];

    if (index >= 0 && next) {
      focusCell(next[0], next[1]);
    }
  };

  const changeLetter = (row, column, value) => {
    if (locked || requestBusyRef.current) return;

    const letter = value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(-1);

    setBoard((previous) =>
      previous.map((line, r) =>
        r === row
          ? line.map((cell, c) =>
              c === column ? letter : cell
            )
          : line
      )
    );

    setMessage("");

    if (letter) {
      focusAlongEntry(row, column, 1);
    }
  };

  const selectClue = (index) => {
    setActiveEntry(index);
    const entry = config.entries[index];
    focusCell(entry.row, entry.column);
  };

  const resetBoard = () => {
    if (locked || requestBusyRef.current) return;
    setBoard(makeBoard());
    setMessage("");
  };

  const submitPuzzle = async () => {
    if (locked || requestBusyRef.current || !valid) return;

    if (board.some((row) => row.some((cell) => cell === ""))) {
      setMessage("Fill every white square before submitting.");
      return;
    }

    requestBusyRef.current = true;
    setBusy(true);
    setMessage("");

    try {
      const response = await api.post(
        "/api/rewards-hub-games/play",
        {
          gameId: game._id,
          submittedAnswer: JSON.stringify(
            board.map((row) => row.join(""))
          ),
        }
      );

      const play = response.data?.data?.play;

      if (!play?._id) {
        throw new Error("Submission could not be confirmed.");
      }

      setRecorded(true);
      setMessage(
        response.data?.message || "Crossword completed."
      );
      onRecorded?.(play);
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "Could not confirm your submission. " +
          "Refresh your game history before retrying."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }
  };

  if (!valid) {
    return (
      <p role="status">
        This Crossword needs an updated configuration.
        Please contact support.
      </p>
    );
  }

  const selectedEntry = config.entries[activeEntry];
  const totalCells = config.cells.flat().filter(Boolean).length;
  const filledCells = board
    .flat()
    .filter((cell) => /^[A-Z]$/.test(cell)).length;

  const numbers = new Map(
    config.entries.map((entry) => [
      `${entry.row},${entry.column}`,
      entry.number,
    ])
  );

  return (
    <section className="ek-crossword" aria-label="Crossword puzzle">
      <p>
        Select an Across or Down clue, then enter its answer.
        Crossing words share letters. Tap any white square
        to change a letter.
      </p>

      {completed ? (
        <p role="status">Your play has been recorded.</p>
      ) : (
        <p role="status">
          {filledCells} of {totalCells} squares filled
        </p>
      )}

      <div className="ek-crossword-scroll">
        <div
          className="ek-crossword-board"
          style={{
            gridTemplateColumns:
              `repeat(${config.columns}, minmax(0, 1fr))`,
            maxWidth: `${config.columns * 48}px`,
          }}
        >
          {config.cells.map((line, row) =>
            line.map((open, column) => {
              const key = `${row},${column}`;

              if (!open) {
                return (
                  <div
                    key={key}
                    className="ek-crossword-block"
                    aria-hidden="true"
                  />
                );
              }

              const highlighted =
                selectedEntry &&
                containsCell(selectedEntry, row, column);

              return (
                <div
                  key={key}
                  className={
                    "ek-crossword-cell" +
                    (highlighted ? " ek-crossword-active" : "")
                  }
                >
                  {numbers.has(key) ? (
                    <span aria-hidden="true">
                      {numbers.get(key)}
                    </span>
                  ) : null}

                  <input
                    ref={(element) => {
                      if (element) {
                        inputsRef.current[key] = element;
                      } else {
                        delete inputsRef.current[key];
                      }
                    }}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-label={
                      `Row ${row + 1}, column ${column + 1}` +
                      (numbers.has(key)
                        ? `, clue ${numbers.get(key)}`
                        : "")
                    }
                    value={board[row][column]}
                    disabled={locked}
                    onFocus={(event) => {
                      event.target.select();

                      if (
                        !selectedEntry ||
                        !containsCell(selectedEntry, row, column)
                      ) {
                        const index = config.entries.findIndex(
                          (entry) =>
                            containsCell(entry, row, column)
                        );

                        if (index >= 0) setActiveEntry(index);
                      }
                    }}
                    onChange={(event) =>
                      changeLetter(row, column, event.target.value)
                    }
                    onKeyDown={(event) => {
                      const arrows = {
                        ArrowUp: [-1, 0],
                        ArrowDown: [1, 0],
                        ArrowLeft: [0, -1],
                        ArrowRight: [0, 1],
                      };

                      if (arrows[event.key]) {
                        event.preventDefault();
                        const [dr, dc] = arrows[event.key];
                        focusCell(row + dr, column + dc);
                      } else if (
                        event.key === "Backspace" &&
                        !board[row][column]
                      ) {
                        event.preventDefault();
                        focusAlongEntry(row, column, -1);
                      }
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="ek-crossword-clues">
        {["across", "down"].map((direction) => (
          <div key={direction}>
            <h4>{direction === "across" ? "Across" : "Down"}</h4>

            {config.entries
              .map((entry, index) => ({ entry, index }))
              .filter(({ entry }) => entry.direction === direction)
              .sort((a, b) => a.entry.number - b.entry.number)
              .map(({ entry, index }) => (
                <button
                  key={`${direction}-${entry.number}`}
                  type="button"
                  aria-pressed={activeEntry === index}
                  disabled={locked}
                  onClick={() => selectClue(index)}
                  className={
                    activeEntry === index ? "ek-crossword-chosen" : ""
                  }
                >
                  <strong>{entry.number}.</strong>{" "}
                  {entry.clue} ({entry.length})
                </button>
              ))}
          </div>
        ))}
      </div>

      {!completed ? (
        <div className="ek-crossword-actions">
          <button
            type="button"
            onClick={resetBoard}
            disabled={busy}
          >
            Reset board
          </button>

          <button
            type="button"
            className="ek-crossword-submit"
            onClick={submitPuzzle}
            disabled={busy || filledCells !== totalCells}
          >
            {busy ? "Submitting…" : "Submit completed puzzle"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p role="status" aria-live="polite">{message}</p>
      ) : null}

      <style>{`
        .ek-crossword {
          color: #0f172a;
          min-width: 0;
        }

        .ek-crossword p {
          line-height: 1.6;
        }

        .ek-crossword-scroll {
          overflow-x: auto;
          padding: 3px;
        }

        .ek-crossword-board {
          display: grid;
          width: 100%;
          min-width: 240px;
          margin: 12px auto;
          gap: 1px;
          background: #0B3D91;
          border: 2px solid #0B3D91;
          box-sizing: border-box;
        }

        .ek-crossword-cell,
        .ek-crossword-block {
          position: relative;
          aspect-ratio: 1;
          min-width: 0;
        }

        .ek-crossword-block {
          background: #172554;
        }

        .ek-crossword-cell {
          background: #ffffff;
        }

        .ek-crossword-active {
          background: #e1edff;
        }

        .ek-crossword-cell > span {
          position: absolute;
          top: 1px;
          left: 3px;
          font-size: 10px;
          line-height: 1;
          color: #0B3D91;
          pointer-events: none;
          z-index: 1;
        }

        .ek-crossword .ek-crossword-cell input {
          display: block;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          margin: 0;
          padding: 8px 0 0;
          box-sizing: border-box;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: #0B3D91;
          text-align: center;
          text-transform: uppercase;
          font-size: clamp(16px, 4vw, 24px);
          font-weight: bold;
          opacity: 1;
          -webkit-text-fill-color: #0B3D91;
        }

        .ek-crossword .ek-crossword-cell input:focus {
          outline: 3px solid #F15A24;
          outline-offset: -3px;
        }

        .ek-crossword-clues {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 16px 0;
        }

        .ek-crossword-clues h4 {
          margin: 0 0 8px;
          color: #0B3D91;
        }

        .ek-crossword-clues button {
          display: block;
          width: 100%;
          min-height: 44px;
          padding: 9px;
          margin-bottom: 7px;
          border: 1px solid #dbe3ef;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          text-align: left;
          line-height: 1.5;
          cursor: pointer;
          touch-action: manipulation;
        }

        .ek-crossword-clues .ek-crossword-chosen {
          border-color: #0B3D91;
          background: #eef4ff;
        }

        .ek-crossword-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ek-crossword-actions button {
          min-height: 44px;
          padding: 10px 14px;
          border: 1px solid #0B3D91;
          border-radius: 9px;
          background: #ffffff;
          color: #0B3D91;
          font-weight: bold;
          cursor: pointer;
          touch-action: manipulation;
        }

        .ek-crossword-actions .ek-crossword-submit {
          background: #0B3D91;
          color: #ffffff;
        }

        .ek-crossword button:disabled {
          cursor: default;
          opacity: 0.65;
        }

        @media (max-width: 420px) {
          .ek-crossword-clues {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}