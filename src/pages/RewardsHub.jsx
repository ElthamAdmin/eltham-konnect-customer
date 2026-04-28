import { useEffect, useMemo, useState } from "react";
import api from "../api";

function RewardsHub() {
  const [posts, setPosts] = useState([]);
  const [entries, setEntries] = useState([]);
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

    const [postsRes, entriesRes] = await Promise.all([
      api.get("/api/rewards-hub"),
      savedCustomer?.ekonId
        ? api.get(`/api/rewards-hub-entries/customer/${savedCustomer.ekonId}`)
        : Promise.resolve({ data: { data: [] } }),
    ]);

    setPosts(postsRes.data.data || []);
    setEntries(entriesRes.data.data || []);
  } catch (error) {
    console.error("Error loading Rewards Hub:", error);
  } finally {
    setLoading(false);
  }
};

const hasEntered = (postId) => {
  return entries.some((entry) => String(entry.rewardsHubId) === String(postId));
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
      )}

      <style>
        {`
          .hub-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }

          @media (max-width: 800px) {
            .hub-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

export default RewardsHub;