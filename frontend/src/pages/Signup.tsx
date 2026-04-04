import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/layouts/AuthLayout";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  organizationName: z.string().min(2, "Organization name is required"),
  role: z.enum(["admin", "manager", "staff"], { message: "Please select a role" }),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "manager",
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    // Simulate API call
    console.log("Signup data:", data);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <AuthLayout>
      <div className="bg-card p-8 rounded-2xl shadow-xl shadow-black/5 ring-1 ring-border">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
          <p className="text-muted-foreground text-sm">
            Set up your POSCafe workspace to start managing your restaurant.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className={errors.fullName ? "text-destructive" : ""}>
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                className={`h-11 ${errors.fullName ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@restaurant.com"
                className={`h-11 ${errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="organizationName" className={errors.organizationName ? "text-destructive" : ""}>
                Organization Name
              </Label>
              <Input
                id="organizationName"
                placeholder="The Golden Spoon"
                className={`h-11 ${errors.organizationName ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                {...register("organizationName")}
              />
              {errors.organizationName && (
                <p className="text-xs font-medium text-destructive">{errors.organizationName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className={errors.role ? "text-destructive" : ""}>
                Role
              </Label>
              <select
                id="role"
                className={`flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none ${errors.role ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                {...register("role")}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              {errors.role && (
                <p className="text-xs font-medium text-destructive">{errors.role.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`h-11 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={errors.confirmPassword ? "text-destructive" : ""}>
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`h-11 pr-10 ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md active:scale-[0.98] transition-transform mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline transition-all">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
