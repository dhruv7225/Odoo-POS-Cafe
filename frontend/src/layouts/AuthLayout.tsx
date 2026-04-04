import React from "react";
import { Coffee, UtensilsCrossed } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground animate-in fade-in duration-500">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-2/5 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="relative z-10 flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-sm">
            <Coffee size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">POSCafe</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Smart Restaurant Management &
            <span className="text-primary block mt-2">POS System</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Streamline your orders, manage your staff, and scale your restaurant business with our premium tools.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-12 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <UtensilsCrossed size={18} />
          <span>Trusted by 10,000+ restaurants worldwide</span>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md sm:max-w-lg space-y-8">
          {/* Mobile logo (visible only on mobile) */}
          <div className="flex lg:hidden items-center justify-center space-x-2 mb-8">
            <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-sm">
              <Coffee size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">POSCafe</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
