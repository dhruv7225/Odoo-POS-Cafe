import React from "react";
import type { MenuItemPayload } from "./AddMenuForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Search, Trash2, Utensils } from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";

export type MenuItem = MenuItemPayload & { id: string };

interface MenuTableProps {
  items: MenuItem[];
  onDelete: (id: string) => void;
  onEdit: (item: MenuItem) => void;
}

export const MenuTable: React.FC<MenuTableProps> = ({ items, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="flex bg-card items-center border rounded-lg px-3 py-2 w-full max-w-sm shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
          <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
          <input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground text-sm"
          />
        </div>
      )}

      <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Utensils className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {items.length === 0 ? "No menu items added yet." : "No menu items found matching search."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 group">
                  <TableCell>
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted/50 border flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <Utensils className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.variants?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.variants.length} variant{item.variants.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-accent/50 text-foreground shadow-none rounded-md px-2 py-0.5 border-border">
                      {item.category || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                        ${item.available ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}
                      `}>
                        {item.available ? "Available" : "Out of Stock"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
