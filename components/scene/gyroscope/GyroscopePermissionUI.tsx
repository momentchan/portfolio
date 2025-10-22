'use client';

import { useEffect, useState } from 'react';
import { useGyroscope } from './GyroscopeContext';
import { useMotionOrientationPermission } from './hooks/useMotionOrientationPermission';
import GlobalState from '@/components/common/GlobalStates';
import GyroscopeIcon from './GyroscopeIcon';
import UICanvas from '@/components/ui/common/UICanvas';

export default function GyroscopePermissionUI() {
    const { isTouchDevice } = GlobalState();
    const {
        gyroEnabled,
        gyroActive,
        setGyroEnabled,
        setGyroActive,
        showPermissionButton,
        setShowPermissionButton,
        permissionDenied,
        setPermissionDenied,
        deniedReason
    } = useGyroscope();
    const { state, request } = useMotionOrientationPermission();
    const [hovered, setHovered] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    // Sync permission state
    useEffect(() => {
        if (state === 'granted') {
            setGyroEnabled(true);
            setGyroActive(true);
            setShowPermissionButton(false);
            setPermissionDenied(false);
        } else if (state === 'denied' || state === 'unavailable') {
            setPermissionDenied(true);
            setShowPermissionButton(false);
        }
    }, [state, setGyroEnabled, setGyroActive, setShowPermissionButton, setPermissionDenied]);

    // Show/hide notification with CSS fade animation
    useEffect(() => {
        if (permissionDenied) {
            // Show notification
            setShowNotification(true);

            // Auto-hide after 3 seconds
            const hideTimer = setTimeout(() => {
                setShowNotification(false);
            }, 3000);

            // Clear permission denied state after fade out (300ms CSS transition)
            const clearTimer = setTimeout(() => {
                setPermissionDenied(false);
            }, 3300);

            return () => {
                clearTimeout(hideTimer);
                clearTimeout(clearTimer);
            };
        }
    }, [permissionDenied, setPermissionDenied]);

    // Only show on real touch devices (not just small viewports)
    if (!isTouchDevice) return null;

    const handleClick = () => {
        if (!gyroEnabled) {
            // Request permission (first time or retry)
            // Clear denied notification immediately on retry
            if (permissionDenied) {
                setShowNotification(false);
                setPermissionDenied(false);
            }
            request();
        } else {
            // After permission granted: toggle on/off
            setGyroActive(!gyroActive);
        }
    };

    // Determine icon state
    const isActive = gyroEnabled && gyroActive;
    const needsPermission = !gyroEnabled;

    return (
        <>
            {/* Gyroscope Icon - Smart toggle (permission on first click, then on/off) */}
            <UICanvas
                size={40}
                bottom={0}
                left={2}
                zIndex={20}
                cameraPosition={[0, 0, 1]}
                cameraZoom={1}
                cameraNear={-50}
                cameraFar={50}
                onClick={handleClick}
                onHoverChange={setHovered}
                hoverRadius={30}
            >
                <GyroscopeIcon
                    radius={18}
                    active={isActive}
                    color='#aaaaaa'
                    needsPermission={needsPermission}
                />
            </UICanvas>

            {/* Permission Denied - Small notification with CSS fade animation */}
            {permissionDenied && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '10px',
                        left: '50px',
                        zIndex: 999,
                        color: '#ffffff',
                        opacity: showNotification ? 1 : 0,
                        fontSize: '11px',
                        fontWeight: '600',
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s ease-in-out',
                    }}
                >
                    Permission denied
                    {deniedReason && (
                        <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '2px', fontWeight: '400' }}>
                            {deniedReason}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

