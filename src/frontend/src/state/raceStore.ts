import { create } from "zustand";

interface RaceState {
  finishTimeMs: number | null;
  setFinishTime: (time: number) => void;
  clearFinishTime: () => void;
}

export const useRaceStore = create<RaceState>((set) => ({
  finishTimeMs: null,
  setFinishTime: (time) => set({ finishTimeMs: time }),
  clearFinishTime: () => set({ finishTimeMs: null }),
}));
