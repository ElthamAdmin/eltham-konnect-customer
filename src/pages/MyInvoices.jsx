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
    const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const ROYAL_BLUE = "#0B3D91";
    const GOLD = "#F15A24";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchInvoices = async () => {
  try {
    setLoading(true);

    const res = await api.get("/api/invoices/my");
    const customerInvoices = Array.isArray(res.data?.data)
      ? res.data.data
      : [];

    setInvoices(customerInvoices);
  } catch (error) {
    console.error("Error loading customer invoices:", error);
    setInvoices([]);

    alert(
      error?.response?.data?.message ||
        "Could not load your invoices."
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchInvoices();
  }, []);

    const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return invoices.filter((inv) => {
      const matchesSearch =
        `${inv.invoiceNumber || ""} ${inv.customerName || ""} ${
          inv.customerEkonId || ""
        } ${inv.status || ""}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / rowsPerPage)
  );

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;

    return filteredInvoices.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [filteredInvoices, currentPage, rowsPerPage]);

  const firstVisibleInvoice =
    filteredInvoices.length === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1;

  const lastVisibleInvoice = Math.min(
    currentPage * rowsPerPage,
    filteredInvoices.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      status === "Paid" ? "#16a34a" : status === "Unpaid" ? "#dc2626" : "#64748b";

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
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const printReceipt = () => {
    window.print();
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

  const receiptRow = (label, value, bold = false, color = TEXT) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 0",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span style={{ color: MUTED }}>{label}</span>
      <strong style={{ color, fontWeight: bold ? "900" : "700" }}>{value}</strong>
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
          <h1 style={{ margin: 0, color: TEXT, fontSize: "38px" }}>
            My Invoices
          </h1>
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
        <div className="invoice-records-header">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
              Invoice Records
            </h2>

            <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
              Showing {firstVisibleInvoice} to {lastVisibleInvoice} of{" "}
              {filteredInvoices.length} matched invoice
              {filteredInvoices.length === 1 ? "" : "s"}.
            </p>
          </div>

          {filteredInvoices.length > 0 && (
            <div className="invoice-pagination">
              <label className="invoice-page-size">
                <span>Rows:</span>

                <select
                  value={rowsPerPage}
                  onChange={(event) =>
                    setRowsPerPage(Number(event.target.value))
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>

              <div className="invoice-page-status">
                Page {currentPage} of {totalPages}
              </div>

              <div className="invoice-page-buttons">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(page + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                    <th>Subtotal</th>
                    <th>Extra Charges</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Paid Date</th>
                    <th>Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.length > 0 ? (
                                        paginatedInvoices.map((inv) => (
                      <tr key={inv._id} style={{ backgroundColor: WHITE }}>
                        <td style={{ fontWeight: "800", color: TEXT }}>
                          {inv.invoiceNumber}
                        </td>
                        <td>{inv.customerName}</td>
                        <td>{formatCurrency(inv.subtotal)}</td>
<td>
  {formatCurrency(
    Number(inv.customsDuty || 0) +
      Number(inv.gct || 0) +
      Number(inv.processingFee || 0) +
      Number(inv.otherAdjustment || 0)
  )}
</td>
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
                            <button
                              onClick={() => setSelectedReceipt(inv)}
                              style={{
                                backgroundColor: ROYAL_BLUE,
                                color: WHITE,
                                border: "none",
                                padding: "9px 14px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "800",
                                minWidth: "120px",
                              }}
                            >
                              View Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
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
                paginatedInvoices.map((inv) => (
                  <div
                    key={inv._id}
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
  <div style={{ fontSize: "12px", color: MUTED }}>Subtotal</div>
  <div style={{ fontWeight: "700" }}>{formatCurrency(inv.subtotal)}</div>
</div>

<div>
  <div style={{ fontSize: "12px", color: MUTED }}>Extra Charges</div>
  <div style={{ fontWeight: "700" }}>
    {formatCurrency(
      Number(inv.customsDuty || 0) +
        Number(inv.gct || 0) +
        Number(inv.processingFee || 0) +
        Number(inv.otherAdjustment || 0)
    )}
  </div>
</div>
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
                      <button
                        onClick={() => setSelectedReceipt(inv)}
                        style={{
                          backgroundColor: ROYAL_BLUE,
                          color: WHITE,
                          border: "none",
                          padding: "11px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          width: "100%",
                          fontWeight: "800",
                        }}
                      >
                        View Receipt
                      </button>
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

      {selectedReceipt && (
        <div
          className="receipt-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.72)",
            zIndex: 9999,
            padding: "18px",
            overflowY: "auto",
          }}
        >
          <div
            className="receipt-card"
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              backgroundColor: WHITE,
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${ROYAL_BLUE}, #102a63)`,
                color: WHITE,
                padding: "26px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: WHITE,
                      borderRadius: "12px",
                      padding: "7px 10px",
                    }}
                  >
                    <img
                      src="/ek-logo.png"
                      alt="Eltham Konnect"
                      style={{
                        display: "block",
                        width: "230px",
                        maxWidth: "100%",
                        height: "62px",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      color: GOLD,
                      fontWeight: "800",
                      fontSize: "14px",
                    }}
                  >
                    Your Konnection, Our Priority
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: "14px",
                    padding: "12px 14px",
                    textAlign: "right",
                  }}
                >
                  <div style={{ fontSize: "12px", opacity: 0.85 }}>PAYMENT RECEIPT</div>
                  <div style={{ fontWeight: "900", fontSize: "18px" }}>
                    {selectedReceipt.invoiceNumber}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "26px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr",
                  gap: "18px",
                  marginBottom: "22px",
                }}
                className="receipt-top-grid"
              >
                <div
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: "16px",
                    padding: "16px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div style={{ color: MUTED, fontSize: "12px", fontWeight: "bold" }}>
                    RECEIVED FROM
                  </div>
                  <h2 style={{ margin: "8px 0 4px", color: TEXT }}>
                    {selectedReceipt.customerName}
                  </h2>
                  <div style={{ color: MUTED }}>
                    EKON ID: <strong>{selectedReceipt.customerEkonId}</strong>
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: "16px",
                    padding: "16px",
                    backgroundColor: "#f0fdf4",
                  }}
                >
                  <div style={{ color: MUTED, fontSize: "12px", fontWeight: "bold" }}>
                    RECEIPT STATUS
                  </div>
                  <div style={{ marginTop: "10px" }}>{getStatusBadge(selectedReceipt.status)}</div>
                  <div style={{ marginTop: "10px", color: MUTED, fontSize: "13px" }}>
                    Paid Date
                  </div>
                  <strong>{formatDate(selectedReceipt.paidDate || selectedReceipt.paidAt)}</strong>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: ROYAL_BLUE,
                  color: WHITE,
                  borderRadius: "16px",
                  padding: "18px",
                  marginBottom: "22px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.85 }}>
                    AMOUNT PAID
                  </div>
                  <div style={{ fontSize: "30px", fontWeight: "900" }}>
                    {formatCurrency(selectedReceipt.finalTotal)}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: GOLD,
                    color: "#1e293b",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    fontWeight: "900",
                  }}
                >
                  PAID IN FULL
                </div>
              </div>

              <h3 style={{ color: ROYAL_BLUE, marginBottom: "12px" }}>
                Package Breakdown
              </h3>

              <div style={{ overflowX: "auto", marginBottom: "22px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "#eef4ff" }}>
                    <tr>
                      <th style={{ padding: "11px", textAlign: "left" }}>Tracking</th>
                      <th style={{ padding: "11px", textAlign: "left" }}>Weight</th>
                      <th style={{ padding: "11px", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selectedReceipt.packages || []).map((pkg, index) => (
                      <tr key={index}>
                        <td style={{ padding: "11px", borderBottom: `1px solid ${BORDER}` }}>
                          {pkg.trackingNumber}
                        </td>
                        <td style={{ padding: "11px", borderBottom: `1px solid ${BORDER}` }}>
                          {pkg.chargeableWeight} lb
                        </td>
                        <td
                          style={{
                            padding: "11px",
                            borderBottom: `1px solid ${BORDER}`,
                            textAlign: "right",
                            fontWeight: "bold",
                          }}
                        >
                          {formatCurrency(pkg.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  marginLeft: "auto",
                  maxWidth: "380px",
                  borderTop: `3px solid ${GOLD}`,
                  paddingTop: "8px",
                }}
              >
                {receiptRow("Shipping / Freight Subtotal", formatCurrency(selectedReceipt.subtotal))}
{receiptRow("Customs Duty", formatCurrency(selectedReceipt.customsDuty))}
{receiptRow("GCT", formatCurrency(selectedReceipt.gct))}
{receiptRow("Processing Fee", formatCurrency(selectedReceipt.processingFee))}
{receiptRow("Other Adjustment", formatCurrency(selectedReceipt.otherAdjustment))}

{selectedReceipt.adjustmentNote ? (
  <div
    style={{
      padding: "12px 0",
      borderBottom: `1px solid ${BORDER}`,
      color: MUTED,
      lineHeight: 1.5,
    }}
  >
    <strong style={{ color: TEXT }}>Adjustment Note:</strong>{" "}
    {selectedReceipt.adjustmentNote}
  </div>
) : null}

{receiptRow(
  "EK Points Redeemed",
  `- ${formatCurrency(selectedReceipt.pointsRedeemed)}`,
  true,
  "#dc2626"
)}
{receiptRow(
  "Total Paid",
  formatCurrency(selectedReceipt.finalTotal),
  true,
  "#16a34a"
)}
              </div>

              <div
                style={{
                  marginTop: "24px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "16px",
                  padding: "16px",
                  backgroundColor: "#fffbeb",
                  color: "#92400e",
                  lineHeight: 1.5,
                }}
              >
                <strong>Thank you for shipping with Eltham Konnect.</strong>
                <br />
                This receipt confirms payment received for the invoice listed above.
              </div>

              <div
                className="receipt-actions"
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  marginTop: "22px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setSelectedReceipt(null)}
                  style={{
                    backgroundColor: "#64748b",
                    color: WHITE,
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Close
                </button>

                <button
                  onClick={printReceipt}
                  style={{
                    backgroundColor: GOLD,
                    color: "#1e293b",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

        .invoice-records-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .invoice-pagination {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .invoice-page-size {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .invoice-page-size select {
          min-width: 76px;
          min-height: 42px;
          border: 1px solid #dbe3ef;
          border-radius: 9px;
          background: #ffffff;
        }

        .invoice-page-status {
          color: #475569;
          font-size: 14px;
          font-weight: 700;
        }

        .invoice-page-buttons {
          display: flex;
          gap: 8px;
        }

        .invoice-page-buttons button {
          min-height: 42px;
          padding: 9px 14px;
          border: 0;
          border-radius: 9px;
          color: #ffffff;
          background: #0b3d91;
          font-weight: 800;
          cursor: pointer;
        }

        .invoice-page-buttons button:disabled {
          color: #64748b;
          background: #e2e8f0;
          cursor: not-allowed;
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

                    .receipt-top-grid {
            grid-template-columns: 1fr !important;
          }

          .invoice-records-header {
            align-items: stretch;
          }

          .invoice-pagination {
            width: 100%;
            align-items: stretch;
          }

          .invoice-page-size,
          .invoice-page-status {
            justify-content: center;
          }

          .invoice-page-buttons {
            width: 100%;
          }

          .invoice-page-buttons button {
            flex: 1;
          }
        }

                @page {
          size: A4 portrait;
          margin: 8mm;
        }

        @media print {
          html,
          body,
          #root {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          body * {
            display: none !important;
          }

          .receipt-overlay,
          .receipt-overlay * {
            display: revert !important;
            visibility: visible !important;
          }

          .receipt-overlay {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .receipt-card {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: 1px solid #dbe3ef !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            font-size: 10pt !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .receipt-card > div:first-child {
            padding: 12px 16px !important;
          }

          .receipt-card > div:last-child {
            padding: 14px 16px !important;
          }

          .receipt-card img {
            width: 170px !important;
            height: 46px !important;
            object-fit: contain !important;
          }

          .receipt-top-grid {
            display: grid !important;
            grid-template-columns: 1.2fr 0.8fr !important;
            gap: 10px !important;
            margin-bottom: 12px !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .receipt-card h1,
          .receipt-card h2,
          .receipt-card h3,
          .receipt-card p {
            break-after: avoid;
            page-break-after: avoid;
          }

          .receipt-card table {
            display: table !important;
            width: 100% !important;
            font-size: 9pt !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .receipt-card thead {
            display: table-header-group !important;
          }

          .receipt-card tbody {
            display: table-row-group !important;
          }

          .receipt-card tr {
            display: table-row !important;
          }

          .receipt-card th,
          .receipt-card td {
            display: table-cell !important;
            padding: 6px 8px !important;
          }

          .receipt-card,
          .receipt-card * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .receipt-actions,
          .receipt-actions * {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MyInvoices;