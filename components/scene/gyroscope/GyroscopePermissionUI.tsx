'use client';

import { useEffect, useState } from 'react';
import { useMotionOrientationPermission } from './hooks/useMotionOrientationPermission';
import { useGyroscope } from './GyroscopeContext';
import GlobalState from '@/components/common/GlobalStates';
import GyroscopeDebugUI from './GyroscopeDebugUI';
import GyroscopeToggle from './GyroscopeToggle';

export default function GyroscopePermissionUI() {
    const { isTouchDevice } = GlobalState();
    const { setGyroEnabled, setGyroActive, showPermissionButton, setShowPermissionButton } = useGyroscope();
    const { state, reason, request } = useMotionOrientationPermission();
    const [showDenied, setShowDenied] = useState(false);

    // Sync permission state with context
    useEffect(() => {
        if (state === 'granted') {
            setGyroEnabled(true);
            setGyroActive(true); // Auto-enable when permission granted
            setShowPermissionButton(false);
            setShowDenied(false);
        } else if (state === 'denied' || state === 'unavailable') {
            setShowDenied(true);
            setShowPermissionButton(false);
        }
    }, [state, setGyroEnabled, setGyroActive, setShowPermissionButton]);

    // Auto-hide denied message after 10 seconds
    useEffect(() => {
        if (showDenied) {
            const timer = setTimeout(() => setShowDenied(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [showDenied]);

    // Only show on real touch devices (not just small viewports)
    if (!isTouchDevice) return null;

    return (
        <>
            {/* <GyroscopeDebugUI /> */}
            <GyroscopeToggle />
            {/* Permission Request Icon - bottom left corner */}
            {showPermissionButton && (
                <button
                    onClick={request}
                    disabled={state === 'asking'}
                    style={{
                        position: 'fixed',
                        bottom: '80px',
                        left: '20px',
                        zIndex: 1000,
                        width: '48px',
                        height: '48px',
                        padding: '0',
                        background: state === 'asking' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: state === 'asking' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        opacity: state === 'asking' ? 0.6 : 1,
                    }}
                    title="Enable gyroscope control"
                >
                    {state === 'asking' ? '⏳' : '📱'}
                </button>
            )}

            {/* Permission Denied - Small notification */}
            {showDenied && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '80px',
                        left: '20px',
                        zIndex: 999,
                        padding: '8px 12px',
                        background: 'rgba(255, 102, 0, 0.9)',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontSize: '11px',
                        maxWidth: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <span>⚠️</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>Permission denied</div>
                        {reason && <div style={{ opacity: 0.9, fontSize: '10px' }}>{reason}</div>}
                    </div>
                    <button
                        onClick={() => {
                            setShowDenied(false);
                            setShowPermissionButton(true);
                        }}
                        style={{
                            padding: '4px 8px',
                            background: 'white',
                            color: '#ff6600',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}
        </>
    );
}

