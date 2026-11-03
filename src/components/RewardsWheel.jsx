import { useEffect, useRef, useState } from "react";
import api from "../api";

const FALLBACK_COLORS = [
  "#1d4ed8", "#c2410c", "#7c3aed", "#0f766e",
  "#be185d", "#4338ca", "#166534", "#a16207",
  "#0369a1", "#a21caf", "#9f1239", "#374151",
];

const landingAngle = (index, count) =>
  360 - (index + 0.5) * (360 / count);

export default function RewardsWheel({
  game,
  recordedPlay,
  onRecorded,
}) {
  const config = game.publicConfig;
  const segments = Array.isArray(config?.segments)
    ? config.segments
    : [];

  const valid =
    game.engineVersion === 2 &&
    config?.wheelVersion === 1 &&
    config?.selection === "equal-segments" &&
    segments.length >= 4 &&
    segments.length <= 12 &&
    segments.every(
      (segment, index) =>
        segment?.id === `segment-${index + 1}` &&
        typeof segment.label === "string" &&
        Number.isSafeInteger(segment.points) &&
        segment.points >= 0 &&
        segment.points <= 1500
    );

  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(4000);
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const requestBusyRef = useRef(false);

  const play = result?.play || recordedPlay;
  const outcome = play?.outcome;

  const busy =
    phase === "requesting" || phase === "spinning";

  const completed = Boolean(play);
  const reveal = completed && !busy;

  const matchingOutcome =
    outcome &&
    Number.isInteger(outcome.segmentIndex) &&
    outcome.segmentIndex >= 0 &&
    outcome.segmentIndex < segments.length &&
    segments[outcome.segmentIndex]?.id === outcome.segmentId;

  // Restore the saved landing position when history loads.
  useEffect(() => {
    if (
      !valid ||
      phase !== "idle" ||
      !recordedPlay?.outcome
    ) {
      return;
    }

    const saved = recordedPlay.outcome;

    if (
      Number.isInteger(saved.segmentIndex) &&
      saved.segmentIndex >= 0 &&
      saved.segmentIndex < segments.length &&
      segments[saved.segmentIndex]?.id === saved.segmentId
    ) {
      setRotation(
        landingAngle(saved.segmentIndex, segments.length)
      );
    }
  }, [valid, phase, recordedPlay, segments]);

  // A timer also completes the reveal if a browser skips
  // transitionend after switching tabs.
  useEffect(() => {
    if (phase !== "spinning") return undefined;

    const timer = window.setTimeout(
      () => setPhase("done"),
      duration + 150
    );

    return () => window.clearTimeout(timer);
  }, [phase, duration]);

  const spin = async () => {
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
    setPhase("requesting");
    setError("");

    try {
      const response = await api.post(
        "/api/rewards-hub-games/play",
        { gameId: game._id }
      );

      const data = response.data?.data;
      const saved = data?.play?.outcome;

      if (!data?.play?._id) {
        setNeedsRefresh(true);
        setError(
          "Could not confirm your spin. Refresh the page " +
          "to check your saved result."
        );
        setPhase("idle");
        return;
      }

      setResult({
        play: data.play,
        message: response.data.message,
      });

      // Save the play in the page immediately. Animation
      // completion does not control whether a prize is awarded.
      onRecorded?.(data.play);

      if (
        !saved ||
        !Number.isInteger(saved.segmentIndex) ||
        saved.segmentIndex < 0 ||
        saved.segmentIndex >= segments.length ||
        segments[saved.segmentIndex]?.id !== saved.segmentId
      ) {
        setPhase("done");
        setError(
          "Your spin was recorded, but its wheel position " +
          "could not be displayed. Refresh to check your history."
        );
        return;
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      setDuration(reducedMotion ? 0 : 4000);
      setPhase("spinning");

      setRotation(
        5 * 360 +
        landingAngle(saved.segmentIndex, segments.length)
      );
    } catch (spinError) {
      const status = spinError?.response?.status;

      if (!status || status >= 500 || status === 409) {
        setNeedsRefresh(true);
      }

      setError(
        spinError?.response?.data?.message ||
          "Could not confirm your spin. Refresh the page " +
          "to check your saved result."
      );

      setPhase("idle");
    } finally {
      requestBusyRef.current = false;
    }
  };

  if (!valid) {
    return (
      <p role="status">
        This wheel needs an updated prize configuration.
        Please contact support.
      </p>
    );
  }

  const colors = segments.map((segment, index) =>
    /^#[a-f0-9]{6}$/i.test(segment.color || "")
      ? segment.color
      : FALLBACK_COLORS[index]
  );

  const gradient = segments
    .map(
      (_, index) =>
        `${colors[index]} ${
          (index * 100) / segments.length
        }% ${((index + 1) * 100) / segments.length}%`
    )
    .join(", ");

  const prizeType =
    outcome?.prizeType ||
    (outcome?.points > 0 ? "Points" : "No Prize");

  const won = completed && prizeType !== "No Prize";

  const credited =
    play?.pointsAwarded == null
      ? null
      : Number(play.pointsAwarded);

  return (
    <section className="ek-customer-wheel" aria-label="Prize wheel">
      <div className="ek-customer-wheel-banner">
        <span aria-hidden="true">✦</span>
        <strong>SPIN THE EK REWARDS WHEEL</strong>
        <p>One spin. A colourful surprise.</p>
      </div>

      <p className="ek-customer-wheel-rules">
        Every segment has an equal chance. Your result is
        selected and saved when you press Spin.
      </p>

      <div className="ek-customer-wheel-stage" aria-hidden="true">
        <div className="ek-customer-wheel-pointer" />

        <div
          className="ek-customer-wheel-disc"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${rotation}deg)`,
            transition:
              phase === "spinning"
                ? `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.15, 1)`
                : "none",
          }}
          onTransitionEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              event.propertyName === "transform" &&
              phase === "spinning"
            ) {
              setPhase("done");
            }
          }}
        >
          {segments.map((segment, index) => {
            const angle =
              ((index + 0.5) * 2 * Math.PI) /
              segments.length;

            return (
              <span
                key={segment.id}
                className="ek-customer-wheel-number"
                style={{
                  left: `${50 + 35 * Math.sin(angle)}%`,
                  top: `${50 - 35 * Math.cos(angle)}%`,
                }}
              >
                {index + 1}
              </span>
            );
          })}
        </div>

        <div className="ek-customer-wheel-center">EK</div>
      </div>

      <div role="status" aria-live="polite">
        {phase === "requesting" ? (
          <p className="ek-customer-wheel-status">
            Selecting and saving your result…
          </p>
        ) : phase === "spinning" ? (
          <p className="ek-customer-wheel-status">
            The wheel is spinning…
          </p>
        ) : null}
      </div>

      {!completed ? (
        <button
          type="button"
          className="ek-customer-wheel-spin"
          disabled={busy || needsRefresh}
          onClick={spin}
        >
          {busy ? "Spin in progress…" : "Spin the wheel"}
        </button>
      ) : null}

      {reveal ? (
        <div
          className={
            "ek-customer-wheel-result " +
            (won
              ? "ek-customer-wheel-win"
              : "ek-customer-wheel-no-prize")
          }
          role="status"
          aria-live="polite"
        >
          <span
            className="ek-customer-wheel-result-icon"
            aria-hidden="true"
          >
            {won ? "★" : "✦"}
          </span>

          <h3>
            {outcome
              ? won
                ? "You won!"
                : "Your spin is complete"
              : "Your spin has been recorded"}
          </h3>

          {outcome ? (
            <>
              <strong>{outcome.label}</strong>
              <p>{prizeType === "Points" ? "EK Points prize" : prizeType}</p>
            </>
          ) : null}

          {result?.message ? <p>{result.message}</p> : null}

          {Number.isFinite(credited) ? (
            <p>
              <strong>
                {credited.toLocaleString()} EK Points credited
              </strong>
            </p>
          ) : null}

          {outcome?.fulfilmentStatus === "Pending" ? (
            <p className="ek-customer-wheel-fulfilment">
              Prize delivery pending. Eltham Konnect will
              arrange fulfilment separately.
            </p>
          ) : outcome?.fulfilmentStatus === "Delivered" ? (
            <p className="ek-customer-wheel-fulfilment">
              This prize has been marked delivered.
            </p>
          ) : null}

          <small>Your spin is saved. Refreshing will not give another spin.</small>
        </div>
      ) : null}

      {error ? (
        <p className="ek-customer-wheel-error" role="alert">
          {error}
        </p>
      ) : null}

      {needsRefresh ? (
        <p>Refresh this page to check your game history before retrying.</p>
      ) : null}

      <h4 className="ek-customer-wheel-list-heading">
        On this wheel
      </h4>

      <div className="ek-customer-wheel-prizes">
        {segments.map((segment, index) => {
          const selected =
            reveal &&
            matchingOutcome &&
            outcome.segmentIndex === index;

          return (
            <div
              key={segment.id}
              className={
                "ek-customer-wheel-prize" +
                (selected ? " ek-customer-wheel-picked" : "")
              }
            >
              <span
                className="ek-customer-wheel-key"
                style={{ backgroundColor: colors[index] }}
              >
                {index + 1}
              </span>

              <div>
                <strong>{segment.label}</strong>
                <small>
                  {segment.prizeType ||
                    (segment.points > 0 ? "Points" : "No Prize")}
                  {segment.points > 0
                    ? ` · ${segment.points.toLocaleString()} EK Points`
                    : ""}
                </small>
              </div>

              {selected ? (
                <span aria-label="Your result">✓</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="ek-customer-wheel-rules">
        EK Points prizes are subject to the 1,500-point balance
        limit. Gift cards, phone credit and other prizes are
        fulfilled separately.
      </p>

      <style>{`
        .ek-customer-wheel {
          color: #0f172a;
          min-width: 0;
          margin-top: 16px;
        }

        .ek-customer-wheel-banner {
          padding: 20px;
          border-radius: 16px;
          background: linear-gradient(120deg, #0B3D91, #7c3aed);
          color: #ffffff;
          text-align: center;
        }

        .ek-customer-wheel-banner > span {
          display: block;
          font-size: 28px;
          margin-bottom: 6px;
          color: #fde68a;
        }

        .ek-customer-wheel-banner strong {
          letter-spacing: 1px;
          font-size: 14px;
        }

        .ek-customer-wheel-banner p {
          margin: 8px 0 0;
          color: #ffffff;
        }

        .ek-customer-wheel-rules {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }

        .ek-customer-wheel-stage {
          position: relative;
          width: min(100%, 340px);
          aspect-ratio: 1;
          margin: 28px auto 22px;
        }

        .ek-customer-wheel-disc {
          position: absolute;
          inset: 0;
          border: 8px solid #ffffff;
          border-radius: 50%;
          box-sizing: border-box;
          box-shadow:
            0 0 0 3px #0B3D91,
            0 12px 28px rgba(11,61,145,0.2);
        }

        .ek-customer-wheel-number {
          position: absolute;
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 50%;
          background: rgba(0,0,0,0.22);
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
        }

        .ek-customer-wheel-pointer {
          position: absolute;
          top: -13px;
          left: 50%;
          width: 0;
          height: 0;
          transform: translateX(-50%);
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 32px solid #F15A24;
          filter: drop-shadow(0 2px 1px rgba(0,0,0,0.25));
          z-index: 3;
        }

        .ek-customer-wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          display: grid;
          place-items: center;
          width: 62px;
          height: 62px;
          transform: translate(-50%, -50%);
          border: 5px solid #ffffff;
          border-radius: 50%;
          background: #0B3D91;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          box-shadow: 0 3px 12px rgba(0,0,0,0.25);
        }

        .ek-customer-wheel-status {
          text-align: center;
          color: #0B3D91;
          font-weight: bold;
        }

        .ek-customer-wheel .ek-customer-wheel-spin {
          width: 100%;
          min-height: 50px;
          padding: 12px 18px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(100deg, #c2410c, #be185d);
          color: #ffffff;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          touch-action: manipulation;
        }

        .ek-customer-wheel .ek-customer-wheel-spin:disabled {
          background: #e2e8f0;
          color: #475569;
          cursor: default;
        }

        .ek-customer-wheel-result {
          padding: 20px;
          margin-top: 16px;
          border: 1px solid;
          border-radius: 16px;
          text-align: center;
          overflow-wrap: anywhere;
        }

        .ek-customer-wheel-win {
          background: #ecfdf5;
          border-color: #86efac;
          color: #166534;
        }

        .ek-customer-wheel-no-prize {
          background: #f5f3ff;
          border-color: #c4b5fd;
          color: #5b21b6;
        }

        .ek-customer-wheel-result-icon {
          font-size: 36px;
          color: #a16207;
        }

        .ek-customer-wheel .ek-customer-wheel-result h3 {
          margin: 8px 0 12px;
          color: inherit;
        }

        .ek-customer-wheel-result p {
          line-height: 1.6;
        }

        .ek-customer-wheel-fulfilment {
          padding: 10px;
          border-radius: 9px;
          background: #ffffff;
          font-weight: bold;
        }

        .ek-customer-wheel-list-heading {
          margin: 22px 0 10px;
          color: #0B3D91;
        }

        .ek-customer-wheel-prizes {
          display: grid;
          gap: 8px;
        }

        .ek-customer-wheel-prize {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: #ffffff;
        }

        .ek-customer-wheel-prize > div {
          flex: 1;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .ek-customer-wheel-prize small {
          display: block;
          margin-top: 4px;
          color: #475569;
        }

        .ek-customer-wheel-key {
          display: grid;
          place-items: center;
          flex: 0 0 30px;
          height: 30px;
          border-radius: 9px;
          color: #ffffff;
          font-weight: bold;
        }

        .ek-customer-wheel-picked {
          border: 2px solid #0B3D91;
          background: #eef4ff;
        }

        .ek-customer-wheel-error {
          padding: 12px;
          border-radius: 10px;
          background: #fef2f2;
          color: #991b1b;
          line-height: 1.6;
        }

        @media (prefers-reduced-motion: reduce) {
          .ek-customer-wheel-disc {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}