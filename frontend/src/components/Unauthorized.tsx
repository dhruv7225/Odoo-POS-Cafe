import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-6 bg-background text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground max-w-[400px]">
          You do not have the required "admin" permissions to view this dashboard. Please log in with a different account or contact system administration.
        </p>
      </div>
      <Button asChild className="mt-4 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
        <Link to="/login">Return to Login</Link>
      </Button>
    </div>
  );
};
