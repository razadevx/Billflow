import { Suspense } from "react";
import InventoryClient from "./InventoryClient";
import { DashboardContainer } from "@/components/layout/DashboardContainer";
import { PageHeader } from "@/components/layout/PageLayout";

export const metadata = {
  title: "Inventory | BillFlow",
  description: "Manage your inventory and stock levels",
};

export default function InventoryPage() {
  return (
    <DashboardContainer className="py-8">
      <PageHeader 
        title="Inventory" 
        description="Manage your inventory, low stock alerts, and stock adjustments." 
      />
      <Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>}>
        <InventoryClient />
      </Suspense>
    </DashboardContainer>
  );
}
