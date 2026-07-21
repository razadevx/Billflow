import { PageHeader } from "@/components/shared/PageHeader";

export default function KhataPage() {
  return (
    <div>
      <PageHeader title="Khata Ledger" description="Manage payments and balances." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Khata Ledger module will go here.</p>
      </div>
    </div>
  );
}
