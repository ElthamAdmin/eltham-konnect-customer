import { useEffect, useMemo, useState } from "react";
import api from "../api";

function CustomerPortalBanner() {
  const [banners, setBanners] = useState([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchActiveBanners = async () => {
      try {
        const response = await api.get("/api/portal-banners/active");

        const bannerData = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        if (isMounted) {
          setBanners(bannerData);
        }
      } catch (error) {
        console.error("Error loading portal banners:", error);

        if (isMounted) {
          setBanners([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActiveBanners();

    const refreshInterval = window.setInterval(
      fetchActiveBanners,
      5 * 60 * 1000
    );

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const bannerItems = useMemo(
    () =>
      banners
        .filter((banner) => banner?.message)
        .map((banner) => ({
          id: banner._id || banner.bannerNumber || banner.message,
          message: banner.message,
          type: banner.type || "Information",
          linkUrl: banner.linkUrl || "",
          linkLabel: banner.linkLabel || "View Details",
        })),
    [banners]
  );

  if (loading || bannerItems.length === 0) {
    return null;
  }

  const renderBannerItems = (copyName) =>
    bannerItems.map((banner) => (
      <span
        className="customer-banner-item"
        key={`${copyName}-${banner.id}`}
      >
        <span
          className={`customer-banner-type customer-banner-type-${banner.type.toLowerCase()}`}
        >
          {banner.type}
        </span>

        <span className="customer-banner-message">
          {banner.message}
        </span>

        {banner.linkUrl && (
          <a
            className="customer-banner-link"
            href={banner.linkUrl}
            target={
              banner.linkUrl.startsWith("http") ? "_blank" : undefined
            }
            rel={
              banner.linkUrl.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
          >
            {banner.linkLabel}
          </a>
        )}

        <span className="customer-banner-separator" aria-hidden="true">
          •
        </span>
      </span>
    ));

  return (
    <section
      className="customer-portal-banner"
      aria-label="Important Eltham Konnect updates"
    >
      <div className="customer-banner-label">
        <span className="customer-banner-label-icon" aria-hidden="true">
          EK
        </span>

        <span>Updates</span>
      </div>

      <div className="customer-banner-window">
        <div
          className={`customer-banner-track ${
            paused ? "customer-banner-track-paused" : ""
          }`}
        >
          <div className="customer-banner-group">
            {renderBannerItems("first")}
          </div>

          <div className="customer-banner-group" aria-hidden="true">
            {renderBannerItems("second")}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="customer-banner-control"
        onClick={() => setPaused((current) => !current)}
        aria-label={paused ? "Resume banner updates" : "Pause banner updates"}
        title={paused ? "Resume updates" : "Pause updates"}
      >
        {paused ? "▶" : "Ⅱ"}
      </button>

      <style>
        {`
          .customer-portal-banner {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: stretch;
            width: 100%;
            min-height: 52px;
            margin-bottom: 20px;
            overflow: hidden;
            color: #ffffff;
            background: linear-gradient(90deg, #0b3d91, #1557b0);
            border: 1px solid rgba(11, 61, 145, 0.25);
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(11, 61, 145, 0.16);
          }

          .customer-banner-label {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 16px;
            color: #ffffff;
            background: #f15a24;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            white-space: nowrap;
          }

          .customer-banner-label-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            color: #0b3d91;
            background: #ffffff;
            font-size: 10px;
            font-weight: 900;
          }

          .customer-banner-window {
            display: flex;
            align-items: center;
            min-width: 0;
            overflow: hidden;
          }

          .customer-banner-track {
            display: flex;
            align-items: center;
            width: max-content;
            min-width: max-content;
            animation: customer-banner-scroll 28s linear infinite;
            will-change: transform;
          }

          .customer-banner-track-paused {
            animation-play-state: paused;
          }

          .customer-banner-group {
            display: flex;
            align-items: center;
            flex-shrink: 0;
            min-width: max-content;
          }

          .customer-banner-item {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding-left: 34px;
            white-space: nowrap;
          }

          .customer-banner-type {
            display: inline-flex;
            align-items: center;
            min-height: 24px;
            padding: 4px 9px;
            border-radius: 999px;
            color: #0b3d91;
            background: #ffffff;
            font-size: 11px;
            font-weight: 800;
          }

          .customer-banner-type-important {
            color: #7c2d12;
            background: #ffedd5;
          }

          .customer-banner-type-urgent {
            color: #ffffff;
            background: #dc2626;
          }

          .customer-banner-message {
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
          }

          .customer-banner-link {
            display: inline-flex;
            align-items: center;
            min-height: 32px;
            padding: 6px 11px;
            border: 1px solid rgba(255, 255, 255, 0.55);
            border-radius: 999px;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
          }

          .customer-banner-link:hover,
          .customer-banner-link:focus-visible {
            color: #0b3d91;
            background: #ffffff;
            outline: none;
          }

          .customer-banner-separator {
            margin-left: 14px;
            color: #fbbf24;
            font-size: 20px;
          }

          .customer-banner-control {
            position: relative;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 52px;
            min-height: 52px;
            border: 0;
            border-left: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 0;
            color: #ffffff;
            background: #0b3d91;
            font-size: 15px;
            font-weight: 900;
            cursor: pointer;
          }

          .customer-banner-control:hover,
          .customer-banner-control:focus-visible {
            background: #f15a24;
            outline: 3px solid rgba(241, 90, 36, 0.25);
            outline-offset: -3px;
          }

          @keyframes customer-banner-scroll {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-50%);
            }
          }

          @media (max-width: 700px) {
            .customer-portal-banner {
              grid-template-columns: auto minmax(0, 1fr) 46px;
              min-height: 48px;
              margin-bottom: 16px;
              border-radius: 12px;
            }

            .customer-banner-label {
              padding: 0 10px;
              font-size: 0;
            }

            .customer-banner-label-icon {
              width: 27px;
              height: 27px;
              font-size: 9px;
            }

            .customer-banner-control {
              width: 46px;
              min-height: 48px;
            }

            .customer-banner-item {
              gap: 8px;
              padding-left: 22px;
            }

            .customer-banner-message {
              font-size: 13px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .customer-banner-window {
              overflow-x: auto;
            }

            .customer-banner-track {
              animation: none;
            }

            .customer-banner-group[aria-hidden="true"] {
              display: none;
            }
          }
        `}
      </style>
    </section>
  );
}

export default CustomerPortalBanner;