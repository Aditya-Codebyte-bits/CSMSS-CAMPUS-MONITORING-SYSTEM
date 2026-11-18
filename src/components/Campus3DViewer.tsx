import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CampusZone, IncidentReport, TimeOfDay } from '../types';
import {
  Compass,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Shield,
  Layers,
  Box,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lightbulb,
  Sliders,
  X,
  Zap,
  ShieldAlert,
  Check,
} from 'lucide-react';

interface Campus3DViewerProps {
  zones: CampusZone[];
  incidents: IncidentReport[];
  activeZoneId?: number;
  onSelectZone: (zoneId: number) => void;
  boomBarrierOpen?: boolean;
}

export const Campus3DViewer: React.FC<Campus3DViewerProps> = ({
  zones,
  incidents,
  activeZoneId = 1,
  onSelectZone,
  boomBarrierOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic Lighting System States
  const [lightingMode, setLightingMode] = useState<'daylight' | 'night'>('daylight');
  const [isLightingPanelOpen, setIsLightingPanelOpen] = useState<boolean>(false);
  const [securityFloodlights, setSecurityFloodlights] = useState<boolean>(true);
  const [perimeterStreetlamps, setPerimeterStreetlamps] = useState<boolean>(true);
  const [emergencyBeacon, setEmergencyBeacon] = useState<boolean>(true);
  const [floodlightIntensity, setFloodlightIntensity] = useState<number>(1.0);

  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Internal mutable Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boomBarrier3Ref = useRef<THREE.Group | null>(null);
  const boomBarrier2Ref = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const securityLightsGroupRef = useRef<THREE.Group | null>(null);
  const gate3SpotRef = useRef<THREE.SpotLight | null>(null);
  const gate2SpotRef = useRef<THREE.SpotLight | null>(null);
  const streetlampsRef = useRef<THREE.PointLight[]>([]);
  const redBeaconRef = useRef<THREE.PointLight | null>(null);
  const buildingGlassesRef = useRef<THREE.MeshStandardMaterial[]>([]);

  const activeTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(-14, 1, 0));
  const activeCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(-20, 10, 6));
  const viewModeRef = useRef<'3d' | '2d'>('3d');
  const boomBarrierOpenRef = useRef<boolean>(boomBarrierOpen);
  const autoRotateRef = useRef<boolean>(autoRotate);

  useEffect(() => {
    boomBarrierOpenRef.current = boomBarrierOpen;
  }, [boomBarrierOpen]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);
  const cameraHeight2D = useRef<number>(55);
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Switch between 3D Perspective and 2D Overhead
  const handleSwitchTo3D = () => {
    setViewMode('3d');
    viewModeRef.current = '3d';
    const targetZone = zones.find((z) => z.zone_id === activeZoneId) || zones[0];
    activeCameraPos.current.set(...targetZone.camera_position);
    activeTargetPos.current.set(...targetZone.camera_target);
  };

  const handleSwitchTo2D = () => {
    setViewMode('2d');
    viewModeRef.current = '2d';
    const targetZone = zones.find((z) => z.zone_id === activeZoneId) || zones[0];
    activeTargetPos.current.set(targetZone.camera_target[0], 0, targetZone.camera_target[2]);
    activeCameraPos.current.set(
      targetZone.camera_target[0],
      cameraHeight2D.current,
      targetZone.camera_target[2] + 0.001
    );
  };

  const handleZoom2D = (direction: 'in' | 'out') => {
    if (viewModeRef.current !== '2d') return;
    const delta = direction === 'in' ? -10 : 10;
    cameraHeight2D.current = Math.max(18, Math.min(95, cameraHeight2D.current + delta));
    activeCameraPos.current.y = cameraHeight2D.current;
  };

  const handleReset2D = () => {
    if (viewModeRef.current !== '2d') return;
    cameraHeight2D.current = 55;
    activeTargetPos.current.set(-2, 0, -15);
    activeCameraPos.current.set(-2, 55, -14.999);
  };

  // Update target camera position when zone changes
  useEffect(() => {
    const targetZone = zones.find((z) => z.zone_id === activeZoneId);
    if (!targetZone) return;

    if (viewModeRef.current === '2d') {
      activeTargetPos.current.set(targetZone.camera_target[0], 0, targetZone.camera_target[2]);
      activeCameraPos.current.set(
        targetZone.camera_target[0],
        cameraHeight2D.current,
        targetZone.camera_target[2] + 0.001
      );
    } else {
      activeCameraPos.current.set(...targetZone.camera_position);
      activeTargetPos.current.set(...targetZone.camera_target);
    }
  }, [activeZoneId, zones]);

  // Three.js scene setup aligned with user's satellite map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080d1a);
    scene.fog = new THREE.FogExp2(0x080d1a, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(-20, 10, 6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.replaceChildren(renderer.domElement);

    // ==========================================
    // 1. LIGHTING RIG (Monochrome Architectural Glass)
    // ==========================================
    const lightsGroup = new THREE.Group();
    lightsGroupRef.current = lightsGroup;
    scene.add(lightsGroup);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x090d16, 0.6);
    hemiLight.position.set(0, 50, 0);
    lightsGroup.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xf8fafc, 1.4);
    dirLight.position.set(20, 45, 20);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 120;
      dirLight.shadow.camera.left = -45;
      dirLight.shadow.camera.right = 45;
      dirLight.shadow.camera.top = 45;
      dirLight.shadow.camera.bottom = -45;
      dirLight.shadow.bias = -0.0005;
    }
    lightsGroup.add(dirLight);

    // Electric Cyan accent edge light
    const cyanRim = new THREE.DirectionalLight(0x00f0ff, 0.5);
    cyanRim.position.set(-30, 20, -30);
    lightsGroup.add(cyanRim);

    // ==========================================
    // 1B. NOCTURNAL CAMPUS SECURITY ILLUMINATION RIG
    // ==========================================
    const securityLightsGroup = new THREE.Group();
    securityLightsGroup.visible = false; // off by default in daylight
    securityLightsGroupRef.current = securityLightsGroup;
    scene.add(securityLightsGroup);

    // 1. Gate 3 ANPR High-Intensity Surveillance Spotlight
    const g3Spot = new THREE.SpotLight(0xffffff, 3.2, 38, Math.PI / 4, 0.35, 1.0);
    g3Spot.position.set(-15, 6, 4);
    g3Spot.target.position.set(-14, 0, 0);
    scene.add(g3Spot.target);
    securityLightsGroup.add(g3Spot);
    gate3SpotRef.current = g3Spot;

    // 2. Gate 2 Checkpoint High-Intensity Surveillance Spotlight
    const g2Spot = new THREE.SpotLight(0xffffff, 3.2, 38, Math.PI / 4, 0.35, 1.0);
    g2Spot.position.set(17, 6, 4);
    g2Spot.target.position.set(18, 0, 0);
    scene.add(g2Spot.target);
    securityLightsGroup.add(g2Spot);
    gate2SpotRef.current = g2Spot;

    // 3. Gate 3 Emergency Hazard Red Strobe Beacon
    const beacon = new THREE.PointLight(0xef4444, 2.5, 16, 1.4);
    beacon.position.set(-14, 3.2, 0);
    securityLightsGroup.add(beacon);
    redBeaconRef.current = beacon;

    const beaconGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.3, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(-14, 3.2, 0);
    securityLightsGroup.add(beaconMesh);

    // 4. Perimeter Campus Roadway Lampposts
    const streetLampPositions: [number, number, number][] = [
      [-7, 0, 2.5],
      [2, 0, 2.5],
      [11, 0, 2.5],
      [-4.5, 0, -14],
      [-4.5, 0, -28],
      [10, 0, -18],
    ];

    streetlampsRef.current = [];
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
    const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    streetLampPositions.forEach(([lx, ly, lz]) => {
      const lGroup = new THREE.Group();
      lGroup.position.set(lx, ly, lz);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 12), poleMat);
      pole.position.y = 2.25;
      lGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), poleMat);
      arm.position.set(0.5, 4.5, 0);
      lGroup.add(arm);

      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.15, 12), lampHeadMat);
      head.position.set(1.0, 4.4, 0);
      lGroup.add(head);

      const pLight = new THREE.PointLight(0xfef3c7, 1.8, 20, 1.2);
      pLight.position.set(1.0, 4.2, 0);
      lGroup.add(pLight);
      streetlampsRef.current.push(pLight);

      securityLightsGroup.add(lGroup);
    });

    // ==========================================
    // 2. PROCEDURAL CAMPUS GROUND & ROAD NETWORK (MATCHING UPLOADED SATELLITE MAP)
    // ==========================================
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.25,
    });

    // Road 1: West-to-East Cross Road connecting Gate 3 and Gate 2 (Z = 0)
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(80, 6), roadMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(0, 0.02, 0);
    crossRoad.receiveShadow = true;
    scene.add(crossRoad);

    // Road 2: Gate 2 to CSMSS Road (East Highway running along Z axis at X = 20)
    const csmssRd = new THREE.Mesh(new THREE.PlaneGeometry(7, 90), roadMat);
    csmssRd.rotation.x = -Math.PI / 2;
    csmssRd.position.set(22, 0.02, -10);
    csmssRd.receiveShadow = true;
    scene.add(csmssRd);

    // Road 3: North-South Central Spine from Gate 3 heading North past Dental & Ayurveda (X = -2)
    const spineRoad = new THREE.Mesh(new THREE.PlaneGeometry(6, 65), roadMat);
    spineRoad.rotation.x = -Math.PI / 2;
    spineRoad.position.set(-2, 0.02, -22);
    spineRoad.receiveShadow = true;
    scene.add(spineRoad);

    // Road 4: Parking bay branch (East off central spine towards faculty parking)
    const parkingBranch = new THREE.Mesh(new THREE.PlaneGeometry(20, 5), roadMat);
    parkingBranch.rotation.x = -Math.PI / 2;
    parkingBranch.position.set(10, 0.02, -18);
    scene.add(parkingBranch);

    // ==========================================
    // 3. GATE 3 (WEST) & GATE 2 (EAST) STRUCTURES
    // ==========================================
    const createGate = (x: number, z: number, label: string) => {
      const gGroup = new THREE.Group();
      gGroup.position.set(x, 0, z);

      // Gatehouse Pavilion
      const gatehouse = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 3, 3),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 })
      );
      gatehouse.position.set(0, 1.5, -2.5);
      gatehouse.castShadow = true;
      gGroup.add(gatehouse);

      // Glass window
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.1, metalness: 0.9 })
      );
      win.position.set(0, 1.6, -1);
      gGroup.add(win);

      // Pillars & Barrier
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.5, 16), pillarMat);
      p1.position.set(-3, 2.25, 0);
      gGroup.add(p1);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.5, 16), pillarMat);
      p2.position.set(3, 2.25, 0);
      gGroup.add(p2);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.4, 0.5), pillarMat);
      beam.position.set(0, 4.5, 0);
      gGroup.add(beam);

      // Motorized Boom Barrier Arm
      const barrierPivot = new THREE.Group();
      barrierPivot.position.set(-2.8, 0.9, 0);
      const armGeo = new THREE.BoxGeometry(5.6, 0.15, 0.15);
      armGeo.translate(2.8, 0, 0);
      const armMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.4 });
      const arm = new THREE.Mesh(armGeo, armMat);
      barrierPivot.add(arm);
      gGroup.add(barrierPivot);

      scene.add(gGroup);
      return barrierPivot;
    };

    // Gate 3 on the West (Engineering entrance)
    boomBarrier3Ref.current = createGate(-14, 0, 'Gate 3');

    // Gate 2 on the East (Polytechnic entrance on CSMSS Rd)
    boomBarrier2Ref.current = createGate(18, 0, 'Gate 2');

    // Red Emergency Hazard Buffer at Gate 3 (From user's red box annotation)
    const redBufferMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const redBuffer = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 5), redBufferMat);
    redBuffer.position.set(-14, 1.5, 0);
    scene.add(redBuffer);
    const redHelper = new THREE.BoxHelper(redBuffer, 0xef4444);
    scene.add(redHelper);

    // ==========================================
    // 4. MAP-ACCURATE BUILDINGS (MATCHING USER SATELLITE IMAGE)
    // ==========================================
    const createBlock = (name: string, x: number, z: number, w: number, h: number, d: number) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0, z);

      // Main structural volume
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.7 })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);

      // Glass ribbon windows (with night-mode emissive support)
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        roughness: 0.1,
        metalness: 0.95,
        emissive: 0x000000,
        emissiveIntensity: 0.65,
      });
      buildingGlassesRef.current.push(glassMat);
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.92, h * 0.65, d + 0.1),
        glassMat
      );
      glass.position.set(0, h / 2, 0);
      bGroup.add(glass);

      // Architectural roof cap
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.6, 0.4, d + 0.6),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 })
      );
      roof.position.set(0, h + 0.2, 0);
      bGroup.add(roof);

      scene.add(bGroup);
      return bGroup;
    };

    // 1. Southwest: CSMSS Chh. Shahu College of Engineering
    createBlock('Engineering College', -20, -10, 16, 7.5, 14);

    // 2. Southeast: CSMSS College of Polytechnic
    createBlock('Polytechnic College', 10, -10, 14, 6.5, 14);

    // 3. Central: CSMSS Dental College
    createBlock('Dental College', -2, -18, 16, 7, 12);

    // 4. North: CSMSS Ayurveda College & Rugnalaya
    createBlock('Ayurveda College', -1, -36, 18, 8, 14);

    // 5. Northeast: Faculty & Student Parking Lot Bay
    const parkingBay = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.2 })
    );
    parkingBay.rotation.x = -Math.PI / 2;
    parkingBay.position.set(12, 0.03, -18);
    scene.add(parkingBay);

    // Parked vehicle instances in parking bay
    const parkVehMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    for (let px = 6; px <= 16; px += 3) {
      const pCar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3), parkVehMat);
      pCar.position.set(px, 0.35, -18);
      scene.add(pCar);
    }

    // Vehicle parked inside Red Emergency Buffer at Gate 3 (Violating MH20BY1122)
    const violatorCar = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.7, 3.6),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.1 })
    );
    violatorCar.position.set(-14, 0.35, 0);
    scene.add(violatorCar);

    // ==========================================
    // 5. ORBIT / PAN LISTENERS
    // ==========================================
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      if (viewModeRef.current === '2d') {
        // 2D Overhead: pan along ground plane (X and Z)
        const factor = (cameraHeight2D.current / 50) * 0.08;
        activeCameraPos.current.x -= deltaX * factor;
        activeCameraPos.current.z -= deltaY * factor;
        activeTargetPos.current.x -= deltaX * factor;
        activeTargetPos.current.z -= deltaY * factor;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // 3D Perspective Orbit
      const offset = activeCameraPos.current.clone().sub(activeTargetPos.current);
      const radius = offset.length();
      let theta = Math.atan2(offset.x, offset.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

      theta -= deltaX * 0.006;
      phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi + deltaY * 0.006));

      activeCameraPos.current.x = activeTargetPos.current.x + radius * Math.sin(phi) * Math.sin(theta);
      activeCameraPos.current.y = activeTargetPos.current.y + radius * Math.cos(phi);
      activeCameraPos.current.z = activeTargetPos.current.z + radius * Math.sin(phi) * Math.cos(theta);

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (viewModeRef.current === '2d') {
        // 2D Overhead Zoom (height adjustment)
        const zoomDelta = e.deltaY * 0.06;
        cameraHeight2D.current = Math.max(18, Math.min(95, cameraHeight2D.current + zoomDelta));
        activeCameraPos.current.y = cameraHeight2D.current;
        return;
      }

      // 3D Perspective Zoom
      const zoomFactor = e.deltaY * 0.02;
      const dir = activeCameraPos.current.clone().sub(activeTargetPos.current).normalize();
      activeCameraPos.current.addScaledVector(dir, zoomFactor);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      if (cameraRef.current) {
        cameraRef.current.position.lerp(activeCameraPos.current, 0.08);
        cameraRef.current.lookAt(activeTargetPos.current);
      }

      // Smooth barrier arms lift
      const targetAngle = boomBarrierOpenRef.current ? -Math.PI / 2.3 : 0;
      if (boomBarrier3Ref.current) {
        boomBarrier3Ref.current.rotation.z = THREE.MathUtils.damp(
          boomBarrier3Ref.current.rotation.z,
          targetAngle,
          6,
          delta
        );
      }
      if (boomBarrier2Ref.current) {
        boomBarrier2Ref.current.rotation.z = THREE.MathUtils.damp(
          boomBarrier2Ref.current.rotation.z,
          targetAngle,
          6,
          delta
        );
      }

      // Pulse Gate 3 red emergency buffer beacon in night mode
      if (redBeaconRef.current && lightingModeRef.current === 'night' && emergencyBeaconRef.current) {
        const pulse = Math.sin(clock.getElapsedTime() * 5) * 0.8 + 1.8;
        redBeaconRef.current.intensity = pulse * floodlightIntensityRef.current;
      }

      if (autoRotateRef.current && !isDragging.current && viewModeRef.current === '3d') {
        const offset = activeCameraPos.current.clone().sub(activeTargetPos.current);
        const radius = offset.length();
        let theta = Math.atan2(offset.x, offset.z) + delta * 0.15;
        const phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

        activeCameraPos.current.x = activeTargetPos.current.x + radius * Math.sin(phi) * Math.sin(theta);
        activeCameraPos.current.z = activeTargetPos.current.z + radius * Math.sin(phi) * Math.cos(theta);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update barrier color
  useEffect(() => {
    [boomBarrier3Ref.current, boomBarrier2Ref.current].forEach((bRef) => {
      if (!bRef) return;
      const armMesh = bRef.children[0] as THREE.Mesh;
      if (armMesh && armMesh.material) {
        (armMesh.material as THREE.MeshStandardMaterial).color.set(boomBarrierOpen ? 0x10b981 : 0xef4444);
      }
    });
  }, [boomBarrierOpen]);

  const lightingModeRef = useRef<'daylight' | 'night'>('daylight');
  const emergencyBeaconRef = useRef<boolean>(true);
  const floodlightIntensityRef = useRef<number>(1.0);

  // Dynamic Campus Security Lighting Mode Effect
  useEffect(() => {
    lightingModeRef.current = lightingMode;
    emergencyBeaconRef.current = emergencyBeacon;
    floodlightIntensityRef.current = floodlightIntensity;

    if (!sceneRef.current || !lightsGroupRef.current) return;

    const hemi = lightsGroupRef.current.children[0] as THREE.HemisphereLight;
    const dir = lightsGroupRef.current.children[1] as THREE.DirectionalLight;
    const rim = lightsGroupRef.current.children[2] as THREE.DirectionalLight;

    if (lightingMode === 'daylight') {
      sceneRef.current.background = new THREE.Color(0x0a101d);
      sceneRef.current.fog = new THREE.FogExp2(0x0a101d, 0.012);

      if (hemi) {
        hemi.color.set(0xe0f2fe);
        hemi.groundColor.set(0x090d16);
        hemi.intensity = 0.75;
      }
      if (dir) {
        dir.color.set(0xf8fafc);
        dir.intensity = 1.45;
      }
      if (rim) {
        rim.color.set(0x00f0ff);
        rim.intensity = 0.5;
      }

      // Daylight: Security lighting standby/off
      if (securityLightsGroupRef.current) {
        securityLightsGroupRef.current.visible = false;
      }
      buildingGlassesRef.current.forEach((m) => {
        m.emissive.set(0x000000);
      });
    } else {
      // NIGHT MODE: Campus Security Illumination Active
      sceneRef.current.background = new THREE.Color(0x020617);
      sceneRef.current.fog = new THREE.FogExp2(0x020617, 0.022);

      if (hemi) {
        hemi.color.set(0x1e293b);
        hemi.groundColor.set(0x020617);
        hemi.intensity = 0.22;
      }
      if (dir) {
        dir.color.set(0x38bdf8);
        dir.intensity = 0.2;
      }
      if (rim) {
        rim.color.set(0x0284c7);
        rim.intensity = 0.3;
      }

      if (securityLightsGroupRef.current) {
        securityLightsGroupRef.current.visible = true;
      }

      if (gate3SpotRef.current) {
        gate3SpotRef.current.intensity = securityFloodlights ? 3.4 * floodlightIntensity : 0;
      }
      if (gate2SpotRef.current) {
        gate2SpotRef.current.intensity = securityFloodlights ? 3.4 * floodlightIntensity : 0;
      }
      streetlampsRef.current.forEach((sl) => {
        sl.intensity = perimeterStreetlamps ? 2.0 * floodlightIntensity : 0;
      });
      if (redBeaconRef.current) {
        redBeaconRef.current.intensity = emergencyBeacon ? 2.5 * floodlightIntensity : 0;
      }

      // Glowing campus windows in night mode
      buildingGlassesRef.current.forEach((m) => {
        m.emissive.set(0x0284c7);
        m.emissiveIntensity = 0.65;
      });
    }
  }, [lightingMode, securityFloodlights, perimeterStreetlamps, emergencyBeacon, floodlightIntensity]);

  return (
    <div className="relative w-full h-[540px] bg-slate-950 rounded-2xl overflow-hidden border border-[#d6c4b6] shadow-md select-none group">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: View Mode (3D / 2D Overhead) & Status HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* View Mode Toggle Pill */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-xl">
          <button
            onClick={handleSwitchTo3D}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === '3d'
                ? 'bg-[#800000] text-amber-200 shadow-sm border border-amber-400/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-amber-300" />
            <span>3D Model</span>
          </button>

          <button
            onClick={handleSwitchTo2D}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === '2d'
                ? 'bg-[#800000] text-amber-200 shadow-sm border border-amber-400/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>2D Overhead</span>
          </button>
        </div>

        {/* Status / Lighting Badge */}
        <div className="flex items-center gap-2">
          {viewMode === '2d' && (
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-amber-400/30 text-[10px] text-amber-200/90 flex items-center gap-1.5 font-mono shadow-md animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse"></span>
              <span>2D Top-Down View · Drag to Pan · Scroll to Zoom</span>
            </div>
          )}

          {lightingMode === 'night' && (
            <div className="bg-indigo-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-400/40 text-[10px] text-indigo-200 flex items-center gap-1.5 font-mono shadow-md">
              <Moon className="w-3 h-3 text-amber-300" />
              <span>Night Security Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Right: 2D Zoom, Dynamic Lighting Panel Toggle, and Auto-Orbit */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* 2D Zoom & Recenter Controls */}
        {viewMode === '2d' && (
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg">
            <button
              onClick={() => handleZoom2D('in')}
              className="p-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom2D('out')}
              className="p-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset2D}
              className="p-1.5 rounded-lg text-xs text-amber-300 hover:text-amber-100 hover:bg-slate-800 transition cursor-pointer"
              title="Reset Campus Center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Security Lighting Panel Toggle Button */}
        <button
          onClick={() => setIsLightingPanelOpen(!isLightingPanelOpen)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg border ${
            lightingMode === 'night'
              ? 'bg-gradient-to-r from-indigo-900 to-[#1e1b4b] text-amber-300 border-indigo-400/50 hover:border-amber-400'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300 hover:bg-amber-400'
          }`}
          title="Toggle Dynamic Security Lighting Control Panel"
        >
          {lightingMode === 'night' ? (
            <Moon className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-slate-950" />
          )}
          <span className="font-serif hidden sm:inline">
            {lightingMode === 'night' ? 'Night Mode' : 'Daylight'}
          </span>
          <Sliders className="w-3.5 h-3.5 opacity-80" />
        </button>

        {viewMode === '3d' && (
          <button
            onClick={() => setAutoRotate((r) => !r)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer shadow-lg border border-white/10 ${
              autoRotate ? 'bg-emerald-700 text-white' : 'bg-slate-900/85 text-slate-300 hover:text-white'
            }`}
          >
            Auto Orbit
          </button>
        )}
      </div>

      {/* Floating Dynamic Security Lighting Control Panel */}
      {isLightingPanelOpen && (
        <div className="absolute top-16 right-4 z-30 w-80 bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl space-y-4 animate-fade-in text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#800000] text-amber-300 border border-amber-400/30">
                <Lightbulb className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white font-serif uppercase tracking-wider">
                  Campus Illumination
                </h4>
                <p className="text-[10px] text-amber-300/80 font-mono">Security Lighting Rig</p>
              </div>
            </div>
            <button
              onClick={() => setIsLightingPanelOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Mode Switch: Daylight vs Night Mode */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-serif">
              Master Environment State
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLightingMode('daylight')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                  lightingMode === 'daylight'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Daylight</span>
              </button>

              <button
                onClick={() => setLightingMode('night')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                  lightingMode === 'night'
                    ? 'bg-indigo-600 text-amber-200 border-indigo-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Night Mode</span>
              </button>
            </div>
          </div>

          {/* Night Security Illumination Controls */}
          {lightingMode === 'night' ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Gate 2 & 3 Floodlights
                </span>
                <button
                  onClick={() => setSecurityFloodlights(!securityFloodlights)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                    securityFloodlights
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 border border-white/5'
                  }`}
                >
                  {securityFloodlights ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                  Perimeter Streetlamps
                </span>
                <button
                  onClick={() => setPerimeterStreetlamps(!perimeterStreetlamps)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                    perimeterStreetlamps
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 border border-white/5'
                  }`}
                >
                  {perimeterStreetlamps ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Gate 3 Red Strobe Beacon
                </span>
                <button
                  onClick={() => setEmergencyBeacon(!emergencyBeacon)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                    emergencyBeacon
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-500 border border-white/5'
                  }`}
                >
                  {emergencyBeacon ? 'STROBE' : 'OFF'}
                </button>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Security Beam Intensity</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {Math.round(floodlightIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.1"
                  value={floodlightIntensity}
                  onChange={(e) => setFloodlightIntensity(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Quick Scenarios */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Quick Security Presets
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    onClick={() => {
                      setSecurityFloodlights(true);
                      setEmergencyBeacon(true);
                      setFloodlightIntensity(1.4);
                      onSelectZone(1); // Gate 3
                    }}
                    className="p-1.5 rounded-lg bg-[#800000]/40 text-amber-200 border border-amber-500/30 hover:bg-[#800000]/60 transition text-center cursor-pointer font-medium"
                  >
                    🚨 Gate 3 Breach
                  </button>
                  <button
                    onClick={() => {
                      setSecurityFloodlights(true);
                      setPerimeterStreetlamps(true);
                      setEmergencyBeacon(true);
                      setFloodlightIntensity(1.6);
                    }}
                    className="p-1.5 rounded-lg bg-indigo-950/70 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-900/60 transition text-center cursor-pointer font-medium"
                  >
                    🔒 Max Perimeter
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              Daylight solar illumination active. Switch to <strong>Night Mode</strong> to activate high-beam ANPR surveillance floodlights, campus streetlamps, and gate warning beacons.
            </div>
          )}

          {/* Footer note */}
          <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Watchman Deck</span>
            <span className={lightingMode === 'night' ? 'text-emerald-400' : 'text-amber-400'}>
              {lightingMode === 'night' ? 'Night Security Sim' : 'Sun Ambient Active'}
            </span>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Camera Dock */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-xl transition-all duration-300 ${
          isControlsCollapsed ? 'translate-y-12 opacity-80 hover:translate-y-0 hover:opacity-100' : ''
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/15 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
              Fly To:
            </span>
            <button
              onClick={() => onSelectZone(1)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                activeZoneId === 1 ? 'bg-[#800000] text-amber-200 font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Gate 3 (Red Buffer)
            </button>
            <button
              onClick={() => onSelectZone(2)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                activeZoneId === 2 ? 'bg-[#800000] text-amber-200 font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Gate 2 (CSMSS Rd)
            </button>
            <button
              onClick={() => onSelectZone(6)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                activeZoneId === 6 ? 'bg-[#800000] text-amber-200 font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Ayurveda
            </button>
            <button
              onClick={() => onSelectZone(7)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                activeZoneId === 7 ? 'bg-[#800000] text-amber-200 font-semibold shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Parking Bay
            </button>
          </div>

          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            {isControlsCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
