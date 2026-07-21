import { PageHeader } from "@/components/shared/PageHeader";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="View business analytics and reports." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Reports module will go here.</p>
      </div>
    </div>
  );
}
