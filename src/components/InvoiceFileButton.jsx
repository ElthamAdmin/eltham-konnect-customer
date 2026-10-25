import { useState } from "react";
import api from "../api";

export default function InvoiceFileButton({
  uploadNumber,
  staff = false,
}) {
  const [opening, setOpening] = useState(false);

  const openInvoice = async () => {
    if (opening || !uploadNumber) return;

    /*
     * Open the tab during the click, before awaiting the request.
     * This avoids most browser popup blocking.
     */
    const fileWindow = window.open("about:blank", "_blank");

    if (!fileWindow) {
      alert("Please allow popups for this site to open your invoice.");
      return;
    }

    fileWindow.opener = null;
    fileWindow.document.title = "Opening invoice";
    fileWindow.document.body.textContent = "Opening invoice…";

    setOpening(true);

    try {
      const route = staff
        ? "/api/customer-invoices/staff/files/"
        : "/api/customer-invoices/files/";

      const response = await api.get(
        `${route}${encodeURIComponent(uploadNumber)}`,
        { responseType: "blob" }
      );

      const objectUrl = URL.createObjectURL(response.data);

      if (fileWindow.closed) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      fileWindow.location.replace(objectUrl);

      const cleanup = window.setInterval(() => {
        if (fileWindow.closed) {
          URL.revokeObjectURL(objectUrl);
          window.clearInterval(cleanup);
        }
      }, 1000);
    } catch (error) {
      fileWindow.close();

      let message =
        "The invoice could not be opened. Please try again.";

      const responseData = error?.response?.data;

      if (responseData instanceof Blob) {
        try {
          const details = JSON.parse(await responseData.text());
          message = details.message || message;
        } catch {
          // Keep the fallback message.
        }
      } else {
        message = responseData?.message || message;
      }

      alert(message);
    } finally {
      setOpening(false);
    }
  };

  if (!uploadNumber) {
    return <span>File reference unavailable</span>;
  }

  return (
    <button
      type="button"
      onClick={openInvoice}
      disabled={opening}
      style={{
        border: 0,
        borderRadius: "8px",
        padding: "9px 13px",
        backgroundColor: "#0B3D91",
        color: "#ffffff",
        fontWeight: 700,
        cursor: opening ? "wait" : "pointer",
      }}
    >
      {opening ? "Opening…" : "Open Invoice"}
    </button>
  );
}