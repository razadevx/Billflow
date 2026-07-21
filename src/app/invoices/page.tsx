import { PageHeader } from "@/components/shared/PageHeader";

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader title="Invoices" description="Generate and manage invoices." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Invoices module will go here.</p>
      </div>
    </div>
  );
}
