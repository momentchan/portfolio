'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface GyroscopeValues {
    alpha: number;
    beta: number;
    gamma: number;
}

interface GyroscopeContextType {
    gyroEnabled: boolean;
    setGyroEnabled: (value: boolean) => void;
    gyroActive: boolean;
    setGyroActive: (value: boolean) => void;
    showPermissionButton: boolean;
    setShowPermissionButton: (value: boolean) => void;
    gyroValues: GyroscopeValues;
    setGyroValues: (values: GyroscopeValues) => void;
    permissionDenied: boolean;
    setPermissionDenied: (value: boolean) => void;
    deniedReason: string | null;
    setDeniedReason: (reason: string | null) => void;
}

const GyroscopeContext = createContext<GyroscopeContextType | undefined>(undefined);

export function GyroscopeProvider({ children }: { children: ReactNode }) {
    const [gyroEnabled, setGyroEnabled] = useState(false);
    const [gyroActive, setGyroActive] = useState(false);
    const [showPermissionButton, setShowPermissionButton] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [deniedReason, setDeniedReason] = useState<string | null>(null);
    const [gyroValues, setGyroValues] = useState<GyroscopeValues>({
        alpha: 0,
        beta: 0,
        gamma: 0,
    });

    return (
        <GyroscopeContext.Provider
            value={{
                gyroEnabled,
                setGyroEnabled,
                gyroActive,
                setGyroActive,
                showPermissionButton,
                setShowPermissionButton,
                gyroValues,
                setGyroValues,
                permissionDenied,
                setPermissionDenied,
                deniedReason,
                setDeniedReason,
            }}
        >
            {children}
        </GyroscopeContext.Provider>
    );
}

export function useGyroscope() {
    const context = useContext(GyroscopeContext);
    if (!context) {
        throw new Error('useGyroscope must be used within GyroscopeProvider');
    }
    return context;
}

