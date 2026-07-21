import { PageHeader } from "@/components/shared/PageHeader";

export default function InventoryPage() {
  return (
    <div>
      <PageHeader title="Inventory" description="Manage stock and raw materials." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Inventory module will go here.</p>
      </div>
    </div>
  );
}
