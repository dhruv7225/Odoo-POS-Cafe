import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, Plus, X, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export type Variant = { id: string; name: string; priceOption: number };
export type Topping = { id: string; name: string; price: number; optional: boolean };

export type MenuItemPayload = {
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  variants: Variant[];
  toppings: Topping[];
  available: boolean;
  sendToKitchen: boolean;
};

interface AddMenuFormProps {
  onAdd: (item: MenuItemPayload) => void;
  onCancel: () => void;
}

export const AddMenuForm: React.FC<AddMenuFormProps> = ({ onAdd, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [available, setAvailable] = useState(true);
  const [sendToKitchen, setSendToKitchen] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { toast.error("Please select a valid image file."); return; }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) { toast.error("Please drop a valid image file."); return; }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Variant helpers
  const addVariant = () => setVariants([...variants, { id: Date.now().toString(), name: "", priceOption: 0 }]);
  const updateVariant = (id: string, field: "name" | "priceOption", value: string | number) =>
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  const removeVariant = (id: string) => setVariants(variants.filter(v => v.id !== id));

  // Topping helpers
  const addTopping = () => setToppings([...toppings, { id: Date.now().toString(), name: "", price: 0, optional: true }]);
  const updateTopping = (id: string, field: keyof Omit<Topping, "id">, value: string | number | boolean) =>
    setToppings(toppings.map(t => t.id === id ? { ...t, [field]: value } : t));
  const removeTopping = (id: string) => setToppings(toppings.filter(t => t.id !== id));

  const handleSubmit = () => {
    if (!name || !category || !price || !image) {
      toast.error("Please fill in all required fields, including the product image.");
      return;
    }
    if (variants.some(v => !v.name.trim())) {
      toast.error("All added variants must have a name.");
      return;
    }
    if (toppings.some(t => !t.name.trim())) {
      toast.error("All added toppings must have a name.");
      return;
    }

    onAdd({ name, description, category, price: Number(price), image: image!, variants, toppings, available, sendToKitchen });

    setName(""); setDescription(""); setCategory(""); setPrice(""); setImage(null);
    setVariants([]); setToppings([]); setAvailable(true); setSendToKitchen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="rounded-xl shadow-sm border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">Add New Item</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">

        {/* Name + Category + Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-foreground after:content-['*'] after:ml-0.5 after:text-red-500">Product Name</Label>
            <Input placeholder="e.g. Classic Cheeseburger" value={name} onChange={e => setName(e.target.value)} className="bg-card w-full" />
          </div>
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div className="space-y-2">
              <Label className="text-foreground after:content-['*'] after:ml-0.5 after:text-red-500">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {["Pizza", "Burger", "Drinks", "Dessert", "Seafood", "Pasta", "Sides", "Salads"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground after:content-['*'] after:ml-0.5 after:text-red-500">Base Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} className="pl-8 bg-card" />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-foreground">Description</Label>
          <Textarea placeholder="Write a short appetizing description..." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px] resize-none bg-card" />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-foreground after:content-['*'] after:ml-0.5 after:text-red-500">Product Image</Label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
              ${dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30 hover:border-primary/50"}
              ${image ? "py-4" : ""}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            {image ? (
              <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border shadow-sm group">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-sm font-medium flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Change Image</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <ImagePlus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (MAX. 800×400px)</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Variants Section ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="text-base font-semibold">Variants</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Sizes or customizations that change the base price.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="text-primary hover:text-primary hover:bg-primary/5 shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Add Variant
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
              No variants added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map(v => (
                <div key={v.id} className="flex items-start gap-4 p-3.5 border rounded-xl bg-accent/20">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Variant Name</Label>
                    <Input placeholder="e.g. Small, Large, Extra Cheese" value={v.name} onChange={e => updateVariant(v.id, "name", e.target.value)} className="h-9" />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Price Difference</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input type="number" placeholder="0.00" value={v.priceOption} onChange={e => updateVariant(v.id, "priceOption", parseFloat(e.target.value) || 0)} className="h-9 pl-6" />
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(v.id)} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Toppings Section ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="text-base font-semibold">Toppings / Add-ons</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Extra add-ons customers can choose when ordering.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTopping} className="text-primary hover:text-primary hover:bg-primary/5 shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Add Topping
            </Button>
          </div>

          {toppings.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
              No toppings added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {toppings.map(t => (
                <div key={t.id} className="flex items-start gap-4 p-3.5 border rounded-xl bg-orange-50/40 border-orange-100">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Topping Name</Label>
                    <Input placeholder="e.g. Extra Cheese, Jalapeños, Bacon" value={t.name} onChange={e => updateTopping(t.id, "name", e.target.value)} className="h-9" />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Price (+)</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={t.price} onChange={e => updateTopping(t.id, "price", parseFloat(e.target.value) || 0)} className="h-9 pl-6" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Optional</Label>
                    <div className="h-9 flex items-center">
                      <Checkbox
                        checked={t.optional}
                        onCheckedChange={val => updateTopping(t.id, "optional", val as boolean)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTopping(t.id)} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="grid md:grid-cols-2 gap-6 pt-2 border-t border-border/50 mt-2">
          <div className="flex items-center justify-between p-4 border rounded-xl bg-card">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground">Available</Label>
              <p className="text-xs text-muted-foreground">Is this item currently in stock?</p>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl bg-card">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground">Send To Kitchen</Label>
              <p className="text-xs text-muted-foreground">Alert KDS displays on order.</p>
            </div>
            <Switch checked={sendToKitchen} onCheckedChange={setSendToKitchen} />
          </div>
        </div>

      </CardContent>

      <CardFooter className="flex justify-end gap-3 bg-muted/20 border-t py-4 px-6">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
        <Button onClick={handleSubmit} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md">Save Item</Button>
      </CardFooter>
    </Card>
  );
};
