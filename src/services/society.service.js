import { storage } from "@/lib/storage";

const STORAGE_KEY = "societies";

export const getSocieties = () => {
  const stored = storage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse societies", e);
    }
  }
  return [];
};

export const getSocietyById = (id) => {
  const societies = getSocieties();
  return societies.find((s) => s.id === id);
};

export const createSociety = (data) => {
  const societies = getSocieties();
  if (societies.some((s) => s.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error("Society with this name already exists.");
  }
  if (
    societies.some(
      (s) => s.registrationNumber.toLowerCase() === data.registrationNumber.toLowerCase(),
    )
  ) {
    throw new Error("Registration number is already registered.");
  }

  const newId = `SOC-NEW-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const newSociety = {
    ...data,
    id: newId,
    societyId: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [...societies, newSociety];
  storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSociety;
};

export const updateSocietyData = (id, data) => {
  const societies = getSocieties();
  const index = societies.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Society not found");

  if (data.name && data.name.toLowerCase() !== societies[index].name.toLowerCase()) {
    if (societies.some((s) => s.id !== id && s.name.toLowerCase() === data.name?.toLowerCase())) {
      throw new Error("Society with this name already exists.");
    }
  }
  if (
    data.registrationNumber &&
    data.registrationNumber.toLowerCase() !== societies[index].registrationNumber.toLowerCase()
  ) {
    if (
      societies.some(
        (s) =>
          s.id !== id &&
          s.registrationNumber.toLowerCase() === data.registrationNumber?.toLowerCase(),
      )
    ) {
      throw new Error("Registration number is already registered.");
    }
  }

  const updatedSociety = {
    ...societies[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  societies[index] = updatedSociety;
  storage.setItem(STORAGE_KEY, JSON.stringify(societies));
  return updatedSociety;
};

export const deleteSocietyData = (id) => {
  const societies = getSocieties();
  const filtered = societies.filter((s) => s.id !== id);
  storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const initDemoSocietiesIfEmpty = (demoSocieties) => {
  const stored = getSocieties();
  if (stored.length === 0) {
    storage.setItem(STORAGE_KEY, JSON.stringify(demoSocieties));
    return demoSocieties;
  }
  return stored;
};
