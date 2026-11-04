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

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const requestBusyRef = useRef(false);

  const play = result?.play || recordedPlay;
  const completed = Boolean(play);
  const locked = completed || busy || needsRefresh;
  const displayedAnswers = completed
    ? readSavedAnswers(play)
    : answers;

  const entered = clues.filter(
    (entry) => displayedAnswers[entry.id]?.trim()
  ).length;

  const submitHunt = async (event) => {
    event.preventDefault();

    if (!valid || locked || requestBusyRef.current) return;

    if (entered !== clues.length) {
      setError("Enter an answer for every clue before submitting.");
      return;
    }

    requestBusyRef.current = true;
    setBusy(true);
    setError("");

    try {
      const response = await api.post(
        "/api/rewards-hub-games/play",
        {
          gameId: game._id,
          submittedAnswer: JSON.stringify(
            clues.map((entry) => ({
              id: entry.id,
              answer: (answers[entry.id] || "").trim(),
            }))
          ),
        }
      );

      const data = response.data?.data;

      if (!data?.play?._id) {
        setNeedsRefresh(true);
        setError(
          "Could not confirm completion. Refresh the page " +
          "to check your game history."
        );
        return;
      }

      setResult({
        play: data.play,
        message: response.data.message,
      });

      onRecorded?.(data.play);
    } catch (submissionError) {
      const status = submissionError?.response?.status;

      if (!status || status >= 500 || status === 409) {
        setNeedsRefresh(true);
      }

      setError(
        submissionError?.response?.data?.message ||
          "Could not confirm completion. Refresh the page " +
          "to check your game history."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }
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
              disabled={locked || entered !== clues.length}
            >
              {busy ? "Checking your discoveries…" : "Submit completed hunt"}
            </button>
          </div>
        ) : null}
      </form>

      {error ? (
        <p className="ek-hunt-error" role="alert">{error}</p>
      ) : null}

      {needsRefresh ? (
        <p className="ek-hunt-note">
          Refresh the page to check your history before retrying.
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

          {Number.isFinite(credited) ? (
            <strong>{credited.toLocaleString()} EK Points credited</strong>
          ) : null}

          <p className="ek-hunt-note">
            This completed play is saved. You cannot claim its reward again.
          </p>
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