import { PageHeader } from "@/components/shared/PageHeader";
import CreateWorkOrderClient from "./CreateWorkOrderClient";

export default function NewWorkOrderPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <CreateWorkOrderClient />
    </div>
  );
}
