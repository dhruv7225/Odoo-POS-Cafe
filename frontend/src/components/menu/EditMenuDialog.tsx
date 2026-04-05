import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem } from "./MenuTable";
import type { Variant, Topping } from "./AddMenuForm";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

interface EditMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  onSave: (id: string, data: {
    name: string; description: string; price: number;
    available: boolean; sendToKitchen: boolean;
    variants: Variant[]; toppings: Topping[];
  }) => Promise<void>;
}

export const EditMenuDialog: React.FC<EditMenuDialogProps> = ({ open, onOpenChange, item, onSave }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [sendToKitchen, setSendToKitchen] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description);
      setPrice(String(item.price));
      setAvailable(item.available);
      setSendToKitchen(item.sendToKitchen);
      setVariants(item.variants?.map(v => ({ ...v })) || []);
      setToppings(item.toppings?.map(t => ({ ...t })) || []);
    }
  }, [item]);

  const addVariant = () => setVariants([...variants, { id: `new-${Date.now()}`, name: "", priceOption: 0 }]);
  const updateVariant = (id: string, field: "name" | "priceOption", value: string | number) =>
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  const removeVariant = (id: string) => setVariants(variants.filter(v => v.id !== id));

  const addTopping = () => setToppings([...toppings, { id: `new-${Date.now()}`, name: "", price: 0, optional: true }]);
  const updateTopping = (id: string, field: keyof Omit<Topping, "id">, value: string | number | boolean) =>
    setToppings(toppings.map(t => t.id === id ? { ...t, [field]: value } : t));
  const removeTopping = (id: string) => setToppings(toppings.filter(t => t.id !== id));

  const handleSave = async () => {
    if (!name.trim() || !price) {
      toast.error("Name and price are required.");
      return;
    }
    if (variants.some(v => !v.name.trim())) {
      toast.error("All variants must have a name.");
      return;
    }
    if (toppings.some(t => !t.name.trim())) {
      toast.error("All toppings must have a name.");
      return;
    }
    setSaving(true);
    try {
      await onSave(item!.id, {
        name, description, price: Number(price),
        available, sendToKitchen, variants, toppings,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-bold">Edit Menu Item</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">

            {/* Name + Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Base Price (₹)</Label>
                <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[80px] resize-none" />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-xl">
                <Label>Available</Label>
                <Switch checked={available} onCheckedChange={setAvailable} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-xl">
                <Label>Send To Kitchen</Label>
                <Switch checked={sendToKitchen} onCheckedChange={setSendToKitchen} />
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Variants</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="text-primary">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3 bg-muted/20 rounded-lg border border-dashed">No variants</p>
              ) : (
                <div className="space-y-2">
                  {variants.map(v => (
                    <div key={v.id} className="flex items-center gap-3 p-3 border rounded-xl bg-accent/20">
                      <Input placeholder="Name" value={v.name} onChange={e => updateVariant(v.id, "name", e.target.value)} className="flex-1 h-9" />
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                        <Input type="number" value={v.priceOption} onChange={e => updateVariant(v.id, "priceOption", parseFloat(e.target.value) || 0)} className="h-9 pl-5" />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeVariant(v.id)} className="h-9 w-9 text-red-500 hover:bg-red-50 shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toppings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Toppings</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTopping} className="text-primary">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {toppings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3 bg-muted/20 rounded-lg border border-dashed">No toppings</p>
              ) : (
                <div className="space-y-2">
                  {toppings.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 border rounded-xl bg-orange-50/40 border-orange-100">
                      <Input placeholder="Name" value={t.name} onChange={e => updateTopping(t.id, "name", e.target.value)} className="flex-1 h-9" />
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                        <Input type="number" min="0" value={t.price} onChange={e => updateTopping(t.id, "price", parseFloat(e.target.value) || 0)} className="h-9 pl-5" />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeTopping(t.id)} className="h-9 w-9 text-red-500 hover:bg-red-50 shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
