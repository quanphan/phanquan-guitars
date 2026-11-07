import { useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  attachFacebookPlayer,
  detachFacebookPlayer,
  facebookPlayerIsMuted,
  unmuteFacebookPlayer,
} from "../../services/facebookPlayerPool.js";

export default function GalleryFacebookPlayer({ href, embedSrc, title }) {
  const { t } = useLanguage();
  const slotRef = useRef(null);
  const [useIframe, setUseIframe] = useState(!href);
  const [needsUnmute, setNeedsUnmute] = useState(false);

  useLayoutEffect(() => {
    if (!href) {
      setUseIframe(Boolean(embedSrc));
      return undefined;
    }

    function tryAttach() {
      if (!slotRef.current) return false;
      if (!attachFacebookPlayer(href, slotRef.current)) return false;
      setUseIframe(false);
      setNeedsUnmute(facebookPlayerIsMuted(href));
      return true;
    }

    if (tryAttach()) {
      return () => detachFacebookPlayer(href);
    }

    setUseIframe(true);
    const timer = window.setInterval(() => {
      if (tryAttach()) window.clearInterval(timer);
    }, 250);
    return () => {
      window.clearInterval(timer);
      detachFacebookPlayer(href);
    };
  }, [embedSrc, href]);

  function unmute() {
    const ok = unmuteFacebookPlayer(href);
    setNeedsUnmute(!ok || facebookPlayerIsMuted(href));
  }

  return (
    <div className="relative isolate aspect-video w-full max-h-[min(80vh,calc(100vh-9rem))] overflow-hidden bg-ink">
      <div ref={slotRef} className={`absolute inset-0 z-0 h-full w-full ${useIframe ? "hidden" : ""}`} />
      {useIframe && embedSrc ? (
        <iframe
          src={embedSrc}
          title={title}
          className="absolute inset-0 z-0 h-full w-full"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          scrolling="no"
          referrerPolicy="origin-when-cross-origin"
        />
      ) : null}
      {needsUnmute ? (
        <button
          type="button"
          onClick={unmute}
          className="absolute inset-0 z-20 flex items-center justify-center [transform:translate3d(0,0,1px)]"
          aria-label={t("gallery.video.unmute")}
        >
          <span className="flex size-16 items-center justify-center rounded-full border border-gold bg-charcoal text-gold">
            <svg viewBox="0 0 24 24" className="size-7 fill-current" aria-hidden="true">
              <path d="M4 9v6h3l5 4V5L7 9H4zm11.5 3a3.5 3.5 0 0 0-1.8-3.1v6.2A3.5 3.5 0 0 0 15.5 12zm-1.8-7.2v1.8A5.5 5.5 0 0 1 18.5 12a5.5 5.5 0 0 1-4.8 5.4v1.8A7.3 7.3 0 0 0 20.5 12a7.3 7.3 0 0 0-6.8-7.2z" />
            </svg>
          </span>
        </button>
      ) : null}
    </div>
  );
}
