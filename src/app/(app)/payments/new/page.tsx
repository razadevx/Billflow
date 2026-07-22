import ReceivePaymentClient from "./ReceivePaymentClient";

export default async function ReceivePaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; invoiceId?: string; workOrderId?: string; amount?: string }>;
}) {
  const params = await searchParams;

  return (
    <ReceivePaymentClient
      initialCustomerId={params.customerId || ""}
      initialInvoiceId={params.invoiceId || ""}
      initialWorkOrderId={params.workOrderId || ""}
      initialAmount={params.amount || ""}
    />
  );
}
