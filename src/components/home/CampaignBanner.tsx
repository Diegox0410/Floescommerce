import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function CampaignBanner() {
  const campaign = useStoreConfigStore((state) => state.config.home.campaign);
  if (!campaign.enabled) return null;

  return (
    <section className="campaign-banner" aria-labelledby="campaign-title">
      <div className="container campaign-banner-inner">
        {campaign.image && <img src={campaign.image} alt="" loading="lazy" decoding="async" data-scroll-item="campaign-image" />}
        <div data-scroll-item="campaign-copy">
          <span className="eyebrow">{campaign.eyebrow}</span>
          <h2 id="campaign-title">{campaign.title}</h2>
          <p>{campaign.description}</p>
          {campaign.buttonHref && campaign.buttonLabel && <Link to={campaign.buttonHref}>{campaign.buttonLabel}</Link>}
        </div>
      </div>
    </section>
  );
}
