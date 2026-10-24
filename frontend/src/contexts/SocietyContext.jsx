import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { storage } from "@/lib/storage";
import { societyApi } from "@/services/api";
import {
  getSocieties,
  getSocietyById as getSocietyByIdService,
  createSociety as createSocietyService,
  updateSocietyData,
  deleteSocietyData,
  initDemoSocietiesIfEmpty,
} from "@/services/society.service";

const SocietyContext = createContext(null);

const DEFAULT_SOCIETIES = [
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
    coverImage:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=2000",
    logo: "https://ui-avatars.com/api/?name=Harmony+Heights&background=14B8A6&color=fff&rounded=true",
    wings: [
      { id: "w1", name: "A", totalFlats: 100 },
      { id: "w2", name: "B", totalFlats: 100 },
      { id: "w3", name: "C", totalFlats: 50 },
    ],
    totalFlats: 250,
    totalResidents: 520,
    occupiedFlats: 220,
    vacantFlats: 30,
    amenities: ["Gym", "Garden", "Swimming Pool", "Club House", "Parking"],
    status: "Active",
    description: "Premium living community in the heart of Pune.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    coverImage:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000",
    logo: "https://ui-avatars.com/api/?name=Green+Valley+Residency&background=3B82F6&color=fff&rounded=true",
    wings: [
      { id: "w1", name: "A", totalFlats: 90 },
      { id: "w2", name: "B", totalFlats: 90 },
    ],
    totalFlats: 180,
    totalResidents: 390,
    occupiedFlats: 150,
    vacantFlats: 30,
    amenities: ["Garden", "Parking", "Gym", "Children Play Area"],
    status: "Active",
    description: "Serene living spaces offering tranquility in Mumbai.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function SocietyProvider({ children }) {
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [availableSocieties, setAvailableSocieties] = useState(DEFAULT_SOCIETIES);

  useEffect(() => {
    const initialized = initDemoSocietiesIfEmpty(DEFAULT_SOCIETIES);
    setAvailableSocieties(initialized);

    let storedSelected = storage.getItem("havenly.societyId");
    if (!storedSelected) {
      try {
        const storedUser = storage.getItem("havenly.user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.societyId) {
            storedSelected = u.societyId;
            storage.setItem("havenly.societyId", storedSelected);
          }
        }
      } catch (e) {}
    }

    if (storedSelected) {
      const found = initialized.find(
        (s) =>
          s.id === storedSelected ||
          s.societyId === storedSelected ||
          s._id?.toString() === storedSelected.toString() ||
          s.registrationNumber === storedSelected
      );
      if (found) setSelectedSociety(found);
    }

    // Query backend API for live MongoDB Atlas societies
    societyApi.getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (list.length > 0) {
          setAvailableSocieties(list);
          if (storedSelected) {
            const foundApi = list.find(
              (s) =>
                s.id === storedSelected ||
                s.societyId === storedSelected ||
                s._id?.toString() === storedSelected.toString() ||
                s.registrationNumber === storedSelected
            );
            if (foundApi) {
              setSelectedSociety(foundApi);
            } else {
              // Try fetching directly by ID if not in list
              societyApi.getById(storedSelected)
                .then((singleRes) => {
                  const s = singleRes?.data || singleRes;
                  if (s && (s.id || s._id)) setSelectedSociety(s);
                })
                .catch(() => {});
            }
          }
        }
      })
      .catch((err) => {
        console.log("[SocietyContext] Offline/cached mode:", err.message);
      });
  }, []);

  const selectSociety = useCallback((society) => {
    if (!society) return;
    setSelectedSociety(society);
    const sid = society._id || society.id || society.societyId || society.registrationNumber;
    if (sid) {
      storage.setItem("havenly.societyId", sid);
    }
  }, []);

  const clearSociety = useCallback(() => {
    setSelectedSociety(null);
    storage.removeItem("havenly.societyId");
  }, []);

  const switchSociety = useCallback(() => {
    clearSociety();
    window.location.href = "/select-society";
  }, [clearSociety]);

  const refreshSocieties = useCallback(async () => {
    try {
      const res = await societyApi.getAll();
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (list && list.length > 0) {
        setAvailableSocieties(list);
      }
      return list;
    } catch (e) {
      console.log("[SocietyContext] Offline/cached:", e.message);
      return [];
    }
  }, []);

  const addSociety = useCallback(async (data) => {
    try {
      const res = await societyApi.create(data);
      const created = res?.data || res;
      if (created) {
        // Re-fetch all societies directly from MongoDB Atlas
        await refreshSocieties();
        return created;
      }
    } catch (e) {
      console.error("[SocietyContext] Failed to store society in database:", e.message);
      throw e;
    }
  }, [refreshSocieties]);

  const updateSociety = useCallback((id, updates) => {
    updateSocietyData(id, updates);
    setAvailableSocieties(getSocieties());
    setSelectedSociety((prev) => {
      if (prev?.id === id) return getSocietyByIdService(id) || null;
      return prev;
    });
  }, []);

  const deleteSociety = useCallback((id) => {
    deleteSocietyData(id);
    setAvailableSocieties(getSocieties());
    setSelectedSociety((prev) => {
      if (prev?.id === id) {
        storage.removeItem("havenly.societyId");
        return null;
      }
      return prev;
    });
  }, []);

  const contextValue = useMemo(() => ({
    selectedSociety,
    selectSociety,
    clearSociety,
    availableSocieties,
    refreshSocieties,
    addSociety,
    updateSociety,
    deleteSociety,
    getSocietyById: getSocietyByIdService,
    switchSociety,
  }), [
    selectedSociety,
    selectSociety,
    clearSociety,
    availableSocieties,
    refreshSocieties,
    addSociety,
    updateSociety,
    deleteSociety,
    switchSociety,
  ]);

  return (
    <SocietyContext.Provider value={contextValue}>
      {children}
    </SocietyContext.Provider>
  );
}

export const useSociety = () => {
  const context = useContext(SocietyContext);
  if (!context) {
    throw new Error("useSociety must be used within a SocietyProvider");
  }
  return context;
};
