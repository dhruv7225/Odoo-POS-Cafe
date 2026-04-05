import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutTemplate, Loader2 } from "lucide-react";
import { TableCard } from "@/components/floor/TableCard";
import type { TableData } from "@/components/floor/TableCard";
import { AddFloorDialog, AddTableDialog, EditTableDialog } from "@/components/floor/FloorDialogs";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { floorApi, tableApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export type FloorData = {
  id: string;
  backendId: number;
  name: string;
  tables: (TableData & { backendId: number })[];
};

export const FloorTableManagement: React.FC = () => {
  const { restaurantId } = useAuth();
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);
  const [tableToDelete, setTableToDelete] = useState<{ floorId: string; tableId: string } | null>(null);

  const loadFloors = async () => {
    if (!restaurantId) return;
    try {
      const floorData = await floorApi.list(restaurantId);
      const mapped: FloorData[] = await Promise.all(
        floorData.map(async (f: any) => {
          const tables = await tableApi.listByFloor(f.id);
          return {
            id: `f-${f.id}`,
            backendId: f.id,
            name: f.name,
            tables: tables.map((t: any) => ({
              id: `t-${t.id}`,
              backendId: t.id,
              number: t.tableNo,
              seats: t.seats,
              active: t.active,
            })),
          };
        })
      );
      setFloors(mapped);
      if (mapped.length > 0 && !activeFloorId) setActiveFloorId(mapped[0].id);
      // Sync to localStorage for POS
      localStorage.setItem("poscafe_floors", JSON.stringify(mapped));
    } catch (err: any) {
      toast.error("Failed to load floors: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFloors(); }, [restaurantId]);

  const handleAddFloor = async (name: string) => {
    if (!restaurantId) return;
    try {
      await floorApi.create({ restaurantId, name, sortOrder: floors.length });
      toast.success(`Floor "${name}" created.`);
      loadFloors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteFloor = async () => {
    if (!floorToDelete) return;
    const floor = floors.find((f) => f.id === floorToDelete);
    if (!floor) return;
    try {
      await floorApi.remove(floor.backendId);
      toast.success(`Floor "${floor.name}" deleted.`);
      if (activeFloorId === floorToDelete) setActiveFloorId("");
      setFloorToDelete(null);
      loadFloors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddTable = async (tableData: Omit<TableData, "id">) => {
    if (!restaurantId || !activeFloorId) {
      toast.error("Please select a floor first.");
      return;
    }
    const floor = floors.find((f) => f.id === activeFloorId);
    if (!floor) return;
    try {
      await tableApi.create({
        restaurantId,
        floorId: floor.backendId,
        tableNo: tableData.number,
        seats: tableData.seats,
      });
      toast.success("Table added.");
      loadFloors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditTable = async (updatedTable: TableData) => {
    const floor = floors.find((f) => f.id === activeFloorId);
    if (!floor || !restaurantId) return;
    const tbl = floor.tables.find((t) => t.id === updatedTable.id);
    if (!tbl) return;
    try {
      await tableApi.update(tbl.backendId, {
        restaurantId,
        floorId: floor.backendId,
        tableNo: updatedTable.number,
        seats: updatedTable.seats,
      });
      toast.success("Table updated.");
      loadFloors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    const floor = floors.find((f) => f.id === tableToDelete.floorId);
    const tbl = floor?.tables.find((t) => t.id === tableToDelete.tableId);
    if (!tbl) return;
    try {
      await tableApi.toggle(tbl.backendId); // toggle active to false
      toast.success("Table deleted.");
      setTableToDelete(null);
      loadFloors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEditModal = (table: TableData) => {
    setEditingTable(table);
    setIsEditTableOpen(true);
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
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
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

        {floors.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 flex flex-col items-center justify-center text-center bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <LayoutTemplate className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No floors added yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">Create your first floor to begin adding tables.</p>
            <Button onClick={() => setIsAddFloorOpen(true)} className="bg-primary text-white">Create First Floor</Button>
          </div>
        ) : (
          <Tabs value={activeFloorId} onValueChange={setActiveFloorId} className="w-full">
            <div className="bg-card rounded-t-xl border-t border-x px-4 pt-4 shadow-sm">
              <div className="overflow-x-auto pb-4 no-scrollbar">
                <div className="flex items-center justify-between pb-4">
                  <TabsList className="bg-muted/50 p-1 w-max border">
                    {floors.map((floor) => (
                      <TabsTrigger key={floor.id} value={floor.id} className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-semibold">
                        {floor.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {activeFloorId && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setFloorToDelete(activeFloorId)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Floor
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-t-0 p-6 rounded-b-xl bg-muted/10 shadow-inner min-h-[400px]">
              {floors.map((floor) => (
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
                      {floor.tables.map((table) => (
                        <TableCard key={table.id} table={table} onEdit={openEditModal} onDelete={(id) => setTableToDelete({ floorId: floor.id, tableId: id })} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}
      </div>

      <AddFloorDialog open={isAddFloorOpen} onOpenChange={setIsAddFloorOpen} onSave={handleAddFloor} />
      <AddTableDialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen} onSave={handleAddTable} />
      <EditTableDialog open={isEditTableOpen} onOpenChange={setIsEditTableOpen} table={editingTable} onSave={handleEditTable} />

      <AlertDialog open={!!floorToDelete} onOpenChange={(open) => !open && setFloorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Floor?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the floor and all tables within it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFloor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Floor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this table?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Table</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};
