import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

export type SocietyStatus = "Active" | "Under Maintenance" | "Inactive" | "Suspended";

export type Society = {
  id: string;
  name: string;
  registrationNumber: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  secretaryName: string;
  secretaryMobile: string;
  secretaryEmail: string;
  officeTiming: string;
  emergencyContact: string;
  coverImage: string;
  logo: string;
  wings: string[];
  totalFlats: number;
  totalResidents: number;
  amenities: string[];
  status: SocietyStatus;
  description?: string;
  settings?: any;
};

type SocietyContextType = {
  selectedSociety: Society | null;
  selectSociety: (society: Society) => void;
  clearSociety: () => void;
  availableSocieties: Society[];
  addSociety: (society: Society) => void;
  updateSociety: (id: string, society: Partial<Society>) => void;
  deleteSociety: (id: string) => void;
};

const SocietyContext = createContext<SocietyContextType | null>(null);

const DEFAULT_SOCIETIES: Society[] = [
  {
    id: "SOC-PUN-001",
    name: "Harmony Heights",
    registrationNumber: "SOC-PUN-001",
    type: "Apartment",
    address: "412 Link Road, Wakad",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411057",
    secretaryName: "Rahul Patil",
    secretaryMobile: "9876543210",
    secretaryEmail: "rahul.patil@harmony.com",
    officeTiming: "10:00 AM - 6:00 PM",
    emergencyContact: "1800-111-2222",
    coverImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=2000",
    logo: "https://ui-avatars.com/api/?name=Harmony+Heights&background=14B8A6&color=fff&rounded=true",
    wings: ["A", "B", "C"],
    totalFlats: 250,
    totalResidents: 520,
    amenities: ["Gym", "Garden", "Swimming Pool", "Club House", "Parking"],
    status: "Active",
    description: "Premium living community in the heart of Pune.",
  },
  {
    id: "SOC-MUM-002",
    name: "Green Valley Residency",
    registrationNumber: "SOC-MUM-002",
    type: "Residential Complex",
    address: "Cyber City, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400053",
    secretaryName: "Priya Sharma",
    secretaryMobile: "9988776655",
    secretaryEmail: "priya.sharma@greenvalley.com",
    officeTiming: "9:00 AM - 5:00 PM",
    emergencyContact: "1800-333-4444",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000",
    logo: "https://ui-avatars.com/api/?name=Green+Valley+Residency&background=3B82F6&color=fff&rounded=true",
    wings: ["A", "B"],
    totalFlats: 180,
    totalResidents: 390,
    amenities: ["Garden", "Parking", "Gym", "Children Play Area"],
    status: "Active",
    description: "Serene living spaces offering tranquility in Mumbai.",
  },
];

export function SocietyProvider({ children }: { children: ReactNode }) {
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [availableSocieties, setAvailableSocieties] = useState<Society[]>(DEFAULT_SOCIETIES);

  useEffect(() => {
    // Load custom societies from localStorage if available
    const storedSocieties = localStorage.getItem("havenly.customSocieties");
    if (storedSocieties) {
      try {
        setAvailableSocieties(JSON.parse(storedSocieties));
      } catch (e) {}
    } else {
      localStorage.setItem("havenly.customSocieties", JSON.stringify(DEFAULT_SOCIETIES));
    }

    const storedSelected = localStorage.getItem("havenly.societyId");
    if (storedSelected) {
      const found = availableSocieties.find((s) => s.id === storedSelected) || DEFAULT_SOCIETIES.find((s) => s.id === storedSelected);
      if (found) setSelectedSociety(found);
    }
  }, []);

  const selectSociety = (society: Society) => {
    setSelectedSociety(society);
    localStorage.setItem("havenly.societyId", society.id);
  };

  const clearSociety = () => {
    setSelectedSociety(null);
    localStorage.removeItem("havenly.societyId");
  };

  const addSociety = (society: Society) => {
    const updated = [...availableSocieties, society];
    setAvailableSocieties(updated);
    localStorage.setItem("havenly.customSocieties", JSON.stringify(updated));
  };

  const updateSociety = (id: string, updates: Partial<Society>) => {
    const updated = availableSocieties.map(s => s.id === id ? { ...s, ...updates } : s);
    setAvailableSocieties(updated);
    localStorage.setItem("havenly.customSocieties", JSON.stringify(updated));
    if (selectedSociety?.id === id) {
      setSelectedSociety({ ...selectedSociety, ...updates });
    }
  };

  const deleteSociety = (id: string) => {
    const updated = availableSocieties.filter(s => s.id !== id);
    setAvailableSocieties(updated);
    localStorage.setItem("havenly.customSocieties", JSON.stringify(updated));
    if (selectedSociety?.id === id) {
      clearSociety();
    }
  };

  return (
    <SocietyContext.Provider
      value={{
        selectedSociety,
        selectSociety,
        clearSociety,
        availableSocieties,
        addSociety,
        updateSociety,
        deleteSociety,
      }}
    >
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  const context = useContext(SocietyContext);
  if (!context) {
    throw new Error("useSociety must be used within a SocietyProvider");
  }
  return context;
}
