import { useEffect, useMemo, useState } from "react";
import api from "../api";

function PreAlerts() {
  const [preAlerts, setPreAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    trackingNumber: "",
    courier: "",
    storeName: "",
    itemDescription: "",
    estimatedWeight: "",
    notes: "",
  });

  const fetchPreAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/pre-alerts");
      setPreAlerts(res.data.data || []);
    } catch (error) {
      console.error("Error loading pre-alerts:", error);
      alert(error?.response?.data?.message || "Could not load pre-alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreAlerts();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.trackingNumber) {
        alert("Please enter the tracking number.");
        return;
      }

      const payload = {
        ...formData,
        estimatedWeight: Number(formData.estimatedWeight || 0),
      };

      const res = await api.post("/api/pre-alerts", payload);
      alert(res.data.message);

      setFormData({
        trackingNumber: "",
        courier: "",
        storeName: "",
        itemDescription: "",
        estimatedWeight: "",
        notes: "",
      });

      fetchPreAlerts();
    } catch (error) {
      console.error("Error submitting pre-alert:", error);
      alert(error?.response?.data?.message || "Could not submit pre-alert.");
    }
  };

  const filteredPreAlerts = useMemo(() => {
    return preAlerts.filter((alert) =>
      `${alert.preAlertNumber} ${alert.trackingNumber} ${alert.courier} ${alert.storeName} ${alert.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [preAlerts, searchTerm]);

  const summary = useMemo(() => {
    return {
      total: preAlerts.length,
      submitted: preAlerts.filter((item) => item.status === "Submitted").length,
    };
  }, [preAlerts]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "18px",
    border: "1px solid #e5e7eb",
  };

  const metricCardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "18px",
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
        <h1 style={{ margin: 0 }}>Pre-Alerts</h1>

        <button
          onClick={fetchPreAlerts}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            width: "100%",
            maxWidth: "160px",
          }}
        >
          Refresh
        </button>
      </div>

      <div className="prealerts-summary-grid">
        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#1f3552", marginBottom: "8px" }}>
            {summary.total}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>Total Pre-Alerts</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#0B3D91", marginBottom: "8px" }}>
            {summary.submitted}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>Submitted</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Create Pre-Alert</h2>

        <div className="prealerts-form-grid">
          <input
            type="text"
            name="trackingNumber"
            placeholder="Tracking Number"
            value={formData.trackingNumber}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="courier"
            placeholder="Courier"
            value={formData.courier}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="storeName"
            placeholder="Store Name"
            value={formData.storeName}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            name="estimatedWeight"
            placeholder="Estimated Weight"
            value={formData.estimatedWeight}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="itemDescription"
            placeholder="Item Description"
            value={formData.itemDescription}
            onChange={handleChange}
            style={{ padding: "10px" }}
            className="prealerts-span-2"
          />

          <textarea
            name="notes"
            placeholder="Notes"
            value={formData.notes}
            onChange={handleChange}
            style={{
              padding: "10px",
              minHeight: "100px",
            }}
            className="prealerts-span-2"
          />
        </div>

        <button
          onClick={handleSubmit}
          style={{
            marginTop: "18px",
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            width: "100%",
            maxWidth: "220px",
          }}
        >
          Submit Pre-Alert
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Search Pre-Alerts</h2>

        <input
          type="text"
          placeholder="Search by tracking number, courier, store, or status"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px" }}
        />
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>My Pre-Alerts</h2>

        {loading ? (
          <p>Loading your pre-alerts...</p>
        ) : (
          <>
            <div className="prealerts-table-wrap">
              <table border="1" cellPadding="10" style={{ minWidth: "1400px", width: "100%" }}>
                <thead>
                  <tr>
                    <th>Pre-Alert Number</th>
                    <th>Tracking Number</th>
                    <th>Courier</th>
                    <th>Store Name</th>
                    <th>Item Description</th>
                    <th>Estimated Weight</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPreAlerts.length > 0 ? (
                    filteredPreAlerts.map((alert) => (
                      <tr key={alert._id}>
                        <td>{alert.preAlertNumber}</td>
                        <td>{alert.trackingNumber}</td>
                        <td>{alert.courier}</td>
                        <td>{alert.storeName}</td>
                        <td>{alert.itemDescription}</td>
                        <td>{alert.estimatedWeight}</td>
                        <td>{alert.status}</td>
                        <td>{formatDate(alert.date || alert.createdAt)}</td>
                        <td>{alert.notes}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No pre-alerts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="prealerts-mobile-list">
              {filteredPreAlerts.length > 0 ? (
                filteredPreAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      backgroundColor: "#f8fafc",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        Pre-Alert Number
                      </div>
                      <div style={{ fontWeight: "bold", wordBreak: "break-word" }}>
                        {alert.preAlertNumber}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Tracking Number</div>
                        <div>{alert.trackingNumber}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Courier</div>
                        <div>{alert.courier || "-"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Store Name</div>
                        <div>{alert.storeName || "-"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Item Description</div>
                        <div>{alert.itemDescription || "-"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Estimated Weight</div>
                        <div>{alert.estimatedWeight}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Status</div>
                        <div>{alert.status || "-"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Date</div>
                        <div>{formatDate(alert.date || alert.createdAt)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Notes</div>
                        <div>{alert.notes || "-"}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "14px",
                    backgroundColor: "#f8fafc",
                    color: "#64748b",
                  }}
                >
                  No pre-alerts found.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>
        {`
          .prealerts-summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 24px;
          }

          .prealerts-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .prealerts-span-2 {
            grid-column: span 2;
          }

          .prealerts-mobile-list {
            display: none;
          }

          .prealerts-table-wrap {
            overflow-x: auto;
          }

          @media (max-width: 700px) {
            .prealerts-summary-grid,
            .prealerts-form-grid {
              grid-template-columns: 1fr;
            }

            .prealerts-span-2 {
              grid-column: span 1;
            }

            .prealerts-table-wrap {
              display: none;
            }

            .prealerts-mobile-list {
              display: block;
            }
          }
        `}
      </style>
    </div>
  );
}

export default PreAlerts;