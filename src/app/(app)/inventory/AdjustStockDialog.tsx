import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { InventoryItem } from "@/domain/inventory/types";

export default function AdjustStockDialog({ 
  item,
  open, 
  onOpenChange,
  onSuccess 
}: { 
  item: InventoryItem;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("RESTOCK");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/v1/inventory/${item.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to adjust stock");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Stock adjusted successfully");
      onSuccess();
      onOpenChange(false);
      setQuantity(0);
      setNotes("");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity === 0) return toast.error("Quantity cannot be zero");
    
    mutation.mutate({
      quantity: Number(quantity),
      reason,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          Current Stock: {item.currentStock} {item.unit}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Adjustment Type</Label>
            <Select value={reason} onValueChange={(val) => val && setReason(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESTOCK">Add Stock (Restock)</SelectItem>
                <SelectItem value="SHRINKAGE">Remove Stock (Shrinkage/Loss)</SelectItem>
                <SelectItem value="CORRECTION">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Adjust (+ or -)</Label>
            <Input 
              id="quantity" 
              type="number" 
              value={quantity} 
              onChange={e => setQuantity(Number(e.target.value))} 
              required 
            />
            <p className="text-xs text-muted-foreground">
              New stock will be: {item.currentStock + Number(quantity)} {item.unit}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input 
              id="notes" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || quantity === 0 || (item.currentStock + quantity < 0)}>
              {mutation.isPending ? "Adjusting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
