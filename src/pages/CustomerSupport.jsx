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
      console.error(error);
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
    if (!formData.subject || !formData.message) {
      alert("Fill all fields");
      return;
    }

    const body = new FormData();
    body.append("subject", formData.subject);
    body.append("message", formData.message);
    if (selectedFile) body.append("attachmentFile", selectedFile);

    await api.post("/api/support-tickets", body);
    setFormData({ subject: "", message: "" });
    setSelectedFile(null);
    fetchTickets();
  };

  const submitReply = async (ticketNumber) => {
    const message = replyTexts[ticketNumber];
    if (!message) return;

    const body = new FormData();
    body.append("message", message);
    if (replyFiles[ticketNumber]) body.append("attachmentFile", replyFiles[ticketNumber]);

    await api.post(`/api/support-tickets/${ticketNumber}/reply`, body);

    setReplyTexts((p) => ({ ...p, [ticketNumber]: "" }));
    setReplyFiles((p) => ({ ...p, [ticketNumber]: null }));

    fetchTickets();
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) =>
      `${t.ticketNumber} ${t.subject} ${t.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  return (
    <div>
      <h1>Support Tickets</h1>

      {/* CREATE */}
      <div className="card">
        <input name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} />
        <textarea name="message" placeholder="Message" value={formData.message} onChange={handleChange} />
        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
        <button onClick={handleCreateTicket}>Submit</button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search tickets"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* DESKTOP TABLE */}
      <div className="desktop">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Thread</th>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.map((t) => (
              <>
                <tr key={t._id}>
                  <td>{t.ticketNumber}</td>
                  <td>{t.subject}</td>
                  <td>{t.status}</td>
                  <td>
                    <button onClick={() =>
                      setExpandedTicket(
                        expandedTicket === t.ticketNumber ? "" : t.ticketNumber
                      )
                    }>
                      Open
                    </button>
                  </td>
                </tr>

                {expandedTicket === t.ticketNumber && (
                  <tr>
                    <td colSpan="4">
                      <div className="thread-box">
                        <div>{t.message}</div>

                        {(t.replies || []).map((r) => (
                          <div key={r._id}>{r.message}</div>
                        ))}

                        <textarea
                          placeholder="Reply"
                          value={replyTexts[t.ticketNumber] || ""}
                          onChange={(e) =>
                            setReplyTexts((p) => ({
                              ...p,
                              [t.ticketNumber]: e.target.value,
                            }))
                          }
                        />

                        <button onClick={() => submitReply(t.ticketNumber)}>
                          Send
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="mobile">
        {filteredTickets.map((t) => (
          <div key={t._id} className="mobile-card">
            <strong>{t.ticketNumber}</strong>
            <div>{t.subject}</div>
            <div>{t.status}</div>

            <button
              onClick={() =>
                setExpandedTicket(
                  expandedTicket === t.ticketNumber ? "" : t.ticketNumber
                )
              }
            >
              View
            </button>

            {expandedTicket === t.ticketNumber && (
              <div className="thread-box">
                <div>{t.message}</div>

                {(t.replies || []).map((r) => (
                  <div key={r._id}>{r.message}</div>
                ))}

                <textarea
                  placeholder="Reply"
                  value={replyTexts[t.ticketNumber] || ""}
                  onChange={(e) =>
                    setReplyTexts((p) => ({
                      ...p,
                      [t.ticketNumber]: e.target.value,
                    }))
                  }
                />

                <button onClick={() => submitReply(t.ticketNumber)}>
                  Send Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CSS */}
      <style>{`
        .card {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
        }

        .desktop {
          display: block;
        }

        .mobile {
          display: none;
        }

        .mobile-card {
          border: 1px solid #ddd;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 8px;
        }

        .thread-box {
          margin-top: 10px;
          padding: 10px;
          border: 1px solid #ccc;
        }

        @media (max-width: 768px) {
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