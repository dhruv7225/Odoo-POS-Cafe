import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, Plus, X, UploadCloud, Loader2, Box } from "lucide-react";
import { toast } from "sonner";
import { uploadApi } from "@/lib/api";

export type Variant = { id: string; name: string; priceOption: number };
export type Topping = { id: string; name: string; price: number; optional: boolean };

export type MenuItemPayload = {
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  imageUrl?: string;
  glbUrl?: string;
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const glbInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [glbUrl, setGlbUrl] = useState<string>("");
  const [glbFileName, setGlbFileName] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGlb, setUploadingGlb] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [available, setAvailable] = useState(true);
  const [sendToKitchen, setSendToKitchen] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select a valid image file."); return; }
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    // Upload to Cloudinary
    setUploadingImage(true);
    try {
      const result = await uploadApi.image(file);
      setImageUrl(result.url);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Image upload failed: " + err.message);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGlbUpload = async (file: File) => {
    if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) {
      toast.error("Please select a .glb or .gltf file.");
      return;
    }
    setUploadingGlb(true);
    setGlbFileName(file.name);
    try {
      const result = await uploadApi.glb(file);
      setGlbUrl(result.url);
      toast.success("3D model uploaded!");
    } catch (err: any) {
      toast.error("GLB upload failed: " + err.message);
      setGlbFileName("");
    } finally {
      setUploadingGlb(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
  };

  const addVariant = () => setVariants([...variants, { id: Date.now().toString(), name: "", priceOption: 0 }]);
  const updateVariant = (id: string, field: "name" | "priceOption", value: string | number) =>
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  const removeVariant = (id: string) => setVariants(variants.filter(v => v.id !== id));

  const addTopping = () => setToppings([...toppings, { id: Date.now().toString(), name: "", price: 0, optional: true }]);
  const updateTopping = (id: string, field: keyof Omit<Topping, "id">, value: string | number | boolean) =>
    setToppings(toppings.map(t => t.id === id ? { ...t, [field]: value } : t));
  const removeTopping = (id: string) => setToppings(toppings.filter(t => t.id !== id));

  const handleSubmit = () => {
    if (!name || !category || !price) {
      toast.error("Please fill in name, category, and price.");
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

    onAdd({
      name, description, category, price: Number(price),
      image: imagePreview || "", imageUrl: imageUrl || undefined, glbUrl: glbUrl || undefined,
      variants, toppings, available, sendToKitchen
    });

    setName(""); setDescription(""); setCategory(""); setPrice("");
    setImagePreview(null); setImageUrl(""); setGlbUrl(""); setGlbFileName("");
    setVariants([]); setToppings([]); setAvailable(true); setSendToKitchen(true);
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
                  {["Beverages", "Starters", "Main Course", "Desserts", "Drinks", "Appetizers", "Biryani", "Pizza", "Burger", "Seafood", "Pasta", "Sides", "Salads"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground after:content-['*'] after:ml-0.5 after:text-red-500">Base Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
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

        {/* Image + GLB Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-foreground">Product Image (optional)</Label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer
                ${dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30 hover:border-primary/50"}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => imageInputRef.current?.click()}
            >
              <input type="file" ref={imageInputRef} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} accept="image/*" className="hidden" />
              {uploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : imagePreview ? (
                <div className="relative w-full max-w-[160px] aspect-square rounded-lg overflow-hidden border shadow-sm group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-medium flex items-center gap-1"><UploadCloud className="w-3 h-3" /> Change</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <ImagePlus className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">Click or drag image</p>
                </div>
              )}
            </div>
          </div>

          {/* GLB Upload */}
          <div className="space-y-2">
            <Label className="text-foreground">3D Model .glb (optional)</Label>
            <div
              className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer border-border hover:bg-muted/30 hover:border-primary/50"
              onClick={() => glbInputRef.current?.click()}
            >
              <input type="file" ref={glbInputRef} onChange={e => e.target.files?.[0] && handleGlbUpload(e.target.files[0])} accept=".glb,.gltf" className="hidden" />
              {uploadingGlb ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : glbUrl ? (
                <div className="text-center">
                  <Box className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-emerald-600">{glbFileName}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Click to replace</p>
                </div>
              ) : (
                <div className="text-center">
                  <Box className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">Click to upload .glb</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variants */}
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
            <div className="py-4 text-center text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">No variants added yet.</div>
          ) : (
            <div className="space-y-3">
              {variants.map(v => (
                <div key={v.id} className="flex items-start gap-4 p-3.5 border rounded-xl bg-accent/20">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Variant Name</Label>
                    <Input placeholder="e.g. Small, Large" value={v.name} onChange={e => updateVariant(v.id, "name", e.target.value)} className="h-9" />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Price Diff</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                      <Input type="number" placeholder="0.00" value={v.priceOption} onChange={e => updateVariant(v.id, "priceOption", parseFloat(e.target.value) || 0)} className="h-9 pl-6" />
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(v.id)} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toppings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="text-base font-semibold">Toppings / Add-ons</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Extra add-ons customers can choose.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTopping} className="text-primary hover:text-primary hover:bg-primary/5 shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Add Topping
            </Button>
          </div>
          {toppings.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">No toppings added yet.</div>
          ) : (
            <div className="space-y-3">
              {toppings.map(t => (
                <div key={t.id} className="flex items-start gap-4 p-3.5 border rounded-xl bg-orange-50/40 border-orange-100">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Topping Name</Label>
                    <Input placeholder="e.g. Extra Cheese" value={t.name} onChange={e => updateTopping(t.id, "name", e.target.value)} className="h-9" />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Price (+)</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={t.price} onChange={e => updateTopping(t.id, "price", parseFloat(e.target.value) || 0)} className="h-9 pl-6" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Optional</Label>
                    <div className="h-9 flex items-center">
                      <Checkbox checked={t.optional} onCheckedChange={val => updateTopping(t.id, "optional", val as boolean)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTopping(t.id)} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"><X className="w-4 h-4" /></Button>
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
        <Button onClick={handleSubmit} disabled={uploadingImage || uploadingGlb} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md">Save Item</Button>
      </CardFooter>
    </Card>
  );
};
