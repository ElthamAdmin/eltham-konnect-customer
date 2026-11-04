import { useRef, useState } from "react";
import api from "../api";

const COLORS = [
  "#1d4ed8",
  "#c2410c",
  "#7c3aed",
  "#0f766e",
  "#be185d",
  "#4338ca",
];

export default function RewardsTrivia({
  game,
  recordedPlay,
  onRecorded,
}) {
  const [storageKey] = useState(() => {
    let ekonId = "customer";

    try {
      const customer = JSON.parse(
        localStorage.getItem("ek_customer_data") || "null"
      );
      ekonId = customer?.ekonId || ekonId;
    } catch {
      // Authentication is still enforced by the API.
    }

    return `ek-trivia-pending:${ekonId}:${game._id}`;
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
        saved.submittedAnswer.length <= 500
      )
        ? saved
        : null;
    } catch {
      return null;
    }
  });

  const [selected, setSelected] = useState(
    recoveredAttempt?.submittedAnswer || ""
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [retryPending, setRetryPending] = useState(
    Boolean(recoveredAttempt)
  );

  const requestBusyRef = useRef(false);
  const pendingAttemptRef = useRef(recoveredAttempt);

  // Historical plays no longer lock a new Trivia attempt.
  const play = result?.play;
  const completed = Boolean(play);
  const locked = completed || busy || retryPending;

  const options = Array.isArray(game.options)
    ? game.options.filter(
        (option) => typeof option === "string" && option.trim()
      )
    : [];

  const displayedAnswer = play?.submittedAnswer || selected;

  const clearSavedAttempt = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // A remaining saved ID is safe to retry:
      // the backend returns its existing result.
    }
  };

  const submitAnswer = async () => {
    if (completed || busy || requestBusyRef.current) return;

    if (!selected.trim()) {
      setError("Choose an answer before submitting.");
      return;
    }

    requestBusyRef.current = true;
    setBusy(true);
    setError("");

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
          submittedAnswer: selected.trim(),
        };

        // Save before sending. Do not submit if the pending
        // attempt cannot be saved for recovery.
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(attempt)
          );
        } catch {
          setError(
            "This browser could not save your pending attempt. " +
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

      if (!data?.play?._id) {
        setError(
          "The result could not be confirmed. " +
          "Use Check saved attempt to retry the same submission."
        );
        return;
      }

      confirmedPlay = data.play;

      setResult({
        ...data,
        message: response.data.message,
      });

      clearSavedAttempt();
      pendingAttemptRef.current = null;
      setRetryPending(false);
    } catch (submissionError) {
      const status = submissionError?.response?.status;

      if (status === 400) {
        // Validation failed without recording a play.
        clearSavedAttempt();
        pendingAttemptRef.current = null;
        setRetryPending(false);
      }

      setError(
        submissionError?.response?.data?.message ||
          "The result could not be confirmed. " +
          "Use Check saved attempt to retry the same submission."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }

    if (confirmedPlay) {
      onRecorded?.(confirmedPlay);
    }
  };

  const playAgain = () => {
    if (busy || requestBusyRef.current || retryPending) return;

    setSelected("");
    setResult(null);
    setError("");
    pendingAttemptRef.current = null;
  };

  const correct = play?.isCorrect === true;
  const practice = play?.playMode === "Practice";

  const points =
    play?.pointsAwarded == null
      ? null
      : Number(play.pointsAwarded);

  const score =
    Number.isSafeInteger(play?.scoreEarned)
      ? play.scoreEarned
      : 0;


  return (
    <section className="ek-trivia" aria-label="Trivia game">
      <div className="ek-trivia-question">
        <span className="ek-trivia-eyebrow">
          <span aria-hidden="true">✦</span> EK TRIVIA CHALLENGE
        </span>

        <h3>{game.question || "What is your answer?"}</h3>

        <p>
                    Play again whenever you like. Correct answers earn game
          score; rewards follow this game's reward limits.
        </p>
      </div>

      {options.length > 0 ? (
        <div
          className="ek-trivia-choices"
          role="group"
          aria-label="Answer choices"
        >
          {options.map((option, index) => {
            const chosen = displayedAnswer === option;

            return (
              <button
                key={`${index}-${option}`}
                type="button"
                disabled={locked}
                aria-pressed={chosen}
                className={
                  "ek-trivia-choice" +
                  (chosen ? " ek-trivia-selected" : "")
                }
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                }}
                onClick={() => {
                  setSelected(option);
                  setError("");
                }}
              >
                <span
                  className="ek-trivia-letter"
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="ek-trivia-answer">
                  {option}
                </span>

                <span className="ek-trivia-mark">
                  {chosen ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <label className="ek-trivia-text-answer">
          Your answer

          <input
            type="text"
            value={displayedAnswer}
            disabled={locked}
            maxLength={500}
            onChange={(event) => {
              setSelected(event.target.value);
              setError("");
            }}
            placeholder="Type your answer"
          />
        </label>
      )}

      {!completed ? (
        <>
          <p
            className="ek-trivia-selection"
            aria-live="polite"
          >
            {selected
              ? `Selected: ${selected}`
              : "Select an answer to get started."}
          </p>

                    {retryPending ? (
            <p className="ek-trivia-note" role="status">
              An attempt is awaiting confirmation. Your answer
              is locked until its saved result is checked.
            </p>
          ) : null}

          <button
            type="button"
            className="ek-trivia-submit"
            disabled={busy || !selected.trim()}
            onClick={submitAnswer}
          >
            {busy
              ? "Checking your answer…"
              : retryPending
                ? "Check saved attempt"
                : "Submit answer"}
          </button>
        </>
      ) : (
        <div
          className={
            "ek-trivia-result " +
            (correct ? "ek-trivia-win" : "ek-trivia-miss")
          }
          role="status"
          aria-live="polite"
        >
          <div className="ek-trivia-result-icon" aria-hidden="true">
            {correct ? "★" : "●"}
          </div>

          <strong>
            {correct ? "Correct answer!" : "That answer was incorrect."}
          </strong>

          <p>
            {result?.message ||
              (correct
                ? "Your successful play has been recorded."
                                : "Your attempt has been recorded. " +
                  "You can play again.")}
          </p>

                    <p style={{ fontWeight: "bold" }}>
            Game score earned: +{score.toLocaleString()}
          </p>

          {practice ? (
            <p>
              Practice play — no reward awarded.
              Your game score still counts.
            </p>
          ) : null}


          {Number.isFinite(points) ? (
            <span className="ek-trivia-points">
              {points.toLocaleString()} EK Points credited
            </span>
          ) : null}

                    {correct && !practice && result?.rewardText ? (
            <p>{result.rewardText}</p>
          ) : null}

          <button
            type="button"
            className="ek-trivia-submit"
            style={{ marginTop: "16px" }}
            onClick={playAgain}
          >
            Play again
          </button>
        </div>
      )}

      {error ? (
        <p className="ek-trivia-error" role="alert">
          {error}
        </p>
      ) : null}

            {!completed && !retryPending && recordedPlay ? (
        <p className="ek-trivia-note">
          Previous plays are saved. This is a new attempt;
          reward eligibility is checked when you submit.
        </p>
      ) : null}

      <style>{`
        .ek-trivia {
          color: #0f172a;
          min-width: 0;
          margin-top: 14px;
        }

        .ek-trivia-question {
          padding: 22px;
          border-radius: 18px;
          background:
            radial-gradient(circle at top right,
              rgba(255,255,255,0.18), transparent 55%),
            linear-gradient(125deg, #0B3D91, #5930a8);
          color: #ffffff;
          box-shadow: 0 8px 20px rgba(11,61,145,0.16);
        }

        .ek-trivia-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .ek-trivia .ek-trivia-question h3 {
          margin: 14px 0 10px;
          color: #ffffff;
          font-size: 23px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .ek-trivia-question p {
          margin: 0;
          color: #e8edff;
          font-size: 13px;
          line-height: 1.6;
        }

        .ek-trivia-choices {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .ek-trivia .ek-trivia-choice {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          min-height: 84px;
          padding: 14px;
          border: 3px solid transparent;
          border-radius: 14px;
          color: #ffffff;
          text-align: left;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(15,23,42,0.15);
          transition: transform 150ms ease, box-shadow 150ms ease;
          touch-action: manipulation;
          opacity: 1;
        }

        .ek-trivia .ek-trivia-choice:not(:disabled):hover {
          transform: translateY(-3px);
          opacity: 1;
          box-shadow: 0 7px 0 rgba(15,23,42,0.15);
        }

        .ek-trivia .ek-trivia-choice.ek-trivia-selected {
          border-color: #ffffff;
          outline: 3px solid #0f172a;
          outline-offset: 1px;
        }

        .ek-trivia .ek-trivia-choice:focus-visible {
          outline: 3px solid #0f172a;
          outline-offset: 3px;
        }

        .ek-trivia-choice:disabled {
          cursor: default;
        }

        .ek-trivia-letter {
          display: grid;
          place-items: center;
          flex: 0 0 30px;
          height: 30px;
          border-radius: 9px;
          background: rgba(0,0,0,0.2);
          color: #ffffff;
        }

        .ek-trivia-answer {
          flex: 1;
          min-width: 0;
          overflow-wrap: anywhere;
          line-height: 1.5;
        }

        .ek-trivia-mark {
          flex: 0 0 16px;
          font-size: 20px;
          color: #ffffff;
        }

        .ek-trivia-selection {
          margin: 18px 0 12px;
          color: #475569;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .ek-trivia .ek-trivia-submit {
          width: 100%;
          min-height: 48px;
          padding: 12px 16px;
          border: 0;
          border-radius: 12px;
          background: #0B3D91;
          color: #ffffff;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          touch-action: manipulation;
        }

        .ek-trivia .ek-trivia-submit:disabled {
          background: #e2e8f0;
          color: #475569;
          cursor: default;
        }

        .ek-trivia-text-answer {
          display: grid;
          gap: 8px;
          margin-top: 16px;
          color: #0B3D91;
          font-weight: bold;
        }

        .ek-trivia-text-answer input {
          width: 100%;
          min-height: 48px;
          padding: 12px;
          box-sizing: border-box;
          border: 2px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          font-size: 16px;
        }

        .ek-trivia-result {
          margin-top: 20px;
          padding: 20px;
          border: 1px solid;
          border-radius: 16px;
          text-align: center;
        }

        .ek-trivia-win {
          background: #ecfdf5;
          border-color: #86efac;
          color: #166534;
        }

        .ek-trivia-miss {
          background: #fff7ed;
          border-color: #fdba74;
          color: #9a3412;
        }

        .ek-trivia-result-icon {
          font-size: 34px;
          margin-bottom: 8px;
        }

        .ek-trivia-result strong {
          display: block;
          font-size: 20px;
        }

        .ek-trivia-result p {
          margin: 10px 0;
          line-height: 1.6;
        }

        .ek-trivia-points {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 999px;
          background: #ffffff;
          font-weight: 800;
        }

        .ek-trivia-error {
          padding: 12px;
          border-radius: 10px;
          background: #fef2f2;
          color: #991b1b;
          line-height: 1.6;
        }

        .ek-trivia-note {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }

        @keyframes ek-trivia-reveal {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .ek-trivia-result {
            animation: ek-trivia-reveal 350ms ease-out both;
          }

          .ek-trivia-win .ek-trivia-result-icon {
            animation: ek-trivia-reveal 500ms ease-out both;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ek-trivia button {
            transition: none !important;
          }

          .ek-trivia button:hover {
            transform: none !important;
          }
        }

        @media (max-width: 420px) {
          .ek-trivia-choices {
            grid-template-columns: 1fr;
          }

          .ek-trivia .ek-trivia-choice {
            min-height: 64px;
          }

          .ek-trivia-question {
            padding: 18px;
          }

          .ek-trivia .ek-trivia-question h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </section>
  );
}