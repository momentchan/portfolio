import { ParticlePositionConfig } from "@/lib/particle-system";

// Enhanced position configurations
export class RandomSpherePositionConfig extends ParticlePositionConfig {
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
