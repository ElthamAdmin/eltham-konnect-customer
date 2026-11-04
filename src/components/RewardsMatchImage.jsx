import { useEffect, useRef, useState } from "react";
import api from "../api";

const shuffle = (cards) => {
  const result = [...cards];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }

  return result;
};

const validImageUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

export default function RewardsMatchImage({ game, onRecorded }) {
  const config = game.publicConfig;
  const cards = Array.isArray(config?.cards) ? config.cards : [];
  const pairCount = config?.pairCount;

  const valid =
    game.engineVersion === 2 &&
    config?.matchImageVersion === 2 &&
    config?.presentation === "memory-pairs" &&
    Number.isInteger(pairCount) &&
    pairCount >= 3 &&
    pairCount <= 8 &&
    cards.length === pairCount * 2 &&
    new Set(cards.map((card) => card?.id)).size === cards.length &&
    cards.every(
      (card) =>
        typeof card?.id === "string" &&
        /^[a-f0-9]{32}$/.test(card.id) &&
        typeof card.imageUrl === "string" &&
        validImageUrl(card.imageUrl) &&
        cards.filter((other) => other.imageUrl === card.imageUrl)
          .length === 2
    );

  const [storageKey] = useState(() => {
    let ekonId = "customer";

    try {
      const customer = JSON.parse(
        localStorage.getItem("ek_customer_data") || "null"
      );
      ekonId = customer?.ekonId || ekonId;
    } catch {
      // The API enforces customer authentication.
    }

    return `ek-memory-pending:${ekonId}:${game._id}`;
  });

  const [recovery] = useState(() => {
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
        saved.submittedAnswer.length > 2000
      ) return null;

      const matches = JSON.parse(saved.submittedAnswer);
      const used = new Set();

      if (
        !Array.isArray(matches) ||
        matches.length !== pairCount
      ) return null;

      for (const match of matches) {
        const first = cards.find(
          (card) => card.id === match?.firstCardId
        );
        const second = cards.find(
          (card) => card.id === match?.secondCardId
        );

        if (
          !first ||
          !second ||
          first.id === second.id ||
          first.imageUrl !== second.imageUrl ||
          used.has(first.id) ||
          used.has(second.id)
        ) return null;

        used.add(first.id);
        used.add(second.id);
      }

      return {
        attempt: {
          gameId: String(game._id),
          attemptId: saved.attemptId,
          submittedAnswer: saved.submittedAnswer,
        },
        matches,
      };
    } catch {
      return null;
    }
  });

  const [deck, setDeck] = useState(() => shuffle(cards));
  const [opened, setOpened] = useState([]);
  const [matches, setMatches] = useState(recovery?.matches || []);
  const [turns, setTurns] = useState(0);
  const [notice, setNotice] = useState(
    recovery ? "Check your saved completion below." : "Choose a card."
  );
  const [busy, setBusy] = useState(false);
  const [retryPending, setRetryPending] = useState(Boolean(recovery));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [imageStatus, setImageStatus] = useState({});
  const [imageRevision, setImageRevision] = useState(0);

  const openedRef = useRef([]);
  const matchesRef = useRef(recovery?.matches || []);
  const pendingAttemptRef = useRef(recovery?.attempt || null);
  const requestBusyRef = useRef(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(hideTimerRef.current);
  }, []);

  const matchedIds = new Set(
    matches.flatMap((match) => [
      match.firstCardId,
      match.secondCardId,
    ])
  );

  const allLoaded =
    valid &&
    cards.every((card) => imageStatus[card.imageUrl] === "loaded");

  const imageFailed = cards.some(
    (card) => imageStatus[card.imageUrl] === "error"
  );

  const completed = Boolean(result?.play);
  const boardComplete = matches.length === pairCount;

  const clearSavedAttempt = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // A remaining saved ID safely returns its existing result.
    }
  };

  const saveCompletion = async (completedMatches) => {
    if (
      !valid ||
      requestBusyRef.current ||
      completed ||
      completedMatches.length !== pairCount
    ) return;

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
          submittedAnswer: JSON.stringify(completedMatches),
        };

        try {
          sessionStorage.setItem(storageKey, JSON.stringify(attempt));
        } catch {
          setError(
            "Your completion could not be saved in this browser. " +
            "Allow site storage, then select Save completion."
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
        setError(
          "Completion could not be confirmed. " +
          "Select Check saved completion to retry the same attempt."
        );
        return;
      }

      confirmedPlay = data.play;
      setResult({ ...data, message: response.data.message });

      clearSavedAttempt();
      pendingAttemptRef.current = null;
      setRetryPending(false);
    } catch (submissionError) {
      if (submissionError.response?.status === 400) {
        clearSavedAttempt();
        pendingAttemptRef.current = null;
        setRetryPending(false);
      }

      setError(
        submissionError.response?.data?.message ||
          "Completion could not be confirmed. " +
          "Select Check saved completion to retry the same attempt."
      );
    } finally {
      requestBusyRef.current = false;
      setBusy(false);
    }

    if (confirmedPlay) onRecorded?.(confirmedPlay);
  };

  const revealCard = (card) => {
    const alreadyMatched = matchesRef.current.some(
      (match) =>
        match.firstCardId === card.id ||
        match.secondCardId === card.id
    );

    if (
      !allLoaded ||
      completed ||
      busy ||
      retryPending ||
      requestBusyRef.current ||
      alreadyMatched ||
      openedRef.current.includes(card.id) ||
      openedRef.current.length >= 2
    ) return;

    const nextOpened = [...openedRef.current, card.id];
    openedRef.current = nextOpened;
    setOpened(nextOpened);

    if (nextOpened.length === 1) {
      setNotice("Choose another card to find its match.");
      return;
    }

    setTurns((previous) => previous + 1);

    const first = cards.find(
      (item) => item.id === nextOpened[0]
    );

    if (first.imageUrl === card.imageUrl) {
      const nextMatches = [
        ...matchesRef.current,
        {
          firstCardId: first.id,
          secondCardId: card.id,
        },
      ];

      matchesRef.current = nextMatches;
      setMatches(nextMatches);
      openedRef.current = [];
      setOpened([]);

      if (nextMatches.length === pairCount) {
        setNotice("Every pair matched! Saving your completed game…");
        saveCompletion(nextMatches);
      } else {
        setNotice("Match found! Choose your next card.");
      }
    } else {
      setNotice("Not a match. Remember these images.");

      hideTimerRef.current = window.setTimeout(() => {
        openedRef.current = [];
        setOpened([]);
        setNotice("Cards hidden again. Choose a card.");
        hideTimerRef.current = null;
      }, 1000);
    }
  };

  const playAgain = () => {
    if (busy || retryPending || requestBusyRef.current) return;

    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
    openedRef.current = [];
    matchesRef.current = [];
    pendingAttemptRef.current = null;

    setDeck(shuffle(cards));
    setOpened([]);
    setMatches([]);
    setTurns(0);
    setResult(null);
    setError("");
    setNotice("New round! Choose a card.");
  };

  if (!valid) {
    return (
      <p role="status">
        This game needs the memory-card configuration.
        Please contact staff.
      </p>
    );
  }

  const play = result?.play;
  const score = Number.isSafeInteger(play?.scoreEarned)
    ? play.scoreEarned : 0;
  const credited = Number.isSafeInteger(play?.pointsAwarded)
    ? play.pointsAwarded : 0;

  return (
    <section className="ek-memory" aria-label="Image memory game">
      <div className="ek-memory-banner">
        <h3>Find the matching pairs</h3>
        <p>Flip two cards. Remember the images. Match every pair.</p>
      </div>

      <p>
        Matching cards stay open and receive a tick.
        Different cards turn face down again.
        Play repeatedly for game score; reward limits still apply.
      </p>

      <strong>
        Pairs matched: {matches.length} / {pairCount}
        {!recovery && <> · Turns: {turns}</>}
      </strong>

      <p role="status" aria-live="polite">{notice}</p>

      {/* Preload images without displaying them or exposing labels. */}
      <div hidden aria-hidden="true">
        {[...new Set(cards.map((card) => card.imageUrl))].map((url) => (
          <img
            key={`${url}-${imageRevision}`}
            src={url}
            alt=""
            onLoad={() =>
              setImageStatus((previous) => ({
                ...previous, [url]: "loaded",
              }))
            }
            onError={() =>
              setImageStatus((previous) => ({
                ...previous, [url]: "error",
              }))
            }
          />
        ))}
      </div>

      {!allLoaded ? (
        <div role="status">
          <p>
            {imageFailed
              ? "An image could not load. Check your connection and retry."
              : "Preparing the cards…"}
          </p>
          {imageFailed ? (
            <button
              type="button"
              onClick={() => {
                setImageStatus({});
                setImageRevision((previous) => previous + 1);
              }}
            >
              Reload images
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="ek-memory-grid">
        {deck.map((card, index) => {
          const matched = matchedIds.has(card.id);
          const faceUp = matched || opened.includes(card.id);

          return (
            <button
              key={card.id}
              type="button"
              className={
                "ek-memory-card" +
                (faceUp ? " ek-memory-open" : "") +
                (matched ? " ek-memory-matched" : "")
              }
              disabled={
                !allLoaded ||
                matched ||
                completed ||
                busy ||
                retryPending ||
                opened.length >= 2
              }
              aria-label={
                `Card ${index + 1}, ` +
                (matched
                  ? "matched"
                  : faceUp
                    ? "revealed"
                    : "face down. Reveal card")
              }
              aria-pressed={faceUp}
              onClick={() => revealCard(card)}
            >
              {faceUp ? (
                <img src={card.imageUrl} alt="" />
              ) : (
                <span className="ek-memory-back" aria-hidden="true">
                  EK
                </span>
              )}

              {matched ? (
                <span className="ek-memory-tick" aria-hidden="true">✓</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {busy ? <p role="status">Saving your completed game…</p> : null}

      {boardComplete && !completed && !busy ? (
        <button
          type="button"
          onClick={() => saveCompletion(matchesRef.current)}
        >
          {retryPending ? "Check saved completion" : "Save completion"}
        </button>
      ) : null}

      {error ? <p role="alert">{error}</p> : null}

      {completed ? (
        <div className="ek-memory-result" role="status">
          <h3>Every pair matched!</h3>
          <p>{result.message}</p>
          <p><strong>Game score earned: +{score.toLocaleString()}</strong></p>
          <p>{credited.toLocaleString()} EK Points credited</p>

          {play.playMode === "Practice" ? (
            <p>Practice completion — no reward awarded. Your score counts.</p>
          ) : null}

          <button type="button" onClick={playAgain}>
            Play again
          </button>
        </div>
      ) : null}

      <style>{`
        .ek-memory { margin-top:16px; min-width:0; color:#0f172a; }
        .ek-memory p { line-height:1.7; }
        .ek-memory-banner {
          padding:20px; border-radius:14px;
          background:linear-gradient(120deg,#0B3D91,#7c3aed);
          color:white;
        }
        .ek-memory-banner h3 { margin-top:0; color:white; }
        .ek-memory-banner p { margin-bottom:0; }
        .ek-memory-grid {
          display:grid; grid-template-columns:repeat(4,minmax(0,1fr));
          gap:10px; margin:16px 0;
        }
        .ek-memory button {
          min-height:46px; padding:11px 15px;
          border:1px solid #0B3D91; border-radius:10px;
          background:#0B3D91; color:white;
          font:inherit; font-weight:bold; cursor:pointer;
          touch-action:manipulation;
        }
        .ek-memory .ek-memory-card {
          position:relative; display:grid; place-items:center;
          aspect-ratio:1; width:100%; min-width:0;
          min-height:0 !important; padding:6px;
          border:3px solid #c4b5fd;
          background:linear-gradient(135deg,#0B3D91,#7c3aed);
          overflow:hidden; opacity:1;
        }
        .ek-memory .ek-memory-card:disabled { cursor:default; opacity:1; }
        .ek-memory .ek-memory-card:hover { transform:none !important; }
        .ek-memory .ek-memory-card:focus-visible {
          outline:3px solid #F15A24; outline-offset:2px;
        }
        .ek-memory .ek-memory-open { background:#f8fafc; }
        .ek-memory .ek-memory-matched { border-color:#16a34a; }
        .ek-memory-card img {
          width:100%; height:100%; min-height:0;
          object-fit:contain; border-radius:5px;
        }
        .ek-memory-back { font-size:clamp(18px,4vw,30px); color:white; }
        .ek-memory-tick {
          position:absolute; top:3px; right:3px;
          display:grid; place-items:center;
          width:25px; height:25px; border-radius:50%;
          background:#166534; color:white; font-size:18px;
        }
        .ek-memory-result {
          margin-top:18px; padding:20px; border:1px solid #86efac;
          border-radius:14px; background:#ecfdf5;
          color:#166534; text-align:center;
        }
        .ek-memory-result h3 { color:inherit; }
        @media(max-width:360px) {
          .ek-memory-grid { gap:6px; }
        }
      `}</style>
    </section>
  );
}