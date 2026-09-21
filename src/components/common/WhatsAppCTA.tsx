import { MessageCircle } from "lucide-react";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { whatsappUrl } from "../../utils/storefront";

interface WhatsAppCTAProps {
  productName?: string;
  message?: string;
  className?: string;
  label?: string;
}

export function WhatsAppCTA({
  productName,
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
      ? `🛍️✨ ¡Hola, FLOES.ec! Vi el producto "${productName}" en su tienda online y me gustaría recibir más información sobre disponibilidad y compra. 💜 ¿Me pueden ayudar, por favor? 😊`
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
