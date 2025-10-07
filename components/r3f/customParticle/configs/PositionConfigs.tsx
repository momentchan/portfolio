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

export class SphereSurfacePositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 1.0,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        // Generate uniform distribution on sphere surface
        const theta = Math.random() * Math.PI * 2; // azimuthal angle
        const phi = Math.acos(2 * Math.random() - 1); // polar angle
        
        const x = Math.sin(phi) * Math.cos(theta) * this.radius + this.center[0];
        const y = Math.sin(phi) * Math.sin(theta) * this.radius + this.center[1];
        const z = Math.cos(phi) * this.radius + this.center[2];
        
        return [x, y, z, 0.0];
    }
}

export class GridPositionConfig extends ParticlePositionConfig {
    constructor(
        private bounds: { x: [number, number]; y: [number, number]; z: [number, number] } = { x: [-1, 1], y: [-1, 1], z: [0, 0] }
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const x = (i / size - 0.5) * (this.bounds.x[1] - this.bounds.x[0]) + (this.bounds.x[0] + this.bounds.x[1]) / 2;
        const y = (j / size - 0.5) * (this.bounds.y[1] - this.bounds.y[0]) + (this.bounds.y[0] + this.bounds.y[1]) / 2;
        const z = this.bounds.z[0];
        return [x, y, z, 0.0];
    }
}

export class InitialPositionConfig extends ParticlePositionConfig {
    constructor(
        private baseConfig: ParticlePositionConfig
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        // Use the base configuration to generate positions but always set age to 0
        const [x, y, z, _] = this.baseConfig.generatePosition(index, totalCount, size);
        return [x, y, z, 0.0]; // Always start with age 0
    }
}
