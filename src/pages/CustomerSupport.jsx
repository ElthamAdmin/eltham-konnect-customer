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
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [creatingTicket, setCreatingTicket] =
    useState(false);
  const [replyingTicket, setReplyingTicket] =
    useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const ROYAL_BLUE = "#0B3D91";
    const GOLD = "#F15A24";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://eltham-konnect-backend-c2sf.onrender.com";

const getAttachmentUrl = (path = "") => {
  if (!path) return "";
  if (String(path).startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/support-tickets/my");
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
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!subject || !message) {
      alert(
        "Please complete the subject and message."
      );
      return;
    }

    if (creatingTicket) {
      return;
    }

    try {
      setCreatingTicket(true);

      const body = new FormData();
      body.append("subject", subject);
      body.append("message", message);

      if (selectedFile) {
        body.append(
          "attachmentFile",
          selectedFile
        );
      }

      await api.post(
        "/api/support-tickets/my",
        body
      );

      setFormData({
        subject: "",
        message: "",
      });

      setSelectedFile(null);

      await fetchTickets();

      alert(
        "Support ticket submitted successfully."
      );
    } catch (error) {
      console.error(
        "Error creating support ticket:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Could not submit support ticket."
      );
    } finally {
      setCreatingTicket(false);
    }
  };

    const submitReply = async (ticketNumber) => {
    const message = String(
      replyTexts[ticketNumber] || ""
    ).trim();

    if (!message) {
      alert(
        "Please enter a reply before sending."
      );
      return;
    }

    if (replyingTicket) {
      return;
    }

    try {
      setReplyingTicket(ticketNumber);

      const body = new FormData();
      body.append("message", message);

      if (replyFiles[ticketNumber]) {
        body.append(
          "attachmentFile",
          replyFiles[ticketNumber]
        );
      }

      await api.post(
        `/api/support-tickets/my/${ticketNumber}/reply`,
        body
      );

      setReplyTexts((currentTexts) => ({
        ...currentTexts,
        [ticketNumber]: "",
      }));

      setReplyFiles((currentFiles) => ({
        ...currentFiles,
        [ticketNumber]: null,
      }));

      await fetchTickets();
    } catch (error) {
      console.error(
        "Error sending reply:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Could not send reply."
      );
    } finally {
      setReplyingTicket("");
    }
  };

    const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "All" ||
        ticket?.status === statusFilter;

      const replyText = Array.isArray(
        ticket?.replies
      )
        ? ticket.replies
            .map((reply) =>
              [
                reply?.message,
                reply?.senderName,
              ]
                .filter(Boolean)
                .join(" ")
            )
            .join(" ")
        : "";

      const searchableText = [
        ticket?.ticketNumber,
        ticket?.subject,
        ticket?.status,
        ticket?.message,
        ticket?.date,
        ticket?.createdAt,
        replyText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [
    tickets,
    searchTerm,
    statusFilter,
  ]);

  const statusOptions = useMemo(() => {
    const availableStatuses = tickets
      .map((ticket) => ticket?.status)
      .filter(Boolean);

    return [
      "All",
      ...new Set(availableStatuses),
    ];
  }, [tickets]);

  useEffect(() => {
    setPage(1);
    setExpandedTicket("");
  }, [searchTerm, statusFilter, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageStart = (page - 1) * pageSize;

  const paginatedTickets = filteredTickets.slice(
    pageStart,
    pageStart + pageSize
  );

  const firstVisibleTicket =
    filteredTickets.length === 0
      ? 0
      : pageStart + 1;

  const lastVisibleTicket = Math.min(
    pageStart + pageSize,
    filteredTickets.length
  );

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

{r.attachmentFilePath && (
  <div style={{ marginTop: "10px", width: "100%" }}>
    {/\.(jpg|jpeg|png|webp)$/i.test(r.attachmentFilePath) ? (
      <>
        <a
          href={getAttachmentUrl(r.attachmentFilePath)}
          target="_blank"
          rel="noreferrer"
          style={{ display: "block", width: "100%" }}
        >
          <img
            src={getAttachmentUrl(r.attachmentFilePath)}
            alt={r.attachmentFileName || "Attachment"}
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              display: "block",
              borderRadius: "12px",
              border: `1px solid ${BORDER}`,
              backgroundColor: WHITE,
            }}
          />
        </a>

        <a
          href={getAttachmentUrl(r.attachmentFilePath)}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            marginTop: "10px",
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            padding: "10px 14px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Open Image
        </a>
      </>
    ) : (
      <a
        href={getAttachmentUrl(r.attachmentFilePath)}
        target="_blank"
        rel="noreferrer"
        style={{ color: ROYAL_BLUE, fontWeight: "bold" }}
      >
        View Attachment
      </a>
    )}
  </div>
)}
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
          type="button"
          onClick={() =>
            submitReply(t.ticketNumber)
          }
          disabled={
            replyingTicket === t.ticketNumber
          }
          style={{
            backgroundColor:
              replyingTicket === t.ticketNumber
                ? "#94a3b8"
                : ROYAL_BLUE,
            color: "white",
            border: "none",
            padding: "11px 14px",
            borderRadius: "8px",
            cursor:
              replyingTicket === t.ticketNumber
                ? "wait"
                : "pointer",
            width: "100%",
            maxWidth: "180px",
            fontWeight: "800",
          }}
        >
          {replyingTicket === t.ticketNumber
            ? "Sending..."
            : "Send Reply"}
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
          type="button"
          onClick={handleCreateTicket}
          disabled={creatingTicket}
          style={{
            marginTop: "16px",
            backgroundColor: creatingTicket
              ? "#94a3b8"
              : ROYAL_BLUE,
            color: "white",
            border: "none",
            padding: "11px 16px",
            borderRadius: "8px",
            cursor: creatingTicket
              ? "wait"
              : "pointer",
            fontWeight: "800",
            width: "100%",
            maxWidth: "220px",
          }}
        >
          {creatingTicket
            ? "Submitting..."
            : "Submit Ticket"}
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

                <div className="support-search-grid">
          <input
            type="search"
            placeholder="Search tickets"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter support tickets by status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All"
                  ? "All Statuses"
                  : status}
              </option>
            ))}
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
              My Ticket Threads
            </h2>
                        <p
              style={{
                margin: 0,
                color: MUTED,
                fontSize: "14px",
              }}
            >
              Showing {firstVisibleTicket} to{" "}
              {lastVisibleTicket} of{" "}
              {filteredTickets.length} matched{" "}
              {filteredTickets.length === 1
                ? "ticket"
                : "tickets"}.
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
                    paginatedTickets.map((t) => (
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
                paginatedTickets.map((t) => (
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

            {filteredTickets.length > 0 && (
              <div className="support-pagination">
                <div className="support-page-size">
                  <label htmlFor="support-page-size">
                    Tickets:
                  </label>

                  <select
                    id="support-page-size"
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(
                        Number(event.target.value)
                      )
                    }
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="support-page-status">
                  Page {page} of {totalPages}
                </div>

                <div className="support-page-buttons">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.max(
                          1,
                          currentPage - 1
                        )
                      )
                    }
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.min(
                          totalPages,
                          currentPage + 1
                        )
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

            <style>{`
        .support-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .support-summary-grid > div {
          min-width: 0;
        }

        .support-form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .support-span-2 {
          grid-column: span 2;
        }

        .support-search-grid {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 12px;
        }

        .support-search-grid input,
        .support-search-grid select {
          width: 100%;
          padding: 12px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: #ffffff;
          box-sizing: border-box;
        }

        .support-search-grid input:focus,
        .support-search-grid select:focus {
          border-color: #0B3D91;
          outline: 3px solid
            rgba(11, 61, 145, 0.1);
        }

        .desktop {
          display: block;
          overflow-x: auto;
          border: 1px solid #dbe3ef;
          border-radius: 12px;
        }

        .desktop table {
          border: 0 !important;
        }

        .desktop th,
        .desktop td {
          border-color: #dbe3ef;
          text-align: left;
        }

        .mobile {
          display: none;
        }

        .support-pagination {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #dbe3ef;
        }

        .support-page-size {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .support-page-size label {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .support-page-size select {
          padding: 9px 28px 9px 10px;
          border: 1px solid #dbe3ef;
          border-radius: 9px;
          background: #ffffff;
        }

        .support-page-status {
          color: #334155;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
        }

        .support-page-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .support-page-buttons button {
          min-width: 82px;
          padding: 9px 13px;
          border: 0;
          border-radius: 9px;
          background: #0B3D91;
          color: #ffffff;
          font-weight: 800;
          cursor: pointer;
        }

        .support-page-buttons button:disabled {
          background: #e2e8f0;
          color: #64748b;
          cursor: not-allowed;
        }

        .thread-box {
          overflow-wrap: anywhere;
        }

        @media (max-width: 900px) {
          .support-summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .support-summary-grid,
          .support-form-grid,
          .support-search-grid {
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

          .support-pagination {
            grid-template-columns: 1fr;
          }

          .support-page-size,
          .support-page-buttons {
            justify-content: center;
          }

          .support-page-buttons button {
            flex: 1;
          }

          .thread-box {
            padding: 12px !important;
          }
        }

        @media (max-width: 500px) {
          .support-summary-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .support-page-buttons {
            flex-direction: column;
          }

          .support-page-buttons button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default CustomerSupport;