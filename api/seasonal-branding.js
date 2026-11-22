const defaultIcons = {
  "180": "/icons/apple-touch-icon.png",
  "192": "/icons/icon-192.png",
  "512": "/icons/icon-512.png",
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const backend =
    process.env.VITE_API_URL ||
    "https://eltham-konnect-backend-c2sf.onrender.com";

  let icons = defaultIcons;

  try {
    const url = new URL("/api/settings/seasonal-branding/public", backend);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(`Backend returned ${response.status}`);

    const result = await response.json();
    const candidate = result.data?.campaign?.icons;

    if (
      result.success &&
      candidate &&
      ["180", "192", "512"].every((size) => {
        const value = candidate[size];
        return typeof value === "string" &&
          value.startsWith("https://res.cloudinary.com/");
      })
    ) {
      icons = candidate;
    }
  } catch (error) {
    console.warn("Using standard Eltham Konnect icons:", error.message);
  }

  if (req.query.view === "apple") {
    res.setHeader("Location", icons["180"]);
    return res.status(302).end();
  }

  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  return res.status(200).send(JSON.stringify({
    id: "/",
    name: "Eltham Konnect Customer Portal",
    short_name: "Eltham Konnect",
    start_url: "/",
    scope: "/",
    display: "standalone",
    icons: [
      { src: icons["192"], sizes: "192x192", type: "image/png" },
      { src: icons["512"], sizes: "512x512", type: "image/png" },
    ],
  }));
}