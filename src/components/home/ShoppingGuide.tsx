import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WhatsAppCTA } from "../common/WhatsAppCTA";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function ShoppingGuide() {
  const commerce = useStoreConfigStore((state) => state.config.commerce);
  return <section className="shopping-guide" id="como-comprar"><div className="container">
    <header className="model-collection-heading"><div><span className="eyebrow">HECHO PARA TU JORNADA</span><h2>Tu profesión.<br />Tu forma de vestir.</h2></div><p>Encuentra el modelo que te acompaña, elige tu color y construye tu pedido.</p></header>
    <div className="shopping-guide-steps">
      <article><span>01</span><h3>Elige tu modelo</h3><p>Una colección para explorar por diseño. Dentro de cada modelo encontrarás sus colores disponibles.</p><Link to="/catalogo">Descubrir colección <ArrowUpRight size={16} /></Link></article>
      <article><span>02</span><h3>Encuentra tu talla</h3><p>Extiende una prenda que te quede bien y mide su ancho en plano. Compárala con la guía del modelo antes de elegir.</p></article>
      <article><span>03</span><h3>Completa tu pedido</h3><p>Revisa tu selección y comparte tus datos. FLOES verifica el pago antes de pasar tu pedido a preparación.</p>{commerce.shippingEnabled && commerce.shippingText && <p>{commerce.shippingText}</p>}<WhatsAppCTA className="shopping-guide-contact" label="Te acompañamos" /></article>
    </div>
  </div></section>;
}
