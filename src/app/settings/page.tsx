import { PageHeader } from "@/components/shared/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage application settings." />
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-lg">Settings module will go here.</p>
      </div>
    </div>
  );
}
