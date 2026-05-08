type BuildMobileConnectBridgeHtmlParams = {
  kind: 'return' | 'refresh';
  deepLinkUrl: string;
  webFallbackUrl: string;
};

/**
 * Small HTML bridge page for Stripe Connect return/refresh redirects.
 * Tries app deep link immediately, then shows manual actions as fallback.
 */
export function buildMobileConnectBridgeHtml({
  kind,
  deepLinkUrl,
  webFallbackUrl,
}: BuildMobileConnectBridgeHtmlParams): string {
  const title =
    kind === 'return'
      ? 'Returning to ServiceLink app…'
      : 'Refreshing Stripe onboarding in ServiceLink…';
  const deepLinkLiteral = JSON.stringify(deepLinkUrl);
  const webFallbackLiteral = JSON.stringify(webFallbackUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
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
      .row { display: flex; gap: 10px; flex-wrap: wrap; }
      a {
        display: inline-block;
        padding: 10px 14px;
        border-radius: 10px;
        text-decoration: none;
        border: 1px solid rgba(127,127,127,0.35);
      }
      #fallback { display: none; margin-top: 14px; }
      code {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(127,127,127,0.16);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>We are opening the ServiceLink app. If nothing happens, use the buttons below.</p>
      <div id="fallback">
        <div class="row">
          <a id="open-app" href=${deepLinkLiteral}>Open ServiceLink app</a>
          <a id="open-web" href=${webFallbackLiteral}>Open web payments page</a>
        </div>
        <p style="margin-top: 12px;">Deep link: <code id="deep-link-code"></code></p>
      </div>
    </main>
    <script>
      (function () {
        var deepLink = ${deepLinkLiteral};
        var webFallback = ${webFallbackLiteral};
        var code = document.getElementById('deep-link-code');
        if (code) code.textContent = deepLink;
        try {
          window.location.replace(deepLink);
        } catch (_) {}
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
