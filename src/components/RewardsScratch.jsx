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

  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const previousPointRef = useRef(null);
  const lastCheckRef = useRef(0);
  const requestBusyRef = useRef(false);

  const play = result?.play || recordedPlay;
  const outcome = play?.outcome;
  const completed = Boolean(play);

  // Returning to the page displays the already saved result.
  const showResult =
    revealed || (!result && Boolean(recordedPlay));

  const prizeType =
    outcome?.prizeType ||
    (outcome?.points > 0 ? "Points" : "No Prize");

  const won = Boolean(outcome) && prizeType !== "No Prize";

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
      needsRefresh ||
      requestBusyRef.current
    ) {
      return;
    }

    requestBusyRef.current = true;
    setBusy(true);
    setError("");

    try {
      const response = await api.post(
        "/api/rewards-hub-games/play",
        { gameId: game._id }
      );

      const data = response.data?.data;

      if (!data?.play?._id) {
        setNeedsRefresh(true);
        setError(
          "Could not confirm your card. Refresh the page " +
          "to check your saved result."
        );
        return;
      }

      setResult({
        play: data.play,
        message: response.data.message,
      });

      setProgress(0);
      setRevealed(false);
      onRecorded?.(data.play);
    } catch (startError) {
      const status = startError?.response?.status;

      if (!status || status >= 500 || status === 409) {
        setNeedsRefresh(true);
      }

      setError(
        startError?.response?.data?.message ||
          "Could not confirm your card. Refresh the page " +
          "to check your saved result."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }
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
        One card per customer. Starting the card selects and
        saves your result. Every listed prize entry has an
        equal chance.
      </p>

      {!completed ? (
        <>
          <div className="ek-scratch-unopened" aria-hidden="true">
            <span>EK</span>
            <strong>Your surprise awaits</strong>
          </div>

          <button
            type="button"
            className="ek-scratch-start"
            disabled={busy || needsRefresh}
            onClick={startCard}
          >
            {busy ? "Preparing your card…" : "Start Scratch Card"}
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
              <small>{outcome ? prizeType : "Check your game history"}</small>
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
                {outcome
                  ? won
                    ? "You won!"
                    : "Your card is complete"
                  : "Your card has been recorded"}
              </h3>

              {outcome ? <strong>{outcome.label}</strong> : null}
              {result?.message ? <p>{result.message}</p> : null}

              {Number.isFinite(credited) &&
              (!outcome || prizeType === "Points" || prizeType === "No Prize") ? (
                <p>
                  <strong>
                    {credited.toLocaleString()} EK Points credited
                  </strong>
                </p>
              ) : null}

              {outcome?.fulfilmentStatus === "Pending" ? (
                <p className="ek-scratch-pending">
                  Prize delivery pending. Eltham Konnect will
                  arrange fulfilment separately.
                </p>
              ) : outcome?.fulfilmentStatus === "Delivered" ? (
                <p>This prize has been marked delivered.</p>
              ) : null}

              <small>
                Your result is saved. Refreshing will not give another card.
              </small>
            </div>
          )}
        </>
      )}

      {error ? (
        <p className="ek-scratch-error" role="alert">{error}</p>
      ) : null}

      {needsRefresh ? (
        <p>Refresh this page to check your game history before retrying.</p>
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
        EK Points are subject to the 1,500-point balance limit.
        Gift cards, phone credit and other prizes are fulfilled separately.
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