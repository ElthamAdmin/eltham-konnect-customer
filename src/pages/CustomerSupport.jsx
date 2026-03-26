import { useEffect, useMemo, useState, Fragment } from "react";
import api from "../api";

function CustomerSupport() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [tickets, setTickets] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyFiles, setReplyFiles] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [expandedTicket, setExpandedTicket] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/support-tickets");
      setTickets(res.data.data || []);
    } catch (error) {
      console.error("Error loading support tickets:", error);
      alert(error?.response?.data?.message || "Could not load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.ekonId) fetchTickets();
  }, [customer?.ekonId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTicket = async () => {
    try {
      if (!formData.subject || !formData.message) {
        alert("Please complete the subject and message.");
        return;
      }

      const body = new FormData();
      body.append("subject", formData.subject);
      body.append("message", formData.message);
      if (selectedFile) body.append("attachmentFile", selectedFile);

      await api.post("/api/support-tickets", body);

      setFormData({ subject: "", message: "" });
      setSelectedFile(null);
      await fetchTickets();
      alert("Support ticket submitted successfully.");
    } catch (error) {
      console.error("Error creating support ticket:", error);
      alert(error?.response?.data?.message || "Could not submit support ticket.");
    }
  };

  const submitReply = async (ticketNumber) => {
    try {
      const message = replyTexts[ticketNumber];
      if (!message) {
        alert("Please enter a reply before sending.");
        return;
      }

      const body = new FormData();
      body.append("message", message);
      if (replyFiles[ticketNumber]) body.append("attachmentFile", replyFiles[ticketNumber]);

      await api.post(`/api/support-tickets/${ticketNumber}/reply`, body);

      setReplyTexts((p) => ({ ...p, [ticketNumber]: "" }));
      setReplyFiles((p) => ({ ...p, [ticketNumber]: null }));

      await fetchTickets();
    } catch (error) {
      console.error("Error sending reply:", error);
      alert(error?.response?.data?.message || "Could not send reply.");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) =>
      `${t.ticketNumber} ${t.subject} ${t.status} ${t.message || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      inProgress: tickets.filter((t) => t.status === "In Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
    };
  }, [tickets]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return String(value).slice(0, 10);
    }
  };

  const statusBadge = (status) => {
    let backgroundColor = "#64748b";
    let glowColor = "rgba(100, 116, 139, 0.18)";

    if (status === "Open") {
      backgroundColor = ROYAL_BLUE;
      glowColor = "rgba(11, 61, 145, 0.18)";
    } else if (status === "In Progress") {
      backgroundColor = "#f59e0b";
      glowColor = "rgba(245, 158, 11, 0.18)";
    } else if (status === "Resolved") {
      backgroundColor = "#16a34a";
      glowColor = "rgba(22, 163, 74, 0.18)";
    } else if (status === "Closed") {
      backgroundColor = "#475569";
      glowColor = "rgba(71, 85, 105, 0.18)";
    }

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
        {status || "Open"}
      </span>
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
        }}
      >
        {value}
      </h2>
      <p style={{ fontWeight: "700", color: "#334155", margin: 0 }}>{label}</p>
    </div>
  );

  const renderThread = (t) => (
    <div
      className="thread-box"
      style={{
        marginTop: "14px",
        padding: "16px",
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        backgroundColor: "#f8fafc",
      }}
    >
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "12px", color: MUTED, marginBottom: "4px" }}>
          Original Message
        </div>
        <div
          style={{
            backgroundColor: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
            padding: "14px",
            color: TEXT,
            lineHeight: 1.55,
          }}
        >
          {t.message}
        </div>
      </div>

      {(t.replies || []).length > 0 && (
        <div style={{ display: "grid", gap: "12px", marginBottom: "14px" }}>
          {(t.replies || []).map((r) => {
            const isCustomerReply =
              String(r.senderType || "").toLowerCase() === "customer";

            return (
              <div
                key={r._id}
                style={{
                  display: "flex",
                  justifyContent: isCustomerReply ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    backgroundColor: isCustomerReply ? "#dbeafe" : WHITE,
                    border: `1px solid ${isCustomerReply ? "#bfdbfe" : BORDER}`,
                    borderRadius: "14px",
                    padding: "12px 14px",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.03)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: MUTED,
                      marginBottom: "4px",
                      fontWeight: "700",
                    }}
                  >
                    {r.senderName || (isCustomerReply ? "You" : "Eltham Konnect")}
                  </div>

                  <div style={{ color: TEXT, lineHeight: 1.5 }}>
                    {r.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", gap: "10px" }}>
        <textarea
          placeholder="Write your reply"
          value={replyTexts[t.ticketNumber] || ""}
          onChange={(e) =>
            setReplyTexts((p) => ({
              ...p,
              [t.ticketNumber]: e.target.value,
            }))
          }
          style={{
            minHeight: "100px",
            padding: "12px",
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
            resize: "vertical",
            backgroundColor: WHITE,
          }}
        />

        <input
          type="file"
          onChange={(e) =>
            setReplyFiles((p) => ({
              ...p,
              [t.ticketNumber]: e.target.files?.[0] || null,
            }))
          }
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
            backgroundColor: WHITE,
          }}
        />

        {replyFiles[t.ticketNumber] && (
          <div style={{ color: MUTED, fontSize: "13px" }}>
            Selected file: {replyFiles[t.ticketNumber].name}
          </div>
        )}

        <button
          onClick={() => submitReply(t.ticketNumber)}
          style={{
            backgroundColor: ROYAL_BLUE,
            color: "white",
            border: "none",
            padding: "11px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            maxWidth: "180px",
            fontWeight: "800",
          }}
        >
          Send Reply
        </button>
      </div>
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
          <h1 style={{ margin: 0, color: TEXT, fontSize: "38px" }}>Support Tickets</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            Contact Eltham Konnect and keep all support conversations in one place.
          </p>
        </div>

        <button
          onClick={fetchTickets}
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

      <div className="support-summary-grid">
        {summaryCard(summary.total, "Total Tickets", "#1f3552", "#f8fbff")}
        {summaryCard(summary.open, "Open", ROYAL_BLUE, "#f2f7ff")}
        {summaryCard(summary.inProgress, "In Progress", "#f59e0b", "#fff8ea")}
        {summaryCard(summary.resolved, "Resolved", "#16a34a", "#effcf4")}
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
            Create Support Ticket
          </h2>
          <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
            Submit a new request and attach a file if needed.
          </p>
        </div>

        <div className="support-form-grid">
          <input
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              backgroundColor: WHITE,
            }}
          />

          <textarea
            name="message"
            placeholder="Describe your issue or question"
            value={formData.message}
            onChange={handleChange}
            style={{
              minHeight: "120px",
              padding: "12px",
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              resize: "vertical",
              backgroundColor: WHITE,
            }}
            className="support-span-2"
          />

          <div className="support-span-2">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: `1px solid ${BORDER}`,
                backgroundColor: WHITE,
              }}
            />
            {selectedFile && (
              <div style={{ color: MUTED, fontSize: "13px", marginTop: "8px" }}>
                Selected file: {selectedFile.name}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCreateTicket}
          style={{
            marginTop: "16px",
            backgroundColor: ROYAL_BLUE,
            color: "white",
            border: "none",
            padding: "11px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "800",
            width: "100%",
            maxWidth: "220px",
          }}
        >
          Submit Ticket
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
            Search Tickets
          </h2>
          <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
            Search by ticket number, subject, status, or ticket message.
          </p>
        </div>

        <input
          placeholder="Search tickets"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
            backgroundColor: WHITE,
          }}
        />
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
              My Ticket Threads
            </h2>
            <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
              {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"} matched
              your current search.
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: MUTED, margin: 0 }}>Loading your tickets...</p>
        ) : (
          <>
            <div className="desktop">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "980px",
                  tableLayout: "fixed",
                }}
                border="1"
                cellPadding="12"
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th style={{ width: "22%" }}>Ticket</th>
                    <th style={{ width: "34%" }}>Subject</th>
                    <th style={{ width: "16%" }}>Status</th>
                    <th style={{ width: "14%" }}>Date</th>
                    <th style={{ width: "14%" }}>Thread</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((t) => (
                      <Fragment key={t._id}>
                        <tr style={{ backgroundColor: WHITE }}>
                          <td style={{ fontWeight: "800", color: TEXT, wordBreak: "break-word" }}>
                            {t.ticketNumber}
                          </td>
                          <td style={{ wordBreak: "break-word" }}>{t.subject}</td>
                          <td>{statusBadge(t.status)}</td>
                          <td>{formatDate(t.date || t.createdAt)}</td>
                          <td>
                            <button
                              onClick={() =>
                                setExpandedTicket(
                                  expandedTicket === t.ticketNumber ? "" : t.ticketNumber
                                )
                              }
                              style={{
                                backgroundColor:
                                  expandedTicket === t.ticketNumber ? "#475569" : ROYAL_BLUE,
                                color: "white",
                                border: "none",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "700",
                                minWidth: "88px",
                              }}
                            >
                              {expandedTicket === t.ticketNumber ? "Close" : "Open"}
                            </button>
                          </td>
                        </tr>

                        {expandedTicket === t.ticketNumber && (
                          <tr>
                            <td colSpan="5">{renderThread(t)}</td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: MUTED, padding: "20px" }}>
                        No support tickets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <div
                    key={t._id}
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
                        Ticket Number
                      </div>
                      <div style={{ fontWeight: "800", color: TEXT }}>{t.ticketNumber}</div>
                    </div>

                    <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Subject</div>
                        <div>{t.subject}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Status</div>
                        <div>{statusBadge(t.status)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Date</div>
                        <div>{formatDate(t.date || t.createdAt)}</div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedTicket(
                          expandedTicket === t.ticketNumber ? "" : t.ticketNumber
                        )
                      }
                      style={{
                        backgroundColor:
                          expandedTicket === t.ticketNumber ? "#475569" : ROYAL_BLUE,
                        color: "white",
                        border: "none",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        width: "100%",
                        fontWeight: "800",
                      }}
                    >
                      {expandedTicket === t.ticketNumber ? "Close Thread" : "View Thread"}
                    </button>

                    {expandedTicket === t.ticketNumber && renderThread(t)}
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
                  No support tickets found.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .support-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .support-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .support-span-2 {
          grid-column: span 2;
        }

        .desktop {
          display: block;
          overflow-x: auto;
        }

        .mobile {
          display: none;
        }

        @media (max-width: 900px) {
          .support-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .support-summary-grid,
          .support-form-grid {
            grid-template-columns: 1fr;
          }

          .support-span-2 {
            grid-column: span 1;
          }

          .desktop {
            display: none;
          }

          .mobile {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

export default CustomerSupport;