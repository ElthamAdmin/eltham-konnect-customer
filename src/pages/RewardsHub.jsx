import { useEffect, useMemo, useState } from "react";
import api from "../api";

function RewardsHub() {
  const [posts, setPosts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [games, setGames] = useState([]);
  const [gamePlays, setGamePlays] = useState([]);
  const [answers, setAnswers] = useState({});
  const [leaderboard, setLeaderboard] = useState({
  gameLeaderboard: [],
  entryLeaderboard: [],
});
  const [activeType, setActiveType] = useState("All");
  const [loading, setLoading] = useState(true);

  const API = "https://eltham-konnect-backend-c2sf.onrender.com";
  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchPosts = async () => {
  try {
    setLoading(true);

    const savedCustomer = JSON.parse(
      localStorage.getItem("ek_customer_data") || "null"
    );

    const results = await Promise.allSettled([
  api.get("/api/rewards-hub"),
  savedCustomer?.ekonId
    ? api.get(`/api/rewards-hub-entries/customer/${savedCustomer.ekonId}`)
    : Promise.resolve({ data: { data: [] } }),
  api.get("/api/rewards-hub-games"),
  savedCustomer?.ekonId
    ? api.get(`/api/rewards-hub-games/customer/${savedCustomer.ekonId}/plays`)
    : Promise.resolve({ data: { data: [] } }),
  api.get("/api/rewards-hub-leaderboard"),
]);

    setPosts(results[0].status === "fulfilled" ? results[0].value.data.data || [] : []);
    setEntries(results[1].status === "fulfilled" ? results[1].value.data.data || [] : []);
    setGames(results[2].status === "fulfilled" ? results[2].value.data.data || [] : []);
    setGamePlays(results[3].status === "fulfilled" ? results[3].value.data.data || [] : []);
    setLeaderboard(
  results[4].status === "fulfilled"
    ? results[4].value.data.data || { gameLeaderboard: [], entryLeaderboard: [] }
    : { gameLeaderboard: [], entryLeaderboard: [] }
);
  } catch (error) {
    console.error("Error loading Rewards Hub:", error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchPosts();
}, []);

const hasEntered = (postId) => {
  return entries.some((entry) => String(entry.rewardsHubId) === String(postId));
};

const hasWon = (postId) => {
  return entries.some(
    (entry) =>
      String(entry.rewardsHubId) === String(postId) &&
      (entry.isWinner || entry.hasWon)
  );
};

const enterHubPost = async (postId) => {
  try {
    const savedCustomer = JSON.parse(
      localStorage.getItem("ek_customer_data") || "null"
    );

    if (!savedCustomer?.ekonId) {
      alert("Please log in again before entering.");
      return;
    }

    await api.post("/api/rewards-hub-entries/enter", {
      rewardsHubId: postId,
      customerEkonId: savedCustomer.ekonId,
      customerName: savedCustomer.name,
    });

    alert("You have successfully entered.");
    await fetchPosts();
  } catch (error) {
    alert(error?.response?.data?.message || "Could not enter this promotion.");
  }
};

const hasPlayedGame = (gameId) => {
  return gamePlays.some((play) => String(play.gameId) === String(gameId));
};

const playGame = async (game) => {
  try {
    const savedCustomer = JSON.parse(
      localStorage.getItem("ek_customer_data") || "null"
    );

    if (!savedCustomer?.ekonId) {
      alert("Please log in again before playing.");
      return;
    }

    const submittedAnswer = answers[game._id] || "";

    if (
      ["Trivia", "Scavenger Hunt", "Match Image"].includes(game.gameType) &&
      !submittedAnswer
    ) {
      alert("Please enter or select your answer.");
      return;
    }

    const res = await api.post("/api/rewards-hub-games/play", {
      gameId: game._id,
      customerEkonId: savedCustomer.ekonId,
      customerName: savedCustomer.name,
      submittedAnswer,
    });

    alert(res.data?.message || "Game submitted successfully.");

    setGamePlays((prev) => [...prev, res.data.data.play]);
  } catch (error) {
    alert(error?.response?.data?.message || "Could not submit game.");
  }
};

  const filteredPosts = useMemo(() => {
    if (activeType === "All") return posts;
    return posts.filter((post) => post.type === activeType);
  }, [posts, activeType]);

  const typeOptions = [
    "All",
    "Giveaway",
    "Gift Card",
    "Amazon Link",
    "Game",
    "Promotion",
    "Customer Update",
  ];

  const badgeStyle = (type) => ({
    backgroundColor:
      type === "Giveaway"
        ? "#16a34a"
        : type === "Gift Card"
        ? GOLD
        : type === "Amazon Link"
        ? "#f97316"
        : type === "Game"
        ? "#7c3aed"
        : type === "Customer Update"
        ? "#0f766e"
        : ROYAL_BLUE,
    color: type === "Gift Card" ? "black" : WHITE,
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  });

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "18px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
  };

  return (
    <div style={{ backgroundColor: LIGHT_BG }}>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ margin: 0, color: TEXT, fontSize: "36px" }}>
          EK Rewards Hub
        </h1>
        <p style={{ margin: "6px 0 0 0", color: MUTED }}>
          Explore giveaways, games, Amazon links, promotions, and customer reward opportunities.
        </p>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
          background: `linear-gradient(135deg, ${ROYAL_BLUE}, #1f4fb0)`,
          color: WHITE,
          border: "none",
        }}
      >
        <h2 style={{ marginTop: 0 }}>More Than Shipping</h2>
        <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
          At Eltham Konnect, we want customers to feel appreciated. Check this hub often
          for giveaways, phone credit opportunities, games, Amazon finds, and special updates.
        </p>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {typeOptions.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            style={{
              backgroundColor: activeType === type ? ROYAL_BLUE : WHITE,
              color: activeType === type ? WHITE : ROYAL_BLUE,
              border: `1px solid ${ROYAL_BLUE}`,
              padding: "9px 13px",
              borderRadius: "999px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
  <div style={cardStyle}>Loading Rewards Hub...</div>
) : (
  <>

  <div style={{ ...cardStyle, marginBottom: "22px" }}>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>🏆 EK Rewards Leaderboard</h2>
  <p style={{ color: MUTED, marginTop: 0 }}>
    Customer names are hidden for privacy. Only EKON IDs are shown.
  </p>

  <div className="leaderboard-grid">
    <div>
      <h3 style={{ color: TEXT }}>Top Game Players</h3>
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", borderCollapse: "collapse", borderColor: BORDER }}
      >
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th>Rank</th>
            <th>EKON ID</th>
            <th>Games</th>
            <th>Correct</th>
            <th>Rewards</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.gameLeaderboard.length > 0 ? (
            leaderboard.gameLeaderboard.map((item, index) => (
              <tr key={item._id}>
                <td>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}</td>
                <td style={{ fontWeight: "bold", color: ROYAL_BLUE }}>{item._id}</td>
                <td>{item.totalGames}</td>
                <td>{item.correctAnswers}</td>
                <td>{item.rewardsEarned}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: MUTED }}>
                No game leaderboard yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div>
      <h3 style={{ color: TEXT }}>Top Rewards Participants</h3>
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", borderCollapse: "collapse", borderColor: BORDER }}
      >
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th>Rank</th>
            <th>EKON ID</th>
            <th>Entries</th>
            <th>Wins</th>
            <th>Rewards</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.entryLeaderboard.length > 0 ? (
            leaderboard.entryLeaderboard.map((item, index) => (
              <tr key={item._id}>
                <td>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}</td>
                <td style={{ fontWeight: "bold", color: ROYAL_BLUE }}>{item._id}</td>
                <td>{item.totalEntries}</td>
                <td>{item.wins}</td>
                <td>{item.rewardsGiven}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: MUTED }}>
                No Rewards Hub entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

    <div style={{ marginBottom: "22px" }}>
      <h2 style={{ color: ROYAL_BLUE }}>Play & Win Games</h2>

      <div className="hub-grid">
        {games.length > 0 ? (
          games.map((game) => (
            <div key={game._id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{game.title}</h2>
                <span style={badgeStyle("Game")}>{game.gameType}</span>
              </div>

              <p style={{ color: TEXT, lineHeight: 1.7 }}>{game.instructions}</p>

              {game.question ? (
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "12px",
                    fontWeight: "bold",
                    color: TEXT,
                  }}
                >
                  {game.question}
                </div>
              ) : null}

              {game.options?.length > 0 ? (
                <select
                  value={answers[game._id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [game._id]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: `1px solid ${BORDER}`,
                    marginBottom: "12px",
                  }}
                >
                  <option value="">Select answer</option>
                  {game.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : ["Trivia", "Scavenger Hunt", "Match Image"].includes(game.gameType) ? (
                <input
                  type="text"
                  placeholder="Enter your answer"
                  value={answers[game._id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [game._id]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: `1px solid ${BORDER}`,
                    marginBottom: "12px",
                    boxSizing: "border-box",
                  }}
                />
              ) : null}

              {game.gameType === "Spin Wheel" ? (
                <div
                  style={{
                    backgroundColor: "#f7f2ff",
                    border: "1px solid #ddd6fe",
                    borderRadius: "50%",
                    width: "170px",
                    height: "170px",
                    margin: "12px auto",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: "bold",
                    color: "#7c3aed",
                    textAlign: "center",
                  }}
                >
                  🎡<br />Spin & Win
                </div>
              ) : null}

              {game.gameType === "Scratch Card" ? (
                <div
                  style={{
                    backgroundColor: "#e2e8f0",
                    border: `2px dashed ${ROYAL_BLUE}`,
                    borderRadius: "14px",
                    padding: "30px",
                    textAlign: "center",
                    fontWeight: "bold",
                    color: ROYAL_BLUE,
                    marginBottom: "12px",
                  }}
                >
                  🎁 Scratch Card Surprise
                </div>
              ) : null}

              {game.rewardText ? (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "12px",
                    color: "#166534",
                    fontWeight: "bold",
                    marginBottom: "12px",
                  }}
                >
                  Reward: {game.rewardText}
                </div>
              ) : null}

              {Number(game.rewardPoints || 0) > 0 ? (
                <div
                  style={{
                    backgroundColor: "#eef4ff",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "12px",
                    padding: "12px",
                    color: ROYAL_BLUE,
                    fontWeight: "bold",
                    marginBottom: "12px",
                  }}
                >
                  EK Points: {Number(game.rewardPoints || 0).toLocaleString()}
                </div>
              ) : null}

              <button
                onClick={() => playGame(game)}
                disabled={hasPlayedGame(game._id)}
                style={{
                  backgroundColor: hasPlayedGame(game._id) ? "#94a3b8" : GOLD,
                  color: "black",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: hasPlayedGame(game._id) ? "not-allowed" : "pointer",
                  width: "100%",
                }}
              >
                {hasPlayedGame(game._id) ? "Already Played" : `Play ${game.gameType}`}
              </button>

              {game.endDate ? (
                <div style={{ marginTop: "12px", color: "#dc2626", fontWeight: "bold" }}>
                  Ends: {String(game.endDate).slice(0, 10)}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div style={cardStyle}>No active games available right now.</div>
        )}
      </div>
    </div>

    <div className="hub-grid">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div key={post._id} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{post.title}</h2>
                  <span style={badgeStyle(post.type)}>{post.type}</span>
                </div>

                {post.imageFilePath ? (
                  <img
                    src={`${API}${post.imageFilePath}`}
                    alt={post.title}
                    style={{
                      width: "100%",
                      borderRadius: "14px",
                      border: `1px solid ${BORDER}`,
                      marginBottom: "12px",
                      maxHeight: "360px",
                      objectFit: "cover",
                    }}
                  />
                ) : null}

                <p style={{ color: TEXT, lineHeight: 1.7 }}>{post.description}</p>

                {hasWon(post._id) ? (
  <div
    style={{
      backgroundColor: "#fffbeb",
      border: "1px solid #facc15",
      borderRadius: "12px",
      padding: "12px",
      color: "#854d0e",
      fontWeight: "bold",
      marginBottom: "12px",
    }}
  >
    🎉 Congratulations! You won this Rewards Hub activity.
  </div>
) : null}

                {post.rewardText ? (
                  <div
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "12px",
                      padding: "12px",
                      color: "#166534",
                      fontWeight: "bold",
                      marginBottom: "12px",
                    }}
                  >
                    Reward: {post.rewardText}
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  {["Giveaway", "Gift Card", "Game", "Promotion"].includes(post.type) ? (
    <button
      onClick={() => enterHubPost(post._id)}
      disabled={hasEntered(post._id)}
      style={{
        display: "inline-block",
        backgroundColor: hasEntered(post._id) ? "#94a3b8" : ROYAL_BLUE,
        color: WHITE,
        padding: "10px 14px",
        borderRadius: "10px",
        border: "none",
        fontWeight: "bold",
        cursor: hasEntered(post._id) ? "not-allowed" : "pointer",
      }}
    >
      {hasEntered(post._id)
        ? "Already Entered"
        : post.type === "Game"
        ? "Join Game"
        : post.type === "Promotion"
        ? "Claim Offer"
        : "Enter"}
    </button>
  ) : null}

  {post.externalLink ? (
    <a
      href={post.externalLink}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-block",
        backgroundColor: GOLD,
        color: "black",
        padding: "10px 14px",
        borderRadius: "10px",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      Open Link
    </a>
  ) : null}
</div>
                <div style={{ marginTop: "12px", color: MUTED, fontSize: "13px" }}>
                  {post.startDate ? (
                    <span style={{ marginRight: "12px" }}>
                      Starts: {String(post.startDate).slice(0, 10)}
                    </span>
                  ) : null}

                  {post.endDate ? (
                    <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                      Ends: {String(post.endDate).slice(0, 10)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div style={cardStyle}>No active Rewards Hub posts found.</div>
          )}
                </div>
      </>
)}

      <style>
  {`
    .hub-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }

    .leaderboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
      overflow-x: auto;
    }

    @media (max-width: 800px) {
      .hub-grid {
        grid-template-columns: 1fr;
      }

      .leaderboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `}
</style>
    </div>
  );
}

export default RewardsHub;