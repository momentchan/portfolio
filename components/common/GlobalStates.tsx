import { create } from "zustand";

interface GlobalState {
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;
  started: boolean;
  setStarted: (value: boolean) => void;
  paused: boolean;
  setPaused: (value: boolean | ((prev: boolean) => boolean)) => void;
  soundOn: boolean;
  setSoundOn: (value: boolean) => void;
}

export default create<GlobalState>((set) => ({
  isMobile: false,
  setIsMobile: (value) => set({ isMobile: value }),
  started: false,
  setStarted: (value) => set({ started: value }),
  paused: false,
  setPaused: (value) => set((state) => ({ 
    paused: typeof value === 'function' ? value(state.paused) : value 
  })),
  soundOn: false,
  setSoundOn: (value) => set({ soundOn: value }),
}))