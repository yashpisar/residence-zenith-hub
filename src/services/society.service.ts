import { Society, SocietyStatus } from "@/contexts/SocietyContext";

const STORAGE_KEY = "societies";

export const getSocieties = (): Society[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse societies", e);
    }
  }
  return [];
};

export const getSocietyById = (id: string): Society | undefined => {
  const societies = getSocieties();
  return societies.find(s => s.id === id);
};

export const createSociety = (data: Omit<Society, "id" | "societyId" | "createdAt" | "updatedAt">): Society => {
  const societies = getSocieties();
  
  if (societies.some(s => s.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error("Society with this name already exists.");
  }
  if (societies.some(s => s.registrationNumber.toLowerCase() === data.registrationNumber.toLowerCase())) {
    throw new Error("Registration number is already registered.");
  }

  const newId = `SOC-NEW-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const newSociety: Society = {
    ...data,
    id: newId,
    societyId: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [...societies, newSociety];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSociety;
};

export const updateSocietyData = (id: string, data: Partial<Society>): Society => {
  const societies = getSocieties();
  const index = societies.findIndex(s => s.id === id);
  if (index === -1) throw new Error("Society not found");

  if (data.name && data.name.toLowerCase() !== societies[index].name.toLowerCase()) {
    if (societies.some(s => s.id !== id && s.name.toLowerCase() === data.name?.toLowerCase())) {
      throw new Error("Society with this name already exists.");
    }
  }
  
  if (data.registrationNumber && data.registrationNumber.toLowerCase() !== societies[index].registrationNumber.toLowerCase()) {
    if (societies.some(s => s.id !== id && s.registrationNumber.toLowerCase() === data.registrationNumber?.toLowerCase())) {
      throw new Error("Registration number is already registered.");
    }
  }

  const updatedSociety: Society = {
    ...societies[index],
    ...data,
    updatedAt: new Date().toISOString()
  };

  societies[index] = updatedSociety;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(societies));
  return updatedSociety;
};

export const deleteSocietyData = (id: string): void => {
  const societies = getSocieties();
  const filtered = societies.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const initDemoSocietiesIfEmpty = (demoSocieties: Society[]): Society[] => {
  const stored = getSocieties();
  if (stored.length === 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSocieties));
    return demoSocieties;
  }
  return stored;
};
