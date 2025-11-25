import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Float, Line, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Part } from '../types';

// Augment JSX.IntrinsicElements to include Three.js elements used in the component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      icosahedronGeometry: any;
      fog: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      gridHelper: any;
    }
  }
}

interface Viewer3DProps {
  parts: Part[];
  selectedPartId?: number;
  onPartSelect: (id: number) => void;
}

const PartNode = ({ part, index, total, isSelected, onClick }: { part: Part, index: number, total: number, isSelected: boolean, onClick: () => void }) => {
  // Distribute parts in a spiral cone shape to simulate "exploded" depth
  const position = useMemo(() => {
    // Spiral logic
    const angle = (index / Math.max(total, 1)) * Math.PI * 4; 
    const radius = 2.5 + (index / Math.max(total, 1)) * 3;
    const height = (index / Math.max(total, 1)) * 6 - 3; 
    return new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
  }, [index, total]);

  const color = isSelected ? '#22D3EE' : '#64748b';
  const emissiveIntensity = isSelected ? 2 : 0.2;

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        {/* Connection Line to Center */}
        <Line points={[[0, 0, 0], [-position.x, -position.y, -position.z]]} color={color} opacity={0.15} transparent lineWidth={1} />
        
        {/* The "Part" Representation - Abstract Sphere/Node */}
        <mesh>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={emissiveIntensity} 
            roughness={0.2} 
            metalness={0.8} 
          />
        </mesh>
        
        {/* Glow halo */}
        {isSelected && (
            <mesh scale={[1.5, 1.5, 1.5]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
        )}

        {/* Floating Label Text */}
        <Text
          position={[0.4, 0.4, 0]}
          fontSize={0.35}
          color="white"
          anchorX="left"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          {`${part.id}. ${part.name}`}
        </Text>
      </group>
    </Float>
  );
};

export const Viewer3D: React.FC<Viewer3DProps> = ({ parts, selectedPartId, onPartSelect }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#05070B] to-[#0C1018]">
      <Canvas camera={{ position: [8, 4, 8], fov: 50 }}>
        <fog attach="fog" args={['#05070B', 10, 25]} />
        
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#22D3EE" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F59E0B" />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={1} castShadow />

        <OrbitControls 
            autoRotate={!selectedPartId} 
            autoRotateSpeed={0.5} 
            enablePan={true} 
            enableZoom={true} 
            maxDistance={20}
            minDistance={2}
        />
        
        <group>
             {/* Center Core Object Placeholder */}
            <mesh>
                <icosahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#334155" wireframe emissive="#22D3EE" emissiveIntensity={0.1} />
            </mesh>
            
            {/* Parts */}
            {parts.map((part, i) => (
                <PartNode 
                    key={part.id} 
                    part={part} 
                    index={i} 
                    total={parts.length} 
                    isSelected={selectedPartId === part.id}
                    onClick={() => onPartSelect(part.id)}
                />
            ))}
        </group>
        
        {/* Environment & Floor */}
        <gridHelper args={[30, 30, 0x1e293b, 0x0f172a]} position={[0, -4, 0]} />
        <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="flex flex-col gap-1">
             <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Interactive 3D Mode</div>
             <div className="text-[10px] text-gray-500">Left Click: Rotate • Scroll: Zoom • Right Click: Pan</div>
        </div>
      </div>
    </div>
  );
};