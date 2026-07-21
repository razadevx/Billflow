import CustomerStatementClient from "./CustomerStatementClient";
import { Suspense } from "react";

export default async function CustomerStatementPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  return (
    <Suspense fallback={<div className="p-8">Loading statement...</div>}>
      <CustomerStatementClient customerId={customerId} />
    </Suspense>
  );
}
