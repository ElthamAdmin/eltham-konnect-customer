import { useEffect, useState } from "react";
import api from "../api";

function MyMarketplaceInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/marketplace-invoices/my-invoices");
      setInvoices(res.data.data || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load marketplace invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  if (loading) {
    return <div style={{ color: MUTED, fontWeight: "bold" }}>Loading marketplace invoices...</div>;
  }

  return (
    <div>
      <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "20px", padding: "24px", marginBottom: "20px" }}>
        <h1 style={{ marginTop: 0, color: TEXT }}>My Marketplace Invoices</h1>
        <p style={{ color: MUTED, marginBottom: 0 }}>
          View and pay invoices for EK Marketplace purchases.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "24px", color: MUTED, fontWeight: "bold" }}>
          No marketplace invoices found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {invoices.map((invoice) => (
            <div key={invoice.invoiceNumber} style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div>
                  <div style={{ color: ROYAL_BLUE, fontWeight: "bold", fontSize: "18px" }}>{invoice.invoiceNumber}</div>
                  <div style={{ color: MUTED, fontSize: "13px" }}>Order: {invoice.orderNumber}</div>
                  <div style={{ color: MUTED, fontSize: "13px" }}>
                    {invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ backgroundColor: invoice.status === "Paid" ? "#dcfce7" : "#fff7ed", color: invoice.status === "Paid" ? "#166534" : "#9a3412", padding: "8px 12px", borderRadius: "999px", fontWeight: "bold" }}>
                    {invoice.status}
                  </div>
                  <div style={{ marginTop: "10px", color: TEXT, fontSize: "22px", fontWeight: "bold" }}>
                    JMD {Number(invoice.finalTotal || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {(invoice.items || []).map((item) => (
                <div key={item.itemNumber} style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${BORDER}`, paddingTop: "10px", marginTop: "10px" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: TEXT }}>{item.title}</div>
                    <div style={{ color: MUTED, fontSize: "13px" }}>Qty: {item.quantity}</div>
                  </div>
                  <strong>JMD {Number(item.lineTotal || 0).toLocaleString()}</strong>
                </div>
              ))}

              {invoice.paymentLink ? (
                <a
                  href={invoice.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", marginTop: "16px", backgroundColor: GOLD, color: "#111827", textDecoration: "none", padding: "12px 18px", borderRadius: "12px", fontWeight: "bold" }}
                >
                  Pay Marketplace Invoice
                </a>
              ) : (
                <button
                  disabled
                  style={{ marginTop: "16px", backgroundColor: "#cbd5e1", color: WHITE, border: "none", padding: "12px 18px", borderRadius: "12px", fontWeight: "bold" }}
                >
                  Payment Link Pending
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyMarketplaceInvoices;