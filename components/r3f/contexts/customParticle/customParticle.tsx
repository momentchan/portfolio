import { UniformSizeConfig, ParticleSystem, ZeroVelocityConfig, SpherePositionConfig, UniformColorConfig, ParticlePositionConfig } from "@/lib/particle-system";

import { useMemo } from "react";
import CustomBehavior from "./customBehavior";

// Custom position config for random positions inside a sphere
class RandomSpherePositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 1.0,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        // Generate random point inside sphere using rejection sampling
        let x, y, z, distance;
        do {
            x = (Math.random() - 0.5) * 2 * this.radius;
            y = (Math.random() - 0.5) * 2 * this.radius;
            z = (Math.random() - 0.5) * 2 * this.radius;
            distance = Math.sqrt(x * x + y * y + z * z);
        } while (distance > this.radius);

        return [
            this.center[0] + x,
            this.center[1] + y,
            this.center[2] + z,
            0.0
        ];
    }
}

export default function CustomParticle() {
    const config = useMemo(() => ({
        position: new RandomSpherePositionConfig(0.2, [0, 0, 0]),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new UniformSizeConfig(0.1)
    }), []);

    const behavior = useMemo(() => new CustomBehavior(), []);


    return (
        <ParticleSystem
            count={2048}
            config={config}
            behavior={behavior}
        />
    )
}