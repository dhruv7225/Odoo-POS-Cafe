import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AddMenuForm } from "@/components/menu/AddMenuForm";
import type { MenuItemPayload } from "@/components/menu/AddMenuForm";
import { MenuTable } from "@/components/menu/MenuTable";
import type { MenuItem } from "@/components/menu/MenuTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const MenuManagement: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedMenu = localStorage.getItem("poscafe_menu");
    if (savedMenu) {
      try {
        setItems(JSON.parse(savedMenu));
      } catch (e) {
        console.error("Failed to parse menu items from local storage");
      }
    } else {
      // Load some initial mock data if empty
      const initialMock: MenuItem[] = [
        {
          id: "1",
          name: "Classic Cheeseburger",
          description: "Juicy beef patty with sharp cheddar",
          category: "Burger",
          price: 10.99,
          image: "", // empty for mock
          variants: [],
          available: true,
          sendToKitchen: true
        }
      ];
      setItems(initialMock);
      localStorage.setItem("poscafe_menu", JSON.stringify(initialMock));
    }
  }, []);

  const saveToLocalStorage = (newItems: MenuItem[]) => {
    localStorage.setItem("poscafe_menu", JSON.stringify(newItems));
  };

  const handleAddItem = (payload: MenuItemPayload) => {
    const newItem: MenuItem = {
      ...payload,
      id: Date.now().toString()
    };
    
    const updated = [newItem, ...items];
    setItems(updated);
    saveToLocalStorage(updated);
    setIsAdding(false);
    toast.success("Menu item added successfully!");
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    saveToLocalStorage(updated);
    toast.success("Menu item deleted.");
  };

  // Mock edit flow 
  const handleEditItem = (item: MenuItem) => {
    toast.info(`Edit functionally mocked for ${item.name}.`);
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Menu Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Add and manage restaurant food items</p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-8 pb-10">
          {/* Add Menu Form */}
          {isAdding && (
            <div className="animate-in slide-in-from-top-4 fade-in duration-300">
              <AddMenuForm 
                onAdd={handleAddItem}
                onCancel={() => setIsAdding(false)}
              />
            </div>
          )}

          {/* Table List */}
          <div className="space-y-4">
            {!isAdding && (
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Current Menu Items</h3>
            )}
            <MenuTable 
              items={items} 
              onDelete={handleDeleteItem} 
              onEdit={handleEditItem} 
            />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
