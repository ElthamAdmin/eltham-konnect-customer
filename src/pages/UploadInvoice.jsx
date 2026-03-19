import { useEffect, useState } from "react";
import api from "../api";

function UploadInvoice() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [packages, setPackages] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    trackingNumber: "",
    invoiceNumber: "",
    notes: "",
  });

  const fetchPageData = async () => {
    try {
      const [packagesRes, uploadsRes] = await Promise.all([
        api.get("/api/packages"),
        api.get("/api/customer-invoices"),
      ]);

      const allPackages = packagesRes.data.data || [];
      const customerPackages = allPackages.filter(
        (pkg) => pkg.customerEkonId === customer?.ekonId
      );

      setPackages(customerPackages);
      setUploads(uploadsRes.data.data || []);
    } catch (error) {
      console.error("Error loading invoice upload page:", error);
      alert(error?.response?.data?.message || "Could not load invoice upload data.");
    }
  };

  useEffect(() => {
    if (customer?.ekonId) {
      fetchPageData();
    }
  }, [customer?.ekonId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpload = async () => {
    try {
      if (!selectedFile) {
        alert("Please choose an invoice file.");
        return;
      }

      const body = new FormData();
      body.append("trackingNumber", formData.trackingNumber);
      body.append("invoiceNumber", formData.invoiceNumber);
      body.append("notes", formData.notes);
      body.append("invoiceFile", selectedFile);

      const res = await api.post("/api/customer-invoices", body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message);

      setFormData({
        trackingNumber: "",
        invoiceNumber: "",
        notes: "",
      });
      setSelectedFile(null);

      const fileInput = document.getElementById("customer-invoice-file");
      if (fileInput) fileInput.value = "";

      fetchPageData();
    } catch (error) {
      console.error("Error uploading invoice:", error);
      alert(error?.response?.data?.message || "Could not upload invoice.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  };

  return (
    <div>
      <h1>Upload Invoice</h1>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Upload Your Package Invoice</h2>
        <p style={{ color: "#64748b" }}>
          Upload your package invoice as soon as your item reaches our warehouse to help prevent customs clearance delays.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
          }}
        >
          <select
            name="trackingNumber"
            value={formData.trackingNumber}
            onChange={handleChange}
            style={{ padding: "10px" }}
          >
            <option value="">Select Package Tracking Number</option>
            {packages.map((pkg) => (
              <option key={pkg._id} value={pkg.trackingNumber}>
                {pkg.trackingNumber} - {pkg.status}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="invoiceNumber"
            placeholder="Invoice Number (optional)"
            value={formData.invoiceNumber}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <textarea
            name="notes"
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={handleChange}
            style={{
              padding: "10px",
              minHeight: "100px",
              gridColumn: "span 2",
            }}
          />

          <input
            id="customer-invoice-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
            style={{ padding: "10px", gridColumn: "span 2" }}
          />
        </div>

        <button
          onClick={handleUpload}
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
          Upload Invoice
        </button>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>My Uploaded Invoices</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ width: "100%", minWidth: "1100px" }}>
            <thead>
              <tr>
                <th>Upload Number</th>
                <th>Tracking Number</th>
                <th>Invoice Number</th>
                <th>File</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Uploaded At</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length > 0 ? (
                uploads.map((upload) => (
                  <tr key={upload._id}>
                    <td>{upload.uploadNumber}</td>
                    <td>{upload.trackingNumber || ""}</td>
                    <td>{upload.invoiceNumber || ""}</td>
                    <td>
                      <a
                        href={`http://localhost:5000${upload.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View File
                      </a>
                    </td>
                    <td>{upload.status}</td>
                    <td>{upload.notes}</td>
                    <td>{formatDate(upload.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No invoice uploads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UploadInvoice;