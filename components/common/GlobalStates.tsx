import { create } from "zustand";
import { Environment } from "../../utils/environment";

interface GlobalState {
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;
  started: boolean;
  setStarted: (value: boolean) => void;
  paused: boolean;
  setPaused: (value: boolean | ((prev: boolean) => boolean)) => void;
  soundOn: boolean;
  setSoundOn: (value: boolean) => void;
  currentPath: string;
  previousPath: string;
  setCurrentPath: (path: string) => void;
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  isDev: boolean;
  isProd: boolean;
}

export default create<GlobalState>((set, get) => ({
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
  currentPath: '/',
  previousPath: '/',
  setCurrentPath: (path) => set((state) => ({
    previousPath: state.currentPath,
    currentPath: path,
  })),
  environment: 'development',
  setEnvironment: (env) => set((state) => ({
    environment: env,
    isDev: env === 'development',
    isProd: env === 'production',
  })),
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
}))