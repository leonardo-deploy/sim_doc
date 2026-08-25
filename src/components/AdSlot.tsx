import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  placement: "left" | "right" | "inline";
  className?: string;
}

const slotByPlacement = {
  left: import.meta.env.VITE_ADSENSE_LEFT_SLOT,
  right: import.meta.env.VITE_ADSENSE_RIGHT_SLOT,
  inline: import.meta.env.VITE_ADSENSE_INLINE_SLOT,
};

export function AdSlot({ placement, className = "" }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const slot = slotByPlacement[placement] as string | undefined;
  const [consented, setConsented] = useState(
    () => localStorage.getItem("converge-ad-consent") === "accepted",
  );
  const isReady = Boolean(client && slot && consented);
  const label = useMemo(
    () => (placement === "inline" ? "Anúncio horizontal" : "Anúncio lateral"),
    [placement],
  );

  useEffect(() => {
    const updateConsent = () => {
      setConsented(localStorage.getItem("converge-ad-consent") === "accepted");
    };
    window.addEventListener("ads-consent-updated", updateConsent);
    return () => window.removeEventListener("ads-consent-updated", updateConsent);
  }, []);

  useEffect(() => {
    if (!isReady || !client) return;

    const scriptId = "converge-adsense-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(script);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // O AdSense tenta novamente quando o script termina de carregar.
    }
  }, [client, isReady]);

  return (
    <aside className={`ad-slot ad-slot-${placement} ${className}`.trim()} aria-label={label}>
      <span className="ad-label">Publicidade</span>
      {isReady ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-placeholder" aria-hidden="true">
          <span>Espaço publicitário</span>
          <small>{placement === "inline" ? "responsivo" : "160 × 600"}</small>
        </div>
      )}
    </aside>
  );
}
