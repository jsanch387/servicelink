/**
 * Runs while the public booking-link HTML is parsed so the first paint is
 * already pinned to the top (before React hydrates and images decode).
 */
export function PublicProfileLandingScrollReset() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          '(function(){if(location.hash)return;try{history.scrollRestoration="manual"}catch(e){}scrollTo(0,0);var d=document.documentElement;if(d)d.scrollTop=0;if(document.body)document.body.scrollTop=0;})();',
      }}
    />
  );
}
