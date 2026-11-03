const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export const moveCode = (move) =>
  move.from + move.to + (move.promotion || "");

export const moveInput = (code) => ({
  from: code.slice(0, 2),
  to: code.slice(2, 4),
  ...(code.length === 5
    ? { promotion: code.slice(4, 5) }
    : {}),
});

export const isValidChessConfig = (config) =>
  config?.opponentVersion === 1 &&
  config?.playerColor === "w" &&
  config?.maxPlies === 300 &&
  Number.isSafeInteger(config?.seed) &&
  config.seed >= 1 &&
  config.seed < 2147483647;

const tieBreak = (seed, fen, code) => {
  const text = `${seed}|${fen}|${code}`;
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967296;
};

// Keep this move selection identical to the backend service.
export const chooseComputerMove = (chess, config) => {
  if (
    !isValidChessConfig(config) ||
    chess.turn() !== "b" ||
    chess.isGameOver()
  ) {
    return null;
  }

  const fen = chess.fen();

  const moves = chess
    .moves({ verbose: true })
    .sort((first, second) => {
      const firstCode = moveCode(first);
      const secondCode = moveCode(second);

      return firstCode < secondCode
        ? -1
        : firstCode > secondCode
          ? 1
          : 0;
    });

  let bestCode = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const code = moveCode(move);

    chess.move(moveInput(code));

    let score;

    try {
      if (chess.isCheckmate()) {
        score = 100000;
      } else if (chess.isDraw()) {
        score = 0;
      } else {
        const capturedValue =
          PIECE_VALUES[move.captured] || 0;

        const movingValue =
          PIECE_VALUES[move.promotion || move.piece] || 0;

        const promotionGain = move.promotion
          ? PIECE_VALUES[move.promotion] - PIECE_VALUES.p
          : 0;

        score = capturedValue + promotionGain;

        if (chess.isAttacked(move.to, "w")) {
          score -= movingValue;
        }

        if (chess.isCheck()) {
          score += 20;
        }
      }

      score += tieBreak(config.seed, fen, code);
    } finally {
      chess.undo();
    }

    if (score > bestScore) {
      bestScore = score;
      bestCode = code;
    }
  }

  return bestCode;
};