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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Welcome to Harmony
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-lg">
                Select your society to continue
              </p>
            </div>

            <Button
              onClick={() => navigate({ to: "/societies/new" })}
              className="shadow-lg hover:shadow-xl transition-all w-full md:w-auto h-11 md:h-10"
            >
              <Plus className="mr-2 size-4" /> Add New Society
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 md:mt-8 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3.5 md:top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search society by name or address..."
                className="pl-9 h-11 bg-muted/50 border-muted w-full text-sm md:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-row gap-2 w-full md:w-auto overflow-hidden">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="flex-1 min-w-0 h-11 md:w-[160px] md:flex-none bg-muted/50 text-xs md:text-sm px-2 md:px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
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
                <SelectTrigger className="flex-1 min-w-0 h-11 md:w-[160px] md:flex-none bg-muted/50 text-xs md:text-sm px-2 md:px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
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
                <SelectTrigger className="flex-1 min-w-0 h-11 md:w-[160px] md:flex-none bg-muted/50 text-xs md:text-sm px-2 md:px-3 [&>span]:truncate [&>span]:w-full [&>span]:text-left">
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
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
                  className="group relative bg-card rounded-[20px] border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full hover:border-primary/50 w-full max-w-none"
                >
                  <div className="h-32 md:h-40 w-full overflow-hidden relative">
                    <img
                      src={society.coverImage}
                      alt={society.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div
                      className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold border flex items-center backdrop-blur-md ${getStatusColor(society.status)}`}
                    >
                      <StatusIcon status={society.status} /> {society.status}
                    </div>
                  </div>

                  <div className="relative px-4 md:px-6 pb-5 md:pb-6 pt-10 md:pt-12 flex-1 flex flex-col">
                    <div className="absolute -top-8 md:-top-10 left-4 md:left-6">
                      <div className="size-16 md:size-20 rounded-xl bg-background p-1 shadow-lg border border-border">
                        <img
                          src={society.logo}
                          alt={society.name}
                          className="size-full rounded-lg object-cover"
                        />
                      </div>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {society.name}
                    </h3>

                    <div className="flex items-start gap-1.5 text-muted-foreground text-xs md:text-sm mb-4">
                      <MapPin className="size-3.5 md:size-4 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">
                        {society.address}, {society.city}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 md:gap-y-3 gap-x-2 text-xs md:text-sm mt-auto border-t border-border/50 pt-3 md:pt-4">
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
                  </div>

                  {/* Hover Overlay Button */}
                  <div className="absolute inset-x-0 bottom-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out p-3 text-center">
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
    </div>
  );
}
