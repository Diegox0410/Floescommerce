import { executeCommerce } from "./_lib/chopify.js";
import { json, parseBody, type ApiRequest, type ApiResponse } from "./_lib/http.js";

const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
const validKey=(value:unknown)=>typeof value==="string"&&/^[A-Za-z0-9:_-]{16,160}$/.test(value);

/** Persists a clearly fictional receipt marker. This endpoint is sandbox-only and never accepts file or bank data. */
export default async function handler(request:ApiRequest,response:ApiResponse){
  if(request.method!=="POST")return json(response,405,{error:"Method not allowed"});
  if(!(process.env.FLOES_ENABLE_SYNTHETIC_TRANSFER==="true"&&(process.env.VERCEL_ENV==="preview"||process.env.NODE_ENV==="development")))return json(response,403,{error:"El comprobante sintético está deshabilitado fuera del sandbox local/Preview."});
  let body:Record<string,unknown>;try{body=parseBody(request.body)}catch{return json(response,400,{error:"JSON inválido."})}
  const orderId=clean(body.orderId,160),customerId=clean(body.customerId,160),idempotencyKey=body.idempotencyKey;
  if(!orderId||!customerId||body.confirmation!=="SYNTHETIC_TEST_RECEIPT"||!validKey(idempotencyKey))return json(response,400,{error:"Pedido, cliente, confirmación sintética e idempotencia son obligatorios."});
  try{
    const status=await executeCommerce("getOrderStatus",{orderId}) as Record<string,unknown>|undefined;
    const quote=status?.shippingQuote as Record<string,unknown>|undefined;
    if(status?.customerId!==customerId||status?.paymentMethod!=="MANUAL_TRANSFER_TEST"||quote?.status!=="ACCEPTED"||status.totalStatus!=="definitive")return json(response,409,{error:"El pedido debe tener transferencia de prueba y envío aceptado antes del comprobante."});
    const proof=await executeCommerce("attachPaymentProof",{orderId,customerId,externalReference:"COMPROBANTE-FICTICIO-SANDBOX",proofUrl:`sandbox-test://transfer/${encodeURIComponent(String(idempotencyKey))}`},{idempotencyKey:String(idempotencyKey)});
    return json(response,201,{ok:true,proof});
  }catch(error){return json(response,409,{error:error instanceof Error?error.message:"No se pudo registrar el comprobante ficticio."})}
}
