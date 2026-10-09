import { MessageCircle } from "lucide-react";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { whatsappUrl } from "../../utils/storefront";

interface WhatsAppCTAProps {
  productName?: string;
  color?: string;
  size?: string;
  message?: string;
  className?: string;
  label?: string;
}

export function WhatsAppCTA({
  productName,
  color,
  size,
  message,
  className = "",
  label = "Consultar por WhatsApp",
}: WhatsAppCTAProps) {
  const config =
    useStoreConfigStore(
      (state) => state.config,
    );

  if (
    !config.commerce
      .whatsappPurchaseEnabled
  ) {
    return null;
  }

  const resolvedMessage =
    message ||
    (productName
      ? `Hola, estoy interesada en ${productName}${color ? ` color ${color}` : ""}${size ? ` talla ${size}` : ""}.`
      : config.contact
          .whatsappMessage);

  const href =
    whatsappUrl(
      config.contact.whatsapp,
      resolvedMessage,
    );

  if (!href) {
    return null;
  }

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle size={18} />
      {label}
    </a>
  );
}
