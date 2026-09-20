import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/global.css";
import "./styles/home.css";
import "./styles/products.css";
import "./styles/catalog.css";
import "./styles/product-detail.css";
import "./styles/cart.css";
import "./styles/search.css";
import "./styles/checkout.css";
import "./styles/not-found.css";
import "./styles/release.css";


createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <App />
  </StrictMode>
);
