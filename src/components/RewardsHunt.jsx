import { useRef, useState } from "react";
import api from "../api";

const COLORS = [
  "#1d4ed8", "#c2410c", "#7c3aed", "#0f766e",
  "#be185d", "#4338ca", "#166534", "#0369a1",
];

const readSavedAnswers = (play) => {
  try {
    const entries = JSON.parse(play?.submittedAnswer || "[]");

    if (!Array.isArray(entries)) return {};

    return Object.fromEntries(
      entries
        .filter(
          (entry) =>
            typeof entry?.id === "string" &&
            typeof entry.answer === "string"
        )
        .map((entry) => [entry.id, entry.answer])
    );
  } catch {
    return {};
  }
};

export default function RewardsHunt({
  game,
  recordedPlay,
  onRecorded,
}) {
  const config = game.publicConfig;
  const clues = Array.isArray(config?.clues) ? config.clues : [];

  const valid =
    game.engineVersion === 2 &&
    config?.huntVersion === 1 &&
    clues.length >= 3 &&
    clues.length <= 8 &&
    clues.every(
      (entry, index) =>
        entry?.id === `clue-${index + 1}` &&
        typeof entry.clue === "string" &&
        entry.clue.trim()
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

    return `ek-hunt-pending:${ekonId}:${game._id}`;
  });

  const [recoveredAttempt] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) || "null"
      );

      if (
        saved?.gameId !== String(game._id) ||
        typeof saved.attemptId !== "string" ||
        !/^[a-zA-Z0-9_-]{16,100}$/.test(saved.attemptId) ||
        typeof saved.submittedAnswer !== "string" ||
        saved.submittedAnswer.length > 2000
      ) {
        return null;
      }

      const entries = JSON.parse(saved.submittedAnswer);

      if (
        !Array.isArray(entries) ||
        entries.length !== clues.length ||
        !entries.every(
          (entry, index) =>
            entry?.id === clues[index]?.id &&
            typeof entry.answer === "string" &&
            entry.answer.trim().length > 0 &&
            entry.answer.length <= 100
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

  const [answers, setAnswers] = useState(() =>
    recoveredAttempt ? readSavedAnswers(recoveredAttempt) : {}
  );
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryPending, setRetryPending] = useState(
    Boolean(recoveredAttempt)
  );

  const requestBusyRef = useRef(false);
  const pendingAttemptRef = useRef(recoveredAttempt);
  const firstAnswerRef = useRef(null);

  // Earlier completed hunts do not lock a new attempt.
  const play = result?.play;
  const completed = Boolean(play);
  const locked = completed || busy || retryPending;
  const practice = play?.playMode === "Practice";

  const displayedAnswers = completed
    ? readSavedAnswers(play)
    : answers;

  const entered = clues.filter(
    (entry) => displayedAnswers[entry.id]?.trim()
  ).length;

  const score =
    Number.isSafeInteger(play?.scoreEarned)
      ? play.scoreEarned
      : 0;

  const clearSavedAttempt = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // A remaining saved ID can safely return its existing result.
    }
  };

  const submitHunt = async (event) => {
    event.preventDefault();

    if (
      !valid ||
      completed ||
      busy ||
      requestBusyRef.current
    ) {
      return;
    }

    if (
      !pendingAttemptRef.current &&
      entered !== clues.length
    ) {
      setError("Enter an answer for every clue before submitting.");
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
          submittedAnswer: JSON.stringify(
            clues.map((entry) => ({
              id: entry.id,
              answer: (answers[entry.id] || "").trim(),
            }))
          ),
        };

        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(attempt)
          );
        } catch {
          setError(
            "This browser could not save your pending hunt. " +
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
          "Your completion could not be confirmed. " +
          "Use Check saved hunt to retry the same attempt."
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
        // Incorrect or incomplete answers have not recorded a play.
        // Unlock the fields so the customer can correct them.
        clearSavedAttempt();
        pendingAttemptRef.current = null;
        setRetryPending(false);
      }

      setError(
        submissionError?.response?.data?.message ||
          "Your completion could not be confirmed. " +
          "Use Check saved hunt to retry the same attempt."
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
    if (
      busy ||
      retryPending ||
      requestBusyRef.current
    ) {
      return;
    }

    setAnswers({});
    setResult(null);
    setError("");
    pendingAttemptRef.current = null;

    window.requestAnimationFrame(() => {
      firstAnswerRef.current?.focus();
    });
  };


  if (!valid) {
    return (
      <p role="status">
        This hunt needs an updated configuration.
        Please contact support.
      </p>
    );
  }

  const correct = play?.isCorrect === true;

  const credited =
    play?.pointsAwarded == null
      ? null
      : Number(play.pointsAwarded);

  return (
    <section className="ek-hunt" aria-label="Scavenger Hunt">
      <div className="ek-hunt-banner">
        <span aria-hidden="true">✦</span>
        <strong>THE EK DISCOVERY TRAIL</strong>
        <p>Follow the clues. Complete the adventure.</p>
      </div>

      <div className="ek-hunt-progress">
        <div aria-live="polite">
          <strong>
            {completed && correct
              ? "Hunt completed!"
              : `${entered} of ${clues.length} answers entered`}
          </strong>
          <span>
            {Math.round((entered / clues.length) * 100)}%
          </span>
        </div>

        <progress
          max={clues.length}
          value={entered}
          aria-label="Answers entered"
        />

        {!completed ? (
          <small>
            Progress counts answers entered. Answers are checked
            when you submit the entire hunt.
          </small>
        ) : null}
      </div>

      <form onSubmit={submitHunt}>
        <div className="ek-hunt-trail">
          {clues.map((entry, index) => {
            const filled = Boolean(
              displayedAnswers[entry.id]?.trim()
            );

            return (
              <div
                key={entry.id}
                className="ek-hunt-card"
                style={{ borderTopColor: COLORS[index] }}
              >
                <div className="ek-hunt-card-heading">
                  <span
                    className="ek-hunt-number"
                    style={{ backgroundColor: COLORS[index] }}
                  >
                    {index + 1}
                  </span>

                  <strong>Clue {index + 1}</strong>

                  <small>
                    {completed && correct
                      ? "Solved ✓"
                      : filled
                        ? "Answer entered"
                        : "To explore"}
                  </small>
                </div>

                <p className="ek-hunt-clue">{entry.clue}</p>

                {entry.hint ? (
                  <details className="ek-hunt-hint">
                    <summary>Need a hint?</summary>
                    <p>{entry.hint}</p>
                  </details>
                ) : null}

                <label className="ek-hunt-answer">
                  Your answer
                  <input
                                        type="text"
                    ref={index === 0 ? firstAnswerRef : undefined}
                    maxLength={100}
                    autoComplete="off"
                    value={displayedAnswers[entry.id] || ""}
                    disabled={locked}
                    placeholder="Enter your discovery"
                    onChange={(event) => {
                      const value = event.target.value;

                      setAnswers((previous) => ({
                        ...previous,
                        [entry.id]: value,
                      }));

                      setError("");
                    }}
                  />
                </label>
              </div>
            );
          })}
        </div>

        {!completed ? (
          <div className="ek-hunt-actions">
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                if (requestBusyRef.current) return;
                setAnswers({});
                setError("");
              }}
            >
              Clear answers
            </button>

            <button
              type="submit"
              className="ek-hunt-submit"
                           disabled={
                busy ||
                (!retryPending && entered !== clues.length)
              }
            >
                            {busy
                ? "Checking your discoveries…"
                : retryPending
                  ? "Check saved hunt"
                  : "Submit completed hunt"}
            </button>
          </div>
        ) : null}
      </form>

      {error ? (
        <p className="ek-hunt-error" role="alert">{error}</p>
      ) : null}

            {retryPending ? (
        <p className="ek-hunt-note" role="status">
          A hunt is awaiting confirmation. Use Check saved hunt
          to recover that same attempt before starting another.
        </p>
      ) : null}

      {!completed && !retryPending ? (
        <p className="ek-hunt-note">
          {recordedPlay
            ? "Your earlier completed hunts remain saved. "
            : ""}
          Solve every clue to earn game score. You can complete
          this hunt repeatedly; reward limits still apply.
        </p>
      ) : null}

      {completed ? (
        <div className="ek-hunt-result" role="status" aria-live="polite">
          <span aria-hidden="true">{correct ? "★" : "✦"}</span>

          <h3>
            {correct ? "Every clue solved!" : "Your play has been recorded"}
          </h3>

          <p>
            {result?.message ||
              (correct
                ? "You completed this Scavenger Hunt."
                : "Check your game history for this attempt.")}
          </p>

                    <p>
            <strong>
              Game score earned: +{score.toLocaleString()}
            </strong>
          </p>

          {practice ? (
            <p>
              Practice completion — no reward awarded.
              Your game score still counts.
            </p>
          ) : null}


          {Number.isFinite(credited) ? (
            <strong>{credited.toLocaleString()} EK Points credited</strong>
          ) : null}

                    <p className="ek-hunt-note">
            This completed hunt is saved. Play again starts a
            separate attempt; reward limits still apply.
          </p>

          <div className="ek-hunt-actions">
            <button
              type="button"
              className="ek-hunt-submit"
              onClick={playAgain}
            >
              Play again
            </button>
          </div>
        </div>
      ) : null}

      <style>{`
        .ek-hunt {
          margin-top: 16px;
          min-width: 0;
          color: #0f172a;
        }

        .ek-hunt-banner {
          padding: 22px;
          border-radius: 16px;
          background: linear-gradient(120deg, #0B3D91, #7c3aed);
          color: #ffffff;
          text-align: center;
        }

        .ek-hunt-banner > span {
          display: block;
          margin-bottom: 8px;
          color: #fde68a;
          font-size: 32px;
        }

        .ek-hunt-banner strong {
          font-size: 14px;
          letter-spacing: 1px;
        }

        .ek-hunt-banner p {
          margin-bottom: 0;
          color: #ffffff;
          line-height: 1.6;
        }

        .ek-hunt-progress {
          padding: 16px 0;
        }

        .ek-hunt-progress > div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 9px;
          color: #0B3D91;
        }

        .ek-hunt-progress progress {
          display: block;
          width: 100%;
          height: 12px;
          border: 0;
          border-radius: 999px;
          overflow: hidden;
          background: #e2e8f0;
          accent-color: #7c3aed;
        }

        .ek-hunt-progress progress::-webkit-progress-bar {
          background: #e2e8f0;
        }

        .ek-hunt-progress progress::-webkit-progress-value {
          background: linear-gradient(90deg, #2563eb, #7c3aed, #be185d);
          border-radius: 999px;
        }

        .ek-hunt-progress progress::-moz-progress-bar {
          background: #7c3aed;
          border-radius: 999px;
        }

        .ek-hunt-progress small {
          display: block;
          margin-top: 8px;
          color: #475569;
          line-height: 1.5;
        }

        .ek-hunt-trail {
          display: grid;
          gap: 14px;
        }

        .ek-hunt-card {
          padding: 16px;
          border: 1px solid #dbe3ef;
          border-top: 5px solid;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 3px 12px rgba(11,61,145,0.06);
        }

        .ek-hunt-card-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ek-hunt-number {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          color: #ffffff;
          font-weight: bold;
        }

        .ek-hunt-card-heading small {
          margin-left: auto;
          color: #475569;
          font-size: 12px;
        }

        .ek-hunt-clue {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .ek-hunt-hint {
          margin: 12px 0;
          padding: 10px 12px;
          border-radius: 9px;
          background: #fff7ed;
          color: #9a3412;
        }

        .ek-hunt-hint summary {
          min-height: 28px;
          font-weight: bold;
          cursor: pointer;
        }

        .ek-hunt-hint p {
          margin-bottom: 0;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .ek-hunt-answer {
          display: grid;
          gap: 7px;
          color: #0B3D91;
          font-size: 13px;
          font-weight: bold;
        }

        .ek-hunt-answer input {
          width: 100%;
          min-width: 0;
          min-height: 48px;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          font-size: 16px;
        }

        .ek-hunt-answer input:disabled {
          background: #f1f5f9;
          opacity: 1;
        }

        .ek-hunt-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .ek-hunt-actions button {
          min-height: 46px;
          padding: 11px 15px;
          border: 1px solid #0B3D91;
          border-radius: 10px;
          background: #ffffff;
          color: #0B3D91;
          font: inherit;
          font-weight: bold;
          cursor: pointer;
          touch-action: manipulation;
        }

        .ek-hunt-actions .ek-hunt-submit {
          flex: 1;
          background: #0B3D91;
          color: #ffffff;
        }

        .ek-hunt-actions button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .ek-hunt-error {
          padding: 12px;
          border-radius: 10px;
          background: #fef2f2;
          color: #991b1b;
          line-height: 1.6;
        }

        .ek-hunt-result {
          margin-top: 18px;
          padding: 22px;
          border: 1px solid #86efac;
          border-radius: 16px;
          background: #ecfdf5;
          color: #166534;
          text-align: center;
        }

        .ek-hunt-result > span {
          font-size: 38px;
          color: #a16207;
        }

        .ek-hunt .ek-hunt-result h3 {
          color: inherit;
        }

        .ek-hunt-result p {
          line-height: 1.6;
        }

        .ek-hunt-note {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }

        @keyframes ek-hunt-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: no-preference) {
          .ek-hunt-result {
            animation: ek-hunt-reveal 350ms ease-out both;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ek-hunt button {
            transition: none !important;
          }

          .ek-hunt button:hover {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}