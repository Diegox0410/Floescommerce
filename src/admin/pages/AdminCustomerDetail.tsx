import { useParams } from "react-router-dom";
import { ChopifyCustomerContext } from "../components/ChopifyCustomerContext";
export function AdminCustomerDetail() {
  const { id } = useParams();
  return id ? <ChopifyCustomerContext key={id} customerId={id} /> : <p role="alert">No se indicó el cliente.</p>;
}
