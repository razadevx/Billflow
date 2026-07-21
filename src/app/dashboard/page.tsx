import { PageHeader } from "@/components/shared/PageHeader";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your business." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Dashboard content will go here.</p>
      </div>
    </div>
  );
}
