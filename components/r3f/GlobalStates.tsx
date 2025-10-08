import { create } from "zustand";

interface GlobalState {
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;
  started: boolean;
  setStarted: (value: boolean) => void;
}

export default create<GlobalState>((set) => ({
  isMobile: false,
  setIsMobile: (value) => set({ isMobile: value }),
  started: false,
  setStarted: (value) => set({ started: value }),
}))