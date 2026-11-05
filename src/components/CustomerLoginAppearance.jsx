import { useEffect, useState } from "react";
import api from "../api";

export default function CustomerLoginAppearance({ children }) {
  const [appearance, setAppearance] = useState(null);
  const [failedImage, setFailedImage] = useState("");

  useEffect(() => {
    let stopped = false;
    let timer;
    let controller;
    let generation = 0;

    const refresh = async () => {
      const requestId = ++generation;

      clearTimeout(timer);
      controller?.abort();
      controller = new AbortController();

      let delay = 30000;

      try {
        const url = new URL(
          "/api/settings/login-appearance/public/customer",
          api.defaults.baseURL || window.location.origin
        );

        // Branding is public; do not send the customer's stored token.
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Appearance unavailable.");

        const result = await response.json();
        const data = result?.data;

        if (!result?.success || !data) {
          throw new Error("Appearance unavailable.");
        }

        if (stopped || requestId !== generation) return;

        if (data.nextChangeAt && data.serverTime) {
          const remaining =
            Date.parse(data.nextChangeAt) - Date.parse(data.serverTime);

          if (Number.isFinite(remaining) && remaining > 0) {
            delay = Math.min(30000, Math.max(500, remaining + 100));
          }
        }

        setAppearance(
          data.active && data.appearance?.wallpaperUrl
            ? {
                ...data.appearance,
                companyName: data.companyName || "Eltham Konnect",
              }
            : null
        );
      } catch {
        if (!stopped && requestId === generation) {
          setAppearance(null);
        }
      } finally {
        if (!stopped && requestId === generation) {
          timer = window.setTimeout(refresh, delay);
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      generation += 1;
      clearTimeout(timer);
      controller?.abort();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const imageUrl = appearance?.wallpaperUrl || "";
  const showImage = Boolean(imageUrl) && failedImage !== imageUrl;

  const overlay = Math.min(
    0.85,
    Math.max(0, Number(appearance?.overlayOpacity) || 0)
  );

  return (
    <div
      className={`ek-login-page ${
        appearance ? "ek-customer-season" : ""
      }`}
    >
      <style>{`
        .ek-customer-season {
          position:relative;
          isolation:isolate;
          display:flex;
          flex-direction:column;
          min-height:100vh;
          min-height:100svh;
          background:#10254a;
        }

        .ek-customer-wallpaper {
          position:fixed;
          inset:0;
          z-index:-2;
          pointer-events:none;
        }

        .ek-customer-wallpaper img {
          display:block;
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .ek-customer-wallpaper-shade {
          position:absolute;
          inset:0;
        }

        .ek-customer-season-header {
          display:flex;
          align-items:center;
          gap:12px;
          padding:28px 36px;
          margin-bottom:auto;
          color:#fff;
          text-shadow:0 2px 8px rgba(0,0,0,.8);
        }

        .ek-customer-season-header img {
          width:48px;
          height:48px;
          object-fit:contain;
        }

        .ek-customer-season-header strong {
          display:block;
          font-size:24px;
          line-height:1.2;
        }

        .ek-customer-season-header span {
          display:block;
          font-size:13px;
          margin-top:4px;
        }

        .ek-customer-season-announcement {
          width:calc(100% - 96px);
          max-width:320px;
          margin:24px 48px 16px auto;
          padding:18px;
          border:1px solid rgba(255,255,255,.25);
          border-radius:16px;
          background:rgba(8,25,52,.65);
          color:#fff;
          overflow-wrap:anywhere;
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
        }

        .ek-customer-season-announcement h1 {
          color:#fff;
          font-size:25px;
          margin:0 0 10px;
        }

        .ek-customer-season-announcement p {
          margin:0;
          font-size:15px;
          line-height:1.6;
          white-space:pre-wrap;
        }

        .ek-customer-season .ek-login-mobile-header,
        .ek-customer-season .ek-login-brand-panel,
        .ek-customer-season .ek-login-mobile-hero {
          display:none;
        }

        .ek-customer-season .ek-login-shell {
          display:block;
          width:100%;
          min-height:0;
          background:transparent;
        }

        .ek-customer-season .ek-login-form-panel {
          display:flex;
          justify-content:flex-end;
          align-items:flex-end;
          padding:0 48px 40px;
          background:transparent;
        }

        .ek-customer-season .ek-login-form-card {
          width:100%;
          max-width:320px;
          padding:18px;
          border:1px solid rgba(255,255,255,.65);
          border-radius:16px;
          background:rgba(255,255,255,.86);
          color:#0f172a;
          box-shadow:0 12px 36px rgba(0,0,0,.2);
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
        }

        .ek-customer-season .ek-login-form-header {
          margin-bottom:14px;
        }

        .ek-customer-season .ek-login-form-title {
          font-size:22px;
          color:#0f172a;
        }

        .ek-customer-season .ek-login-form-logo,
        .ek-customer-season .ek-login-form-subtitle,
        .ek-customer-season .ek-login-quick-points,
        .ek-customer-season .ek-login-helper-box {
          display:none;
        }

        .ek-customer-season .ek-login-form-group {
          margin-bottom:12px;
        }

        .ek-customer-season .ek-login-label {
          font-size:13px;
          margin-bottom:5px;
          color:#0f172a;
        }

        .ek-customer-season .ek-login-input {
          width:100%;
          min-width:0;
          min-height:44px;
          padding:10px;
          box-sizing:border-box;
          font-size:16px;
          border-radius:9px;
          background:#fff;
          color:#0f172a;
        }

        .ek-customer-season .ek-login-password-input {
          width:0;
          flex:1;
        }

        .ek-customer-season .ek-login-password-toggle {
          min-height:44px;
          padding:0 10px;
          color:#0f172a;
        }

        .ek-customer-season .ek-login-button,
        .ek-customer-season .ek-login-secondary-button {
          min-height:44px;
          font-size:14px;
        }

        .ek-customer-season .ek-login-button {
          padding:10px;
        }

        .ek-customer-season .ek-login-footer-text {
          margin:14px 0 0;
          font-size:13px;
          color:#334155;
        }

        .ek-customer-season .ek-login-footer-text a {
          color:#0b3d91;
          font-weight:bold;
          text-decoration:underline;
        }

        @media(max-width:760px) {
          .ek-customer-season-header {
            padding:24px 22px;
            min-height:100px;
          }

          .ek-customer-season-header strong {
            font-size:22px;
          }

          .ek-customer-season .ek-login-shell {
            margin-top:0;
          }

          .ek-customer-season .ek-login-form-panel {
            justify-content:center;
            padding:0 16px 18px;
          }

          .ek-customer-season .ek-login-form-card {
            max-width:320px;
            padding:16px;
          }

          .ek-customer-season-header {
            padding-bottom:140px;
          }

          .ek-customer-season-announcement {
            width:calc(100% - 32px);
            max-width:320px;
            margin:0 auto 16px;
          }
        }
      `}</style>

      {showImage && (
        <div className="ek-customer-wallpaper" aria-hidden="true">
          <img
            src={imageUrl}
            alt=""
            style={{
              objectPosition: appearance.position || "center",
            }}
            onError={() => setFailedImage(imageUrl)}
          />

          <div
            className="ek-customer-wallpaper-shade"
            style={{
              background: `rgba(0,0,0,${overlay})`,
            }}
          />
        </div>
      )}

      {appearance && (
        <header className="ek-customer-season-header">
          <img src="/ek-logo.png" alt="" />

          <div>
            <strong>{appearance.companyName}</strong>
            <span>Customer Portal</span>
          </div>
        </header>
      )}

      {appearance && (appearance.heading || appearance.message) && (
        <section
          className="ek-customer-season-announcement"
          aria-label="Customer announcement"
        >
          {appearance.heading && <h1>{appearance.heading}</h1>}
          {appearance.message && <p>{appearance.message}</p>}
        </section>
      )}

      {children}
    </div>
  );
}