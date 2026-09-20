import { Music2 } from "lucide-react";
import {
  FaFacebookF as Facebook,
  FaInstagram as Instagram,
} from "react-icons/fa";

import { useStoreConfigStore } from "../../store/storeConfigStore";
import { safeExternalUrl } from "../../utils/storefront";

export function SocialSection() {
  const social = useStoreConfigStore((s) => s.config.social);

  const links = [
    { key: "instagram", label: "Instagram", Icon: Instagram },
    { key: "facebook", label: "Facebook", Icon: Facebook },
    { key: "tiktok", label: "TikTok", Icon: Music2 },
  ] as const;

  const visible = links.filter(
    ({ key }) =>
      social[key].enabled &&
      safeExternalUrl(social[key].url)
  );

  if (!visible.length) return null;

  return (
    <section className="social-section dgng-social">
      <div className="container dgng-social-layout">

        <header className="dgng-social-header">
          <span className="eyebrow">CONECTA CON DGNG</span>

          <h2>Síguenos</h2>

          <p>
            Descubre novedades, productos y contenido de DGNG Store.
          </p>
        </header>

        <div className="dgng-social-grid">
          {visible.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={safeExternalUrl(social[key].url)}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
            >
              <div className="dgng-social-icon">
                <Icon />
              </div>

              <div>
                <small>{label}</small>
                <strong>{social[key].handle || label}</strong>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}