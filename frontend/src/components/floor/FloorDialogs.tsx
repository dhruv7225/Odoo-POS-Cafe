import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { TableData } from "./TableCard";

// -------------- Add Floor Dialog --------------

interface AddFloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export const AddFloorDialog: React.FC<AddFloorDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name);
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Floor</DialogTitle>
          <DialogDescription>Create a new seating area or floor layout.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Floor Name</Label>
            <Input placeholder="e.g. Ground Floor, Outdoor Patio" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-white">Save Floor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// -------------- Add Table Dialog --------------

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (table: Omit<TableData, "id">) => void;
}

export const AddTableDialog: React.FC<AddTableDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [number, setNumber] = useState("");
  const [seats, setSeats] = useState<string>("4");
  const [active, setActive] = useState(true);

  const handleSave = () => {
    if (!number.trim() || !seats) return;
    onSave({ number, seats: parseInt(seats) || 2, active });
    setNumber("");
    setSeats("4");
    setActive(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>Define a new seating table for the current floor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Table Number / Identifier</Label>
            <Input placeholder="e.g. T1, Window-1" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Number of Seats</Label>
            <Input type="number" min="1" placeholder="4" value={seats} onChange={(e) => setSeats(e.target.value)} />
          </div>
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground">Is this table open for seating?</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-white">Save Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// -------------- Edit Table Dialog --------------

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData | null;
  onSave: (table: TableData) => void;
}

export const EditTableDialog: React.FC<EditTableDialogProps> = ({ open, onOpenChange, table, onSave }) => {
  const [number, setNumber] = useState("");
  const [seats, setSeats] = useState<string>("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (table) {
      setNumber(table.number);
      setSeats(table.seats.toString());
      setActive(table.active);
    }
  }, [table]);

  const handleSave = () => {
    if (!table || !number.trim() || !seats) return;
    onSave({ id: table.id, number, seats: parseInt(seats) || 2, active });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
          <DialogDescription>Modify settings for this specific table.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Table Number</Label>
            <Input placeholder="e.g. T1" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Number of Seats</Label>
            <Input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} />
          </div>
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground">Is this table open for seating?</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-white">Update Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
