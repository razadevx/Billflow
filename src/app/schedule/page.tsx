import { PageHeader } from "@/components/shared/PageHeader";

export default function SchedulePage() {
  return (
    <div>
      <PageHeader title="Daily Schedule" description="View and manage daily tasks." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Schedule module will go here.</p>
      </div>
    </div>
  );
}
