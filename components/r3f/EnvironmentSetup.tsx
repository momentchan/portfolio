import { Lightformer, Environment } from "@react-three/drei";

export default function EnvironmentSetup() {
    return (
        <>
            <directionalLight
                castShadow position={[-0.5, 0.5, 0.5]} intensity={0}
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-radius={0.5}
                shadow-bias={-0.0001}
            />
            
            <Environment resolution={256}>
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                    {[2, 0, 2, 0, 2, 0, 2, 0].map((x, i) => (
                        <Lightformer key={i} form="circle" intensity={4} rotation={[Math.PI / 2, 0, 0]} position={[x, 4, i * 4]} scale={[4, 1, 1]} />
                    ))}
                    <Lightformer intensity={1} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
                    <Lightformer intensity={1} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
                    <Lightformer intensity={1} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[50, 2, 1]} />
                </group>
            </Environment>
        </>
    )
}