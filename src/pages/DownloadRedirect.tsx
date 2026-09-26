import { useEffect } from "react";

// Solid white, otherwise-empty page whose only job is to immediately
// redirect to the Pi's verify-service, which validates the one-time
// download token and streams the installer .exe. Kept intentionally blank
// — no loading spinner, no branding — per the download flow's design: the
// visible link is this site's own domain, but nothing about the page
// itself should be memorable or need explaining.
//
// Rendered outside the normal site chrome (see the isDownloadRoute check
// in App.tsx, same pattern as the /admin-login popup route) so the site's
// dark theme, nav, and footer never flash before the redirect fires.
export default function DownloadRedirect() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const base = import.meta.env.VITE_VERIFY_SERVICE_URL || "https://gtecofficials.tailde4962.ts.net";
    const target = token ? `${base}/download/file?token=${encodeURIComponent(token)}` : base;
    window.location.replace(target);
  }, []);

  return <div style={{ background: "#ffffff", minHeight: "100vh" }} />;
}
