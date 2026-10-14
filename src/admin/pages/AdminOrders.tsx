import { ChopifyOperationsPanel } from "../components/ChopifyOperationsPanel";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { ChopifyOrderContext } from "../components/ChopifyOrderContext";

export function AdminOrders() {
  const { id } = useParams();
  const [version, setVersion] = useState(0);
  return <>{id && <ChopifyOrderContext key={`${id}:${version}`} orderId={id} />}<ChopifyOperationsPanel orderId={id} onChanged={() => setVersion((current) => current + 1)} /></>;
}
