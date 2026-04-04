import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Users } from "lucide-react";

export type TableData = {
  id: string;
  number: string;
  seats: number;
  active: boolean;
};

interface TableCardProps {
  table: TableData;
  onEdit: (table: TableData) => void;
  onDelete: (id: string) => void;
}

export const TableCard: React.FC<TableCardProps> = ({ table, onEdit, onDelete }) => {
  return (
    <Card className="rounded-xl shadow-sm border-border/60 hover:shadow-md transition-shadow group relative overflow-hidden bg-card">
      <CardContent className="p-5 flex flex-col items-center justify-center text-center">
        
        {/* Status indicator line on top */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${table.active ? "bg-emerald-500" : "bg-red-500"}`} />

        <div className="absolute top-3 right-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(table)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(table.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mb-3 mt-2 ${table.active ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-red-100 bg-red-50 text-red-600"}`}>
          <span className="font-bold text-lg">{table.number}</span>
        </div>

        <h3 className="font-semibold text-foreground mb-1">{table.number}</h3>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Users className="w-3.5 h-3.5 mr-1.5" /> 
          {table.seats} Seats
        </div>

        <Badge variant="outline" className={`shadow-none font-medium border ${table.active ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
          {table.active ? "Active" : "Inactive"}
        </Badge>
      </CardContent>
    </Card>
  );
};
