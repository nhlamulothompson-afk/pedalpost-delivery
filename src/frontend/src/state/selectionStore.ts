import { create } from "zustand";

interface SelectionState {
  selectedCarId: string | null;
  selectedTrackId: string | null;
  setSelectedCar: (carId: string | null) => void;
  setSelectedTrack: (trackId: string | null) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedCarId: null,
  selectedTrackId: null,
  setSelectedCar: (carId) => set({ selectedCarId: carId }),
  setSelectedTrack: (trackId) => set({ selectedTrackId: trackId }),
  clearSelection: () => set({ selectedCarId: null, selectedTrackId: null }),
}));
