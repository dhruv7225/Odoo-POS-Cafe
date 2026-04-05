import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AddMenuForm } from "@/components/menu/AddMenuForm";
import type { MenuItemPayload } from "@/components/menu/AddMenuForm";
import { MenuTable } from "@/components/menu/MenuTable";
import type { MenuItem } from "@/components/menu/MenuTable";
import { EditMenuDialog } from "@/components/menu/EditMenuDialog";
import type { Variant, Topping } from "@/components/menu/AddMenuForm";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productApi, categoryApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const MenuManagement: React.FC = () => {
  const { restaurantId } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Delete state
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const loadMenu = async () => {
    if (!restaurantId) return;
    try {
      const products = await productApi.list(restaurantId);
      const mapped: MenuItem[] = await Promise.all(
        products.map(async (p: any) => {
          let variants: any[] = [];
          let toppings: any[] = [];
          try {
            variants = await productApi.getVariants(p.id);
            toppings = await productApi.getToppings(p.id);
          } catch { /* product may have none */ }

          return {
            id: String(p.id),
            categoryId: p.category?.id,
            name: p.name,
            description: p.description || "",
            category: p.category?.name || "Uncategorized",
            price: p.price,
            image: p.imageUrl || "",
            imageUrl: p.imageUrl || "",
            glbUrl: p.glbUrl || "",
            variants: variants.map((v: any) => ({
              id: String(v.id),
              name: v.name,
              priceOption: v.priceAdjustment,
            })),
            toppings: toppings.map((t: any) => ({
              id: String(t.id),
              name: t.name,
              price: t.price,
              optional: true,
            })),
            available: p.active,
            sendToKitchen: p.kitchenEnabled,
          } as MenuItem;
        })
      );
      setItems(mapped);
      localStorage.setItem("poscafe_menu", JSON.stringify(mapped));
    } catch (err: any) {
      toast.error("Failed to load menu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMenu(); }, [restaurantId]);

  const handleAddItem = async (payload: MenuItemPayload) => {
    if (!restaurantId) return;
    try {
      const categories = await categoryApi.list(restaurantId);
      let category = categories.find((c: any) => c.name.toLowerCase() === payload.category.toLowerCase());
      if (!category) {
        category = await categoryApi.create({ restaurantId, name: payload.category });
      }
      const product: any = await productApi.create({
        restaurantId,
        categoryId: category.id,
        name: payload.name,
        price: payload.price,
        taxRate: 5.0,
        kitchenEnabled: payload.sendToKitchen,
        description: payload.description,
        imageUrl: payload.imageUrl,
        glbUrl: payload.glbUrl,
      });
      for (const v of payload.variants) {
        await productApi.addVariant(product.id, { name: v.name, priceAdjustment: v.priceOption });
      }
      for (const t of (payload.toppings || [])) {
        await productApi.addTopping(product.id, { name: t.name, price: t.price });
      }
      toast.success("Menu item added!");
      setIsAdding(false);
      loadMenu();
    } catch (err: any) {
      toast.error("Failed to add item: " + err.message);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (id: string, data: {
    name: string; description: string; price: number;
    available: boolean; sendToKitchen: boolean;
    variants: Variant[]; toppings: Topping[];
  }) => {
    if (!restaurantId) return;
    const numericId = Number(id);
    const original = items.find(i => i.id === id);

    // Update product fields
    await productApi.update(numericId, {
      restaurantId,
      categoryId: (original as any)?.categoryId,
      name: data.name,
      price: data.price,
      taxRate: 5.0,
      kitchenEnabled: data.sendToKitchen,
      description: data.description,
    });

    // Sync variants: update existing, add new, delete removed
    const originalVariantIds = new Set(original?.variants?.map(v => v.id) || []);
    const newVariantIds = new Set(data.variants.filter(v => !v.id.startsWith("new-")).map(v => v.id));

    // Delete removed variants
    for (const origId of originalVariantIds) {
      if (!newVariantIds.has(origId)) {
        await productApi.removeVariant(Number(origId));
      }
    }
    // Update existing + add new
    for (const v of data.variants) {
      if (v.id.startsWith("new-")) {
        await productApi.addVariant(numericId, { name: v.name, priceAdjustment: v.priceOption });
      } else {
        await productApi.updateVariant(Number(v.id), { name: v.name, priceAdjustment: v.priceOption });
      }
    }

    // Sync toppings
    const originalToppingIds = new Set(original?.toppings?.map(t => t.id) || []);
    const newToppingIds = new Set(data.toppings.filter(t => !t.id.startsWith("new-")).map(t => t.id));

    for (const origId of originalToppingIds) {
      if (!newToppingIds.has(origId)) {
        await productApi.removeTopping(Number(origId));
      }
    }
    for (const t of data.toppings) {
      if (t.id.startsWith("new-")) {
        await productApi.addTopping(numericId, { name: t.name, price: t.price });
      } else {
        await productApi.updateTopping(Number(t.id), { name: t.name, price: t.price });
      }
    }

    toast.success("Menu item updated!");
    loadMenu();
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await productApi.remove(Number(deletingItem.id));
      toast.success(`"${deletingItem.name}" deleted.`);
      setDeletingItem(null);
      loadMenu();
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Menu Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage products, variants, and toppings.</p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2 rounded-xl font-semibold shadow-md">
              <Plus size={18} /> Add Menu Item
            </Button>
          )}
        </div>

        {isAdding && (
          <AddMenuForm onAdd={handleAddItem} onCancel={() => setIsAdding(false)} />
        )}

        <MenuTable items={items} onDelete={(id) => setDeletingItem(items.find(i => i.id === id) || null)} onEdit={handleEditItem} />
      </div>

      {/* Edit Dialog */}
      <EditMenuDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={editingItem}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingItem?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the menu item. It will no longer appear in the menu for ordering.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};
