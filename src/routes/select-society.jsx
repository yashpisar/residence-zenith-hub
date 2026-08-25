import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  const { availableSocieties, selectSociety } = useSociety();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [fabExpanded, setFabExpanded] = useState(false);

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

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Premium Header */}
      <div className="bg-background border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6">
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Welcome to Harmony
              </h1>
              <p className="text-muted-foreground text-xs md:text-lg">
                Select your society to continue
              </p>
            </div>

            <Button
              onClick={() => navigate({ to: "/societies/new" })}
              className="shadow-lg hover:shadow-xl transition-all hidden md:inline-flex h-10"
            >
              <Plus className="mr-2 size-4" /> Add New Society
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="mt-3 md:mt-8 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1 w-full shrink-0">
              <Search className="absolute left-3 top-3.5 md:top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search society by name or address..."
                className="pl-9 h-11 bg-muted/50 border-muted w-full text-sm md:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-row gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 -mb-1">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="flex-1 min-w-[110px] h-11 md:w-[160px] md:flex-none bg-muted/50 text-xs md:text-sm px-2 md:px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
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
                <SelectTrigger className="flex-1 min-w-[110px] h-11 md:w-[160px] md:flex-none bg-muted/50 text-xs md:text-sm px-2 md:px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
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
                <SelectTrigger className="flex-1 min-w-[110px] h-11 md:w-[160px] md:flex-none bg-muted/50 text-xs md:text-sm px-2 md:px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
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
                  className="group relative bg-card rounded-xl md:rounded-[20px] border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-row md:flex-col h-[120px] sm:h-[140px] md:h-full hover:border-primary/50 w-full"
                >
                  <div className="w-[110px] sm:w-[130px] md:w-full shrink-0 h-full md:aspect-[16/9] md:h-auto overflow-hidden relative bg-muted">
                    <img
                      src={society.coverImage}
                      alt={society.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent hidden md:block" />
                    <div
                      className={`hidden md:flex absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold border items-center backdrop-blur-md ${getStatusColor(society.status)}`}
                    >
                      <StatusIcon status={society.status} /> {society.status}
                    </div>
                  </div>

                  <div className="relative p-3 sm:p-4 md:px-6 md:pb-6 md:pt-12 flex-1 flex flex-col min-w-0">
                    <div className="absolute -top-10 left-6 hidden md:block">
                      <div className="size-20 lg:size-24 rounded-full bg-background p-1 shadow-lg border border-border">
                        <img
                          src={society.logo}
                          alt={society.name}
                          className="size-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-0.5 md:mb-1">
                      <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {society.name}
                      </h3>
                      <div className={`md:hidden shrink-0 flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${getStatusColor(society.status)}`}>
                         <StatusIcon status={society.status} /> {society.status}
                      </div>
                    </div>

                    <div className="flex items-start gap-1 text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-2 md:mb-4">
                      <MapPin className="size-3 md:size-4 shrink-0 mt-[1px] md:mt-0.5" />
                      <p className="truncate md:line-clamp-2 md:whitespace-normal">
                        {society.city}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 md:gap-y-3 gap-x-2 text-[10px] sm:text-xs md:text-sm mt-auto border-t border-border/50 pt-2 md:pt-4">
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <Building2 className="size-3 md:size-4 text-primary shrink-0" />
                        <span className="font-medium truncate">{society.totalFlats} Flats</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <Users className="size-3 md:size-4 text-blue-500 shrink-0" />
                        <span className="font-medium truncate">{society.totalResidents} Res.</span>
                      </div>
                      <div className="text-muted-foreground font-medium uppercase tracking-wider truncate">
                        {society.wings.length} Wings
                      </div>
                      <div className="text-muted-foreground font-medium uppercase tracking-wider text-right md:text-left truncate">
                        {society.type}
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay Button */}
                  <div className="hidden md:block absolute inset-x-0 bottom-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out p-3 text-center z-10">
                    <span className="text-primary-foreground font-bold flex items-center justify-center gap-2">
                      Select Society <ArrowRight className="size-4" />
                    </span>
                  </div>
                </motion.div>
              ))}
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

      {/* Mobile Floating Action Button (FAB) */}
      <motion.button
        className="fixed z-50 md:hidden flex items-center justify-center gap-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-primary text-primary-foreground overflow-hidden border border-white/20"
        style={{ bottom: "calc(16px + env(safe-area-inset-bottom))", right: "16px", height: "56px" }}
        initial={false}
        animate={{ width: fabExpanded ? 144 : 56 }}
        onClick={(e) => {
           if (!fabExpanded) {
               e.preventDefault();
               setFabExpanded(true);
               setTimeout(() => setFabExpanded(false), 3000);
           } else {
               navigate({ to: "/societies/new" });
           }
        }}
        aria-label="Add New Society"
      >
         <Plus className="size-6 shrink-0" />
         <AnimatePresence>
           {fabExpanded && (
             <motion.span
               initial={{ opacity: 0, width: 0 }}
               animate={{ opacity: 1, width: "auto" }}
               exit={{ opacity: 0, width: 0 }}
               className="whitespace-nowrap font-semibold pr-4 text-sm"
             >
               Add Society
             </motion.span>
           )}
         </AnimatePresence>
      </motion.button>
    </div>
  );
}
