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
      console.error(error);
    }
  };

  useEffect(() => {
    if (customer?.ekonId) fetchPageData();
  }, [customer?.ekonId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpload = async () => {
    if (!formData.trackingNumber || !selectedFile) {
      alert("Fill all required fields");
      return;
    }

    const body = new FormData();
    body.append("trackingNumber", formData.trackingNumber);
    body.append("invoiceNumber", formData.invoiceNumber);
    body.append("notes", formData.notes);
    body.append("invoiceFile", selectedFile);

    await api.post("/api/customer-invoices", body);

    setFormData({ trackingNumber: "", invoiceNumber: "", notes: "" });
    setSelectedFile(null);

    fetchPageData();
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "";

  return (
    <div>
      <h1>Upload Invoice</h1>

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
          placeholder="Invoice Number"
          value={formData.invoiceNumber}
          onChange={handleChange}
        />

        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
        />

        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

        <button onClick={handleUpload}>Upload</button>
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