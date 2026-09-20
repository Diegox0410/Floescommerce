import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";
export function CampaignBanner() { const c = useStoreConfigStore((s) => s.config.home.campaign); if (!c.enabled) return null; return <section className="campaign-banner"><div className="container campaign-banner-inner">{c.image && <img src={c.image} alt=""/>}<div><span className="eyebrow">{c.eyebrow}</span><h2>{c.title}</h2><p>{c.description}</p>{c.buttonHref && c.buttonLabel && <Link to={c.buttonHref}>{c.buttonLabel}</Link>}</div></div></section> }
