import { useEffect, useRef, useState } from "react";
import api from "../api";

export default function RewardsScratch({
  game,
  recordedPlay,
  onRecorded,
}) {
  const config = game.publicConfig;
  const prizes = Array.isArray(config?.prizes)
    ? config.prizes
    : [];

  const valid =
    game.engineVersion === 2 &&
    config?.scratchVersion === 1 &&
    config?.selection === "equal-prizes" &&
    prizes.length >= 4 &&
    prizes.length <= 12;

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

    return `ek-scratch-pending:${ekonId}:${game._id}`;
  });

  const [recoveredAttempt] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) || "null"
      );

      return (
        saved?.gameId === String(game._id) &&
        typeof saved.attemptId === "string" &&
        /^[a-zA-Z0-9_-]{16,100}$/.test(saved.attemptId)
      )
        ? {
            gameId: String(game._id),
            attemptId: saved.attemptId,
          }
        : null;
    } catch {
      return null;
    }
  });

  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [retryPending, setRetryPending] = useState(
    Boolean(recoveredAttempt)
  );

  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const previousPointRef = useRef(null);
  const lastCheckRef = useRef(0);
  const requestBusyRef = useRef(false);
  const pendingAttemptRef = useRef(recoveredAttempt);

  // Historical plays do not lock a new card.
  const play = result?.play;
  const outcome = play?.outcome;
  const completed = Boolean(play);
  const showResult = completed && revealed;
  const practice = play?.playMode === "Practice";

  const prizeType =
    outcome?.prizeType ||
    (outcome?.points > 0 ? "Points" : "No Prize");

  const won =
    Boolean(outcome) &&
    !practice &&
    prizeType !== "No Prize";

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

  useEffect(() => {
    if (!completed || showResult) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      setRevealed(true);
      return;
    }

    const gradient = context.createLinearGradient(
      0, 0, canvas.width, canvas.height
    );

    gradient.addColorStop(0, "#0B3D91");
    gradient.addColorStop(0.5, "#7c3aed");
    gradient.addColorStop(1, "#be185d");

    context.globalCompositeOperation = "source-over";
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(255,255,255,0.12)";

    for (let x = 20; x < canvas.width; x += 45) {
      for (let y = 20; y < canvas.height; y += 45) {
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.textAlign = "center";
    context.fillStyle = "#fde68a";
    context.font = "bold 34px sans-serif";
    context.fillText("EK REWARDS", canvas.width / 2, 105);

    context.fillStyle = "#ffffff";
    context.font = "bold 32px sans-serif";
    context.fillText("SCRATCH TO REVEAL", canvas.width / 2, 175);

    context.font = "20px sans-serif";
    context.fillText(
      "Use your finger or mouse",
      canvas.width / 2,
      225
    );

    pointerRef.current = null;
    previousPointRef.current = null;
    lastCheckRef.current = 0;
  }, [completed, showResult, play?._id]);

  const checkProgress = (force = false) => {
    const now = performance.now();

    if (!force && now - lastCheckRef.current < 100) return;
    lastCheckRef.current = now;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!context) return;

    try {
      const pixels = context.getImageData(
        0, 0, canvas.width, canvas.height
      ).data;

      let transparent = 0;
      let sampled = 0;

      // Sample every fourth pixel to keep touch interaction smooth.
      for (let index = 3; index < pixels.length; index += 16) {
        sampled += 1;
        if (pixels[index] < 128) transparent += 1;
      }

      const percentage = Math.round(
        (transparent / sampled) * 100
      );

      setProgress(percentage);

      if (percentage >= 50) {
        pointerRef.current = null;
        previousPointRef.current = null;
        setRevealed(true);
      }
    } catch {
      // The Reveal button remains available if canvas inspection fails.
    }
  };

  const scratchAt = (event) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || showResult) return;

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const point = {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height,
    };

    const previous = previousPointRef.current || point;

    context.globalCompositeOperation = "destination-out";
    context.lineWidth = 52;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();

    context.beginPath();
    context.arc(point.x, point.y, 26, 0, Math.PI * 2);
    context.fill();

    previousPointRef.current = point;
    checkProgress();
  };

  const endScratch = (event) => {
    if (pointerRef.current !== event.pointerId) return;

    pointerRef.current = null;
    previousPointRef.current = null;
    checkProgress(true);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

    const startCard = async () => {
    if (
      !valid ||
      completed ||
      busy ||
      requestBusyRef.current
    ) {
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
        };

        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(attempt)
          );
        } catch {
          setError(
            "This browser could not save your pending card. " +
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
          "Your card could not be confirmed. Use Check saved " +
          "card to retry the same attempt."
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

      setProgress(0);
      setRevealed(false);
      pointerRef.current = null;
      previousPointRef.current = null;
      lastCheckRef.current = 0;
    } catch (startError) {
      const status = startError?.response?.status;

      if (status === 400) {
        clearSavedAttempt();
        pendingAttemptRef.current = null;
        setRetryPending(false);
      }

      setError(
        startError?.response?.data?.message ||
          "Your card could not be confirmed. Use Check saved " +
          "card to retry the same attempt."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }

    if (confirmedPlay) {
      onRecorded?.(confirmedPlay);
    }
  };

  const startAnotherCard = () => {
    if (
      busy ||
      retryPending ||
      requestBusyRef.current ||
      !showResult
    ) {
      return;
    }

    setResult(null);
    setRevealed(false);
    setProgress(0);
    setError("");

    pendingAttemptRef.current = null;
    pointerRef.current = null;
    previousPointRef.current = null;
    lastCheckRef.current = 0;
  };


  if (!valid) {
    return (
      <p role="status">
        This Scratch Card needs an updated prize configuration.
        Please contact support.
      </p>
    );
  }

  const credited =
    play?.pointsAwarded == null
      ? null
      : Number(play.pointsAwarded);

  return (
    <section className="ek-scratch" aria-label="Scratch Card game">
      <div className="ek-scratch-banner">
        <span aria-hidden="true">✦</span>
        <strong>YOUR EK SURPRISE CARD</strong>
        <p>A little scratch. A colourful reveal.</p>
      </div>

      <p className="ek-scratch-note">
                Start another card whenever you like. Starting a card
        saves its result and game score. Every listed entry
        has an equal chance. Reward limits still apply;
        practice cards award no prize or EK Points.
      </p>

      {!completed ? (
        <>
          <div className="ek-scratch-unopened" aria-hidden="true">
            <span>EK</span>
            <strong>Your surprise awaits</strong>
          </div>

                    <p className="ek-scratch-note">
            {retryPending
              ? "A card is awaiting confirmation. Check that saved attempt before starting another."
              : game.rewardsEnabled === false
                ? "Rewards are disabled. This card is for game score only."
                : "The server checks your reward allowance when you start. A practice card does not award its displayed prize."}
          </p>


          <button
            type="button"
            className="ek-scratch-start"
                        disabled={busy}
            onClick={startCard}
          >
                        {busy
              ? "Preparing your card…"
              : retryPending
                ? "Check saved card"
                : "Start Scratch Card"}
          </button>
        </>
      ) : (
        <>
          <div className="ek-scratch-card">
            <div
              className={
                "ek-scratch-underlay " +
                (won ? "ek-scratch-winner" : "ek-scratch-neutral")
              }
              aria-hidden="true"
            >
              <span>{won ? "★" : "✦"}</span>
              <strong>{outcome?.label || "Result saved"}</strong>
                            <small>
                {practice
                  ? `Practice: ${prizeType} — not awarded`
                  : outcome
                    ? prizeType
                    : "Result saved"}
              </small>
            </div>

            {!showResult ? (
              <canvas
                ref={canvasRef}
                width="600"
                height="320"
                aria-hidden="true"
                onPointerDown={(event) => {
                  if (
                    pointerRef.current !== null ||
                    (event.pointerType === "mouse" && event.button !== 0)
                  ) {
                    return;
                  }

                  pointerRef.current = event.pointerId;
                  previousPointRef.current = null;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  scratchAt(event);
                }}
                onPointerMove={(event) => {
                  if (pointerRef.current === event.pointerId) {
                    scratchAt(event);
                  }
                }}
                onPointerUp={endScratch}
                onPointerCancel={endScratch}
                onLostPointerCapture={() => {
                  pointerRef.current = null;
                  previousPointRef.current = null;
                }}
              />
            ) : null}
          </div>

          {!showResult ? (
            <>
              <p role="status" className="ek-scratch-note">
                Scratch the cover with your finger or mouse.
                {" "}{progress}% uncovered — reveal at 50%.
              </p>

              <button
                type="button"
                className="ek-scratch-reveal"
                onClick={() => {
                  pointerRef.current = null;
                  setRevealed(true);
                }}
              >
                Reveal result
              </button>
            </>
          ) : (
            <div className="ek-scratch-result" role="status" aria-live="polite">
              <h3>
                                {practice
                  ? "Practice card — no prize awarded"
                  : outcome
                    ? won
                      ? "You won!"
                      : "Your card is complete"
                    : "Your card has been recorded"}
              </h3>

              {outcome ? <strong>{outcome.label}</strong> : null}
              {result?.message ? <p>{result.message}</p> : null}
                            <p>
                <strong>
                  Game score earned: +{score.toLocaleString()}
                </strong>
              </p>

              {practice ? (
                <p>
                  The displayed result is simulated.
                  No prize delivery or redeemable EK Points
                  are awarded for this card.
                </p>
              ) : null}

                            {Number.isFinite(credited) ? (
                <p>
                  <strong>
                    {credited.toLocaleString()} EK Points credited
                  </strong>
                </p>
              ) : null}

                            {!practice && outcome?.fulfilmentStatus === "Pending" ? (
                <p className="ek-scratch-pending">
                  Prize delivery pending. Eltham Konnect will
                  arrange fulfilment separately.
                </p>
                            ) : !practice && outcome?.fulfilmentStatus === "Delivered" ? (
                <p>This prize has been marked delivered.</p>
              ) : null}

                            <small>
                This card is saved. Starting another card
                creates a separate play; reward limits still apply.
              </small>

              <button
                type="button"
                className="ek-scratch-start"
                style={{ marginTop: "16px" }}
                onClick={startAnotherCard}
              >
                Start another card
              </button>
            </div>
          )}
        </>
      )}

      {error ? (
        <p className="ek-scratch-error" role="alert">{error}</p>
      ) : null}

            {!completed && !retryPending && recordedPlay ? (
        <p className="ek-scratch-note">
          Your earlier cards remain saved. You can start a new
          card; the server checks its reward eligibility.
        </p>
      ) : null}

      <details className="ek-scratch-prizes">
        <summary>Possible prizes</summary>

        <ul>
          {prizes.map((prize, index) => (
            <li key={prize.id || index}>
              <strong>{prize.label}</strong>
              {" — "}
              {prize.prizeType ||
                (prize.points > 0 ? "Points" : "No Prize")}
            </li>
          ))}
        </ul>
      </details>

      <p className="ek-scratch-note">
                Eligible EK Points rewards are subject to the
        1,500-point balance limit. Eligible gift cards, phone
        credit and other prizes are fulfilled separately.
        Practice cards never create a prize delivery.
      </p>

      <style>{`
        .ek-scratch {
          min-width: 0;
          margin-top: 16px;
          color: #0f172a;
        }

        .ek-scratch-banner {
          padding: 20px;
          border-radius: 16px;
          background: linear-gradient(120deg, #0B3D91, #7c3aed, #be185d);
          color: #ffffff;
          text-align: center;
        }

        .ek-scratch-banner > span {
          display: block;
          color: #fde68a;
          font-size: 30px;
          margin-bottom: 6px;
        }

        .ek-scratch-banner strong {
          font-size: 14px;
          letter-spacing: 1px;
        }

        .ek-scratch-banner p {
          margin-bottom: 0;
          color: #ffffff;
        }

        .ek-scratch-note {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }

        .ek-scratch-unopened {
          display: grid;
          place-content: center;
          gap: 14px;
          min-height: 200px;
          margin: 18px 0;
          border: 2px dashed #a78bfa;
          border-radius: 18px;
          background: linear-gradient(135deg, #eef4ff, #fce7f3);
          text-align: center;
          color: #0B3D91;
        }

        .ek-scratch-unopened span {
          font-size: 42px;
          font-weight: 900;
        }

        .ek-scratch-card {
          position: relative;
          min-height: 190px;
          aspect-ratio: 600 / 320;
          margin: 20px 0 12px;
          overflow: hidden;
          border: 3px solid #ffffff;
          border-radius: 18px;
          box-shadow: 0 0 0 1px #dbe3ef, 0 8px 22px rgba(11,61,145,0.15);
        }

        .ek-scratch-underlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 18px;
          text-align: center;
          overflow-wrap: anywhere;
        }

        .ek-scratch-winner {
          background: linear-gradient(135deg, #fef3c7, #ecfdf5);
          color: #166534;
        }

        .ek-scratch-neutral {
          background: linear-gradient(135deg, #eef4ff, #f5f3ff);
          color: #5b21b6;
        }

        .ek-scratch-underlay > span {
          font-size: 38px;
          color: #a16207;
        }

        .ek-scratch-underlay strong {
          font-size: clamp(18px, 4vw, 25px);
          line-height: 1.4;
        }

        .ek-scratch-card canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          touch-action: none;
          cursor: crosshair;
        }

        .ek-scratch .ek-scratch-start,
        .ek-scratch .ek-scratch-reveal {
          width: 100%;
          min-height: 48px;
          padding: 12px 16px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(100deg, #0B3D91, #7c3aed);
          color: #ffffff;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          touch-action: manipulation;
        }

        .ek-scratch .ek-scratch-start:disabled {
          background: #e2e8f0;
          color: #475569;
          cursor: default;
        }

        .ek-scratch-result {
          padding: 18px;
          border: 1px solid #c4b5fd;
          border-radius: 14px;
          background: #f5f3ff;
          color: #5b21b6;
          text-align: center;
          overflow-wrap: anywhere;
        }

        .ek-scratch .ek-scratch-result h3 {
          margin-top: 0;
          color: inherit;
        }

        .ek-scratch-result p {
          line-height: 1.6;
        }

        .ek-scratch-pending {
          padding: 10px;
          border-radius: 9px;
          background: #ffffff;
          font-weight: bold;
        }

        .ek-scratch-error {
          padding: 12px;
          border-radius: 10px;
          background: #fef2f2;
          color: #991b1b;
          line-height: 1.6;
        }

        .ek-scratch-prizes {
          margin-top: 18px;
          padding: 12px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: #ffffff;
        }

        .ek-scratch-prizes summary {
          min-height: 28px;
          color: #0B3D91;
          font-weight: bold;
          cursor: pointer;
        }

        .ek-scratch-prizes li {
          margin: 10px 0;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
      `}</style>
    </section>
  );
}