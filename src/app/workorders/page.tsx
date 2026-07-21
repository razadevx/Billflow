import { PageHeader } from "@/components/shared/PageHeader";

export default function WorkOrdersPage() {
  return (
    <div>
      <PageHeader title="Work Orders" description="Manage printing jobs and orders." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Work Orders module will go here.</p>
      </div>
    </div>
  );
}
