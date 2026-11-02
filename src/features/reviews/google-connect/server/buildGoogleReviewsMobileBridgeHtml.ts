/**
 * Page Google's browser lands on after mobile connect.
 * Sends the person back into the app.
 */
export function buildGoogleReviewsMobileBridgeHtml(args: {
  deepLinkUrl: string;
  webFallbackUrl: string;
}): string {
  const deepLinkLiteral = JSON.stringify(args.deepLinkUrl);
  const webFallbackLiteral = JSON.stringify(args.webFallbackUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Returning to ServiceLink…</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: grid;
        place-items: center;
        min-height: 100vh;
        padding: 24px;
      }
      main { max-width: 560px; width: 100%; }
      h1 { margin: 0 0 10px; font-size: 1.2rem; }
      p { margin: 0 0 16px; line-height: 1.45; opacity: 0.9; }
      a {
        display: inline-block;
        padding: 10px 14px;
        border-radius: 10px;
        text-decoration: none;
        border: 1px solid rgba(127,127,127,0.35);
      }
      #fallback { display: none; margin-top: 14px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Returning to ServiceLink…</h1>
      <p>Google is finished. We are opening the app.</p>
      <div id="fallback">
        <a id="open-app" href=${deepLinkLiteral}>Open ServiceLink</a>
      </div>
    </main>
    <script>
      (function () {
        var deepLink = ${deepLinkLiteral};
        var webFallback = ${webFallbackLiteral};
        try { window.location.replace(deepLink); } catch (_) {}
        window.setTimeout(function () {
          var fallback = document.getElementById('fallback');
          if (fallback) fallback.style.display = 'block';
        }, 1200);
        window.setTimeout(function () {
          if (document.visibilityState === 'visible') {
            window.location.href = webFallback;
          }
        }, 3500);
      })();
    </script>
  </body>
</html>`;
}
