import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { optimizeImageUrl } from "@/lib/utils";
import { useSociety } from "@/contexts/SocietyContext";
import {
  Search,
  MapPin,
  Building2,
  Users,
  ArrowRight,
  ShieldAlert,
  Wrench,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export const Route = createFileRoute("/select-society")({
  component: SelectSocietyPage,
});

function SelectSocietyPage() {
  const { availableSocieties, selectSociety, refreshSocieties } = useSociety();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("alphabetical");

  // Re-fetch fresh societies from MongoDB Atlas on mount
  useEffect(() => {
    if (refreshSocieties) {
      refreshSocieties();
    }
  }, [refreshSocieties]);

  // Extract unique cities and types for filters
  const cities = ["All", ...Array.from(new Set(availableSocieties.map((s) => s.city)))];
  const types = ["All", ...Array.from(new Set(availableSocieties.map((s) => s.type)))];

  const filteredAndSortedSocieties = useMemo(() => {
    let filtered = availableSocieties.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === "All" || s.city === cityFilter;
      const matchesType = typeFilter === "All" || s.type === typeFilter;
      return matchesSearch && matchesCity && matchesType;
    });

    if (sortBy === "alphabetical") {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "flats") {
      filtered = filtered.sort((a, b) => b.totalFlats - a.totalFlats);
    }
    return filtered;
  }, [availableSocieties, search, cityFilter, typeFilter, sortBy]);

  const handleSelect = (society) => {
    if (society.status === "Inactive" || society.status === "Suspended") {
      toast.error(`Cannot login. This society is marked as ${society.status}.`);
      return;
    }
    // Store society and go to society details page
    // Wait, the details page requires the ID in URL. So we navigate there.
    navigate({ to: `/societies/${society.id}` });
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case "Active":
        return <ShieldCheck className="size-4 mr-1 text-green-500" />;
      case "Under Maintenance":
        return <Wrench className="size-4 mr-1 text-amber-500" />;
      default:
        return <ShieldAlert className="size-4 mr-1 text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Under Maintenance":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-red-500/10 text-red-600 border-red-500/20";
    }
  };

  const FloatingAddButton = ({ onClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
      if (isExpanded) {
        const t = setTimeout(() => setIsExpanded(false), 3000);
        return () => clearTimeout(t);
      }
    }, [isExpanded]);

    return (
      <motion.button
        className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-50 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg border border-primary/20 backdrop-blur-md overflow-hidden h-[56px] md:hidden"
        onClick={(e) => {
          e.stopPropagation();
          if (!isExpanded) setIsExpanded(true);
          else onClick();
        }}
        onHoverStart={() => setIsExpanded(true)}
        onHoverEnd={() => setIsExpanded(false)}
        animate={{ width: isExpanded ? 150 : 56 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-label="Add New Society"
      >
        <div className="flex items-center justify-center w-[56px] shrink-0">
          <Plus className="size-6" />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="whitespace-nowrap pr-5 font-semibold text-sm"
            >
              Add Society
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-12">
      {/* Premium Header */}
      <div className="bg-background border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-6">
          <div className="flex flex-row items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Welcome to Harmony
              </h1>
              <p className="text-muted-foreground mt-0.5 text-xs md:text-lg">
                Select your society to continue
              </p>
            </div>

            <Button
              onClick={() => navigate({ to: "/societies/new" })}
              className="flex items-center text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all h-9 sm:h-10 px-3 sm:px-4 shrink-0"
            >
              <Plus className="mr-1.5 size-4" /> Add New Society
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 md:mt-8 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 md:top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search society by name..."
                className="pl-9 h-10 md:h-11 bg-muted/50 border-muted w-full text-sm md:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-row gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 -mb-1">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="flex-none w-[120px] md:w-[160px] h-10 md:h-11 bg-muted/50 text-xs md:text-sm px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="flex-none w-[130px] md:w-[160px] h-10 md:h-11 bg-muted/50 text-xs md:text-sm px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-none w-[120px] md:w-[160px] h-10 md:h-11 bg-muted/50 text-xs md:text-sm px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                  <SelectItem value="flats">Largest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-12">
        <AnimatePresence>
          {filteredAndSortedSocieties.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
            >
              {filteredAndSortedSocieties.map((society, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  key={society.id}
                  onClick={() => handleSelect(society)}
                  className="group relative bg-card rounded-[16px] sm:rounded-[20px] border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-row sm:flex-col h-[130px] sm:h-full hover:border-primary/50 w-full max-w-none"
                >
                  {/* Image (Mobile & Desktop) */}
                  <div className="w-[110px] shrink-0 sm:w-full sm:aspect-[16/9] overflow-hidden relative bg-muted h-full sm:h-auto">
                    <img
                      src={optimizeImageUrl(society.coverImage, 400)}
                      alt={society.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-muted"
                    />
                    <div className="absolute inset-0 sm:bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:via-black/30" />
                    <div className="sm:hidden absolute inset-0 bg-black/20" />
                    
                    {/* Desktop Status */}
                    <div
                      className={`hidden sm:flex absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold border items-center backdrop-blur-md ${getStatusColor(society.status)}`}
                    >
                      <StatusIcon status={society.status} /> {society.status}
                    </div>

                    {/* Mobile Logo Overlaid */}
                    <div className="sm:hidden absolute bottom-2 left-2 size-10 rounded-full border-2 border-background shadow-md overflow-hidden bg-background">
                      <img
                        src={optimizeImageUrl(society.logo, 100)}
                        alt={society.name}
                        loading="lazy"
                        className="size-full object-cover bg-muted"
                      />
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="relative p-3 sm:px-4 md:px-6 sm:pb-5 md:pb-6 sm:pt-10 md:pt-12 flex-1 flex flex-col min-w-0 justify-center sm:justify-start">
                    {/* Desktop Logo */}
                    <div className="hidden sm:block absolute -top-8 md:-top-10 left-4 md:left-6">
                      <div className="size-16 md:size-20 lg:size-24 rounded-full bg-background p-1 shadow-lg border border-border">
                        <img
                          src={optimizeImageUrl(society.logo, 150)}
                          alt={society.name}
                          loading="lazy"
                          className="size-full rounded-full object-cover bg-muted"
                        />
                      </div>
                    </div>

                    {/* Header & Status */}
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-sm sm:text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 sm:line-clamp-2">
                        {society.name}
                      </h3>
                      {/* Mobile Status */}
                      <div
                        className={`sm:hidden px-1.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center shrink-0 ${getStatusColor(society.status)}`}
                      >
                        <StatusIcon status={society.status} />
                        <span className="hidden min-[400px]:inline ml-1">{society.status}</span>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1 text-muted-foreground text-[11px] sm:text-xs md:text-sm mb-2 sm:mb-4">
                      <MapPin className="size-3 md:size-4 shrink-0 mt-0.5 hidden sm:block" />
                      <p className="line-clamp-1 sm:line-clamp-2">
                        {society.city} <span className="hidden sm:inline">• {society.address}</span>
                      </p>
                    </div>

                    {/* Desktop Metrics Grid */}
                    <div className="hidden sm:grid grid-cols-2 gap-y-2 md:gap-y-3 gap-x-2 text-xs md:text-sm mt-auto border-t border-border/50 pt-3 md:pt-4">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Building2 className="size-3.5 md:size-4 text-primary" />
                        <span className="font-medium">{society.totalFlats} Flats</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Users className="size-3.5 md:size-4 text-blue-500" />
                        <span className="font-medium">{society.totalResidents} Res.</span>
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {society.wings.length} Wings
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider text-right">
                        {society.type}
                      </div>
                    </div>

                    {/* Mobile Metrics Text */}
                    <div className="sm:hidden mt-auto flex flex-col gap-0.5 text-[11px] text-muted-foreground">
                      <div>
                        <span className="font-semibold text-foreground">{society.totalFlats}</span> Flats • <span className="font-semibold text-foreground">{society.totalResidents}</span> Res.
                      </div>
                      <div>
                        {society.wings.length} Wings • {society.type}
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay Button (Desktop Only) */}
                  <div className="hidden sm:block absolute inset-x-0 bottom-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out p-3 text-center">
                    <span className="text-primary-foreground font-bold flex items-center justify-center gap-2">
                      Select Society <ArrowRight className="size-4" />
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Dedicated "Add Society" Card in Grid */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => navigate({ to: "/societies/new" })}
                className="group relative bg-card/60 hover:bg-card rounded-[16px] sm:rounded-[20px] border-2 border-dashed border-border hover:border-primary/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-6 text-center h-[130px] sm:h-full min-h-[130px] sm:min-h-[280px]"
              >
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="size-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  + Add New Society
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px] hidden sm:block">
                  Can't find your residential complex? Register your society directly to MongoDB.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Search className="size-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Societies Found</h3>
              <p className="text-muted-foreground max-w-sm">
                We couldn't find any societies matching your current filters. Try adjusting your
                search criteria.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearch("");
                  setCityFilter("All");
                  setTypeFilter("All");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Floating Action Button */}
      <FloatingAddButton onClick={() => navigate({ to: "/societies/new" })} />
    </div>
  );
}
