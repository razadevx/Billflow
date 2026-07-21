import InventoryDetailClient from "./InventoryDetailClient";

export default async function InventoryDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <InventoryDetailClient id={params.id} />
    </div>
  );
}
