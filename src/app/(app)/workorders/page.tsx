import { PageHeader } from "@/components/shared/PageHeader";
import WorkOrderClient from "./WorkOrderClient";

export default function WorkOrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader title="Work Orders" description="Manage printing jobs and orders." />
      <WorkOrderClient />
    </div>
  );
}
