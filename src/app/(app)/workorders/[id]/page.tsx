import WorkOrderDetailClient from "./WorkOrderDetailClient";

export default function WorkOrderPage(props: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <WorkOrderDetailClient idPromise={props.params} />
    </div>
  );
}
