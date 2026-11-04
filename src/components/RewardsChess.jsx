import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import api from "../api";
import {
  chooseComputerMove,
  isValidChessConfig,
  moveCode,
  moveInput,
} from "../utils/rewardsChessEngine";

const SYMBOLS = {
  w: {
    k: "♔",
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  },
  b: {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  },
};

const NAMES = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

export default function RewardsChess({
  game,
  alreadyPlayed,
  onRecorded,
}) {
  const config = game.publicConfig;
  const valid = isValidChessConfig(config);

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

    return `ek-chess-pending:${ekonId}:${game._id}`;
  });

  const [recoveredAttempt] = useState(() => {
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
        !saved.submittedAnswer.trim() ||
        saved.submittedAnswer.length > 2000
      ) {
        return null;
      }

      const moves = saved.submittedAnswer.trim().split(/\s+/);

      if (
        moves.length > config.maxPlies ||
        !moves.every(
          (code) => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(code)
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

  const pendingAttemptRef = useRef(recoveredAttempt);
  const [retryPending, setRetryPending] = useState(
    Boolean(recoveredAttempt)
  );


  const chessRef = useRef(null);
  const movesRef = useRef([]);
  const requestBusyRef = useRef(false);

  if (!chessRef.current) {
    chessRef.current = new Chess();
  }

  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
  const play = result?.play;
  const recorded = Boolean(play);
  const [message, setMessage] = useState("");
  const [engineError, setEngineError] = useState("");

  const chess = chessRef.current;
    const completed = recorded;
  const plies = movesRef.current.length;
  const gameOver = chess.isGameOver();
  const limitReached = valid && plies >= config.maxPlies;

  const won =
    chess.isCheckmate() &&
    chess.turn() === "b";

  const locked =
    !valid ||
        completed ||
    busy ||
    retryPending ||
    gameOver ||
    limitReached ||
    Boolean(engineError);

  const thinking =
    !locked && chess.turn() === "b";

  const legalMoves =
    selected && !locked && chess.turn() === "w"
      ? chess.moves({
          square: selected,
          verbose: true,
        })
      : [];

  const legalTargets = new Set(
    legalMoves.map((move) => move.to)
  );

  const lastCode =
    movesRef.current[movesRef.current.length - 1];

  const lastSquares = lastCode
    ? [lastCode.slice(0, 2), lastCode.slice(2, 4)]
    : [];

  const refresh = () =>
    setRevision((previous) => previous + 1);

  useEffect(() => {
    const current = chessRef.current;

    if (
      !isValidChessConfig(config) ||
            recorded ||
      busy ||
      retryPending ||
      engineError ||
      current.turn() !== "b" ||
      current.isGameOver() ||
      movesRef.current.length >= config.maxPlies
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      try {
        const code = chooseComputerMove(current, config);

        if (!code) {
          throw new Error("No computer move available.");
        }

        const move = current.move(moveInput(code));

        if (!move) {
          throw new Error("Invalid computer move.");
        }

        movesRef.current.push(code);
        setSelected(null);
        setRevision((previous) => previous + 1);
      } catch {
        setEngineError(
          "The computer could not finish its move. " +
          "Restart the board to try again."
        );
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    revision,
    config,
        retryPending,
    recorded,
    busy,
    engineError,
  ]);

  const applyPlayerMove = (move) => {
    if (
            requestBusyRef.current ||
      locked ||
      chessRef.current.turn() !== "w"
    ) {
      return;
    }

    try {
      const code = moveCode(move);
      const applied = chessRef.current.move(moveInput(code));

      if (!applied) {
        return;
      }

      movesRef.current.push(code);
      setSelected(null);
      setPromotion(null);
      setMessage("");
      refresh();
    } catch {
      setMessage(
        "That move is not legal. Select a highlighted square."
      );
    }
  };

  const selectSquare = (square) => {
    if (
      locked ||
      thinking ||
      promotion ||
      requestBusyRef.current
    ) {
      return;
    }

    const piece = chess.get(square);

    if (selected === square) {
      setSelected(null);
      return;
    }

    if (piece?.color === "w") {
      setSelected(square);
      setMessage("");
      return;
    }

    if (!selected) {
      setMessage("Select one of your White pieces first.");
      return;
    }

    const candidates = legalMoves.filter(
      (move) => move.to === square
    );

    if (!candidates.length) {
      setMessage(
        "Choose a highlighted destination or another White piece."
      );
      return;
    }

    if (candidates.some((move) => move.promotion)) {
      setPromotion(candidates);
      return;
    }

    applyPlayerMove(candidates[0]);
  };

    const restart = () => {
    if (
      requestBusyRef.current ||
      busy ||
      retryPending ||
      thinking
    ) {
      return;
    }

    chessRef.current = new Chess();
    movesRef.current = [];
    pendingAttemptRef.current = null;

    setResult(null);
    setSelected(null);
    setPromotion(null);
    setMessage("");
    setEngineError("");
    refresh();
  };

  const clearSavedAttempt = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // A remaining saved ID safely returns its existing result.
    }
  };

  const submitWin = async () => {
    if (
      requestBusyRef.current ||
      completed ||
      busy ||
      !valid
    ) {
      return;
    }

    if (
      !pendingAttemptRef.current &&
      (
        !chessRef.current.isCheckmate() ||
        chessRef.current.turn() !== "b"
      )
    ) {
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
          submittedAnswer: movesRef.current.join(" "),
        };

        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(attempt)
          );
        } catch {
          setMessage(
            "This browser could not save your pending win. " +
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
          "Your win could not be confirmed. Use Check saved " +
          "win to retry the same attempt."
        );
        return;
      }

      confirmedPlay = data.play;
      setResult(data);

      clearSavedAttempt();
      pendingAttemptRef.current = null;
      setRetryPending(false);

      setMessage(
        response.data.message || "Chess win recorded."
      );
    } catch (error) {
      if (error.response?.status === 400) {
        clearSavedAttempt();
        pendingAttemptRef.current = null;
        setRetryPending(false);
      }

      setMessage(
        error.response?.data?.message ||
          "Your win could not be confirmed. Use Check saved " +
          "win to retry the same attempt."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }

    if (confirmedPlay) {
      onRecorded?.(confirmedPlay);
    }
  };


  if (!valid) {
    return (
      <p role="status">
        This Chess game needs an updated configuration.
        Please contact support.
      </p>
    );
  }

  let status = "Your turn — White.";

  if (completed) {
    status = "Your completed play has been recorded.";
      } else if (retryPending) {
    status =
      "A win is awaiting confirmation. Select Check saved win.";
  } else if (engineError) {
    status = engineError;
  } else if (won) {
    status = "Checkmate! You won. Submit your win below.";
  } else if (chess.isCheckmate()) {
    status = "Checkmate — the computer won. You can try again.";
  } else if (chess.isStalemate()) {
    status = "Stalemate — the game is a draw. You can try again.";
  } else if (chess.isDraw()) {
    status = "The game is a draw. You can try again.";
  } else if (limitReached) {
    status = "Move limit reached. Restart to try again.";
  } else if (thinking) {
    status = "Computer thinking…";
  } else if (chess.isCheck()) {
    status = "Your king is in check. Choose a legal move.";
  }

  return (
    <section className="ek-chess" aria-label="Chess game">
      <p>
                You are White. Select a piece, then a highlighted
        destination. Checkmate the computer and submit your
        win to earn game score. You can play repeatedly;
        reward limits still apply. Draws and losses do not
        earn game score or EK Points.
      </p>

      <p role="status" aria-live="polite">
        <strong>{status}</strong>
      </p>

      <div
        className="ek-chess-board"
        role="group"
        aria-label="Chess board, White at the bottom"
      >
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, column) => {
            const square =
              String.fromCharCode(97 + column) + (8 - row);

            const piece = chess.get(square);
            const target = legalTargets.has(square);
            const isSelected = selected === square;
            const lastMove = lastSquares.includes(square);

            const description = piece
              ? `${piece.color === "w" ? "White" : "Black"} ${
                  NAMES[piece.type]
                }`
              : "empty";

            const background = isSelected
              ? "#fbbf24"
              : lastMove
                ? "#bed4ef"
                : (row + column) % 2 === 0
                  ? "#edf3fb"
                  : "#7092bb";

            return (
              <button
                key={square}
                type="button"
                className="ek-chess-square"
                aria-label={
                  `${square}, ${description}` +
                  (target ? ", legal destination" : "")
                }
                aria-pressed={isSelected}
                disabled={
                  locked ||
                  thinking ||
                  Boolean(promotion)
                }
                onClick={() => selectSquare(square)}
                style={{ backgroundColor: background }}
              >
                {piece ? (
                  <span
                    className={`ek-chess-piece ek-chess-piece-${piece.color}`}
                    aria-hidden="true"
                  >
                    {SYMBOLS[piece.color][piece.type]}
                  </span>
                ) : null}

                {target ? (
                  <span
                    className={
                      piece
                        ? "ek-chess-target ek-chess-capture"
                        : "ek-chess-target"
                    }
                    aria-hidden="true"
                  />
                ) : null}

                <span
                  className="ek-chess-coordinate"
                  aria-hidden="true"
                >
                  {square}
                </span>
              </button>
            );
          })
        )}
      </div>

      {promotion ? (
        <div
          className="ek-chess-promotion"
          role="group"
          aria-label="Choose pawn promotion"
        >
          <strong>Promote your pawn to:</strong>

          <div className="ek-chess-actions">
            {["q", "r", "b", "n"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  const move = promotion.find(
                    (candidate) =>
                      candidate.promotion === type
                  );

                  if (move) {
                    applyPlayerMove(move);
                  }
                }}
              >
                {NAMES[type]}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPromotion(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <p className="ek-chess-detail">
        Moves played: {plies} / {config.maxPlies}
        {" · "}White starts at the bottom.
      </p>

            <div className="ek-chess-actions">
        <button
          type="button"
          onClick={restart}
          disabled={busy || thinking || retryPending}
        >
          {completed ? "Play again" : "Restart board"}
        </button>

        {(won || retryPending) && !completed ? (
          <button
            type="button"
            className="ek-chess-submit"
            onClick={submitWin}
            disabled={busy}
          >
            {busy
              ? "Submitting…"
              : retryPending
                ? "Check saved win"
                : "Submit Chess win"}
          </button>
        ) : null}
      </div>

      {retryPending ? (
        <p role="status">
          Your submitted moves are saved for checking.
          After refreshing, the board preview resets, but
          Check saved win retries the original submission.
          Confirm it before starting another game.
        </p>
      ) : !completed && alreadyPlayed ? (
        <p>
          Your earlier wins remain saved. This is a new game;
          reward eligibility is checked when you submit a win.
        </p>
      ) : null}

      {completed ? (
        <div
          role="status"
          style={{
            marginTop: "16px",
            padding: "18px",
            border: "1px solid #86efac",
            borderRadius: "12px",
            background: "#ecfdf5",
            color: "#166534",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          <strong>Chess win saved!</strong>

          <p>
            Game score earned: +
            {(
              Number.isSafeInteger(play.scoreEarned)
                ? play.scoreEarned
                : 0
            ).toLocaleString()}
          </p>

          <p>
            {(
              Number.isSafeInteger(play.pointsAwarded)
                ? play.pointsAwarded
                : 0
            ).toLocaleString()} EK Points credited
          </p>

          {play.playMode === "Practice" ? (
            <p>
              Practice win — no reward awarded.
              Your game score still counts.
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      {chess.history().length > 0 ? (
        <details className="ek-chess-history">
          <summary>Move history</summary>
          <p>{chess.pgn()}</p>
        </details>
      ) : null}

      <style>{`
        .ek-chess {
          color: #0f172a;
          min-width: 0;
        }

        .ek-chess > p {
          line-height: 1.6;
        }

        .ek-chess .ek-chess-board {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          width: 100%;
          max-width: 480px;
          margin: 16px auto;
          border: 2px solid #0B3D91;
          box-sizing: border-box;
        }

        .ek-chess .ek-chess-square {
          position: relative;
          display: grid;
          place-items: center;
          width: 100%;
          aspect-ratio: 1;
          min-width: 0;
          min-height: 0 !important;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          cursor: pointer;
          touch-action: manipulation;
          opacity: 1;
          transform: none;
        }

        .ek-chess .ek-chess-square:hover {
          transform: none !important;
          opacity: 1 !important;
        }

        .ek-chess .ek-chess-square:disabled {
          cursor: default;
          opacity: 1;
        }

        .ek-chess .ek-chess-square:focus-visible {
          outline: 3px solid #F15A24;
          outline-offset: -3px;
          z-index: 2;
        }

        .ek-chess-piece {
          position: relative;
          z-index: 1;
          font-family: "Segoe UI Symbol", "Noto Sans Symbols 2",
            "DejaVu Sans", serif;
          font-size: clamp(22px, 5vw, 42px);
          line-height: 1;
          pointer-events: none;
        }

        .ek-chess-piece-w {
          color: #ffffff;
          text-shadow:
            -1px -1px 0 #172554,
            1px -1px 0 #172554,
            -1px 1px 0 #172554,
            1px 1px 0 #172554;
        }

        .ek-chess-piece-b {
          color: #101827;
          text-shadow: 0 1px 0 #ffffff;
        }

        .ek-chess-coordinate {
          position: absolute;
          bottom: 1px;
          left: 2px;
          color: #172554;
          font-size: 9px;
          line-height: 1;
          pointer-events: none;
        }

        .ek-chess-target {
          position: absolute;
          width: 24%;
          height: 24%;
          border-radius: 50%;
          background: rgba(11, 61, 145, 0.55);
          pointer-events: none;
        }

        .ek-chess-capture {
          width: 80%;
          height: 80%;
          border: 3px solid #F15A24;
          background: transparent;
          box-sizing: border-box;
        }

        .ek-chess-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .ek-chess-actions button {
          min-height: 44px;
          padding: 10px 14px;
          border: 1px solid #0B3D91;
          border-radius: 9px;
          background: #ffffff;
          color: #0B3D91;
          font-weight: bold;
          cursor: pointer;
          text-transform: capitalize;
          touch-action: manipulation;
        }

        .ek-chess-actions .ek-chess-submit {
          background: #0B3D91;
          color: #ffffff;
        }

        .ek-chess-actions button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .ek-chess-promotion {
          padding: 12px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: #f1f5fb;
        }

        .ek-chess-detail {
          color: #64748b;
          font-size: 13px;
        }

        .ek-chess-history {
          margin-top: 16px;
          overflow-wrap: anywhere;
        }

        .ek-chess-history summary {
          cursor: pointer;
          min-height: 32px;
        }

        .ek-chess-history p {
          line-height: 1.6;
          white-space: pre-wrap;
        }
      `}</style>
    </section>
  );
}