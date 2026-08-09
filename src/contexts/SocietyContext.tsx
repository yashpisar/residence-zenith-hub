import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  getSocieties, 
  getSocietyById as getSocietyByIdService, 
  createSociety as createSocietyService, 
  updateSocietyData, 
  deleteSocietyData, 
  initDemoSocietiesIfEmpty 
} from "@/services/society.service";

export type SocietyStatus = "Active" | "Under Maintenance" | "Inactive" | "Suspended";

export type Wing = {
  id: string;
  name: string;
  totalFlats: number;
};

export type Society = {
  id: string;
  societyId: string;
  name: string;
  registrationNumber: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  logo: string;
  coverImage: string;
  secretaryName: string;
  secretaryMobile: string;
  secretaryEmail: string;
  officeTiming: string;
  emergencyContact: string;
  wings: Wing[];
  totalFlats: number;
  totalResidents: number;
  occupiedFlats: number;
  vacantFlats: number;
  amenities: string[];
  status: SocietyStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

type SocietyContextType = {
  selectedSociety: Society | null;
  selectSociety: (society: Society) => void;
  clearSociety: () => void;
  availableSocieties: Society[];
  addSociety: (society: Omit<Society, "id" | "societyId" | "createdAt" | "updatedAt">) => Society;
  updateSociety: (id: string, society: Partial<Society>) => void;
  deleteSociety: (id: string) => void;
  getSocietyById: (id: string) => Society | undefined;
  switchSociety: () => void;
};

const SocietyContext = createContext<SocietyContextType | null>(null);

const DEFAULT_SOCIETIES: Society[] = [
  {
    id: "SOC-PUN-001",
    societyId: "SOC-PUN-001",
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
    wings: [{ id: "w1", name: "A", totalFlats: 100 }, { id: "w2", name: "B", totalFlats: 100 }, { id: "w3", name: "C", totalFlats: 50 }],
    totalFlats: 250,
    totalResidents: 520,
    occupiedFlats: 220,
    vacantFlats: 30,
    amenities: ["Gym", "Garden", "Swimming Pool", "Club House", "Parking"],
    status: "Active",
    description: "Premium living community in the heart of Pune.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "SOC-MUM-002",
    societyId: "SOC-MUM-002",
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
    wings: [{ id: "w1", name: "A", totalFlats: 90 }, { id: "w2", name: "B", totalFlats: 90 }],
    totalFlats: 180,
    totalResidents: 390,
    occupiedFlats: 150,
    vacantFlats: 30,
    amenities: ["Garden", "Parking", "Gym", "Children Play Area"],
    status: "Active",
    description: "Serene living spaces offering tranquility in Mumbai.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

export function SocietyProvider({ children }: { children: ReactNode }) {
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [availableSocieties, setAvailableSocieties] = useState<Society[]>([]);

  useEffect(() => {
    const initialized = initDemoSocietiesIfEmpty(DEFAULT_SOCIETIES);
    setAvailableSocieties(initialized);

    const storedSelected = localStorage.getItem("havenly.societyId");
    if (storedSelected) {
      const found = initialized.find((s) => s.id === storedSelected);
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

  const switchSociety = () => {
    clearSociety();
    window.location.href = "/select-society";
  };

  const addSociety = (data: Omit<Society, "id" | "societyId" | "createdAt" | "updatedAt">) => {
    const newSociety = createSocietyService(data);
    setAvailableSocieties(getSocieties());
    return newSociety;
  };

  const updateSociety = (id: string, updates: Partial<Society>) => {
    updateSocietyData(id, updates);
    setAvailableSocieties(getSocieties());
    if (selectedSociety?.id === id) {
      setSelectedSociety(getSocietyByIdService(id) || null);
    }
  };

  const deleteSociety = (id: string) => {
    deleteSocietyData(id);
    setAvailableSocieties(getSocieties());
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
        getSocietyById: getSocietyByIdService,
        switchSociety,
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
