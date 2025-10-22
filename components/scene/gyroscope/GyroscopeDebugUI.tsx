'use client';

import { useGyroscope } from './GyroscopeContext';

export default function GyroscopeDebugUI() {
    const { gyroActive, gyroValues } = useGyroscope();

    if (!gyroActive) return null;

    // Check if in gimbal lock region
    const isNearGimbalLock = Math.abs(gyroValues.beta - 90) < 20;
    const gimbalLockDistance = Math.abs(gyroValues.beta - 90);

    // Check if in comfortable holding range (centered at 45°)
    const isComfortableRange = gyroValues.beta >= 30 && gyroValues.beta <= 60;
    const distanceFromNeutral = Math.abs(gyroValues.beta - 45);

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '140px',
                left: '20px',
                zIndex: 1000,
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.85)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                color: '#00ff00',
                fontFamily: 'monospace',
                fontSize: '11px',
                lineHeight: '1.5',
                pointerEvents: 'none',
                userSelect: 'none',
            }}
        >
            <div style={{ marginBottom: '4px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }}>
                Gyroscope Values:
            </div>
            <div>
                α: <span style={{ color: '#00ff00' }}>{gyroValues.alpha.toFixed(1)}°</span>
            </div>
            <div>
                β: <span style={{ color: isNearGimbalLock ? '#ff6600' : isComfortableRange ? '#00ff88' : '#00ffff' }}>
                    {gyroValues.beta.toFixed(1)}°
                </span>
                {isComfortableRange && <span style={{ color: '#00ff88', fontSize: '10px', marginLeft: '4px' }}>✓</span>}
            </div>
            <div>
                γ: <span style={{ color: '#ffff00' }}>{gyroValues.gamma.toFixed(1)}°</span>
            </div>
            <div style={{
                marginTop: '6px',
                fontSize: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                paddingTop: '4px',
                color: 'rgba(255, 255, 255, 0.6)'
            }}>
                Neutral: 45° | {distanceFromNeutral.toFixed(0)}° off
            </div>
            {isNearGimbalLock && (
                <div style={{
                    marginTop: '4px',
                    color: '#ff6600',
                    fontSize: '10px',
                }}>
                    ⚠ Gimbal Lock
                </div>
            )}
        </div>
    );
}

