import { useEffect, useRef, useState } from "react";
import api from "../api";

const DIRECTIONS = {
  U: [-1, 0],
  D: [1, 0],
  L: [0, -1],
  R: [0, 1],
};

const OPPOSITE = { U: "D", D: "U", L: "R", R: "L" };

function placeFood(state) {
  const occupied = new Set(
    state.body.map(([row, column]) => `${row},${column}`)
  );

  const free = [];

  for (let row = 0; row < 12; row += 1) {
    for (let column = 0; column < 12; column += 1) {
      if (!occupied.has(`${row},${column}`)) {
        free.push([row, column]);
      }
    }
  }

  state.randomState =
    (state.randomState * 16807) % 2147483647;

  state.food = free.length
    ? free[state.randomState % free.length]
    : null;
}

function initialState(seed) {
  const state = {
    body: [[6, 4], [6, 3], [6, 2]],
    direction: "R",
    score: 0,
    randomState: seed,
    food: null,
    moves: "",
    status: "Ready",
  };

  placeFood(state);
  return state;
}

export default function RewardsSnake({
  game,
  alreadyPlayed,
  onRecorded,
}) {
  const config = game.publicConfig || {};

  const valid =
    config.size === 12 &&
    config.target === 5 &&
    config.maxMoves === 1500 &&
    config.tickMs === 180 &&
    Number.isInteger(config.seed) &&
    config.seed > 0 &&
    config.seed < 2147483647;

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

    return `ek-snake-pending:${ekonId}:${game._id}`;
  });

  const [recoveredAttempt] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) || "null"
      );

      return (
        saved?.gameId === String(game._id) &&
        typeof saved.attemptId === "string" &&
        /^[a-zA-Z0-9_-]{16,100}$/.test(saved.attemptId) &&
        typeof saved.submittedAnswer === "string" &&
        /^[UDLR]{1,1500}$/.test(saved.submittedAnswer)
      )
        ? {
            gameId: String(game._id),
            attemptId: saved.attemptId,
            submittedAnswer: saved.submittedAnswer,
          }
        : null;
    } catch {
      return null;
    }
  });

  const pendingAttemptRef = useRef(recoveredAttempt);
  const [retryPending, setRetryPending] = useState(
    Boolean(recoveredAttempt)
  );


  const stateRef = useRef(null);

  if (stateRef.current === null) {
    stateRef.current = initialState(valid ? config.seed : 1);
  }

  const pendingDirection = useRef(null);
  const requestBusy = useRef(false);
  const [snapshot, setSnapshot] = useState(stateRef.current);
  const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
  const play = result?.play;
  const recorded = Boolean(play);
  const [message, setMessage] = useState("");

  const publish = () => setSnapshot({ ...stateRef.current });

  const pause = () => {
    if (stateRef.current.status === "Playing") {
      stateRef.current = {
        ...stateRef.current,
        status: "Paused",
      };
      pendingDirection.current = null;
      publish();
    }
  };

  useEffect(() => {
    const hide = () => {
      if (document.hidden) pause();
    };

    document.addEventListener("visibilitychange", hide);

    return () =>
      document.removeEventListener("visibilitychange", hide);
  }, []);

  useEffect(() => {
    if (
            !valid ||
      recorded ||
      busy ||
      retryPending ||
      snapshot.status !== "Playing"
    ) return;

    const timer = window.setInterval(() => {
      const previous = stateRef.current;
      if (previous.status !== "Playing") return;

      const direction =
        pendingDirection.current || previous.direction;

      pendingDirection.current = null;

      const state = {
        ...previous,
        body: previous.body.map((cell) => [...cell]),
      };

      const [dr, dc] = DIRECTIONS[direction];
      const head = [
        state.body[0][0] + dr,
        state.body[0][1] + dc,
      ];

      const eating =
        head[0] === state.food?.[0] &&
        head[1] === state.food?.[1];

      const collisionBody = eating
        ? state.body
        : state.body.slice(0, -1);

      const collision =
        head[0] < 0 ||
        head[0] >= 12 ||
        head[1] < 0 ||
        head[1] >= 12 ||
        collisionBody.some(
          ([row, column]) =>
            row === head[0] && column === head[1]
        );

      if (collision) {
        state.status = "Lost";
      } else {
        state.direction = direction;
        state.moves += direction;
        state.body.unshift(head);

        if (eating) {
          state.score += 1;

          if (state.score === 5) {
            state.status = "Won";
          } else {
            placeFood(state);
          }
        } else {
          state.body.pop();
        }

        if (state.moves.length >= 1500 && state.status !== "Won") {
          state.status = "Lost";
        }
      }

      stateRef.current = state;
      publish();
    }, 180);

    return () => window.clearInterval(timer);
    }, [valid, recorded, busy, retryPending, snapshot.status]);

  const turn = (direction) => {
    const state = stateRef.current;

    if (
      state.status !== "Playing" ||
            recorded ||
      busy ||
      retryPending ||
      requestBusy.current ||
      pendingDirection.current
    ) return;

    if (direction !== OPPOSITE[state.direction]) {
      pendingDirection.current = direction;
    }
  };

  const startOrResume = () => {
        if (
      recorded ||
      busy ||
      retryPending ||
      requestBusy.current
    ) return;

    if (["Ready", "Paused"].includes(stateRef.current.status)) {
      stateRef.current = {
        ...stateRef.current,
        status: "Playing",
      };
      setMessage("");
      publish();
    }
  };

    const restart = () => {
    if (busy || retryPending || requestBusy.current) return;

    stateRef.current = initialState(config.seed);
    pendingDirection.current = null;
    pendingAttemptRef.current = null;
    setResult(null);
    setMessage("");
    publish();
  };

  const clearSavedAttempt = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // A remaining saved ID safely returns its existing result.
    }
  };

  const submit = async () => {
    if (
      requestBusy.current ||
      busy ||
      recorded ||
      (
        !pendingAttemptRef.current &&
        stateRef.current.status !== "Won"
      )
    ) return;

    requestBusy.current = true;
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
          submittedAnswer: stateRef.current.moves,
        };

        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(attempt)
          );
        } catch {
          setMessage(
            "This browser could not save your pending run. " +
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
          "run to retry the same attempt."
        );
        return;
      }

      confirmedPlay = data.play;
      setResult(data);

      clearSavedAttempt();
      pendingAttemptRef.current = null;
      setRetryPending(false);

      setMessage(response.data.message || "Snake completed.");
    } catch (error) {
      if (error.response?.status === 400) {
        clearSavedAttempt();
        pendingAttemptRef.current = null;
        setRetryPending(false);
      }

      setMessage(
        error.response?.data?.message ||
          "Completion could not be confirmed. Use Check saved " +
          "run to retry the same attempt."
      );
    } finally {
      requestBusy.current = false;
      setBusy(false);
    }

    if (confirmedPlay) {
      onRecorded?.(confirmedPlay);
    }
  };


  if (!valid) {
    return <p role="alert">This Snake board is unavailable.</p>;
  }

  const occupied = new Set(
    snapshot.body.map(([row, column]) => `${row},${column}`)
  );

    const locked = recorded || busy || retryPending;

  const score =
    Number.isSafeInteger(play?.scoreEarned)
      ? play.scoreEarned
      : 0;

  const credited =
    Number.isSafeInteger(play?.pointsAwarded)
      ? play.pointsAwarded
      : 0;

  return (
    <section
      className="ek-snake"
      aria-label="Snake game"
      tabIndex={0}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          pause();
        }
      }}
      onKeyDown={(event) => {
        const keys = {
          ArrowUp: "U",
          ArrowDown: "D",
          ArrowLeft: "L",
          ArrowRight: "R",
        };

        if (keys[event.key]) {
          event.preventDefault();
          turn(keys[event.key]);
        }

        if (event.key === "Escape") pause();
      }}
    >
      <style>{`
        .ek-snake { margin-top:16px; color:#15345d; }
        .ek-snake-board {
          display:grid;
          grid-template-columns:repeat(12,minmax(0,1fr));
          width:100%; max-width:420px;
          margin:16px auto;
          background:#f1f5fc;
          border:2px solid #0b3d91;
          border-radius:8px;
          overflow:hidden;
        }
        .ek-snake-cell {
          aspect-ratio:1;
          border:1px solid #ffffff80;
        }
        .ek-snake-actions {
          display:flex; justify-content:center;
          flex-wrap:wrap; gap:8px; margin:12px 0;
        }
        .ek-snake button {
          min-height:44px; padding:10px 14px;
          border:1px solid #0b3d91; border-radius:9px;
          background:white; color:#0b3d91;
          font:inherit; font-weight:bold;
          cursor:pointer; touch-action:manipulation;
        }
        .ek-snake button:disabled { opacity:.55; cursor:default; }
        .ek-snake .ek-snake-primary {
          background:#0b3d91; color:white;
        }
        .ek-snake-directions {
          display:grid; grid-template-columns:repeat(3,54px);
          justify-content:center; gap:6px;
        }
        .ek-snake-directions button { padding:8px; font-size:22px; }
        .ek-snake:focus-visible {
          outline:3px solid #f15a24; outline-offset:4px;
        }
      `}</style>

      <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                Collect 5 pieces of food without hitting a wall or
        your snake. Select Start, then use the arrow keys or
        buttons below. Leaving the game or switching tabs
        pauses it. Submit a completed run to earn game score.
        You can play repeatedly; reward limits still apply.
      </p>

      <strong>
        Food collected: {snapshot.score} / 5
        {" · "}{snapshot.status}
      </strong>

      <div className="ek-snake-board" aria-hidden="true">
        {Array.from({ length: 144 }, (_, index) => {
          const row = Math.floor(index / 12);
          const column = index % 12;

          const food =
            snapshot.food?.[0] === row &&
            snapshot.food?.[1] === column;

          const head =
            snapshot.body[0][0] === row &&
            snapshot.body[0][1] === column;

          return (
            <div
              key={index}
              className="ek-snake-cell"
              style={{
                background: head
                  ? "#08285f"
                  : occupied.has(`${row},${column}`)
                    ? "#2861dc"
                    : food
                      ? "#f15a24"
                      : "transparent",
              }}
            />
          );
        })}
      </div>

            {!recorded && (
        <>
          <div className="ek-snake-actions">
            {["Ready", "Paused"].includes(snapshot.status) && (
              <button
                type="button"
                className="ek-snake-primary"
                                disabled={locked}
                onClick={startOrResume}
              >
                {snapshot.status === "Paused" ? "Resume" : "Start"}
              </button>
            )}

            {snapshot.status === "Playing" && (
              <button type="button" onClick={pause}>Pause</button>
            )}

                        <button
              type="button"
              disabled={locked}
              onClick={restart}
            >
              Restart
            </button>
          </div>

          <div className="ek-snake-directions">
            <span />
            <button type="button" aria-label="Up"
              disabled={locked || snapshot.status !== "Playing"}
              onClick={() => turn("U")}>↑</button>
            <span />
            <button type="button" aria-label="Left"
              disabled={locked || snapshot.status !== "Playing"}
              onClick={() => turn("L")}>←</button>
            <button type="button" aria-label="Down"
              disabled={locked || snapshot.status !== "Playing"}
              onClick={() => turn("D")}>↓</button>
            <button type="button" aria-label="Right"
              disabled={locked || snapshot.status !== "Playing"}
              onClick={() => turn("R")}>→</button>
          </div>

          {snapshot.status === "Lost" && (
            <p role="status">
              Run ended. Select Restart to try again.
              No play has been submitted.
            </p>
          )}

                    {(snapshot.status === "Won" || retryPending) && (
            <div className="ek-snake-actions">
              <button
                type="button"
                className="ek-snake-primary"
                disabled={busy}
                onClick={submit}
              >
                                {busy
                  ? "Checking…"
                  : retryPending
                    ? "Check saved run"
                    : "Submit completed run"}
              </button>
            </div>
          )}
        </>
      )}

            {retryPending && !recorded ? (
        <p role="status" style={{ lineHeight: 1.6 }}>
          A completed run is awaiting confirmation. Use Check
          saved run before restarting. After a page refresh,
          the board preview resets, but your submitted moves
          remain saved for checking.
        </p>
      ) : null}

      {!recorded && !retryPending && alreadyPlayed ? (
        <p style={{ lineHeight: 1.6 }}>
          Your earlier runs remain saved. You can play again;
          reward eligibility is checked when you submit.
        </p>
      ) : null}

      {recorded ? (
        <div
          role="status"
          style={{
            padding: "18px",
            border: "1px solid #86efac",
            borderRadius: "12px",
            background: "#ecfdf5",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          <strong>Completed run saved!</strong>

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

          <div className="ek-snake-actions">
            <button
              type="button"
              className="ek-snake-primary"
              onClick={restart}
            >
              Play again
            </button>
          </div>
        </div>
      ) : null}

      {message && (
        <p role="status" style={{
          background: "#fff3e9",
          padding: "12px",
          borderRadius: "9px",
        }}>
          {message}
        </p>
      )}
    </section>
  );
}