import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function MarketplaceCart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/marketplace-cart");
      setCart(res.data.data || null);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load cart.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemNumber, quantity) => {
    try {
      const res = await api.put(`/api/marketplace-cart/${itemNumber}`, {
        quantity,
      });
      setCart(res.data.data || null);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not update item.");
    }
  };

  const removeItem = async (itemNumber) => {
    try {
      const res = await api.delete(`/api/marketplace-cart/${itemNumber}`);
      setCart(res.data.data || null);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not remove item.");
    }
  };

  const clearCart = async () => {
    try {
      const confirmed = window.confirm("Clear all items from your cart?");
      if (!confirmed) return;

      const res = await api.delete("/api/marketplace-cart");
      setCart(res.data.data || null);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not clear cart.");
    }
  };

  const submitMarketplaceOrder = async () => {
  try {
    const items = cart?.items || [];

    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    const res = await api.post("/api/marketplace-orders/submit", {
      customerNote: "",
    });

    alert(
      res.data.message ||
        "Marketplace order request submitted successfully."
    );

    setCart(res.data?.cart || { items: [], subtotal: 0 });

    navigate("/amazon-associate-links");
  } catch (error) {
    console.error("Submit marketplace order error:", error);

    alert(
      error?.response?.data?.message ||
        "Could not submit marketplace order."
    );
  } finally {
    setSubmitting(false);
  }
};

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return <div style={{ color: MUTED, fontWeight: "bold" }}>Loading cart...</div>;
  }

  const items = cart?.items || [];

  return (
    <div>
      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ marginTop: 0, color: TEXT }}>My Marketplace Cart</h1>
        <p style={{ color: MUTED, marginBottom: 0 }}>
          Review your selected EK Marketplace items before checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            backgroundColor: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: "18px",
            padding: "24px",
            color: MUTED,
            fontWeight: "bold",
          }}
        >
          Your cart is empty.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "14px" }}>
            {items.map((item) => (
              <div
                key={item.itemNumber}
                style={{
                  backgroundColor: WHITE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "18px",
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns: "90px 1fr auto",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "14px",
                    backgroundColor: "#f8fafc",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span style={{ color: MUTED, fontSize: "12px" }}>No Image</span>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: "bold", color: TEXT, fontSize: "17px" }}>
                    {item.title}
                  </div>
                  <div style={{ color: MUTED, marginTop: "5px" }}>
                    {item.category || "Marketplace Item"}
                  </div>
                  <div style={{ color: ROYAL_BLUE, fontWeight: "bold", marginTop: "8px" }}>
                    JMD {Number(item.sellingPrice || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.itemNumber, Number(e.target.value || 1))
                    }
                    style={{
                      width: "70px",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${BORDER}`,
                      textAlign: "center",
                      marginBottom: "10px",
                    }}
                  />

                  <div style={{ fontWeight: "bold", color: TEXT, marginBottom: "10px" }}>
                    JMD {Number(item.lineTotal || 0).toLocaleString()}
                  </div>

                  <button
                    onClick={() => removeItem(item.itemNumber)}
                    style={{
                      backgroundColor: "#dc2626",
                      color: WHITE,
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              backgroundColor: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: "20px",
              padding: "22px",
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={clearCart}
              style={{
                backgroundColor: "#64748b",
                color: WHITE,
                border: "none",
                padding: "11px 16px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Clear Cart
            </button>

            <div style={{ textAlign: "right" }}>
              <div style={{ color: MUTED }}>Subtotal</div>
              <div style={{ color: TEXT, fontSize: "24px", fontWeight: "bold" }}>
                JMD {Number(cart?.subtotal || 0).toLocaleString()}
              </div>

              <button
  onClick={submitMarketplaceOrder}
  disabled={submitting || items.length === 0}
  style={{
    marginTop: "12px",
    backgroundColor: submitting || items.length === 0 ? "#94a3b8" : GOLD,
    color: "#111827",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: submitting || items.length === 0 ? "not-allowed" : "pointer",
  }}
>
  {submitting ? "Submitting..." : "Submit Order Request"}
</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MarketplaceCart;