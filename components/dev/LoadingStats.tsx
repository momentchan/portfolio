'use client';

import { useEffect, useState, useRef } from 'react';
import { useProgress } from '@react-three/drei';

// Utility to format loading time
export const formatLoadingTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

// Loading metrics interface
export interface LoadingMetrics {
    totalTime: number;
    averageItemTime: number;
    itemsLoaded: number;
    formattedTime: string;
}

// Utility to calculate loading metrics
const calculateMetrics = (
    startTime: number,
    endTime: number,
    itemCount: number
): LoadingMetrics => {
    const totalTime = endTime - startTime;
    return {
        totalTime,
        averageItemTime: itemCount > 0 ? totalTime / itemCount : 0,
        itemsLoaded: itemCount,
        formattedTime: formatLoadingTime(totalTime),
    };
};

interface LoadingStatsProps {
    showVisual?: boolean; // Show on-screen stats
    showConsole?: boolean; // Show console logs
    onLoadingComplete?: (metrics: LoadingMetrics) => void; // Callback when complete
}

export default function LoadingStats({
    showVisual = process.env.NODE_ENV === 'development',
    showConsole = true,
    onLoadingComplete,
}: LoadingStatsProps) {
    const { progress, active, loaded, total, item } = useProgress();

    // Loading time tracking
    const loadingStartTime = useRef<number>(0);
    const loadingEndTime = useRef<number>(0);
    const [loadingMetrics, setLoadingMetrics] = useState<LoadingMetrics | null>(null);
    const [loadingComplete, setLoadingComplete] = useState(false);
    const itemTimestamps = useRef<{ name: string; timestamp: number; itemDuration: number }[]>([]);
    const completionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastProgressRef = useRef<number>(0);
    const stableCountRef = useRef<number>(0);
    const lastItemTimestamp = useRef<number>(0);

    // Track loading start
    useEffect(() => {
        loadingStartTime.current = Date.now();
        lastItemTimestamp.current = Date.now();
        if (showConsole) {
            console.log('🚀 Loading started at:', new Date().toISOString());
            console.log('💡 Note: First file includes connection overhead (~200-400ms)');
        }
    }, [showConsole]);

    // Track individual items loading
    useEffect(() => {
        if (item) {
            const timestamp = Date.now();
            const elapsed = timestamp - loadingStartTime.current;
            const itemDuration = timestamp - lastItemTimestamp.current;

            itemTimestamps.current.push({ name: item, timestamp, itemDuration });
            lastItemTimestamp.current = timestamp;

            if (showConsole) {
                console.log(
                    `📦 Loaded: ${item} (+${formatLoadingTime(elapsed)}) [${formatLoadingTime(itemDuration)}]`
                );
            }
        }
    }, [item, showConsole]);

    // Track loading progress
    useEffect(() => {
        if (progress > 0 && showConsole) {
            const elapsed = Date.now() - loadingStartTime.current;
            console.log(
                `⏳ Progress: ${progress.toFixed(1)}% (${loaded}/${total}) - ${formatLoadingTime(elapsed)}`
            );
        }
    }, [progress, loaded, total, showConsole]);

    // Track loading completion with debounce to avoid premature detection
    if (!showVisual) return null;

    return (
        <div className="mt-8 text-sm text-gray-400 space-y-1 select-none">
            <div>
                Progress: {progress.toFixed(1)}% ({loaded}/{total})
            </div>
            {loadingMetrics && (
                <>
                    <div className="text-green-400 font-semibold">
                        ✅ Loaded in {loadingMetrics.formattedTime}
                    </div>
                    <div className="text-xs">
                        Avg: {formatLoadingTime(loadingMetrics.averageItemTime)}/item
                    </div>
                </>
            )}
            {!loadingComplete && loaded > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                    Current: {item || 'Loading...'}
                </div>
            )}
        </div>
    );
}

