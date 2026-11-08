import { useRef, useState } from "react";
import api from "../api";

function PreAlertInvoiceButton({ preAlertNumber, staff = false }) {
  const inFlight = useRef(false);
  const [opening, setOpening] = useState(false);

  const openInvoice = async () => {
    if (inFlight.current) return;

    const preview = window.open("about:blank", "_blank");

    if (!preview) {
      window.alert("Please allow pop-ups to view the invoice.");
      return;
    }

    preview.opener = null;
    preview.document.title = "Opening invoice";
    preview.document.body.textContent = "Opening invoice…";

    inFlight.current = true;
    setOpening(true);

    let objectUrl;

    try {
      const section = staff ? "staff" : "my";

      const response = await api.get(
        `/api/pre-alerts/${section}/${encodeURIComponent(preAlertNumber)}/invoice`,
        { responseType: "blob" }
      );

      if (preview.closed) return;

      const mimeType = String(
        response.headers?.["content-type"] || response.data.type || ""
      )
        .split(";")[0]
        .trim()
        .toLowerCase();

      const supportedTypes = new Set([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);

      if (!supportedTypes.has(mimeType) || !response.data.size) {
        throw new Error("The server did not return a supported invoice file.");
      }

      objectUrl = URL.createObjectURL(
        new Blob([response.data], { type: mimeType })
      );

      preview.location.replace(objectUrl);

      const cleanup = window.setInterval(() => {
        if (preview.closed) {
          window.clearInterval(cleanup);
          URL.revokeObjectURL(objectUrl);
        }
      }, 1000);
    } catch (error) {
      if (!preview.closed) preview.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      let message =
        error.message || "Could not open the invoice. Please try again.";

      const responseData = error.response?.data;

      if (responseData instanceof Blob) {
        try {
          const details = JSON.parse(await responseData.text());
          message = details.message || message;
        } catch {
          message = "Could not open the invoice. Please try again.";
        }
      } else if (responseData?.message) {
        message = responseData.message;
      }

      window.alert(message);
    } finally {
      inFlight.current = false;
      setOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openInvoice}
      disabled={opening}
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        color: "#0B3D91",
        fontWeight: "bold",
        cursor: opening ? "wait" : "pointer",
        textAlign: "left",
      }}
    >
      {opening ? "Opening…" : "View Invoice"}
    </button>
  );
}

export default PreAlertInvoiceButton;