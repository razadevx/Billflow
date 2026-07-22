import { PageHeader } from "@/components/shared/PageHeader";
import CreateWorkOrderClient from "./CreateWorkOrderClient";

export default async function NewWorkOrderPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  const params = await searchParams;

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <CreateWorkOrderClient initialCustomerId={params.customerId || ""} />
    </div>
  );
}
