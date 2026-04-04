import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutTemplate } from "lucide-react";
import { TableCard } from "@/components/floor/TableCard";
import type { TableData } from "@/components/floor/TableCard";
import { AddFloorDialog, AddTableDialog, EditTableDialog } from "@/components/floor/FloorDialogs";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export type FloorData = {
  id: string;
  name: string;
  tables: TableData[];
};

export const FloorTableManagement: React.FC = () => {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>("");

  // Modals
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  
  // Delete confirmations
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);
  const [tableToDelete, setTableToDelete] = useState<{floorId: string, tableId: string} | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("poscafe_floors");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFloors(parsed);
        if (parsed.length > 0) setActiveFloorId(parsed[0].id);
      } catch (e) {
        console.error("Failed to parse floors", e);
      }
    } else {
      // Setup initial mock
      const initialMock: FloorData[] = [
        {
          id: "f1",
          name: "Ground Floor",
          tables: [
            { id: "t101", number: "T1", seats: 4, active: true },
            { id: "t102", number: "T2", seats: 2, active: true },
            { id: "t103", number: "T3", seats: 4, active: true },
            { id: "t104", number: "T4", seats: 6, active: true },
          ]
        },
        {
          id: "f2",
          name: "Outdoor Patio",
          tables: [
            { id: "t201", number: "P1", seats: 2, active: true },
            { id: "t202", number: "P2", seats: 4, active: false }
          ]
        }
      ];
      setFloors(initialMock);
      setActiveFloorId(initialMock[0].id);
      localStorage.setItem("poscafe_floors", JSON.stringify(initialMock));
    }
  }, []);

  const saveState = (newState: FloorData[]) => {
    setFloors(newState);
    localStorage.setItem("poscafe_floors", JSON.stringify(newState));
  };

  // Floor Actions
  const handleAddFloor = (name: string) => {
    const newFloor: FloorData = {
      id: `f${Date.now()}`,
      name,
      tables: []
    };
    const updated = [...floors, newFloor];
    saveState(updated);
    if (!activeFloorId) setActiveFloorId(newFloor.id);
    toast.success(`Floor "${name}" created successfully.`);
  };

  const handleDeleteFloor = () => {
    if (!floorToDelete) return;
    
    const floorName = floors.find(f => f.id === floorToDelete)?.name;
    const updated = floors.filter(f => f.id !== floorToDelete);
    saveState(updated);
    
    if (activeFloorId === floorToDelete) {
      setActiveFloorId(updated.length > 0 ? updated[0].id : "");
    }
    
    setFloorToDelete(null);
    toast.success(`Floor "${floorName}" deleted.`);
  };

  // Table Actions
  const handleAddTable = (tableData: Omit<TableData, "id">) => {
    if (!activeFloorId) {
      toast.error("Please add and select a floor first.");
      return;
    }
    const newTable: TableData = { ...tableData, id: `t${Date.now()}` };
    const updated = floors.map(floor => {
      if (floor.id === activeFloorId) {
        return { ...floor, tables: [...floor.tables, newTable] };
      }
      return floor;
    });
    saveState(updated);
    toast.success("Table added successfully.");
  };

  const handleEditTable = (updatedTable: TableData) => {
    const updated = floors.map(floor => {
      if (floor.id === activeFloorId) {
        return {
          ...floor,
          tables: floor.tables.map(t => t.id === updatedTable.id ? updatedTable : t)
        };
      }
      return floor;
    });
    saveState(updated);
    toast.success("Table updated.");
  };

  const handleDeleteTable = () => {
    if (!tableToDelete) return;
    
    const { floorId, tableId } = tableToDelete;
    const updated = floors.map(floor => {
      if (floor.id === floorId) {
        return {
          ...floor,
          tables: floor.tables.filter(t => t.id !== tableId)
        };
      }
      return floor;
    });
    saveState(updated);
    setTableToDelete(null);
    toast.success("Table deleted.");
  };

  const openEditModal = (table: TableData) => {
    setEditingTable(table);
    setIsEditTableOpen(true);
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Floor & Table Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage restaurant floors and seating layout</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsAddFloorOpen(true)} className="flex-1 sm:flex-none">
              <span className="font-semibold text-primary/80">+ Add Floor</span>
            </Button>
            <Button onClick={() => setIsAddTableOpen(true)} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white shadow-sm" disabled={floors.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {floors.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 flex flex-col items-center justify-center text-center bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <LayoutTemplate className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No floors added yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">Create your first floor to begin adding tables and mapping out your seating arrangement.</p>
            <Button onClick={() => setIsAddFloorOpen(true)} className="bg-primary text-white">Create First Floor</Button>
          </div>
        ) : (
          <Tabs value={activeFloorId} onValueChange={setActiveFloorId} className="w-full">
            <div className="bg-card rounded-t-xl border-t border-x px-4 pt-4 shadow-sm">
              <div className="overflow-x-auto pb-4 no-scrollbar">
                <div className="flex items-center justify-between pb-4">
                  <TabsList className="bg-muted/50 p-1 w-max border">
                    {floors.map(floor => (
                      <TabsTrigger key={floor.id} value={floor.id} className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-semibold">
                        {floor.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {activeFloorId && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setFloorToDelete(activeFloorId)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Floor
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-t-0 p-6 rounded-b-xl bg-muted/10 shadow-inner min-h-[400px]">
              {floors.map(floor => (
                <TabsContent key={floor.id} value={floor.id} className="mt-0 outline-none">
                  {floor.tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-12 h-12 rounded-full bg-card border flex items-center justify-center mb-3">
                        <LayoutTemplate className="w-5 h-5 text-muted-foreground/60" />
                      </div>
                      <p className="font-medium text-foreground">No tables added to this floor.</p>
                      <Button variant="link" onClick={() => setIsAddTableOpen(true)} className="text-primary mt-1">Add a table</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                      {floor.tables.map(table => (
                        <TableCard 
                          key={table.id} 
                          table={table} 
                          onEdit={openEditModal} 
                          onDelete={(id) => setTableToDelete({ floorId: floor.id, tableId: id })} 
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}

      </div>

      {/* Dialogs */}
      <AddFloorDialog open={isAddFloorOpen} onOpenChange={setIsAddFloorOpen} onSave={handleAddFloor} />
      <AddTableDialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen} onSave={handleAddTable} />
      <EditTableDialog open={isEditTableOpen} onOpenChange={setIsEditTableOpen} table={editingTable} onSave={handleEditTable} />

      {/* Floor Delete Confirmation */}
      <AlertDialog open={!!floorToDelete} onOpenChange={(open) => !open && setFloorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Floor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the floor and all tables within it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFloor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Floor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table Delete Confirmation */}
      <AlertDialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this table from the layout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};
