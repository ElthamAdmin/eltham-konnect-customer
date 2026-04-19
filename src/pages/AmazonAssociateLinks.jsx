import { useEffect, useState } from "react";
import api from "../api";

function AmazonAssociateLinks() {
  const [items, setItems] = useState([]);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/amazon-associate/active");
      setItems(res.data.data || []);
    } catch (error) {
      console.error("Error loading Amazon associate links:", error);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div style={{ backgroundColor: LIGHT_BG }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
          Amazon Associate Links
        </h1>
        <p style={{ margin: 0, color: MUTED }}>
          Shop selected Amazon products using our recommended links.
        </p>
      </div>

      {items.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          {items.map((item) => (
            <div
              key={item.itemNumber}
              style={{
                backgroundColor: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: "16px",
                padding: "16px",
                boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
              }}
            >
              {item.imageUrl ? (
                <img
                  src={`${api.defaults.baseURL}${item.imageUrl}`}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "12px",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "220px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: MUTED,
                    fontWeight: "bold",
                  }}
                >
                  No Image
                </div>
              )}

              <div style={{ fontWeight: "800", color: TEXT, marginBottom: "8px" }}>
                {item.title}
              </div>

              <div
                style={{
                  color: "#334155",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  marginBottom: "14px",
                  minHeight: "44px",
                }}
              >
                {item.description || "Shop this recommended item on Amazon."}
              </div>

              <a
                href={item.affiliateLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  width: "100%",
                  textAlign: "center",
                  backgroundColor: GOLD,
                  color: "#111827",
                  textDecoration: "none",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                }}
              >
                {item.buttonText || "Shop on Amazon"}
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: "16px",
            padding: "24px",
            color: MUTED,
            fontWeight: "bold",
          }}
        >
          No Amazon associate links available right now.
        </div>
      )}
    </div>
  );
}

export default AmazonAssociateLinks;