import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import api from "../api";

function UploadInvoice() {
  const [searchParams] = useSearchParams();

  const requestedTrackingNumber = String(
    searchParams.get("trackingNumber") || ""
  ).trim();

  const [customer] = useState(() => {
    const saved = localStorage.getItem(
      "ek_customer_data"
    );

    return saved ? JSON.parse(saved) : null;
  });

  const [packages, setPackages] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [selectedFile, setSelectedFile] =
    useState(null);
  const [successMessage, setSuccessMessage] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] =
    useState(false);
  const [fileInputKey, setFileInputKey] =
    useState(0);

  const [packageSearch, setPackageSearch] =
    useState("");
  const [uploadSearch, setUploadSearch] =
    useState("");

  const [packagePage, setPackagePage] =
    useState(1);
  const [packagePageSize, setPackagePageSize] =
    useState(10);

  const [uploadPage, setUploadPage] =
    useState(1);
  const [uploadPageSize, setUploadPageSize] =
    useState(10);

  const [formData, setFormData] = useState({
    trackingNumber: "",
    invoiceNumber: "",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const ORANGE = "#F15A24";
  const MUTED = "#64748b";

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "https://eltham-konnect-backend-c2sf.onrender.com";

  const getFileUrl = (path = "") => {
    if (!path) {
      return "";
    }

    if (String(path).startsWith("http")) {
      return path;
    }

    return `${API_BASE}${path}`;
  };

  const fetchPageData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const savedCustomer = JSON.parse(
        localStorage.getItem(
          "ek_customer_data"
        ) || "null"
      );

      const customerEkonId = String(
        customer?.ekonId ||
          savedCustomer?.ekonId ||
          ""
      )
        .trim()
        .toUpperCase();

      if (!customerEkonId) {
        setPackages([]);
        setUploads([]);
        setErrorMessage(
          "Your customer account could not be identified. Please sign in again."
        );
        return;
      }

      const [packagesResult, uploadsResult] =
        await Promise.allSettled([
          api.get("/api/packages/my"),
          api.get("/api/customer-invoices"),
        ]);

      if (
        packagesResult.status === "fulfilled"
      ) {
        const allPackages = Array.isArray(
          packagesResult.value?.data?.data
        )
          ? packagesResult.value.data.data
          : [];

        const customerPackages =
          allPackages.filter((pkg) => {
            const packageEkonId = String(
              pkg?.customerEkonId || ""
            )
              .trim()
              .toUpperCase();

            return (
              !packageEkonId ||
              packageEkonId === customerEkonId
            );
          });

        setPackages(customerPackages);
      } else {
        console.error(
          "Package loading failed:",
          packagesResult.reason
        );

        setPackages([]);
      }

      if (
        uploadsResult.status === "fulfilled"
      ) {
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

      if (
        packagesResult.status === "rejected" &&
        uploadsResult.status === "rejected"
      ) {
        setErrorMessage(
          "Packages and invoice history could not be loaded. Please refresh and try again."
        );
      } else if (
        packagesResult.status === "rejected"
      ) {
        setErrorMessage(
          "Your packages could not be loaded. Please refresh and try again."
        );
      } else if (
        uploadsResult.status === "rejected"
      ) {
        setErrorMessage(
          "Your upload history could not be loaded, but you can still upload an invoice."
        );
      }
    } catch (error) {
      console.error(
        "Upload Invoice page loading failed:",
        error
      );

      setPackages([]);
      setUploads([]);

      setErrorMessage(
        error?.response?.data?.message ||
          "The Upload Invoice page could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.ekonId) {
      fetchPageData();
    } else {
      setLoading(false);
      setErrorMessage(
        "Your customer account could not be identified. Please sign in again."
      );
    }
  }, [customer?.ekonId]);

  useEffect(() => {
    if (
      !requestedTrackingNumber ||
      packages.length === 0
    ) {
      return;
    }

    const matchingPackage = packages.find(
      (pkg) =>
        String(pkg.trackingNumber || "")
          .trim()
          .toUpperCase() ===
        requestedTrackingNumber.toUpperCase()
    );

    if (!matchingPackage) {
      return;
    }

    setFormData((currentFormData) => {
      if (
        currentFormData.trackingNumber ===
        matchingPackage.trackingNumber
      ) {
        return currentFormData;
      }

      return {
        ...currentFormData,
        trackingNumber:
          matchingPackage.trackingNumber,
      };
    });
  }, [
    requestedTrackingNumber,
    packages,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));

    setSuccessMessage("");
  };

  const handleUpload = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (uploading) {
      return;
    }

    if (!formData.trackingNumber) {
      alert(
        "Please select the package tracking number."
      );
      return;
    }

    if (!selectedFile) {
      alert(
        "Please upload the invoice PDF or image."
      );
      return;
    }

    try {
      setUploading(true);
      setSuccessMessage("");
      setErrorMessage("");

      const body = new FormData();

      body.append(
        "trackingNumber",
        formData.trackingNumber
      );

      body.append(
        "invoiceNumber",
        formData.invoiceNumber.trim()
      );

      body.append(
        "notes",
        formData.notes.trim()
      );

      body.append(
        "invoiceFile",
        selectedFile
      );

      const res = await api.post(
        "/api/customer-invoices",
        body
      );

      const message =
        res.data?.message ||
        "Invoice uploaded successfully. Your package record has been updated.";

      setSuccessMessage(message);

      setFormData({
        trackingNumber: "",
        invoiceNumber: "",
        notes: "",
      });

      setSelectedFile(null);

      setFileInputKey(
        (currentKey) => currentKey + 1
      );

      await fetchPageData();

      alert(message);
    } catch (error) {
      console.error(
        "Invoice upload failed:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "The invoice could not be uploaded. Please check the file and try again.";

      setErrorMessage(message);
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const filteredPackages = useMemo(() => {
    const normalizedSearch = packageSearch
      .trim()
      .toLowerCase();

    return packages.filter((pkg) => {
      const searchableText = [
        pkg?.trackingNumber,
        pkg?.status,
        pkg?.courier,
        pkg?.customerInvoiceUploaded
          ? "uploaded yes"
          : "pending no",
        pkg?.customerInvoiceUploadedAt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [packages, packageSearch]);

  const filteredUploads = useMemo(() => {
    const normalizedSearch = uploadSearch
      .trim()
      .toLowerCase();

    return uploads.filter((upload) => {
      const searchableText = [
        upload?.uploadNumber,
        upload?.trackingNumber,
        upload?.invoiceNumber,
        upload?.status,
        upload?.createdAt,
        upload?.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [uploads, uploadSearch]);

  useEffect(() => {
    setPackagePage(1);
  }, [packageSearch, packagePageSize]);

  useEffect(() => {
    setUploadPage(1);
  }, [uploadSearch, uploadPageSize]);

  const packageTotalPages = Math.max(
    1,
    Math.ceil(
      filteredPackages.length /
        packagePageSize
    )
  );

  const uploadTotalPages = Math.max(
    1,
    Math.ceil(
      filteredUploads.length /
        uploadPageSize
    )
  );

  useEffect(() => {
    if (packagePage > packageTotalPages) {
      setPackagePage(packageTotalPages);
    }
  }, [
    packagePage,
    packageTotalPages,
  ]);

  useEffect(() => {
    if (uploadPage > uploadTotalPages) {
      setUploadPage(uploadTotalPages);
    }
  }, [
    uploadPage,
    uploadTotalPages,
  ]);

  const packageStart =
    (packagePage - 1) * packagePageSize;

  const uploadStart =
    (uploadPage - 1) * uploadPageSize;

  const paginatedPackages =
    filteredPackages.slice(
      packageStart,
      packageStart + packagePageSize
    );

  const paginatedUploads =
    filteredUploads.slice(
      uploadStart,
      uploadStart + uploadPageSize
    );

  const firstVisiblePackage =
    filteredPackages.length === 0
      ? 0
      : packageStart + 1;

  const lastVisiblePackage = Math.min(
    packageStart + packagePageSize,
    filteredPackages.length
  );

  const firstVisibleUpload =
    filteredUploads.length === 0
      ? 0
      : uploadStart + 1;

  const lastVisibleUpload = Math.min(
    uploadStart + uploadPageSize,
    filteredUploads.length
  );

  const summary = useMemo(() => {
    const uploaded = packages.filter(
      (pkg) => pkg?.customerInvoiceUploaded
    ).length;

    return {
      totalPackages: packages.length,
      invoicesUploaded: uploaded,
      invoicesPending:
        packages.length - uploaded,
      uploadRecords: uploads.length,
    };
  }, [packages, uploads]);

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  };

  const getPackageStatusStyle = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (
      normalizedStatus.includes("ready")
    ) {
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
      };
    }

    if (
      normalizedStatus.includes("warehouse")
    ) {
      return {
        backgroundColor: "#dbeafe",
        color: "#1e40af",
      };
    }

    if (
      normalizedStatus.includes("transit")
    ) {
      return {
        backgroundColor: "#fff7ed",
        color: "#9a3412",
      };
    }

    return {
      backgroundColor: "#f1f5f9",
      color: "#475569",
    };
  };

  const selectedPackage = packages.find(
    (pkg) =>
      pkg.trackingNumber ===
      formData.trackingNumber
  );

  const summaryCards = [
    {
      label: "Total Packages",
      value: summary.totalPackages,
      color: ROYAL_BLUE,
      background: "#eef4ff",
      icon: Package,
    },
    {
      label: "Invoices Uploaded",
      value: summary.invoicesUploaded,
      color: "#16a34a",
      background: "#f0fdf4",
      icon: FileCheck2,
    },
    {
      label: "Invoices Pending",
      value: summary.invoicesPending,
      color: ORANGE,
      background: "#fff7ed",
      icon: FileText,
    },
    {
      label: "Upload Records",
      value: summary.uploadRecords,
      color: ROYAL_BLUE,
      background: "#f8fafc",
      icon: Upload,
    },
  ];

  return (
    <div className="upload-invoice-page">
      <div className="upload-invoice-header">
        <div>
          <div className="upload-invoice-title">
            <Upload
              size={33}
              color={ROYAL_BLUE}
              strokeWidth={2.2}
            />

            <h1>Upload Invoice</h1>
          </div>

          <p>
            Upload your package invoice to help
            prevent customs and processing delays.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPageData}
          disabled={loading}
          className="upload-invoice-refresh"
        >
          <RefreshCw size={17} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <section className="warehouse-address-card">
        <div className="warehouse-address-heading">
          <div>
            <MapPin size={24} />
          </div>

          <div>
            <h2>
              Your Official EKON Warehouse Address
            </h2>

            <p>
              Use this exact address for packages
              being sent to the EKON warehouse.
            </p>
          </div>
        </div>

        <div className="warehouse-address-grid">
          <div>
            <span>1. Name</span>
            <strong>
              {customer?.name || "Customer"} EKON
            </strong>
          </div>

          <div>
            <span>2. Address Line 1</span>
            <strong>2099 NW 141st St</strong>
          </div>

          <div>
            <span>3. Address Line 2</span>
            <strong>
              Unit 8{" "}
              {customer?.ekonId || "EKON ID"}
            </strong>
          </div>

          <div>
            <span>4. City</span>
            <strong>Opa-Locka</strong>
          </div>

          <div>
            <span>5. State</span>
            <strong>Florida</strong>
          </div>

          <div>
            <span>6. ZIP</span>
            <strong>33054</strong>
          </div>

          <div>
            <span>7. Country</span>
            <strong>USA</strong>
          </div>
        </div>

        <div className="warehouse-address-notice">
          Ensure every uploaded invoice matches this
          warehouse delivery address and its package
          tracking number.
        </div>
      </section>

      {successMessage && (
        <div className="upload-success-message">
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="upload-error-message">
          <div>
            <strong>Upload Invoice notice</strong>
            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={fetchPageData}
          >
            Try Again
          </button>
        </div>
      )}

      <div className="upload-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              style={{
                background: `linear-gradient(180deg, #ffffff, ${card.background})`,
              }}
            >
              <div
                className="upload-summary-icon"
                style={{
                  backgroundColor:
                    card.background,
                  color: card.color,
                }}
              >
                <Icon size={21} />
              </div>

              <strong style={{ color: card.color }}>
                {card.value}
              </strong>

              <span>{card.label}</span>
            </div>
          );
        })}
      </div>

      <section className="invoice-upload-form-card">
        <div className="invoice-upload-form-heading">
          <div>
            <h2>Submit Package Invoice</h2>

            <p>
              Select the correct package and attach
              its merchant invoice.
            </p>
          </div>

          {requestedTrackingNumber &&
            formData.trackingNumber && (
              <div className="preselected-package">
                <CheckCircle2 size={16} />
                Package preselected
              </div>
            )}
        </div>

        <form onSubmit={handleUpload}>
          <div className="invoice-upload-form-grid">
            <div className="invoice-upload-field invoice-upload-full">
              <label htmlFor="trackingNumber">
                Package Tracking Number
              </label>

              <select
                id="trackingNumber"
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleChange}
                disabled={uploading}
              >
                <option value="">
                  Select Package
                </option>

                {packages.map((pkg) => (
                  <option
                    key={
                      pkg._id ||
                      pkg.trackingNumber
                    }
                    value={pkg.trackingNumber}
                  >
                    {pkg.trackingNumber}
                    {pkg.status
                      ? ` — ${pkg.status}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="invoice-upload-field">
              <label htmlFor="invoiceNumber">
                Invoice Number
                <span>Optional</span>
              </label>

              <input
                id="invoiceNumber"
                name="invoiceNumber"
                placeholder="Enter invoice number"
                value={formData.invoiceNumber}
                onChange={handleChange}
                disabled={uploading}
              />
            </div>

            <div className="invoice-upload-field">
              <label htmlFor="invoiceFile">
                Invoice File
                <span>Required</span>
              </label>

              <input
                key={fileInputKey}
                id="invoiceFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0] ||
                    null;

                  setSelectedFile(file);
                  setSuccessMessage("");
                }}
                disabled={uploading}
              />
            </div>

            <div className="invoice-upload-field invoice-upload-full">
              <label htmlFor="notes">
                Notes
                <span>Optional</span>
              </label>

              <textarea
                id="notes"
                name="notes"
                placeholder="Add any helpful information about this invoice"
                value={formData.notes}
                onChange={handleChange}
                disabled={uploading}
              />
            </div>
          </div>

          {selectedPackage && (
            <div className="selected-package-details">
              <Package size={18} />

              <div>
                <strong>
                  {selectedPackage.trackingNumber}
                </strong>

                <span>
                  {selectedPackage.courier ||
                    "Courier unavailable"}{" "}
                  ·{" "}
                  {selectedPackage.status ||
                    "Status unavailable"}
                </span>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="selected-invoice-file">
              <FileCheck2 size={18} />

              <div>
                <strong>
                  Selected invoice file
                </strong>

                <span>{selectedFile.name}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="invoice-upload-button"
            disabled={uploading}
          >
            <Upload size={18} />
            {uploading
              ? "Uploading Invoice..."
              : "Upload Invoice"}
          </button>
        </form>
      </section>

      <section className="invoice-records-card">
        <div className="invoice-records-heading">
          <div>
            <h2>Package Invoice Status</h2>

            <p>
              Showing {firstVisiblePackage} to{" "}
              {lastVisiblePackage} of{" "}
              {filteredPackages.length} matched
              packages.
            </p>
          </div>
        </div>

        <div className="invoice-records-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search by tracking number, courier, status, or invoice state"
            value={packageSearch}
            onChange={(event) =>
              setPackageSearch(event.target.value)
            }
          />
        </div>

        {loading ? (
          <div className="invoice-empty-state">
            <RefreshCw
              size={27}
              className="upload-loading-icon"
            />

            <strong>Loading packages...</strong>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="invoice-empty-state">
            <Package size={30} />

            <strong>
              {packages.length === 0
                ? "No packages are available."
                : "No packages match your search."}
            </strong>
          </div>
        ) : (
          <>
            <div className="invoice-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Tracking</th>
                    <th>Courier</th>
                    <th>Status</th>
                    <th>Invoice</th>
                    <th>Uploaded Date</th>
                    <th>File</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPackages.map((pkg) => {
                    const filePath =
                      pkg.customerInvoiceFilePath;

                    return (
                      <tr
                        key={
                          pkg._id ||
                          pkg.trackingNumber
                        }
                      >
                        <td>
                          <strong>
                            {pkg.trackingNumber}
                          </strong>
                        </td>

                        <td>
                          {pkg.courier || "—"}
                        </td>

                        <td>
                          <span
                            className="package-status-badge"
                            style={getPackageStatusStyle(
                              pkg.status
                            )}
                          >
                            {pkg.status ||
                              "Unknown"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              pkg.customerInvoiceUploaded
                                ? "invoice-state uploaded"
                                : "invoice-state pending"
                            }
                          >
                            {pkg.customerInvoiceUploaded
                              ? "Uploaded"
                              : "Pending"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            pkg.customerInvoiceUploadedAt
                          )}
                        </td>

                        <td>
                          {filePath ? (
                            <a
                              href={getFileUrl(
                                filePath
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                              <ExternalLink
                                size={14}
                              />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="invoice-mobile-list">
              {paginatedPackages.map((pkg) => {
                const filePath =
                  pkg.customerInvoiceFilePath;

                return (
                  <article
                    key={
                      pkg._id ||
                      pkg.trackingNumber
                    }
                    className="invoice-mobile-card"
                  >
                    <div className="invoice-mobile-top">
                      <strong>
                        {pkg.trackingNumber}
                      </strong>

                      <span
                        className={
                          pkg.customerInvoiceUploaded
                            ? "invoice-state uploaded"
                            : "invoice-state pending"
                        }
                      >
                        {pkg.customerInvoiceUploaded
                          ? "Uploaded"
                          : "Pending"}
                      </span>
                    </div>

                    <dl>
                      <div>
                        <dt>Courier</dt>
                        <dd>
                          {pkg.courier || "—"}
                        </dd>
                      </div>

                      <div>
                        <dt>Status</dt>
                        <dd>
                          {pkg.status || "Unknown"}
                        </dd>
                      </div>

                      <div>
                        <dt>Uploaded</dt>
                        <dd>
                          {formatDate(
                            pkg.customerInvoiceUploadedAt
                          )}
                        </dd>
                      </div>
                    </dl>

                    {filePath && (
                      <a
                        href={getFileUrl(filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Invoice
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="invoice-pagination">
              <div className="invoice-page-size">
                <label htmlFor="package-page-size">
                  Packages:
                </label>

                <select
                  id="package-page-size"
                  value={packagePageSize}
                  onChange={(event) =>
                    setPackagePageSize(
                      Number(event.target.value)
                    )
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="invoice-page-status">
                Page {packagePage} of{" "}
                {packageTotalPages}
              </div>

              <div className="invoice-page-buttons">
                <button
                  type="button"
                  disabled={packagePage === 1}
                  onClick={() =>
                    setPackagePage(
                      (currentPage) =>
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
                  disabled={
                    packagePage ===
                    packageTotalPages
                  }
                  onClick={() =>
                    setPackagePage(
                      (currentPage) =>
                        Math.min(
                          packageTotalPages,
                          currentPage + 1
                        )
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="invoice-records-card">
        <div className="invoice-records-heading">
          <div>
            <h2>Invoice Upload History</h2>

            <p>
              Showing {firstVisibleUpload} to{" "}
              {lastVisibleUpload} of{" "}
              {filteredUploads.length} matched
              uploads.
            </p>
          </div>
        </div>

        <div className="invoice-records-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search by upload number, tracking number, invoice, or status"
            value={uploadSearch}
            onChange={(event) =>
              setUploadSearch(event.target.value)
            }
          />
        </div>

        {loading ? (
          <div className="invoice-empty-state">
            <RefreshCw
              size={27}
              className="upload-loading-icon"
            />

            <strong>
              Loading invoice history...
            </strong>
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="invoice-empty-state">
            <FileText size={30} />

            <strong>
              {uploads.length === 0
                ? "No invoice uploads found."
                : "No invoice uploads match your search."}
            </strong>
          </div>
        ) : (
          <>
            <div className="invoice-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Upload Number</th>
                    <th>Tracking</th>
                    <th>Invoice Number</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>File</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUploads.map(
                    (upload) => {
                      const filePath =
                        upload.invoiceFilePath ||
                        upload.filePath ||
                        upload.attachmentFilePath;

                      return (
                        <tr
                          key={
                            upload._id ||
                            upload.uploadNumber
                          }
                        >
                          <td>
                            <strong>
                              {upload.uploadNumber ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            {upload.trackingNumber ||
                              "—"}
                          </td>

                          <td>
                            {upload.invoiceNumber ||
                              "—"}
                          </td>

                          <td>
                            <span className="upload-history-status">
                              {upload.status ||
                                "Submitted"}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              upload.createdAt
                            )}
                          </td>

                          <td>
                            {filePath ? (
                              <a
                                href={getFileUrl(
                                  filePath
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                                <ExternalLink
                                  size={14}
                                />
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            <div className="invoice-mobile-list">
              {paginatedUploads.map((upload) => {
                const filePath =
                  upload.invoiceFilePath ||
                  upload.filePath ||
                  upload.attachmentFilePath;

                return (
                  <article
                    key={
                      upload._id ||
                      upload.uploadNumber
                    }
                    className="invoice-mobile-card"
                  >
                    <div className="invoice-mobile-top">
                      <strong>
                        {upload.uploadNumber ||
                          "Invoice Upload"}
                      </strong>

                      <span className="upload-history-status">
                        {upload.status ||
                          "Submitted"}
                      </span>
                    </div>

                    <dl>
                      <div>
                        <dt>Tracking</dt>
                        <dd>
                          {upload.trackingNumber ||
                            "—"}
                        </dd>
                      </div>

                      <div>
                        <dt>Invoice</dt>
                        <dd>
                          {upload.invoiceNumber ||
                            "—"}
                        </dd>
                      </div>

                      <div>
                        <dt>Date</dt>
                        <dd>
                          {formatDate(
                            upload.createdAt
                          )}
                        </dd>
                      </div>
                    </dl>

                    {filePath && (
                      <a
                        href={getFileUrl(filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View File
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="invoice-pagination">
              <div className="invoice-page-size">
                <label htmlFor="upload-page-size">
                  Uploads:
                </label>

                <select
                  id="upload-page-size"
                  value={uploadPageSize}
                  onChange={(event) =>
                    setUploadPageSize(
                      Number(event.target.value)
                    )
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="invoice-page-status">
                Page {uploadPage} of{" "}
                {uploadTotalPages}
              </div>

              <div className="invoice-page-buttons">
                <button
                  type="button"
                  disabled={uploadPage === 1}
                  onClick={() =>
                    setUploadPage(
                      (currentPage) =>
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
                  disabled={
                    uploadPage ===
                    uploadTotalPages
                  }
                  onClick={() =>
                    setUploadPage(
                      (currentPage) =>
                        Math.min(
                          uploadTotalPages,
                          currentPage + 1
                        )
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <style>
        {`
          .upload-invoice-page {
            min-height: 100%;
          }

          .upload-invoice-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
          }

          .upload-invoice-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .upload-invoice-title h1 {
            margin: 0;
            color: #0f172a;
            font-size: 36px;
            line-height: 1.15;
          }

          .upload-invoice-header p {
            margin: 7px 0 0;
            color: #64748b;
            line-height: 1.5;
          }

          .upload-invoice-refresh {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-width: 120px;
            padding: 11px 15px;
            border: 0;
            border-radius: 9px;
            background: #16a34a;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .upload-invoice-refresh:disabled {
            opacity: 0.65;
            cursor: wait;
          }

          .warehouse-address-card,
          .invoice-upload-form-card,
          .invoice-records-card {
            margin-bottom: 20px;
            padding: 20px;
            border: 1px solid #dbe3ef;
            border-radius: 16px;
            background: #ffffff;
          }

          .warehouse-address-card {
            border-color: #bfdbfe;
            background:
              linear-gradient(
                135deg,
                #eff6ff,
                #ffffff
              );
          }

          .warehouse-address-heading {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 17px;
          }

          .warehouse-address-heading > div:first-child {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 43px;
            height: 43px;
            flex: 0 0 43px;
            border-radius: 11px;
            background: #0B3D91;
            color: #ffffff;
          }

          .warehouse-address-heading h2,
          .invoice-upload-form-heading h2,
          .invoice-records-heading h2 {
            margin: 0;
            color: #0f172a;
          }

          .warehouse-address-heading p,
          .invoice-upload-form-heading p,
          .invoice-records-heading p {
            margin: 5px 0 0;
            color: #64748b;
            font-size: 13px;
          }

          .warehouse-address-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 11px;
          }

          .warehouse-address-grid > div {
            min-width: 0;
            padding: 12px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.8);
          }

          .warehouse-address-grid span,
          .warehouse-address-grid strong {
            display: block;
          }

          .warehouse-address-grid span {
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .warehouse-address-grid strong {
            margin-top: 5px;
            color: #0f172a;
            overflow-wrap: anywhere;
          }

          .warehouse-address-notice {
            margin-top: 13px;
            padding: 11px 13px;
            border-left: 4px solid #F15A24;
            border-radius: 0 8px 8px 0;
            background: #fff7ed;
            color: #7c2d12;
            font-size: 13px;
            line-height: 1.5;
          }

          .upload-success-message {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 18px;
            padding: 13px 15px;
            border: 1px solid #bbf7d0;
            border-radius: 11px;
            background: #f0fdf4;
            color: #166534;
            font-weight: 800;
          }

          .upload-error-message {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 18px;
            padding: 13px 15px;
            border: 1px solid #fecaca;
            border-radius: 11px;
            background: #fef2f2;
            color: #991b1b;
          }

          .upload-error-message div {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .upload-error-message button {
            padding: 9px 14px;
            border: 0;
            border-radius: 8px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .upload-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }

          .upload-summary-grid > div {
            position: relative;
            min-width: 0;
            min-height: 115px;
            padding: 17px;
            border: 1px solid #dbe3ef;
            border-radius: 14px;
          }

          .upload-summary-icon {
            position: absolute;
            top: 14px;
            right: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 10px;
          }

          .upload-summary-grid strong,
          .upload-summary-grid span {
            display: block;
          }

          .upload-summary-grid > div > strong {
            margin-top: 8px;
            font-size: 27px;
          }

          .upload-summary-grid > div > span {
            margin-top: 10px;
            color: #334155;
            font-weight: 800;
          }

          .invoice-upload-form-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 17px;
          }

          .preselected-package {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 11px;
            border-radius: 999px;
            background: #dcfce7;
            color: #166534;
            font-size: 12px;
            font-weight: 900;
          }

          .invoice-upload-form-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .invoice-upload-full {
            grid-column: span 2;
          }

          .invoice-upload-field label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 7px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 900;
          }

          .invoice-upload-field label span {
            color: #64748b;
            font-size: 10px;
            text-transform: uppercase;
          }

          .invoice-upload-field input,
          .invoice-upload-field select,
          .invoice-upload-field textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            background: #ffffff;
            box-sizing: border-box;
          }

          .invoice-upload-field textarea {
            min-height: 105px;
            resize: vertical;
          }

          .invoice-upload-field input:focus,
          .invoice-upload-field select:focus,
          .invoice-upload-field textarea:focus {
            border-color: #0B3D91;
            outline: 3px solid
              rgba(11, 61, 145, 0.1);
          }

          .selected-package-details,
          .selected-invoice-file {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 13px;
            padding: 11px 13px;
            border-radius: 10px;
          }

          .selected-package-details {
            border: 1px solid #bfdbfe;
            background: #eff6ff;
            color: #1e40af;
          }

          .selected-invoice-file {
            border: 1px solid #bbf7d0;
            background: #f0fdf4;
            color: #166534;
          }

          .selected-package-details strong,
          .selected-package-details span,
          .selected-invoice-file strong,
          .selected-invoice-file span {
            display: block;
          }

          .selected-package-details span,
          .selected-invoice-file span {
            margin-top: 3px;
            font-size: 12px;
            overflow-wrap: anywhere;
          }

          .invoice-upload-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-width: 190px;
            margin-top: 15px;
            padding: 12px 16px;
            border: 0;
            border-radius: 10px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 900;
            cursor: pointer;
          }

          .invoice-upload-button:disabled {
            background: #94a3b8;
            cursor: wait;
          }

          .invoice-records-heading {
            margin-bottom: 14px;
          }

          .invoice-records-search {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 15px;
            padding: 0 13px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            color: #64748b;
          }

          .invoice-records-search:focus-within {
            border-color: #0B3D91;
            box-shadow:
              0 0 0 3px rgba(11, 61, 145, 0.1);
          }

          .invoice-records-search input {
            width: 100%;
            padding: 12px 0;
            border: 0;
            outline: 0;
            background: transparent;
          }

          .invoice-desktop-table {
            overflow-x: auto;
            border: 1px solid #dbe3ef;
            border-radius: 11px;
          }

          .invoice-desktop-table table {
            width: 100%;
            min-width: 840px;
            border-collapse: collapse;
          }

          .invoice-desktop-table th,
          .invoice-desktop-table td {
            padding: 11px;
            border-right: 1px solid #dbe3ef;
            border-bottom: 1px solid #dbe3ef;
            text-align: left;
          }

          .invoice-desktop-table th:last-child,
          .invoice-desktop-table td:last-child {
            border-right: 0;
          }

          .invoice-desktop-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .invoice-desktop-table th {
            background: #eef4ff;
            color: #0B3D91;
            font-size: 12px;
            white-space: nowrap;
          }

          .invoice-desktop-table td {
            color: #334155;
            font-size: 13px;
          }

          .invoice-desktop-table a,
          .invoice-mobile-card > a {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: #0B3D91;
            font-weight: 900;
            text-decoration: none;
          }

          .package-status-badge,
          .invoice-state,
          .upload-history-status {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
          }

          .invoice-state.uploaded {
            background: #dcfce7;
            color: #166534;
          }

          .invoice-state.pending {
            background: #fff7ed;
            color: #9a3412;
          }

          .upload-history-status {
            background: #eef4ff;
            color: #0B3D91;
          }

          .invoice-mobile-list {
            display: none;
          }

          .invoice-empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 9px;
            min-height: 150px;
            color: #64748b;
            text-align: center;
          }

          .invoice-empty-state strong {
            color: #0f172a;
          }

          .upload-loading-icon {
            animation: upload-invoice-spin 1s
              linear infinite;
          }

          @keyframes upload-invoice-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .invoice-pagination {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 16px;
            margin-top: 17px;
            padding-top: 13px;
            border-top: 1px solid #dbe3ef;
          }

          .invoice-page-size {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .invoice-page-size label {
            color: #64748b;
            font-size: 13px;
            font-weight: 800;
          }

          .invoice-page-size select {
            padding: 9px 28px 9px 10px;
            border: 1px solid #dbe3ef;
            border-radius: 9px;
            background: #ffffff;
          }

          .invoice-page-status {
            color: #334155;
            font-size: 13px;
            font-weight: 800;
            text-align: center;
          }

          .invoice-page-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          .invoice-page-buttons button {
            min-width: 82px;
            padding: 9px 13px;
            border: 0;
            border-radius: 9px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .invoice-page-buttons button:disabled {
            background: #e2e8f0;
            color: #64748b;
            cursor: not-allowed;
          }

          @media (max-width: 1000px) {
            .warehouse-address-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .upload-summary-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 768px) {
            .upload-invoice-header {
              flex-direction: column;
            }

            .upload-invoice-title {
              align-items: flex-start;
            }

            .upload-invoice-title h1 {
              font-size: 30px;
            }

            .upload-invoice-refresh {
              width: 100%;
            }

            .invoice-upload-form-grid {
              grid-template-columns: 1fr;
            }

            .invoice-upload-full {
              grid-column: span 1;
            }

            .invoice-desktop-table {
              display: none;
            }

            .invoice-mobile-list {
              display: grid;
              gap: 12px;
            }

            .invoice-mobile-card {
              padding: 14px;
              border: 1px solid #dbe3ef;
              border-radius: 12px;
              background: #ffffff;
            }

            .invoice-mobile-top {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 10px;
              margin-bottom: 13px;
            }

            .invoice-mobile-top > strong {
              color: #0B3D91;
              overflow-wrap: anywhere;
            }

            .invoice-mobile-card dl {
              display: grid;
              gap: 9px;
              margin: 0 0 13px;
            }

            .invoice-mobile-card dl > div {
              display: grid;
              grid-template-columns: 90px 1fr;
              gap: 10px;
            }

            .invoice-mobile-card dt {
              color: #64748b;
              font-size: 12px;
            }

            .invoice-mobile-card dd {
              margin: 0;
              color: #0f172a;
              overflow-wrap: anywhere;
            }

            .invoice-pagination {
              grid-template-columns: 1fr;
            }

            .invoice-page-size,
            .invoice-page-buttons {
              justify-content: center;
            }

            .invoice-page-buttons button {
              flex: 1;
            }

            .upload-error-message {
              align-items: stretch;
              flex-direction: column;
            }
          }

          @media (max-width: 520px) {
            .warehouse-address-grid,
            .upload-summary-grid {
              grid-template-columns: 1fr;
            }

            .invoice-upload-form-heading {
              flex-direction: column;
            }

            .invoice-upload-button {
              width: 100%;
            }

            .invoice-page-buttons {
              flex-direction: column;
            }

            .invoice-page-buttons button {
              width: 100%;
            }
          }

          @media (max-width: 420px) {
            .upload-invoice-title h1 {
              font-size: 27px;
            }

            .warehouse-address-card,
            .invoice-upload-form-card,
            .invoice-records-card {
              padding: 15px;
            }

            .invoice-mobile-top {
              flex-direction: column;
            }
          }
        `}
      </style>
    </div>
  );
}

export default UploadInvoice;