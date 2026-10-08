import * as THREE from 'three';
import { useRef, useState, useEffect, memo } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import {
  useFBO,
  useGLTF,
  useScroll,
  Image,
  Scroll,
  Preload,
  ScrollControls,
  MeshTransmissionMaterial,
  Text,
} from '@react-three/drei';
import { easing } from 'maath';

const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1783394327207-acf441e37dda?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8MzR8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8MzZ8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1782094002386-7d9ae1f49f50?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8NDB8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1781242629922-6f39cc3671cd?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8NDR8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1779684474703-5c0519bcf7e8?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8NTJ8fHxlbnwwfHx8fHw%3D',
];

export interface NavItem {
  label: string;
  link: string;
}

export interface FluidGlassProps {
  mode?: 'lens' | 'bar' | 'cube';
  lensProps?: Record<string, unknown>;
  barProps?: Record<string, unknown>;
  cubeProps?: Record<string, unknown>;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  glowColor?: string;
  title?: string;
  children?: React.ReactNode;
}

interface ModeWrapperProps {
  children?: React.ReactNode;
  glb: string;
  geometryKey: string;
  lockToBottom?: boolean;
  followPointer?: boolean;
  modeProps?: Record<string, unknown>;
  backgroundColor?: string;
}

const ModeWrapper = memo(function ModeWrapper({
  children,
  glb,
  geometryKey,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  backgroundColor = '#120F17',
}: ModeWrapperProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const { nodes } = useGLTF(glb);
  const buffer = useFBO();
  const { viewport: vp } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const geoWidthRef = useRef(1);

  useEffect(() => {
    const geo = (nodes[geometryKey] as THREE.Mesh)?.geometry;
    if (geo) {
      geo.computeBoundingBox();
      geoWidthRef.current = geo.boundingBox ? geo.boundingBox.max.x - geo.boundingBox.min.x : 1;
    }
  }, [nodes, geometryKey]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const { gl, viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);

    const destX = followPointer ? (pointer.x * v.width) / 2 : 0;
    const destY = lockToBottom ? -v.height / 2 + 0.2 : followPointer ? (pointer.y * v.height) / 2 : 0;
    easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);

    if (modeProps.scale == null) {
      const maxWorld = v.width * 0.9;
      const desired = maxWorld / geoWidthRef.current;
      ref.current.scale.setScalar(Math.min(0.25, desired));
    }

    gl.setClearColor(0x000000, 0);
    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.setClearColor(0x000000, 0);
  });

  const { scale, ior, thickness, anisotropy, chromaticAberration, ...extraMat } = modeProps as {
    scale?: number;
    ior?: number;
    thickness?: number;
    anisotropy?: number;
    chromaticAberration?: number;
    [key: string]: unknown;
  };

  const meshGeometry = (nodes[geometryKey] as THREE.Mesh)?.geometry;

  return (
    <>
      {createPortal(
        <>
          <mesh position={[0, 0, -5]} scale={[vp.width * 2, vp.height * 2, 1]}>
            <planeGeometry />
            <meshBasicMaterial color={backgroundColor} toneMapped={false} />
          </mesh>
          {children}
        </>,
        scene
      )}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent toneMapped={false} />
      </mesh>
      {meshGeometry && (
        <mesh
          ref={ref}
          scale={scale ?? 0.25}
          rotation-x={Math.PI / 2}
          geometry={meshGeometry}
        >
          <MeshTransmissionMaterial
            buffer={buffer.texture}
            ior={ior ?? 1.15}
            thickness={thickness ?? 5}
            anisotropy={anisotropy ?? 0.01}
            chromaticAberration={chromaticAberration ?? 0.1}
            {...(typeof extraMat === 'object' && extraMat !== null ? extraMat : {})}
          />
        </mesh>
      )}
    </>
  );
});

function Lens({ modeProps, ...p }: Omit<ModeWrapperProps, 'glb' | 'geometryKey'>) {
  return <ModeWrapper glb="/assets/3d/lens.glb" geometryKey="Cylinder" followPointer modeProps={modeProps} {...p} />;
}

function Cube({ modeProps, ...p }: Omit<ModeWrapperProps, 'glb' | 'geometryKey'>) {
  return <ModeWrapper glb="/assets/3d/cube.glb" geometryKey="Cube" followPointer modeProps={modeProps} {...p} />;
}

function Bar({ modeProps = {}, ...p }: Omit<ModeWrapperProps, 'glb' | 'geometryKey'>) {
  const defaultMat = {
    transmission: 1,
    roughness: 0,
    thickness: 10,
    ior: 1.15,
    color: '#ffffff',
    attenuationColor: '#ffffff',
    attenuationDistance: 0.25,
  };

  return (
    <ModeWrapper
      glb="/assets/3d/bar.glb"
      geometryKey="Cube"
      lockToBottom
      followPointer={false}
      modeProps={{ ...defaultMat, ...modeProps }}
      {...p}
    />
  );
}

function NavItems({ items, textColor }: { items: NavItem[]; textColor: string }) {
  const group = useRef<THREE.Group>(null!);
  const { viewport, camera } = useThree();

  const DEVICE = {
    mobile: { max: 639, spacing: 0.2, fontSize: 0.035 },
    tablet: { max: 1023, spacing: 0.24, fontSize: 0.035 },
    desktop: { max: Infinity, spacing: 0.3, fontSize: 0.035 },
  };
  const getDevice = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return w <= DEVICE.mobile.max ? 'mobile' : w <= DEVICE.tablet.max ? 'tablet' : 'desktop';
  };

  const [device, setDevice] = useState<keyof typeof DEVICE>(getDevice());

  useEffect(() => {
    const onResize = () => setDevice(getDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { spacing, fontSize } = DEVICE[device];

  useFrame(() => {
    if (!group.current) return;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);
    group.current.position.set(0, -v.height / 2 + 0.2, 15.1);

    group.current.children.forEach((child, i) => {
      child.position.x = (i - (items.length - 1) / 2) * spacing;
    });
  });

  const handleNavigate = (link: string) => {
    if (!link) return;
    link.startsWith('#') ? (window.location.hash = link) : (window.location.href = link);
  };

  return (
    <group ref={group} renderOrder={10}>
      {items.map(({ label, link }) => (
        <Text
          key={label}
          fontSize={fontSize}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          outlineBlur="20%"
          outlineColor="#000"
          outlineOpacity={0.5}
          renderOrder={10}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate(link);
          }}
          onPointerOver={() => {
            if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
          }}
        >
          {label}
        </Text>
      ))}
    </group>
  );
}

function Images() {
  const group = useRef<THREE.Group>(null!);
  const data = useScroll();
  const { height } = useThree((s) => s.viewport);

  useFrame(() => {
    if (!group.current || !group.current.children.length) return;
    const c = group.current.children as THREE.Mesh[];
    if (c[0]?.material) (c[0].material as any).zoom = 1 + data.range(0, 1 / 3) / 3;
    if (c[1]?.material) (c[1].material as any).zoom = 1 + data.range(0, 1 / 3) / 3;
    if (c[2]?.material) (c[2].material as any).zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2;
    if (c[3]?.material) (c[3].material as any).zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2;
    if (c[4]?.material) (c[4].material as any).zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2;
  });

  return (
    <group ref={group}>
      <Image position={[-2, 0, 0]} scale={[3, height / 1.1] as any} url={IMAGE_URLS[0]} />
      <Image position={[2, 0, 3]} scale={3} url={IMAGE_URLS[1]} />
      <Image position={[-2.05, -height, 6]} scale={[1, 3] as any} url={IMAGE_URLS[2]} />
      <Image position={[-0.6, -height, 9]} scale={[1, 2] as any} url={IMAGE_URLS[3]} />
      <Image position={[0.75, -height, 10.5]} scale={1.5} url={IMAGE_URLS[4]} />
    </group>
  );
}

function Typography({ textColor, title = 'React Bits' }: { textColor: string; title?: string }) {
  const DEVICE = {
    mobile: { fontSize: 0.2 },
    tablet: { fontSize: 0.4 },
    desktop: { fontSize: 0.6 },
  };
  const getDevice = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return w <= 639 ? 'mobile' : w <= 1023 ? 'tablet' : 'desktop';
  };

  const [device, setDevice] = useState<keyof typeof DEVICE>(getDevice());

  useEffect(() => {
    const onResize = () => setDevice(getDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { fontSize } = DEVICE[device];

  return (
    <Text
      position={[0, 0, 12]}
      fontSize={fontSize}
      letterSpacing={-0.05}
      outlineWidth={0}
      outlineBlur="20%"
      outlineColor="#000"
      outlineOpacity={0.5}
      color={textColor}
      anchorX="center"
      anchorY="middle"
    >
      {title}
    </Text>
  );
}

export function FluidGlass({
  mode,
  lensProps = {},
  barProps = {},
  cubeProps = {},
  backgroundColor = '#120F17',
  textColor = '#ffffff',
  className = '',
  glowColor = 'rgba(147, 130, 255, 0.25)',
  title = 'React Bits',
  children,
}: FluidGlassProps) {
  // If children are passed, act as a fluid glass container card
  if (children) {
    return (
      <div
        className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${className}`}
        style={{
          boxShadow: `
            0 20px 50px rgba(0, 0, 0, 0.65),
            0 0 35px ${glowColor},
            inset 0 1px 1px rgba(255, 255, 255, 0.3),
            inset 0 -1px 1px rgba(147, 130, 255, 0.15)
          `,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-4 opacity-70 group-hover:opacity-90 transition-opacity duration-700 -z-10 overflow-hidden"
        >
          <div
            className="absolute w-80 h-80 rounded-full blur-3xl transition-transform duration-700 ease-out animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(147, 130, 255, 0.4) 0%, rgba(80, 70, 228, 0.2) 60%, transparent 80%)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
        <div
          className="relative z-10 w-full h-full rounded-2xl backdrop-blur-2xl bg-[#08041a]/60 border border-white/10 group-hover:border-[#9382ff]/35 transition-all duration-300"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 60%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(16, 9, 58, 0.3) 100%)
            `,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  const activeMode = mode || 'lens';
  const Wrapper = activeMode === 'bar' ? Bar : activeMode === 'cube' ? Cube : Lens;
  const rawOverrides = activeMode === 'bar' ? barProps : activeMode === 'cube' ? cubeProps : lensProps;

  const {
    navItems = [
      { label: '🏆 Leaderboard', link: '/leaderboard' },
      { label: '🔀 Submitted PRs', link: '/pull-requests' },
      { label: '🛡️ Admin Portal', link: '/admin' },
    ],
    ...modeProps
  } = (rawOverrides || {}) as { navItems?: NavItem[]; [key: string]: unknown };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 15 }}
        gl={{ alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ backgroundColor }}
      >
        <ScrollControls damping={0.2} pages={3} distance={0.4}>
          {mode === 'bar' && <NavItems items={navItems} textColor={textColor} />}
          <Wrapper modeProps={modeProps} backgroundColor={backgroundColor}>
            <Scroll>
              <Typography textColor={textColor} title={title} />
              <Images />
            </Scroll>
            <Scroll html />
            <Preload />
          </Wrapper>
        </ScrollControls>
      </Canvas>
    </div>
  );
}

export default FluidGlass;

useGLTF.preload('/assets/3d/lens.glb');
useGLTF.preload('/assets/3d/bar.glb');
useGLTF.preload('/assets/3d/cube.glb');
