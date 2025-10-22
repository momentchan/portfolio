'use client';

import { useGyroscope } from './GyroscopeContext';
import GlobalState from '@/components/common/GlobalStates';

export default function GyroscopeToggle() {
    const { isTouchDevice } = GlobalState();
    const { gyroEnabled, gyroActive, setGyroActive } = useGyroscope();

    // Only show if permission is granted and on touch device
    if (!isTouchDevice || !gyroEnabled) return null;

    return (
        <button
            onClick={() => setGyroActive(!gyroActive)}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 1000,
                width: '48px',
                height: '48px',
                padding: '0',
                background: gyroActive ? 'rgba(0, 255, 136, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
            title={gyroActive ? 'Disable gyroscope' : 'Enable gyroscope'}
        >
            {gyroActive ? '🎮' : '📱'}
        </button>
    );
}

