import { Cookie, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const adsConfigured = Boolean(import.meta.env.VITE_ADSENSE_CLIENT);
  const [visible, setVisible] = useState(
    () => adsConfigured && !localStorage.getItem("converge-ad-consent"),
  );

  if (!visible) return null;

  const choose = (choice: "accepted" | "rejected") => {
    localStorage.setItem("converge-ad-consent", choice);
    window.dispatchEvent(new Event("ads-consent-updated"));
    setVisible(false);
  };

  return (
    <section className="cookie-banner" aria-label="Preferências de privacidade">
      <button className="cookie-close" type="button" onClick={() => choose("rejected")} aria-label="Recusar e fechar">
        <X size={18} />
      </button>
      <div className="cookie-icon"><Cookie size={22} /></div>
      <div>
        <strong>Você controla sua privacidade</strong>
        <p>
          Os arquivos nunca saem do seu dispositivo. Com sua permissão, anúncios podem
          usar cookies. <Link to="/privacidade">Saiba mais</Link>.
        </p>
      </div>
      <div className="cookie-actions">
        <button className="button button-ghost button-small" type="button" onClick={() => choose("rejected")}>
          Recusar
        </button>
        <button className="button button-primary button-small" type="button" onClick={() => choose("accepted")}>
          Aceitar
        </button>
      </div>
    </section>
  );
}
