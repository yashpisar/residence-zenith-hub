import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSociety } from "@/contexts/SocietyContext";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, societyApi } from "@/services/api";
import {
  Building2,
  Home,
  Shield,
  ArrowLeft,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  LogIn,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/(auth)/login")({
  component: Login,
});

function Login() {
  const { selectedSociety, setSelectedSociety } = useSociety();
  const { login, isAuthenticated, user: authUser, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated and session restored, navigate to user's dashboard
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && authUser?.role) {
      const pathPrefix = authUser.role === "security" ? "guard" : authUser.role;
      navigate({ to: `/${pathPrefix}/dashboard` });
    }
  }, [isAuthLoading, isAuthenticated, authUser, navigate]);

  // Mode: "signin" | "create_account"
  const [activeTab, setActiveTab] = useState("signin");

  // Sign In states
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pending approval screen state
  const [pendingApprovalData, setPendingApprovalData] = useState(null);

  // Registration states
  const [regRole, setRegRole] = useState("resident"); // "resident" | "secretary" | "security"
  const [allSocieties, setAllSocieties] = useState([]);
  const [regSocietyId, setRegSocietyId] = useState("");
  const [availableFlats, setAvailableFlats] = useState([]);
  const [isLoadingFlats, setIsLoadingFlats] = useState(false);

  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    residentType: "Owner",
    wing: "",
    flatNumber: "",
    staffId: "",
    shift: "General",
    invitationToken: "",
  });

  const [isCustomFlat, setIsCustomFlat] = useState(false);
  const [customFlatNumber, setCustomFlatNumber] = useState("");

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Load societies for registration dropdown
  useEffect(() => {
    societyApi
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setAllSocieties(list);
        if (selectedSociety) {
          const match = list.find(
            (s) =>
              s.id === selectedSociety.id ||
              s._id === selectedSociety._id ||
              s.registrationNumber === selectedSociety.registrationNumber ||
              s.registrationNumber === selectedSociety.id ||
              s.name?.toLowerCase() === selectedSociety.name?.toLowerCase()
          );
          setRegSocietyId(match ? (match.id || match._id) : (selectedSociety.id || selectedSociety._id));
        } else if (list.length > 0) {
          setRegSocietyId(list[0].id || list[0]._id);
        }
      })
      .catch(() => {});
  }, [selectedSociety]);

  // Load flats when target society changes in resident registration
  useEffect(() => {
    if (!regSocietyId) return;
    setIsLoadingFlats(true);
    societyApi
      .getFlatsPublic(regSocietyId)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setAvailableFlats(list);
        if (list.length > 0) {
          // Prefer selecting a vacant flat first to avoid owner conflicts
          const preferredFlat = list.find((f) => f.occupancyStatus === "Vacant") || list[0];
          setRegForm((prev) => ({
            ...prev,
            wing: preferredFlat.wing || list[0].wing,
            flatNumber: preferredFlat.flatNumber || list[0].flatNumber,
            residentType: preferredFlat.occupancyStatus === "Occupied" ? "Tenant" : prev.residentType,
          }));
          setIsCustomFlat(false);
        } else {
          setRegForm((prev) => ({
            ...prev,
            wing: prev.wing || "A",
            flatNumber: prev.flatNumber || "101",
          }));
        }
      })
      .catch(() => {
        setAvailableFlats([]);
      })
      .finally(() => {
        setIsLoadingFlats(false);
      });
  }, [regSocietyId]);

  // Auto-fill demo credentials on role select
  useEffect(() => {
    if (selectedRole) {
      setEmail(`demo@${selectedRole}.com`);
    }
  }, [selectedRole]);

  // Distinct wings from loaded flats
  const distinctWings = Array.from(new Set(availableFlats.map((f) => f.wing))).sort();
  const flatsForSelectedWing = availableFlats.filter((f) => !regForm.wing || f.wing === regForm.wing);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authApi.login({
        email: email.trim(),
        password,
        societyId: selectedSociety?.id || selectedSociety?._id || regSocietyId,
      });

      const responseData = res?.data || res;
      const user = responseData?.user;
      const token = responseData?.token;
      const refreshToken = responseData?.refreshToken;
      const status = responseData?.membershipStatus || user?.membershipStatus;

      if (status === "Pending") {
        setIsLoading(false);
        setPendingApprovalData({
          name: user?.name || email,
          societyName: user?.societyName || selectedSociety?.name || "Harmony Society",
          wing: user?.wing || "",
          flatNumber: user?.flatNumber || "",
        });
        return;
      }

      if (status === "Rejected") {
        setIsLoading(false);
        toast.error("Your society membership application was not approved by the administrator.");
        return;
      }

      if (token && user) {
        toast.success(`Welcome back, ${user.name}!`);
        const effectiveSocietyId = user.societyId || selectedSociety?.id || selectedSociety?._id || regSocietyId;
        login(token, user, refreshToken, effectiveSocietyId);
        setIsLoading(false);
        const pathPrefix = user.role === "security" ? "guard" : user.role;
        navigate({ to: `/${pathPrefix}/dashboard` });
        return;
      }
    } catch (err) {
      setIsLoading(false);
      toast.error(err.message || "Invalid email or password.");
    }
  };

  const handleRegisterResident = async (e) => {
    e.preventDefault();

    if (regForm.password !== regForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (regForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    const resolvedFlatNumber = isCustomFlat ? customFlatNumber.trim() : regForm.flatNumber.trim();

    if (!regForm.wing || !resolvedFlatNumber) {
      toast.error("Please provide a valid wing and flat number.");
      return;
    }

    setIsSubmittingReg(true);

    try {
      const res = await authApi.registerResident({
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        password: regForm.password,
        societyId: regSocietyId,
        wing: regForm.wing.trim().toUpperCase(),
        flatNumber: resolvedFlatNumber,
        residentType: regForm.residentType,
        invitationToken: regForm.invitationToken.trim(),
      });

      const data = res?.data || res;
      setIsSubmittingReg(false);

      if (data?.membershipStatus === "Active") {
        toast.success("Registration verified & activated! Welcome to Harmony.");
        login(data.token, data.user, data.refreshToken, regSocietyId);
        navigate({ to: "/resident/dashboard" });
      } else {
        // Pending approval
        setPendingApprovalData({
          name: regForm.name,
          societyName:
            allSocieties.find((s) => (s.id || s._id) === regSocietyId)?.name ||
            selectedSociety?.name ||
            "Harmony Society",
          wing: regForm.wing,
          flatNumber: resolvedFlatNumber,
        });
      }
    } catch (err) {
      setIsSubmittingReg(false);
      toast.error(err.message || "Registration failed. Please check your details.");
    }
  };

  const handleRegisterSecretary = async (e) => {
    e.preventDefault();

    if (regForm.password !== regForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!regForm.invitationToken) {
      toast.error("Secretary registration for an existing society requires a valid Invitation Token.");
      return;
    }

    setIsSubmittingReg(true);

    try {
      const res = await authApi.registerSecretary({
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        password: regForm.password,
        societyId: regSocietyId,
        invitationToken: regForm.invitationToken.trim(),
      });

      const data = res?.data || res;
      setIsSubmittingReg(false);
      toast.success("Secretary registration verified successfully!");
      login(data.token, data.user, data.refreshToken, regSocietyId);
      navigate({ to: "/secretary/dashboard" });
    } catch (err) {
      setIsSubmittingReg(false);
      toast.error(err.message || "Secretary registration failed.");
    }
  };

  const handleRegisterGuard = async (e) => {
    e.preventDefault();

    if (regForm.password !== regForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!regForm.staffId) {
      toast.error("Staff ID is required.");
      return;
    }

    setIsSubmittingReg(true);

    try {
      const res = await authApi.registerGuard({
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        password: regForm.password,
        societyId: regSocietyId,
        staffId: regForm.staffId.trim(),
        shift: regForm.shift,
        invitationToken: regForm.invitationToken.trim(),
      });

      const data = res?.data || res;
      setIsSubmittingReg(false);

      if (data?.membershipStatus === "Active") {
        toast.success("Security guard registered and activated!");
        login(data.token, data.user, data.refreshToken, regSocietyId);
        navigate({ to: "/guard/dashboard" });
      } else {
        setPendingApprovalData({
          name: regForm.name,
          societyName:
            allSocieties.find((s) => (s.id || s._id) === regSocietyId)?.name ||
            selectedSociety?.name ||
            "Harmony Society",
          wing: `Staff ID: ${regForm.staffId}`,
          flatNumber: `Shift: ${regForm.shift}`,
        });
      }
    } catch (err) {
      setIsSubmittingReg(false);
      toast.error(err.message || "Security guard registration failed.");
    }
  };

  const displaySociety =
    selectedSociety || allSocieties.find((s) => (s.id || s._id) === regSocietyId) || allSocieties[0];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side: branding/image */}
      <div className="relative hidden w-1/2 flex-col bg-muted lg:flex">
        <img
          src={
            displaySociety?.coverImage ||
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200"
          }
          alt={displaySociety?.name || "Harmony Society"}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
        <div className="relative z-10 mt-auto p-12 text-foreground">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-14 rounded-2xl bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/30 p-2">
              <Building2 className="size-8 text-primary" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-primary font-semibold">
                Residential Management Portal
              </span>
              <h1 className="text-3xl font-bold">{displaySociety?.name || "Harmony Society"}</h1>
            </div>
          </div>
          <p className="text-sm text-foreground/80 max-w-md">
            {displaySociety?.address || "Premium Society Living & Smart Gate Management System."}
          </p>
        </div>
      </div>

      {/* Right side: Interactive Form Container */}
      <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-6 lg:w-1/2 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Top Header with Society Context & Change Link */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate({ to: "/select-society" })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Societies</span>
            </button>
            <span className="text-xs font-semibold text-primary font-mono truncate max-w-[200px]">
              {displaySociety?.name}
            </span>
          </div>

          {/* Top Segmented Navigation Tabs */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-card border border-border p-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setPendingApprovalData(null);
                setActiveTab("signin");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === "signin"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <LogIn className="size-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingApprovalData(null);
                setActiveTab("create_account");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === "create_account"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <UserPlus className="size-4" />
              Create Account
            </button>
          </div>

          {/* Banner: Add Society Located Outside */}
          <div className="mb-6 flex items-center justify-between text-xs py-2 px-3 bg-secondary/40 border border-border rounded-xl">
            <span className="text-muted-foreground">Admin onboarding a new society?</span>
            <button
              type="button"
              onClick={() => navigate({ to: "/societies/new" })}
              className="font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              + Add Society <Sparkles className="size-3" />
            </button>
          </div>

          {/* Pending Approval Modal/Card */}
          {pendingApprovalData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-4"
            >
              <div className="mx-auto size-14 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Clock className="size-7 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Application Under Review</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your registration for{" "}
                  <span className="font-semibold text-foreground">
                    {pendingApprovalData.wing && `${pendingApprovalData.wing}-`}
                    {pendingApprovalData.flatNumber}
                  </span>{" "}
                  in <span className="font-semibold text-foreground">{pendingApprovalData.societyName}</span> is
                  currently pending approval from the society administrator.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-4 text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Applicant Name</span>
                  <span className="font-medium text-foreground">{pendingApprovalData.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Current Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                    <Clock className="size-3" /> Pending Secretary Approval
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Once your residency is approved, you will have immediate access to complaints, maintenance dues,
                  and gate passes.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPendingApprovalData(null);
                    setActiveTab("signin");
                  }}
                >
                  Back to Sign In
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.info("Checking approval status with server...");
                    authApi
                      .login({
                        email: email || regForm.email,
                        password: password || regForm.password,
                        societyId: regSocietyId,
                      })
                      .then((res) => {
                        const status = res?.data?.membershipStatus;
                        if (status === "Active") {
                          toast.success("Congratulations! Your account has been approved.");
                          login(res.data.token, res.data.user, res.data.refreshToken, res.data.user?.societyId || regSocietyId);
                          navigate({ to: "/resident/dashboard" });
                        } else {
                          toast.info("Your application is still under review.");
                        }
                      })
                      .catch(() => {
                        toast.info("Your application is still under review.");
                      });
                  }}
                >
                  Check Status
                </Button>
              </div>
            </motion.div>
          ) : activeTab === "signin" ? (
            /* --- SIGN IN TAB --- */
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
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign In</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Select your role to access your society portal
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <RoleCard
                      title="Flat Member / Resident"
                      description="Flat owners and tenants to manage complaints, dues, and visitors."
                      icon={Home}
                      onClick={() => setSelectedRole("resident")}
                    />

                    <RoleCard
                      title="Secretary / Admin"
                      description="Society administrators to manage operations, members, and finances."
                      icon={Building2}
                      onClick={() => setSelectedRole("secretary")}
                    />

                    <RoleCard
                      title="Security Guard"
                      description="Gate security staff to log visitor check-ins and emergency alerts."
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
                    className="mb-6 flex items-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="mr-1.5 size-4" /> Change Role
                  </button>

                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground capitalize">
                      {selectedRole} Sign In
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter credentials for {displaySociety?.name || "Harmony Society"}.
                    </p>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                    {/* Demo Accounts Pill Selector */}
                    <div className="rounded-xl border border-border bg-card/60 p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <KeyRound className="size-3.5 text-primary" />
                        <span>Quick Demo Database Accounts:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(`demo@${selectedRole}.com`);
                            setPassword("password123");
                          }}
                          className="rounded-lg px-2.5 py-1 bg-secondary/80 text-secondary-foreground hover:bg-secondary font-mono text-[11px] transition-colors border border-border"
                        >
                          demo@{selectedRole}.com
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(
                              selectedRole === "security"
                                ? "guard@harmony.com"
                                : `${selectedRole}@harmony.com`
                            );
                            setPassword("password123");
                          }}
                          className="rounded-lg px-2.5 py-1 bg-secondary/80 text-secondary-foreground hover:bg-secondary font-mono text-[11px] transition-colors border border-border"
                        >
                          {selectedRole === "security" ? "guard" : selectedRole}@harmony.com
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Default Password:{" "}
                        <span className="font-mono text-primary font-semibold">password123</span>
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        placeholder={`demo@${selectedRole}.com`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground">Password</label>
                        <a href="#" className="text-xs font-medium text-primary hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative mt-1.5">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-10 mt-2" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Sign In"}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            /* --- CREATE ACCOUNT TAB --- */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select your role and complete society registration
                </p>
              </div>

              {/* Role Switcher for Registration */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-card border border-border p-1">
                {[
                  { role: "resident", label: "Resident" },
                  { role: "secretary", label: "Secretary" },
                  { role: "security", label: "Guard" },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setRegRole(item.role)}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                      regRole === item.role
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Common Society Picker */}
              <div>
                <label className="text-xs font-medium text-foreground">Select Society</label>
                <select
                  value={regSocietyId}
                  onChange={(e) => setRegSocietyId(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {allSocieties.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name} ({s.registrationNumber || s.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* ROLE SPECIFIC FORMS */}

              {/* 1. RESIDENT REGISTRATION */}
              {regRole === "resident" && (
                <form onSubmit={handleRegisterResident} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Wing / Tower</label>
                      <select
                        value={regForm.wing}
                        onChange={(e) => {
                          const w = e.target.value;
                          const filtered = availableFlats.filter((f) => f.wing === w);
                          setRegForm((prev) => ({
                            ...prev,
                            wing: w,
                            flatNumber: filtered.length > 0 ? filtered[0].flatNumber : "",
                          }));
                        }}
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs"
                      >
                        {distinctWings.length > 0 ? (
                          distinctWings.map((w) => (
                            <option key={w} value={w}>
                              Wing {w}
                            </option>
                          ))
                        ) : (
                          <option value="A">Wing A</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground">Flat Number</label>
                      <select
                        value={isCustomFlat ? "custom" : regForm.flatNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") {
                            setIsCustomFlat(true);
                          } else {
                            setIsCustomFlat(false);
                            const matched = availableFlats.find((f) => f.flatNumber === val);
                            setRegForm((prev) => ({
                              ...prev,
                              flatNumber: val,
                              residentType: matched?.occupancyStatus === "Occupied" ? "Tenant" : prev.residentType,
                            }));
                          }
                        }}
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs"
                      >
                        {flatsForSelectedWing.length > 0 ? (
                          flatsForSelectedWing.map((f) => (
                            <option key={f._id} value={f.flatNumber}>
                              {f.flatNumber} ({f.occupancyStatus})
                            </option>
                          ))
                        ) : (
                          <option value="101">101 (Vacant)</option>
                        )}
                        <option value="custom">+ Enter Custom Unit...</option>
                      </select>
                    </div>
                  </div>

                  {isCustomFlat && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label className="text-xs font-medium text-primary">Custom Flat / Unit Number</label>
                      <input
                        type="text"
                        required
                        value={customFlatNumber}
                        onChange={(e) => setCustomFlatNumber(e.target.value)}
                        placeholder="e.g. 102 or A-204"
                        className="mt-1 flex h-9 w-full rounded-lg border border-primary/50 bg-background px-3 py-1 text-xs focus:ring-1 focus:ring-primary"
                      />
                    </motion.div>
                  )}

                  {!isCustomFlat && availableFlats.find((f) => f.flatNumber === regForm.flatNumber)?.occupancyStatus === "Occupied" && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-600 dark:text-amber-400">
                      ⚠️ Flat {regForm.flatNumber} is already registered to an owner. Please register as <strong>Tenant</strong> or <strong>Family Member</strong>.
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-foreground">Resident Ownership Type</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {["Owner", "Tenant", "FamilyMember"].map((type) => {
                        const isFlatOccupied = !isCustomFlat && availableFlats.find((f) => f.flatNumber === regForm.flatNumber)?.occupancyStatus === "Occupied";
                        const isOwnerBlocked = type === "Owner" && isFlatOccupied;

                        return (
                          <button
                            key={type}
                            type="button"
                            disabled={isOwnerBlocked}
                            onClick={() => setRegForm({ ...regForm, residentType: type })}
                            className={`py-1.5 text-xs rounded-lg border transition-all ${
                              regForm.residentType === type
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : isOwnerBlocked
                                ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
                                : "border-border text-muted-foreground hover:bg-muted/50"
                            }`}
                          >
                            {type === "FamilyMember" ? "Family" : type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Email</label>
                      <input
                        type="email"
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="priya@example.com"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Mobile Number</label>
                      <input
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="9876543210"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          placeholder="Min 6 chars"
                          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 pr-8 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showRegPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Confirm Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showRegConfirmPassword ? "text" : "password"}
                          required
                          value={regForm.confirmPassword}
                          onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                          placeholder="Repeat password"
                          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 pr-8 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showRegConfirmPassword ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center justify-between">
                      <span>Invitation Code (Optional)</span>
                      <span className="text-[10px] text-muted-foreground">For instant auto-approval</span>
                    </label>
                    <input
                      type="text"
                      value={regForm.invitationToken}
                      onChange={(e) => setRegForm({ ...regForm, invitationToken: e.target.value })}
                      placeholder="Paste single-use invite code if provided by Secretary"
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs font-mono"
                    />
                  </div>

                  <Button type="submit" className="w-full h-10 mt-1" disabled={isSubmittingReg}>
                    {isSubmittingReg ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      "Register Resident Account"
                    )}
                  </Button>
                </form>
              )}

              {/* 2. SECRETARY REGISTRATION */}
              {regRole === "secretary" && (
                <form onSubmit={handleRegisterSecretary} className="space-y-3.5">
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-foreground space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-500">
                      <Sparkles className="size-4" />
                      <span>Onboarding a New Society?</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      If you are registering a brand-new residential complex, click the{" "}
                      <span
                        onClick={() => navigate({ to: "/societies/new" })}
                        className="text-primary font-semibold underline cursor-pointer"
                      >
                        Register Society
                      </span>{" "}
                      button in the top header.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="e.g. Rahul Patil"
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Secretary Email</label>
                      <input
                        type="email"
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="secretary@harmony.com"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Mobile</label>
                      <input
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="9876543210"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Password</label>
                      <input
                        type="password"
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Confirm</label>
                      <input
                        type="password"
                        required
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center justify-between">
                      <span>Secretary Invitation Token (Required)</span>
                      <span className="text-[10px] text-primary">Board Authorized</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.invitationToken}
                      onChange={(e) => setRegForm({ ...regForm, invitationToken: e.target.value })}
                      placeholder="Enter single-use Secretary Handover Token"
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs font-mono"
                    />
                  </div>

                  <Button type="submit" className="w-full h-10 mt-1" disabled={isSubmittingReg}>
                    {isSubmittingReg ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      "Claim & Verify Secretary Access"
                    )}
                  </Button>
                </form>
              )}

              {/* 3. GUARD REGISTRATION */}
              {regRole === "security" && (
                <form onSubmit={handleRegisterGuard} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Staff / Guard ID</label>
                      <input
                        type="text"
                        required
                        value={regForm.staffId}
                        onChange={(e) => setRegForm({ ...regForm, staffId: e.target.value })}
                        placeholder="e.g. SEC-104"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Shift</label>
                      <select
                        value={regForm.shift}
                        onChange={(e) => setRegForm({ ...regForm, shift: e.target.value })}
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs"
                      >
                        <option value="General">General (Day)</option>
                        <option value="Morning">Morning Shift</option>
                        <option value="Evening">Evening Shift</option>
                        <option value="Night">Night Shift</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="e.g. Amit Sharma"
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Email</label>
                      <input
                        type="email"
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="guard@example.com"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Phone</label>
                      <input
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="9876543210"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Password</label>
                      <input
                        type="password"
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Confirm</label>
                      <input
                        type="password"
                        required
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center justify-between">
                      <span>Guard Invitation Token (Optional)</span>
                      <span className="text-[10px] text-muted-foreground">For instant auto-activation</span>
                    </label>
                    <input
                      type="text"
                      value={regForm.invitationToken}
                      onChange={(e) => setRegForm({ ...regForm, invitationToken: e.target.value })}
                      placeholder="Paste invite code if provided by Administrator"
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs font-mono"
                    />
                  </div>

                  <Button type="submit" className="w-full h-10 mt-1" disabled={isSubmittingReg}>
                    {isSubmittingReg ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      "Register Security Guard"
                    )}
                  </Button>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleCard({ title, description, icon: Icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
