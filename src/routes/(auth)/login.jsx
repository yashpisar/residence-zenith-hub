import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSociety } from "@/contexts/SocietyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Home, Shield, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(auth)/login")({
  component: Login,
});

function Login() {
  const { selectedSociety } = useSociety();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedSociety) {
      navigate({ to: "/select-society", replace: true });
    }
  }, [selectedSociety, navigate]);

  if (!selectedSociety) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Login Simulation
    setTimeout(() => {
      if (!selectedRole) return;
      const mockUser = {
        id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        name:
          selectedRole === "resident"
            ? "Ananya Rao"
            : selectedRole === "secretary"
              ? "Rahul Patil"
              : "Amit Sharma",
        email: `test@${selectedRole}.com`,
        role: selectedRole,
        avatar: undefined, // Explicitly no avatar for initials logic testing
        flatNumber: selectedRole === "resident" ? "A-402" : undefined,
        wing: selectedRole === "resident" ? "A" : undefined,
      };

      const mockToken = `mock_jwt_${Math.random().toString(36).substr(2, 9)}`;
      login(mockToken, mockUser);
      setIsLoading(false);

      // Redirect to the role's dashboard
      const pathPrefix = selectedRole === "security" ? "guard" : selectedRole;
      navigate({ to: `/${pathPrefix}/dashboard` });
    }, 1500);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side: branding/image */}
      <div className="relative hidden w-1/2 flex-col bg-muted lg:flex">
        <img
          src={selectedSociety.coverImage}
          alt={selectedSociety.name}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        <div className="relative z-10 mt-auto p-12 text-foreground">
          <div className="flex items-center gap-4 mb-6">
            <img src={selectedSociety.logo} alt="Logo" className="size-16 rounded-xl" />
            <h1 className="text-4xl font-bold">{selectedSociety.name}</h1>
          </div>
          <p className="text-lg text-foreground/80 max-w-md">{selectedSociety.address}</p>
        </div>
      </div>

      {/* Right side: Forms */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Mobile Header (hidden on large screens) */}
          <div className="mb-10 flex flex-col items-center text-center lg:hidden">
            <img src={selectedSociety.logo} alt="Logo" className="mb-4 size-20 rounded-2xl" />
            <h2 className="text-2xl font-bold">{selectedSociety.name}</h2>
          </div>

          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select your role to access the portal
                  </p>
                </div>

                <div className="grid gap-4">
                  <RoleCard
                    title="Flat Member / Resident"
                    description="Login for flat owners and tenants to manage complaints, maintenance, and visitors."
                    icon={Home}
                    onClick={() => setSelectedRole("resident")}
                  />

                  <RoleCard
                    title="Secretary / Society Admin"
                    description="Login for society administrators to manage residents, complaints, and reports."
                    icon={Building2}
                    onClick={() => setSelectedRole("secretary")}
                  />

                  <RoleCard
                    title="Security Guard"
                    description="Login for security staff to manage visitors, deliveries and security activities."
                    icon={Shield}
                    onClick={() => setSelectedRole("security")}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  onClick={() => setSelectedRole(null)}
                  className="mb-8 flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="mr-2 size-4" /> Change Role
                </button>

                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground capitalize">
                    {selectedRole} Login
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter your credentials to access the {selectedSociety.name} portal.
                  </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium leading-none text-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        className="mt-2 flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={`demo@${selectedRole}.com`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium leading-none text-foreground">
                          Password
                        </label>
                        <a href="#" className="text-sm font-medium text-primary hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <input
                        type="password"
                        required
                        className="mt-2 flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="password123"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Login"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ title, description, icon: Icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/50"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-6" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
