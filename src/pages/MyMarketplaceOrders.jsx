import { useEffect, useState } from "react";
import api from "../api";

function MyMarketplaceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/marketplace-orders/my-orders");
      setOrders(res.data.data || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load marketplace orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return <div style={{ color: MUTED, fontWeight: "bold" }}>Loading marketplace orders...</div>;
  }

  return (
    <div>
      <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "20px", padding: "24px", marginBottom: "20px" }}>
        <h1 style={{ marginTop: 0, color: TEXT }}>My Marketplace Orders</h1>
        <p style={{ color: MUTED, marginBottom: 0 }}>
          Track your EK Marketplace purchases and order requests.
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "24px", color: MUTED, fontWeight: "bold" }}>
          You have not submitted any marketplace orders yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {orders.map((order) => (
            <div key={order.orderNumber} style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>{order.orderNumber}</div>
                  <div style={{ color: MUTED, fontSize: "13px" }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div style={{ backgroundColor: "#eef4ff", color: ROYAL_BLUE, padding: "8px 12px", borderRadius: "999px", fontWeight: "bold" }}>
                  {order.status}
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {(order.items || []).map((item) => (
                  <div key={item.itemNumber} style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderTop: `1px solid ${BORDER}`, paddingTop: "10px" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: TEXT }}>{item.title}</div>
                      <div style={{ color: MUTED, fontSize: "13px" }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: "bold", color: TEXT }}>
                      JMD {Number(item.lineTotal || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "right", marginTop: "14px", fontWeight: "bold", fontSize: "18px", color: TEXT }}>
                Total: JMD {Number(order.subtotal || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyMarketplaceOrders;