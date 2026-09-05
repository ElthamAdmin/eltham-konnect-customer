import { useEffect, useMemo, useState } from "react";
import api from "../api";

function PreAlerts({ customer }) {
  const [preAlerts, setPreAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
    const [selectedInvoiceFile, setSelectedInvoiceFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      const res = await api.get("/api/pre-alerts/my");
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

      const payload = new FormData();
      payload.append("trackingNumber", formData.trackingNumber);
      payload.append("courier", formData.courier);
      payload.append("storeName", formData.storeName);
      payload.append("itemDescription", formData.itemDescription);
      payload.append("estimatedWeight", Number(formData.estimatedWeight || 0));
      payload.append("notes", formData.notes);

      if (selectedInvoiceFile) {
        payload.append("invoiceFile", selectedInvoiceFile);
      }

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

      setSelectedInvoiceFile(null);
      await fetchPreAlerts();
    } catch (error) {
      console.error("Error submitting pre-alert:", error);
      alert(error?.response?.data?.message || "Could not submit pre-alert.");
    }
  };

    const filteredPreAlerts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return preAlerts.filter((alert) =>
      `${alert.preAlertNumber || ""} ${alert.trackingNumber || ""} ${
        alert.courier || ""
      } ${alert.storeName || ""} ${alert.itemDescription || ""} ${
        alert.notes || ""
      } ${alert.status || ""}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [preAlerts, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPreAlerts.length / rowsPerPage)
  );

  const paginatedPreAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;

    return filteredPreAlerts.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [filteredPreAlerts, currentPage, rowsPerPage]);

  const firstVisiblePreAlert =
    filteredPreAlerts.length === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1;

  const lastVisiblePreAlert = Math.min(
    currentPage * rowsPerPage,
    filteredPreAlerts.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summary = useMemo(() => {
    return {
      total: preAlerts.length,
      submitted: preAlerts.filter((item) => item.status === "Submitted").length,
      withInvoice: preAlerts.filter((item) => item.invoiceFilePath).length,
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

      <div
        style={{
          backgroundColor: "#ecfeff",
          border: "1px solid #67e8f9",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#0B3D91" }}>
  Your Official EKON Warehouse Address
</h3>

<div style={{ lineHeight: 1.8, wordBreak: "break-word" }}>
  <div>
    <strong>1. Name:</strong> {customer.name} EKON
  </div>

  <div>
    <strong>2. Address Line 1:</strong> 2099 NW 141st St
  </div>

  <div>
    <strong>3. Address Line 2:</strong> Unit 8 {customer.ekonId}
  </div>

  <div>
    <strong>4. City:</strong> Opa-Locka
  </div>

  <div>
    <strong>5. State:</strong> Florida
  </div>

  <div>
    <strong>6. ZIP:</strong> 33054
  </div>

  <div>
    <strong>7. Country:</strong> USA
  </div>
</div>

        <p style={{ marginBottom: 0, marginTop: "12px", color: "#475569" }}>
          Use this address when placing online orders and submit your pre-alert as soon as tracking is available.
        </p>
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

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a", marginBottom: "8px" }}>
            {summary.withInvoice}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>With Invoice</p>
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

          <div className="prealerts-span-2">
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                color: "#334155",
                marginBottom: "8px",
              }}
            >
              Upload Invoice (Optional)
            </label>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setSelectedInvoiceFile(e.target.files?.[0] || null)}
              style={{ padding: "10px", width: "100%" }}
            />

            {selectedInvoiceFile && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#475569",
                  fontSize: "14px",
                  wordBreak: "break-word",
                }}
              >
                Selected file: {selectedInvoiceFile.name}
              </div>
            )}
          </div>
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
        <div className="prealerts-records-header">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "6px" }}>
              My Pre-Alerts
            </h2>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Showing {firstVisiblePreAlert} to {lastVisiblePreAlert} of{" "}
              {filteredPreAlerts.length} matched pre-alert
              {filteredPreAlerts.length === 1 ? "" : "s"}.
            </p>
          </div>

          {filteredPreAlerts.length > 0 && (
            <div className="prealerts-pagination">
              <label className="prealerts-page-size">
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

              <div className="prealerts-page-status">
                Page {currentPage} of {totalPages}
              </div>

              <div className="prealerts-page-buttons">
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
          <p>Loading your pre-alerts...</p>
        ) : (
          <>
            <div className="prealerts-table-wrap">
              <table border="1" cellPadding="10" style={{ minWidth: "1600px", width: "100%" }}>
                <thead>
                  <tr>
                    <th>Pre-Alert Number</th>
                    <th>Tracking Number</th>
                    <th>Courier</th>
                    <th>Store Name</th>
                    <th>Item Description</th>
                    <th>Estimated Weight</th>
                    <th>Invoice</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPreAlerts.length > 0 ? (
                                        paginatedPreAlerts.map((alert) => (
                      <tr key={alert._id}>
                        <td>{alert.preAlertNumber}</td>
                        <td>{alert.trackingNumber}</td>
                        <td>{alert.courier}</td>
                        <td>{alert.storeName}</td>
                        <td>{alert.itemDescription}</td>
                        <td>{alert.estimatedWeight}</td>
                        <td>
                          {alert.invoiceFilePath ? (
                            <a
                              href={`https://eltham-konnect-backend-c2sf.onrender.com${alert.invoiceFilePath}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#0B3D91",
                                fontWeight: "bold",
                                textDecoration: "none",
                              }}
                            >
                              View Invoice
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{alert.status}</td>
                        <td>{formatDate(alert.date || alert.createdAt)}</td>
                        <td>{alert.notes}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10">No pre-alerts found.</td>
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
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Invoice</div>
                        <div>
                          {alert.invoiceFilePath ? (
                            <a
                              href={`https://eltham-konnect-backend-c2sf.onrender.com${alert.invoiceFilePath}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#0B3D91",
                                fontWeight: "bold",
                                textDecoration: "none",
                              }}
                            >
                              View Invoice
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
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
            grid-template-columns: repeat(3, 1fr);
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

          .prealerts-records-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 18px;
          }

          .prealerts-pagination {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .prealerts-page-size {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 14px;
            font-weight: 700;
          }

          .prealerts-page-size select {
            min-width: 76px;
            min-height: 42px;
            border: 1px solid #dbe3ef;
            border-radius: 9px;
            background: #ffffff;
          }

          .prealerts-page-status {
            color: #475569;
            font-size: 14px;
            font-weight: 700;
          }

          .prealerts-page-buttons {
            display: flex;
            gap: 8px;
          }

          .prealerts-page-buttons button {
            min-height: 42px;
            padding: 9px 14px;
            border: 0;
            border-radius: 9px;
            color: #ffffff;
            background: #0b3d91;
            font-weight: 800;
            cursor: pointer;
          }

          .prealerts-page-buttons button:disabled {
            color: #64748b;
            background: #e2e8f0;
            cursor: not-allowed;
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

            .prealerts-records-header {
              align-items: stretch;
            }

            .prealerts-pagination {
              width: 100%;
              align-items: stretch;
            }

            .prealerts-page-size,
            .prealerts-page-status {
              justify-content: center;
            }

            .prealerts-page-buttons {
              width: 100%;
            }

            .prealerts-page-buttons button {
              flex: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

export default PreAlerts;