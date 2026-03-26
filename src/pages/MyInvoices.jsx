import { useEffect, useMemo, useState } from "react";
import api from "../api";

function MyInvoices() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const customerData =
        customer || JSON.parse(localStorage.getItem("ek_customer_data") || "null");

      if (!customerData?.ekonId) {
        setInvoices([]);
        return;
      }

      const res = await api.get("/api/invoices");
      const allInvoices = res.data.data || [];

      const customerInvoices = allInvoices.filter(
        (inv) => inv.customerEkonId === customerData.ekonId
      );

      setInvoices(customerInvoices);
    } catch (error) {
      console.error("Error loading customer invoices:", error);
      alert(error?.response?.data?.message || "Could not load your invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        `${inv.invoiceNumber} ${inv.customerName} ${inv.customerEkonId} ${inv.status}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const unpaid = invoices.filter((inv) => inv.status === "Unpaid");
    const paid = invoices.filter((inv) => inv.status === "Paid");

    return {
      totalInvoices: invoices.length,
      unpaidInvoices: unpaid.length,
      paidInvoices: paid.length,
      outstandingBalance: unpaid.reduce(
        (sum, inv) => sum + Number(inv.finalTotal || 0),
        0
      ),
    };
  }, [invoices]);

  const formatCurrency = (value) =>
    `JMD ${Number(value || 0).toLocaleString()}`;

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const getStatusBadge = (status) => {
    const backgroundColor =
      status === "Paid"
        ? "#16a34a"
        : status === "Unpaid"
        ? "#dc2626"
        : "#64748b";

    const glowColor =
      status === "Paid"
        ? "rgba(22, 163, 74, 0.18)"
        : status === "Unpaid"
        ? "rgba(220, 38, 38, 0.18)"
        : "rgba(100, 116, 139, 0.18)";

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "6px 12px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
          boxShadow: `0 6px 16px ${glowColor}`,
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const handlePayNow = (invoice) => {
    if (invoice.paymentLink) {
      window.open(invoice.paymentLink, "_blank", "noopener,noreferrer");
      return;
    }

    alert(
      `Payment link has not been added yet for invoice ${invoice.invoiceNumber}. Please contact Eltham Konnect if needed.`
    );
  };

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
  };

  const metricCardBase = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
    minHeight: "125px",
  };

  const summaryCard = (value, label, valueColor, bgTone) => (
    <div
      style={{
        ...metricCardBase,
        background: `linear-gradient(180deg, ${WHITE}, ${bgTone})`,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          fontSize: "30px",
          color: valueColor,
          marginBottom: "10px",
          fontWeight: "800",
          wordBreak: "break-word",
        }}
      >
        {value}
      </h2>
      <p style={{ fontWeight: "700", color: "#334155", margin: 0 }}>{label}</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: LIGHT_BG }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "22px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: TEXT, fontSize: "38px" }}>My Invoices</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            View your balances, payment status, and pay outstanding invoices.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            width: "100%",
            maxWidth: "160px",
          }}
        >
          Refresh
        </button>
      </div>

      <div className="invoice-summary">
        {summaryCard(summary.totalInvoices, "Total Invoices", "#1f3552", "#f8fbff")}
        {summaryCard(summary.unpaidInvoices, "Unpaid", "#dc2626", "#fff3f2")}
        {summaryCard(summary.paidInvoices, "Paid", "#16a34a", "#effcf4")}
        {summaryCard(
          formatCurrency(summary.outstandingBalance),
          "Outstanding",
          ROYAL_BLUE,
          "#f2f7ff"
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
            Search & Filter
          </h2>
          <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
            Find invoices by invoice number or filter by payment status.
          </p>
        </div>

        <div className="invoice-filter">
          <input
            type="text"
            placeholder="Search by invoice number, customer, EKON ID, or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              backgroundColor: WHITE,
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              backgroundColor: WHITE,
            }}
          >
            <option value="All">All</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
              Invoice Records
            </h2>
            <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
              {filteredInvoices.length} invoice{filteredInvoices.length === 1 ? "" : "s"} matched
              your current search.
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: MUTED, margin: 0 }}>Loading your invoices...</p>
        ) : (
          <>
            <div className="table-desktop" style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="12"
                style={{
                  width: "100%",
                  minWidth: "1100px",
                  borderCollapse: "collapse",
                  borderColor: BORDER,
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Paid Date</th>
                    <th>Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
                      <tr key={inv._id} style={{ backgroundColor: WHITE }}>
                        <td style={{ fontWeight: "800", color: TEXT }}>
                          {inv.invoiceNumber}
                        </td>
                        <td>{inv.customerName}</td>
                        <td style={{ fontWeight: "700" }}>
                          {formatCurrency(inv.finalTotal)}
                        </td>
                        <td>{getStatusBadge(inv.status)}</td>
                        <td>{formatDate(inv.createdAt)}</td>
                        <td>{inv.paidDate ? formatDate(inv.paidDate) : "-"}</td>
                        <td>
                          {inv.status === "Unpaid" ? (
                            <button
                              onClick={() => handlePayNow(inv)}
                              disabled={!inv.paymentLink}
                              style={{
                                backgroundColor: inv.paymentLink ? GOLD : "#cbd5e1",
                                color: inv.paymentLink ? "black" : "#64748b",
                                border: "none",
                                padding: "9px 14px",
                                borderRadius: "8px",
                                cursor: inv.paymentLink ? "pointer" : "not-allowed",
                                fontWeight: "800",
                                minWidth: "110px",
                              }}
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span style={{ color: "#16a34a", fontWeight: "700" }}>
                              Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center", color: MUTED, padding: "20px" }}
                      >
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-mobile">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="mobile-card"
                    style={{
                      border: `1px solid ${BORDER}`,
                      padding: "16px",
                      marginBottom: "12px",
                      borderRadius: "16px",
                      backgroundColor: WHITE,
                      boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: MUTED, marginBottom: "4px" }}>
                        Invoice Number
                      </div>
                      <div style={{ fontWeight: "800", color: TEXT }}>
                        {inv.invoiceNumber}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Total</div>
                        <div style={{ fontWeight: "700" }}>
                          {formatCurrency(inv.finalTotal)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Status</div>
                        <div>{getStatusBadge(inv.status)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Created Date</div>
                        <div>{formatDate(inv.createdAt)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Paid Date</div>
                        <div>{inv.paidDate ? formatDate(inv.paidDate) : "-"}</div>
                      </div>
                    </div>

                    {inv.status === "Unpaid" ? (
                      <button
                        onClick={() => handlePayNow(inv)}
                        disabled={!inv.paymentLink}
                        style={{
                          backgroundColor: inv.paymentLink ? GOLD : "#cbd5e1",
                          color: inv.paymentLink ? "black" : "#64748b",
                          border: "none",
                          padding: "11px 14px",
                          borderRadius: "8px",
                          cursor: inv.paymentLink ? "pointer" : "not-allowed",
                          width: "100%",
                          fontWeight: "800",
                        }}
                      >
                        Pay Now
                      </button>
                    ) : (
                      <div
                        style={{
                          color: "#16a34a",
                          fontWeight: "800",
                          textAlign: "center",
                          paddingTop: "4px",
                        }}
                      >
                        Invoice Paid
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: "14px",
                    padding: "16px",
                    backgroundColor: WHITE,
                    color: MUTED,
                  }}
                >
                  No invoices found.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .invoice-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .invoice-filter {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }

        .table-mobile {
          display: none;
        }

        @media (max-width: 900px) {
          .invoice-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .invoice-summary {
            grid-template-columns: 1fr;
          }

          .invoice-filter {
            grid-template-columns: 1fr;
          }

          .table-desktop {
            display: none;
          }

          .table-mobile {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

export default MyInvoices;