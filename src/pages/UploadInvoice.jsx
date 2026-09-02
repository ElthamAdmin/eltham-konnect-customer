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
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    trackingNumber: "",
    invoiceNumber: "",
    notes: "",
  });

  const fetchPageData = async () => {
  try {
    const savedCustomer = JSON.parse(
      localStorage.getItem("ek_customer_data") || "null"
    );

    const customerEkonId = String(
      customer?.ekonId || savedCustomer?.ekonId || ""
    )
      .trim()
      .toUpperCase();

    if (!customerEkonId) {
      setPackages([]);
      setUploads([]);
      return;
    }

    const [packagesResult, uploadsResult] = await Promise.allSettled([
      api.get("/api/packages/my"),
      api.get("/api/customer-invoices"),
    ]);

    if (packagesResult.status === "fulfilled") {
      const allPackages = Array.isArray(packagesResult.value?.data?.data)
        ? packagesResult.value.data.data
        : [];

      const customerPackages = allPackages.filter((pkg) => {
        const packageEkonId = String(pkg?.customerEkonId || "")
          .trim()
          .toUpperCase();

        return packageEkonId === customerEkonId;
      });

      setPackages(customerPackages);
    } else {
      console.error(
        "Package loading failed:",
        packagesResult.reason
      );
      setPackages([]);
    }

    if (uploadsResult.status === "fulfilled") {
      const invoiceUploads = Array.isArray(
        uploadsResult.value?.data?.data
      )
        ? uploadsResult.value.data.data
        : [];

      setUploads(invoiceUploads);
    } else {
      console.error(
        "Invoice-history loading failed:",
        uploadsResult.reason
      );
      setUploads([]);
    }
  } catch (error) {
    console.error("Upload Invoice page loading failed:", error);
    setPackages([]);
    setUploads([]);
  }
};

  useEffect(() => {
    if (customer?.ekonId) fetchPageData();
  }, [customer?.ekonId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e) => {
  if (e) e.preventDefault();
    if (!formData.trackingNumber) {
  alert("Please select the package tracking number.");
  return;
}

if (!selectedFile) {
  alert("Please upload the invoice PDF or image.");
  return;
}

    const body = new FormData();
    body.append("trackingNumber", formData.trackingNumber);
    body.append("invoiceNumber", formData.invoiceNumber);
    body.append("notes", formData.notes);
    body.append("invoiceFile", selectedFile);

        const res = await api.post("/api/customer-invoices", body);

    setSuccessMessage(
      res.data.message ||
        "Invoice uploaded successfully. Your package record has been updated."
    );

    alert(
      res.data.message ||
        "Invoice uploaded successfully. Your package record has been updated."
    );

    setFormData({ trackingNumber: "", invoiceNumber: "", notes: "" });
    setSelectedFile(null);

    fetchPageData();
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "";

  return (
    <div>
      <h1>Upload Invoice</h1>

      <div
  style={{
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
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
    <strong>1. Name:</strong> {customer?.name} EKON
  </div>

  <div>
    <strong>2. Address Line 1:</strong> 2099 NW 141st St
  </div>

  <div>
    <strong>3. Address Line 2:</strong> Unit 8 {customer?.ekonId}
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
    Ensure all uploaded invoices match this warehouse delivery address and your package tracking number.
  </p>
</div>

            {successMessage && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #16a34a",
            color: "#14532d",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontWeight: "bold",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* FORM */}
      <div className="card">
        <select name="trackingNumber" value={formData.trackingNumber} onChange={handleChange}>
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg._id} value={pkg.trackingNumber}>
              {pkg.trackingNumber}
            </option>
          ))}
        </select>

        <input
  name="invoiceNumber"
  placeholder="Invoice Number (optional)"
  value={formData.invoiceNumber}
  onChange={handleChange}
/>

<textarea
  name="notes"
  placeholder="Notes (optional)"
  value={formData.notes}
  onChange={handleChange}
/>

<input
  type="file"
  accept=".pdf,image/*"
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }}
  style={{
    width: "100%",
    padding: "12px",
    border: "1px solid #dbe3ef",
    borderRadius: "8px",
    backgroundColor: "white",
    boxSizing: "border-box",
  }}
/>

{selectedFile && (
  <div
    style={{
      backgroundColor: "#f0fdf4",
      border: "1px solid #bbf7d0",
      color: "#166534",
      padding: "10px",
      borderRadius: "8px",
      fontWeight: "bold",
    }}
  >
    Selected file: {selectedFile.name}
  </div>
)}

<button type="button" onClick={handleUpload}>
  Upload Invoice
</button>
      </div>

      {/* DESKTOP TABLE */}
      <div className="desktop">
        <table>
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Status</th>
              <th>Invoice</th>
              <th>Date</th>
              <th>File</th>
            </tr>
          </thead>

          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg._id}>
                <td>{pkg.trackingNumber}</td>
                <td>{pkg.status}</td>
                <td>{pkg.customerInvoiceUploaded ? "Yes" : "No"}</td>
                <td>{formatDate(pkg.customerInvoiceUploadedAt)}</td>
                <td>
                  {pkg.customerInvoiceFilePath && (
                    <a href={`https://eltham-konnect-backend-c2sf.onrender.com${pkg.customerInvoiceFilePath}`} target="_blank" rel="noreferrer">
                      View
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="mobile">
        {packages.map((pkg) => (
          <div key={pkg._id} className="mobile-card">
            <strong>{pkg.trackingNumber}</strong>
            <div>Status: {pkg.status}</div>
            <div>Invoice: {pkg.customerInvoiceUploaded ? "Yes" : "No"}</div>
            <div>{formatDate(pkg.customerInvoiceUploadedAt)}</div>
          </div>
        ))}
      </div>

      {/* UPLOAD HISTORY */}
      <div className="mobile">
        {uploads.map((u) => (
          <div key={u._id} className="mobile-card">
            <strong>{u.uploadNumber}</strong>
            <div>{u.trackingNumber}</div>
            <div>{u.invoiceNumber}</div>
            <div>{u.status}</div>
            <div>{formatDate(u.createdAt)}</div>
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

export default UploadInvoice;