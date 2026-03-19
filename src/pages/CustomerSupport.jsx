import { useEffect, useMemo, useState } from "react";
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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/support-tickets");
      setTickets(res.data.data || []);
    } catch (error) {
      console.error("Error loading support tickets:", error);
      alert(error?.response?.data?.message || "Could not load your support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.ekonId) {
      fetchTickets();
    }
  }, [customer?.ekonId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateTicket = async () => {
    try {
      if (!formData.subject || !formData.message) {
        alert("Please complete subject and message.");
        return;
      }

      const body = new FormData();
      body.append("subject", formData.subject);
      body.append("message", formData.message);

      if (selectedFile) {
        body.append("attachmentFile", selectedFile);
      }

      const res = await api.post("/api/support-tickets", body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message);

      setFormData({
        subject: "",
        message: "",
      });
      setSelectedFile(null);

      const fileInput = document.getElementById("customer-support-attachment");
      if (fileInput) fileInput.value = "";

      fetchTickets();
    } catch (error) {
      console.error("Error creating support ticket:", error);
      alert(error?.response?.data?.message || "Could not create support ticket.");
    }
  };

  const submitReply = async (ticketNumber) => {
    try {
      const message = replyTexts[ticketNumber] || "";

      if (!message.trim()) {
        alert("Please enter a reply message.");
        return;
      }

      const body = new FormData();
      body.append("message", message);

      if (replyFiles[ticketNumber]) {
        body.append("attachmentFile", replyFiles[ticketNumber]);
      }

      const res = await api.post(`/api/support-tickets/${ticketNumber}/reply`, body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message);

      setReplyTexts((prev) => ({
        ...prev,
        [ticketNumber]: "",
      }));

      setReplyFiles((prev) => ({
        ...prev,
        [ticketNumber]: null,
      }));

      const fileInput = document.getElementById(`customer-reply-file-${ticketNumber}`);
      if (fileInput) fileInput.value = "";

      fetchTickets();
    } catch (error) {
      console.error("Error replying to support ticket:", error);
      alert(error?.response?.data?.message || "Could not send reply.");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) =>
      `${ticket.ticketNumber} ${ticket.subject} ${ticket.message} ${ticket.status} ${ticket.date}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "Open").length,
      inProgress: tickets.filter((ticket) => ticket.status === "In Progress").length,
      resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    };
  }, [tickets]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const getStatusBadge = (status) => {
    let backgroundColor = "#64748b";

    if (status === "Open") backgroundColor = "#dc2626";
    else if (status === "In Progress") backgroundColor = "#f59e0b";
    else if (status === "Resolved") backgroundColor = "#16a34a";
    else if (status === "Closed") backgroundColor = "#475569";

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
        }}
      >
        {status}
      </span>
    );
  };

  const senderBadge = (senderType) => {
    const backgroundColor = senderType === "Admin" ? "#0B3D91" : "#16a34a";

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {senderType}
      </span>
    );
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  };

  const metricCardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    minHeight: "120px",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1 style={{ margin: 0 }}>Support Tickets</h1>

        <button
          onClick={fetchTickets}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#1f3552" }}>
            {summary.total}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Total Tickets</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#dc2626" }}>
            {summary.open}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Open</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#f59e0b" }}>
            {summary.inProgress}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>In Progress</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a" }}>
            {summary.resolved}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Resolved</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Create Support Ticket</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "15px",
          }}
        >
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <textarea
            name="message"
            placeholder="Describe your issue or request"
            value={formData.message}
            onChange={handleChange}
            style={{
              padding: "10px",
              minHeight: "120px",
            }}
          />

          <input
            id="customer-support-attachment"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
            style={{ padding: "10px" }}
          />
        </div>

        <button
          onClick={handleCreateTicket}
          style={{
            marginTop: "18px",
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Submit Ticket
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Search Tickets</h2>

        <input
          type="text"
          placeholder="Search by ticket number, subject, message, or status"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px" }}
        />
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>My Tickets</h2>

        {loading ? (
          <p>Loading your support tickets...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="10" style={{ minWidth: "1400px", width: "100%" }}>
              <thead>
                <tr>
                  <th>Ticket Number</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Attachment</th>
                  <th>Thread</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <>
                      <tr key={ticket._id}>
                        <td>{ticket.ticketNumber}</td>
                        <td>{ticket.subject}</td>
                        <td>{ticket.message}</td>
                        <td>{getStatusBadge(ticket.status)}</td>
                        <td>{formatDate(ticket.date || ticket.createdAt)}</td>
                        <td>
                          {ticket.attachmentFilePath ? (
                            <a
                              href={`http://localhost:5000${ticket.attachmentFilePath}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Attachment
                            </a>
                          ) : (
                            "No attachment"
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              setExpandedTicket((prev) =>
                                prev === ticket.ticketNumber ? "" : ticket.ticketNumber
                              )
                            }
                            style={{
                              backgroundColor: "#0B3D91",
                              color: "white",
                              border: "none",
                              padding: "6px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            {expandedTicket === ticket.ticketNumber ? "Hide Thread" : "Open Thread"}
                          </button>
                        </td>
                      </tr>

                      {expandedTicket === ticket.ticketNumber && (
                        <tr key={`${ticket.ticketNumber}-thread`}>
                          <td colSpan="7" style={{ backgroundColor: "#f8fafc" }}>
                            <div
                              style={{
                                padding: "12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                backgroundColor: "white",
                              }}
                            >
                              <h3 style={{ marginTop: 0 }}>Ticket Conversation</h3>

                              <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                                <div
                                  style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    backgroundColor: "#f0fdf4",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "8px",
                                      gap: "10px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                      {senderBadge("Customer")}
                                      <strong>{ticket.customerName}</strong>
                                    </div>
                                    <span style={{ color: "#64748b", fontSize: "12px" }}>
                                      {ticket.date}
                                    </span>
                                  </div>

                                  <div style={{ marginBottom: "8px" }}>{ticket.message}</div>

                                  {ticket.attachmentFilePath ? (
                                    <a
                                      href={`http://localhost:5000${ticket.attachmentFilePath}`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View Attachment
                                    </a>
                                  ) : null}
                                </div>

                                {(ticket.replies || []).map((reply) => (
                                  <div
                                    key={reply._id}
                                    style={{
                                      border: "1px solid #e5e7eb",
                                      borderRadius: "8px",
                                      padding: "12px",
                                      backgroundColor:
                                        reply.senderType === "Admin" ? "#eff6ff" : "#f0fdf4",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "8px",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        {senderBadge(reply.senderType)}
                                        <strong>{reply.senderName}</strong>
                                      </div>
                                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    </div>

                                    <div style={{ marginBottom: "8px" }}>{reply.message}</div>

                                    {reply.attachmentFilePath ? (
                                      <a
                                        href={`http://localhost:5000${reply.attachmentFilePath}`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        View Attachment
                                      </a>
                                    ) : null}
                                  </div>
                                ))}
                              </div>

                              <div style={{ display: "grid", gap: "10px" }}>
                                <textarea
                                  placeholder="Write a reply to this ticket"
                                  value={replyTexts[ticket.ticketNumber] || ""}
                                  onChange={(e) =>
                                    setReplyTexts((prev) => ({
                                      ...prev,
                                      [ticket.ticketNumber]: e.target.value,
                                    }))
                                  }
                                  style={{ padding: "10px", minHeight: "90px" }}
                                />

                                <input
                                  id={`customer-reply-file-${ticket.ticketNumber}`}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  onChange={(e) =>
                                    setReplyFiles((prev) => ({
                                      ...prev,
                                      [ticket.ticketNumber]: e.target.files[0] || null,
                                    }))
                                  }
                                  style={{ padding: "10px" }}
                                />

                                <button
                                  onClick={() => submitReply(ticket.ticketNumber)}
                                  style={{
                                    backgroundColor: "#16a34a",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    width: "fit-content",
                                  }}
                                >
                                  Send Reply
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No support tickets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerSupport;