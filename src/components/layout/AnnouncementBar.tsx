import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function AnnouncementBar() {
  const a = useStoreConfigStore((s) => s.config.announcement);

  if (!a.enabled || !a.text.trim()) return null;

  return (
    <div className="announcement-bar">
      <div className="container">
        <span>
  {a.text}
  <span className="usa-flag usa-flag-small" aria-label="Estados Unidos" />
</span>
        {a.href && a.linkText && (
          <Link to={a.href}>{a.linkText}</Link>
        )}
      </div>
    </div>
  );
}