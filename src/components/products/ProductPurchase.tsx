import {
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";

import { useState } from "react";

import type { Product } from "../../types/product";

import { useCartStore } from "../../store/cartStore";

import { WhatsAppCTA } from "../common/WhatsAppCTA";

interface ProductPurchaseProps {
  product: Product;
}

export function ProductPurchase({
  product,
}: ProductPurchaseProps) {
  const [quantity, setQuantity] =
    useState(1);

  const addItem = useCartStore(
    (state) => state.addItem,
  );

  const decrease = () => {
    setQuantity((current) =>
      Math.max(
        1,
        current - 1,
      ),
    );
  };

  const increase = () => {
    setQuantity(
      (current) => current + 1,
    );
  };

  const handleAdd = () => {
    addItem(
      product,
      quantity,
    );
  };

  return (
    <div className="product-purchase">
      <div className="product-quantity">
        <span>Cantidad</span>

        <div className="product-quantity-control">
          <button
            type="button"
            onClick={decrease}
            aria-label="Disminuir cantidad"
            disabled={quantity <= 1}
          >
            <Minus size={16} />
          </button>

          <strong>
            {quantity}
          </strong>

          <button
            type="button"
            onClick={increase}
            aria-label="Aumentar cantidad"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="product-purchase-actions">
        <button
          className="product-main-add"
          type="button"
          onClick={handleAdd}
        >
          <ShoppingBag size={18} />

          Agregar al carrito
        </button>
      </div>

      <p className="product-purchase-note">
        Estás seleccionando{" "}
        {quantity} unidad
        {quantity !== 1
          ? "es"
          : ""}{" "}
        de {product.name}.
      </p>

      <WhatsAppCTA
        productName={product.name}
        className="product-whatsapp"
      />
    </div>
  );
}