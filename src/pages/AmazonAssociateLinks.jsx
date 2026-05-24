import { useEffect, useState } from "react";
import api from "../api";

function AmazonAssociateLinks() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";
  const HERO_BG = "linear-gradient(135deg, #0B3D91 0%, #1e3a8a 60%, #D4AF37 100%)";
  const CARD_SHADOW = "0 10px 24px rgba(15,23,42,0.08)";

  const FILE_BASE = "https://eltham-konnect-backend-c2sf.onrender.com";

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/amazon-associate/active");
      setItems(res.data.data || []);
    } catch (error) {
      console.error("Error loading Amazon associate links:", error);
      setItems([]);
    }
  };

  const fetchCart = async () => {
  try {
    const res = await api.get("/api/marketplace-cart");
    setCart(res.data.data || null);
  } catch (error) {
    console.error("Error loading cart:", error);
  }
};

const addToCart = async (itemNumber) => {
  try {
    setCartLoading(true);
    const res = await api.post("/api/marketplace-cart/add", {
      itemNumber,
      quantity: 1,
    });
    setCart(res.data.data || null);
    alert("Item added to cart.");
  } catch (error) {
    alert(error?.response?.data?.message || "Could not add item to cart.");
  } finally {
    setCartLoading(false);
  }
};

  useEffect(() => {
    fetchItems();
    fetchCart();
  }, []);

  return (
    <div style={{ backgroundColor: LIGHT_BG }}>
      <div
  style={{
    background: HERO_BG,
    borderRadius: "24px",
    padding: "40px 30px",
    marginBottom: "28px",
    color: WHITE,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
  }}
>
  <div
    style={{
      position: "absolute",
      top: "-40px",
      right: "-40px",
      width: "180px",
      height: "180px",
      borderRadius: "50%",
      backgroundColor: "rgba(255,255,255,0.08)",
    }}
  />

  <div
    style={{
      position: "absolute",
      bottom: "-60px",
      left: "-40px",
      width: "220px",
      height: "220px",
      borderRadius: "50%",
      backgroundColor: "rgba(255,255,255,0.05)",
    }}
  />

  <div style={{ position: "relative", zIndex: 2 }}>
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.14)",
        display: "inline-block",
        padding: "8px 14px",
        borderRadius: "999px",
        fontWeight: "bold",
        marginBottom: "18px",
      }}
    >
      EK Marketplace
    </div>

    <h1
      style={{
        marginTop: 0,
        marginBottom: "14px",
        fontSize: "42px",
        lineHeight: 1.1,
      }}
    >
      Shop Trending Products <br />
      & EK Exclusive Finds
    </h1>

    <p
      style={{
        margin: 0,
        maxWidth: "700px",
        lineHeight: 1.7,
        fontSize: "16px",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      Explore Bath & Body Works collections, fragrances, Amazon finds,
      beauty products, colognes, and EK-exclusive inventory available
      for pickup or delivery in Jamaica.
    </p>

    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: "24px",
      }}
    >
      {[
        "Body Mists",
        "Lotions",
        "Colognes",
        "Amazon Finds",
        "Gift Ideas",
      ].map((category) => (
        <div
          key={category}
          style={{
            backgroundColor: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "10px 16px",
            borderRadius: "999px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {category}
        </div>
      ))}
    </div>
  </div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "26px",
  }}
>
  {[
    {
      title: "Authentic Products",
      desc: "Carefully sourced by Eltham Konnect",
    },
    {
      title: "Fast Jamaica Pickup",
      desc: "Quick collection from EK locations",
    },
    {
      title: "Delivery Available",
      desc: "Islandwide delivery options available",
    },
    {
      title: "EK Rewards Eligible",
      desc: "Earn EK points on qualifying items",
    },
  ].map((item) => (
    <div
      key={item.title}
      style={{
        backgroundColor: WHITE,
        borderRadius: "16px",
        padding: "18px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          color: ROYAL_BLUE,
          marginBottom: "6px",
        }}
      >
        {item.title}
      </div>

      <div
        style={{
          color: MUTED,
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        {item.desc}
      </div>
    </div>
  ))}
</div>

{cart?.items?.length > 0 && (
  <div
    style={{
      backgroundColor: WHITE,
      border: `1px solid ${BORDER}`,
      borderRadius: "18px",
      padding: "18px",
      marginBottom: "24px",
      boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div style={{ fontWeight: "bold", color: ROYAL_BLUE, fontSize: "18px" }}>
        Shopping Cart
      </div>
      <div style={{ color: MUTED, marginTop: "4px" }}>
        {cart.items.length} item(s) selected
      </div>
    </div>

    <div style={{ textAlign: "right" }}>
      <div style={{ color: MUTED, fontSize: "13px" }}>Subtotal</div>
      <div style={{ fontWeight: "bold", color: TEXT, fontSize: "20px" }}>
        JMD {Number(cart.subtotal || 0).toLocaleString()}
      </div>
    </div>
  </div>
)}

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
                boxShadow: CARD_SHADOW,
                transition: "all 0.25s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
  style={{
    position: "absolute",
    top: "14px",
    left: "14px",
    backgroundColor:
      item.productType === "EK Inventory"
        ? "#16a34a"
        : "#D4AF37",
    color:
      item.productType === "EK Inventory"
        ? "white"
        : "#111827",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    zIndex: 5,
  }}
>
  {item.productType === "EK Inventory"
    ? "EK PRODUCT"
    : "AMAZON FIND"}
</div>
              {item.imageUrl ? (
                <div
  style={{
    width: "100%",
    height: "280px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "12px",
  }}
>
  <img
    src={item.imageUrl}
    alt={item.title}
    style={{
      maxWidth: "100%",
      maxHeight: "100%",
      width: "auto",
      height: "auto",
      objectFit: "contain",
      display: "block",
    }}
  />
</div>
              ) : (
                <div
  style={{
    width: "100%",
    height: "280px",
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

              <div
  style={{
    fontWeight: "800",
    color: TEXT,
    marginBottom: "8px",
    fontSize: "18px",
    lineHeight: 1.3,
    minHeight: "48px",
  }}
>
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

              {item.productType === "Amazon Affiliate" ? (
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
) : (
  <div>
    <div style={{ fontWeight: "bold", color: ROYAL_BLUE, marginBottom: "8px" }}>
      JMD {Number(item.sellingPrice || 0).toLocaleString()}
    </div>

    <div style={{ color: item.quantityInStock > 0 ? "#16a34a" : "#dc2626", fontWeight: "bold", marginBottom: "10px" }}>
      {item.quantityInStock > 0 ? `${item.quantityInStock} in stock` : "Out of stock"}
    </div>

    <button
  disabled={Number(item.quantityInStock || 0) <= 0 || cartLoading}
  onClick={() => addToCart(item.itemNumber)}
      style={{
        width: "100%",
        backgroundColor: Number(item.quantityInStock || 0) <= 0 ? "#94a3b8" : ROYAL_BLUE,
        color: WHITE,
        border: "none",
        padding: "11px 14px",
        borderRadius: "10px",
        fontWeight: "bold",
        cursor: Number(item.quantityInStock || 0) <= 0 ? "not-allowed" : "pointer",
      }}
    >
      {cartLoading ? "Adding..." : "Add to Cart"}
    </button>
  </div>
)}
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