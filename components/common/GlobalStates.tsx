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
  activeProjectSlug: string | null;
  setActiveProjectSlug: (slug: string | null) => void;
  currentPath: string;
  previousPath: string;
  setCurrentPath: (path: string) => void;
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
  activeProjectSlug: null,
  setActiveProjectSlug: (slug) => set({ activeProjectSlug: slug }),
  currentPath: '/',
  previousPath: '/',
  setCurrentPath: (path) => set((state) => ({
    previousPath: state.currentPath,
    currentPath: path,
  })),
}))