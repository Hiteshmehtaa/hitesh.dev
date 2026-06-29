import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';


function createCar(theme) {
  const carGroup = new THREE.Group();
  const bodyColor = theme === 'dark' ? 0xcc2200 : 0x1144ff;
  const cabinColor = theme === 'dark' ? 0xe63900 : 0x3366ff;
  const wheelColor = 0x111111;
  const bodyMat  = new THREE.MeshToonMaterial({ color: bodyColor });
  const cabinMat = new THREE.MeshToonMaterial({ color: cabinColor });
  const wheelMat = new THREE.MeshToonMaterial({ color: wheelColor });
  const headLightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 });
  const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });

  // Chassis — slightly tapered at top via vertex manipulation
  const chassisGeo = new THREE.BoxGeometry(1.4, 0.4, 2.8);
  const posAttr = chassisGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    if (posAttr.getY(i) > 0) {
      posAttr.setX(i, posAttr.getX(i) * (posAttr.getZ(i) > 0 ? 0.9 : 0.95));
    }
  }
  chassisGeo.computeVertexNormals();
  const chassisMesh = new THREE.Mesh(chassisGeo, bodyMat);
  chassisMesh.position.y = 0.6; chassisMesh.castShadow = true; chassisMesh.receiveShadow = true;
  carGroup.add(chassisMesh);

  // Cabin — windshield slant baked via vertex offset
  const cabinGeo = new THREE.BoxGeometry(1.0, 0.6, 1.4);
  const cPos = cabinGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    if (cPos.getY(i) > 0 && cPos.getZ(i) > 0) cPos.setZ(i, cPos.getZ(i) - 0.3);
    if (cPos.getY(i) > 0) cPos.setX(i, cPos.getX(i) * 0.9);
  }
  cabinGeo.computeVertexNormals();
  const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
  cabinMesh.position.set(0, 1.1, -0.2); cabinMesh.castShadow = true;
  carGroup.add(cabinMesh);

  // Headlights (front +Z)
  [[-0.5, 1.4], [0.5, 1.4]].forEach(([x, z]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), headLightMat);
    m.position.set(x, 0.65, z); carGroup.add(m);
  });
  // Tail lights (rear -Z)
  [[-0.5, -1.4], [0.5, -1.4]].forEach(([x, z]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.1), tailLightMat);
    m.position.set(x, 0.65, z); carGroup.add(m);
  });

  // Physics chassis - Z reduced to 1.0 (from 1.4) to prevent bumpers hitting the ground and flipping the car
  const chassisShape = new CANNON.Box(new CANNON.Vec3(0.7, 0.2, 1.0));
  
  // --- PENDULUM CENTER OF MASS FIX ---
  // This is the key to stability. We create a body with a low center of mass,
  // and then add the chassis collision shape *above* it.
  const chassisBody = new CANNON.Body({ mass: 150, position: new CANNON.Vec3(0, 1.0, 5) });
  chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.7, 0)); // Shape is 0.7m ABOVE the center of mass
  chassisBody.linearDamping = 0.55;
  chassisBody.angularDamping = 0.65;  // Stabilizes yaw/pitch spin

  const vehicle = new CANNON.RaycastVehicle({ chassisBody, indexRightAxis: 0, indexUpAxis: 1, indexForwardAxis: 2 });

  const wheelOpts = {
    radius: 0.4, directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 60, suspensionRestLength: 0.3,
    maxSuspensionForce: 100000, maxSuspensionTravel: 0.3,
    dampingRelaxation: 8.0, dampingCompression: 10.0,
    axleLocal: new CANNON.Vec3(-1, 0, 0), rollInfluence: 0.01,
  };
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 3.5, chassisConnectionPointLocal: new CANNON.Vec3(-0.8, 0.4,  1.0) });
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 3.5, chassisConnectionPointLocal: new CANNON.Vec3( 0.8, 0.4,  1.0) });
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 4.0, chassisConnectionPointLocal: new CANNON.Vec3(-0.8, 0.4, -1.0) });
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 4.0, chassisConnectionPointLocal: new CANNON.Vec3( 0.8, 0.4, -1.0) });

  // Visual wheel groups
  const wheels = [];
  for (let i = 0; i < 4; i++) {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24), wheelMat);
    tire.rotation.z = Math.PI / 2; tire.castShadow = true;
    wg.add(tire); wheels.push(wg);
  }

  return { chassisBody, vehicle, carGroup, wheels };
}

const projectsData = {
  hiresia: {
    title: 'Hirevia',
    tag: 'FULL STACK ATS',
    image: '/hiresia_dashboard.png',
    bullets: [
      'Built a MERN-based Applicant Tracking System (ATS) with job postings, candidate tracking, interview scheduling, and analytics features.',
      'Designed an analytics dashboard surfacing real-time hiring metrics and funnel insights.',
      'Automated email coordination via an interview scheduling module.',
      'Implemented secure role-based authentication (RBAC) for recruiters, candidates, and admins.',
      'Deployed the platform to production on Vercel ensuring high availability.'
    ],
    link: 'https://hiresiaweb.vercel.app'
  },
  rapidrescue: {
    title: 'RapidRescueQ',
    tag: 'COORDINATION PLATFORM',
    image: '/rapid_rescue_ui.png',
    bullets: [
      'Independently designed and built a MERN-stack platform connecting public reporters, NGOs, volunteers, and adopters.',
      'Implemented live camera-based emergency reporting with photo evidence and location capture.',
      'Created a separate NGO authentication portal for partner organizations to manage rescue cases.',
      'Deployed the platform to production on Render, demonstrating end-to-end full-stack ownership from design to deployment.'
    ],
    link: '#'
  }
};

function ContactForm({ theme }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: '20px',
        background: theme === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
        border: '1px solid #4CAF50',
        borderRadius: '8px',
        color: '#4CAF50',
        textAlign: 'center',
        margin: '16px 0',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginBottom: '8px', display: 'inline-block' }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>Message Sent!</div>
        <div style={{ fontSize: '13px', opacity: 0.85 }}>Thank you! I will get back to you shortly.</div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '6px',
    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
    background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    color: theme === 'dark' ? '#fff' : '#000',
    fontSize: '13px',
    marginBottom: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s'
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
      <input
        type="text"
        placeholder="Your Name"
        required
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        style={inputStyle}
      />
      <input
        type="email"
        placeholder="Your Email"
        required
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
        style={inputStyle}
      />
      <textarea
        placeholder="Your Message..."
        rows="4"
        required
        value={formData.message}
        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
        style={{ ...inputStyle, resize: 'none' }}
      />
      <button
        type="submit"
        style={{
          padding: '12px',
          background: '#ff6b6b',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '13px',
          transition: 'background 0.2s, transform 0.1s'
        }}
      >
        Send Message
      </button>
    </form>
  );
}

function App() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const canvasContainerRef = useRef(null);
  const minimapRef = useRef(null);
  
  // Platform Features State
  const [theme, setTheme] = useState('light');
  const [selectedProject, setSelectedProject] = useState(null);
  const [carHitItem, setCarHitItem] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (e, zoneId) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('drive-to-zone', { detail: zoneId }));
  };


  // Three.js + Cannon.js — Bruno Simon Style Playground
  const activeZoneRef = useRef(null);

  useEffect(() => {
    const onEnter = (e) => setActiveZone(e.detail);
    const onLeave = () => setActiveZone(null);
    window.addEventListener('zone-enter', onEnter);
    window.addEventListener('zone-leave', onLeave);
    return () => {
      window.removeEventListener('zone-enter', onEnter);
      window.removeEventListener('zone-leave', onLeave);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    while (container.firstChild) container.removeChild(container.firstChild);

    // Simulated load progress
    let _prog = 0;
    const _loadInterval = setInterval(() => {
      _prog += Math.random() * 18 + 4;
      if (_prog >= 100) { _prog = 100; clearInterval(_loadInterval); }
      setLoadProgress(Math.round(_prog));
    }, 120);

    const W = container.clientWidth || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;


    // ── THREE SETUP ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const BG = theme === 'dark' ? 0x222831 : 0xf2b880; // Bruno Simon warm clay
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 30, 100);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ── LIGHTING ────────────────────────────────────────────────────────────
    const sun = new THREE.DirectionalLight(0xfff5e6, theme === 'dark' ? 1.0 : 1.5);
    sun.position.set(30, 50, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); // Optimized shadow map size for performance
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -60;
    sun.shadow.camera.right = sun.shadow.camera.top = 60;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    
    const ambient = new THREE.AmbientLight(0xffffff, theme === 'dark' ? 0.4 : 0.6);
    scene.add(ambient);
    
    // Soft hemisphere light for clay look
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, theme === 'dark' ? 0.2 : 0.4);
    scene.add(hemiLight);

    // ── CANNON WORLD ────────────────────────────────────────────────────────
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -15, 0) });
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = false;

    const groundMat = new CANNON.Material('ground');
    const carMat = new CANNON.Material('car');
    world.addContactMaterial(new CANNON.ContactMaterial(carMat, groundMat, { friction: 0.6, restitution: 0.1 }));

    // ── GROUND ───────────────────────────────────────────────────────────────
    const groundBody = new CANNON.Body({ mass: 0, material: groundMat });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    const groundColor = theme === 'dark' ? 0x2d343f : 0xf2b880;
    const groundVisual = new THREE.MeshStandardMaterial({ color: groundColor, roughness: 1.0, metalness: 0.0 });
    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundVisual);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Subtle Grid
    const grid = new THREE.GridHelper(300, 60, 0x000000, 0x000000);
    grid.material.opacity = theme === 'dark' ? 0.1 : 0.05;
    grid.material.transparent = true;
    scene.add(grid);

    // ── SCENERY & PROPS ──────────────────────────────────────────────────────
    const props = [];
    const windmills = [];

    // Redesigned Cyber Launchpad Ramp
    const addRamp = (x, z, rotationY) => {
        const w = 4, h = 1.5, d = 4;
        
        // Physics shape: wedge
        const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2));
        const body = new CANNON.Body({ mass: 0 }); // static
        body.addShape(shape);
        body.position.set(x, 0, z);
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI/12); // Slanted
        body.position.y = -0.55;
        world.addBody(body);

        const euler = new CANNON.Vec3();
        body.quaternion.toEuler(euler);
        const qY = new CANNON.Quaternion();
        qY.setFromAxisAngle(new CANNON.Vec3(0,1,0), rotationY);
        body.quaternion = qY.mult(body.quaternion);

        // Cyber launchpad mesh group
        const rampGroup = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({
          color: theme === 'dark' ? 0x1f232a : 0xdbe1e8,
          roughness: 0.5,
          metalness: 0.8
        });

        const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metalMat);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        rampGroup.add(baseMesh);

        // Glowing neon stripes on the ramp sides
        const stripeMat = new THREE.MeshStandardMaterial({
          color: 0xff5555, // Launch red/orange
          emissive: 0xff5555,
          emissiveIntensity: 1.2
        });

        const leftStripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, d), stripeMat);
        leftStripe.position.set(-w/2 + 0.15, h/2 + 0.01, 0);
        const rightStripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, d), stripeMat);
        rightStripe.position.set(w/2 - 0.15, h/2 + 0.01, 0);
        
        baseMesh.add(leftStripe);
        baseMesh.add(rightStripe);

        rampGroup.position.copy(body.position);
        rampGroup.quaternion.copy(body.quaternion);
        scene.add(rampGroup);
        // Static ramp positioned at start, no need to sync in animate loop
    };

    // Redesigned Stylized Cyber-Crystal Trees
    const addTree = (x, z) => {
       const crystalGroup = new THREE.Group();
       
       // Base rock
       const base = new THREE.Mesh(
         new THREE.DodecahedronGeometry(0.8, 0),
         new THREE.MeshStandardMaterial({
           color: theme === 'dark' ? 0x2d343f : 0x8c96a0,
           roughness: 0.8,
           flatShading: true
         })
       );
       base.position.y = 0.3;
       base.castShadow = true;
       crystalGroup.add(base);

       // 3 Glowing crystal shards
       const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
       const colors = [0x38d9a9, 0x4dabf7, 0xbe4bdb];
       const shardColor = colors[Math.floor(Math.random() * colors.length)];

       const crystalMat = new THREE.MeshStandardMaterial({
         color: shardColor,
         emissive: shardColor,
         emissiveIntensity: 0.6,
         roughness: 0.1,
         metalness: 0.9,
         flatShading: true
       });

       // Main shard
       const shard1 = new THREE.Mesh(crystalGeo, crystalMat);
       shard1.position.set(0, 1.0, 0);
       shard1.scale.set(0.6, 1.8, 0.6);
       shard1.castShadow = true;
       crystalGroup.add(shard1);

       // Small side shards
       const shard2 = new THREE.Mesh(crystalGeo, crystalMat);
       shard2.position.set(0.35, 0.7, 0.25);
       shard2.scale.set(0.4, 1.2, 0.4);
       shard2.rotation.set(0.2, 0, -0.4);
       shard2.castShadow = true;
       crystalGroup.add(shard2);

       const shard3 = new THREE.Mesh(crystalGeo, crystalMat);
       shard3.position.set(-0.35, 0.6, -0.25);
       shard3.scale.set(0.4, 1.0, 0.4);
       shard3.rotation.set(-0.2, 0, 0.4);
       shard3.castShadow = true;
       crystalGroup.add(shard3);

       crystalGroup.position.set(x, 0, z);
       scene.add(crystalGroup);
       
       // Static physics body for crystal cluster
       const body = new CANNON.Body({ mass: 0 });
       body.addShape(new CANNON.Cylinder(0.8, 0.8, 1.5, 8));
       body.position.set(x, 0.75, z);
       const q = new CANNON.Quaternion();
       q.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
       body.quaternion.copy(q);
       world.addBody(body);
    };

    // Redesigned High-Tech Energy Pin
    const addPin = (x, z) => {
       const body = new CANNON.Body({ mass: 1 });
       body.addShape(new CANNON.Cylinder(0.2, 0.2, 1.0, 8));
       body.position.set(x, 1.0, z);
       body.linearDamping = 0.4;
       body.angularDamping = 0.4;
       const q = new CANNON.Quaternion();
       q.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
       body.quaternion.copy(q);
       world.addBody(body);

       // Glowing energy pin
       const pinGroup = new THREE.Group();
       const pinMatMain = new THREE.MeshStandardMaterial({
         color: 0x66FCF1, // Cyan neon
         emissive: 0x66FCF1,
         emissiveIntensity: 0.8,
         roughness: 0.1,
         metalness: 0.9,
         flatShading: true
       });
       
       const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.0, 12), pinMatMain);
       mesh.castShadow = true;
       mesh.receiveShadow = true;
       pinGroup.add(mesh);

       const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), pinMatMain);
       cap.position.y = 0.5;
       pinGroup.add(cap);

       pinGroup.position.set(x, 1.0, z);
       scene.add(pinGroup);
       props.push({ body, mesh: pinGroup, isPin: true });
    };

    // Redesigned Glowing Energy Box/Crate
    const addBlock = (x, z, ry) => {
       const body = new CANNON.Body({ mass: 5 });
       body.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)));
       body.position.set(x, 1, z);
       const q = new CANNON.Quaternion();
       q.setFromAxisAngle(new CANNON.Vec3(0,1,0), ry);
       body.quaternion.copy(q);
       world.addBody(body);

       // High-tech crate mesh group
       const crateGroup = new THREE.Group();
       
       // Core box
       const coreGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
       const coreMat = new THREE.MeshStandardMaterial({
         color: theme === 'dark' ? 0x1a2130 : 0xe0e5ec,
         roughness: 0.6,
         metalness: 0.8
       });
       const core = new THREE.Mesh(coreGeo, coreMat);
       core.castShadow = true;
       core.receiveShadow = true;
       crateGroup.add(core);

       // Glowing energy bands on all sides
       const glowColor = 0xff922b; // Energy orange
       const glowMat = new THREE.MeshStandardMaterial({
         color: glowColor,
         emissive: glowColor,
         emissiveIntensity: 1.2
       });

       const band1 = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.2, 0.2), glowMat);
       const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.02, 0.2), glowMat);
       const band3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2.02), glowMat);
       crateGroup.add(band1);
       crateGroup.add(band2);
       crateGroup.add(band3);

       crateGroup.position.set(x, 1, z);
       crateGroup.rotation.y = ry;
       scene.add(crateGroup);
       props.push({ body, mesh: crateGroup });
    };

    // Redesigned Cliff/Rock Boundary
    const addCliff = (x, z, scale) => {
      const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
      // Elongate slightly vertically
      const posAttr = rockGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
         posAttr.setY(i, posAttr.getY(i) * 1.5);
      }
      rockGeo.computeVertexNormals();

      const rockMat = new THREE.MeshStandardMaterial({
        color: theme === 'dark' ? 0x1b2028 : 0xd2a477,
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true
      });
      const mesh = new THREE.Mesh(rockGeo, rockMat);
      mesh.position.set(x, scale * 0.7 - 1.0, z); // Embed slightly
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Spherical static physics body
      const body = new CANNON.Body({ mass: 0 });
      body.addShape(new CANNON.Sphere(scale * 0.8));
      body.position.set(x, scale * 0.7 - 1.0, z);
      world.addBody(body);
      // Static cliffs positioned at start, no need to sync in animate loop
    };

    // Redesigned Curved Launchpad Ramp (Wedge approximation)
    const addCurvedRamp = (x, z, rotationY) => {
       const segments = 6;
       const width = 6;
       const length = 10;
       const rampGroup = new THREE.Group();

       for (let i = 0; i < segments; i++) {
         const angle = (i / (segments - 1)) * (Math.PI / 6); // Max angle 30 deg
         const segmentLength = length / segments;
         const h = 0.4;
         
         let z_local = 0;
         let y_local = 0;
         for (let j = 0; j < i; j++) {
           const a = (j / (segments - 1)) * (Math.PI / 6);
           z_local += segmentLength * Math.cos(a);
           y_local += segmentLength * Math.sin(a);
         }
         const a_curr = (i / (segments - 1)) * (Math.PI / 6);
         z_local += 0.5 * segmentLength * Math.cos(a_curr);
         y_local += 0.5 * segmentLength * Math.sin(a_curr) - 0.2;

         // Physics segment
         const shape = new CANNON.Box(new CANNON.Vec3(width / 2, h / 2, segmentLength / 2));
         const body = new CANNON.Body({ mass: 0 }); // static
         body.addShape(shape);
         
         body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), angle);
         
         const localPos = new THREE.Vector3(0, y_local, z_local);
         localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
         body.position.set(x + localPos.x, localPos.y, z + localPos.z);
         
         const qY = new CANNON.Quaternion();
         qY.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationY);
         body.quaternion = qY.mult(body.quaternion);
         
         world.addBody(body);

         // Visual mesh
         const metalMat = new THREE.MeshStandardMaterial({
           color: theme === 'dark' ? 0x1f232a : 0xdbe1e8,
           roughness: 0.5,
           metalness: 0.8
         });
         const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, h, segmentLength), metalMat);
         mesh.castShadow = true;
         mesh.receiveShadow = true;
         
         const stripeMat = new THREE.MeshStandardMaterial({
           color: 0x38d9a9, // Launch green stripes
           emissive: 0x38d9a9,
           emissiveIntensity: 1.2
         });
         const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, h + 0.02, segmentLength), stripeMat);
         stripeL.position.set(-width/2 + 0.2, 0, 0);
         const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, h + 0.02, segmentLength), stripeMat);
         stripeR.position.set(width/2 - 0.2, 0, 0);
         mesh.add(stripeL);
         mesh.add(stripeR);

         mesh.position.copy(body.position);
         mesh.quaternion.copy(body.quaternion);
         scene.add(mesh);
       }
    };

    // Stunt jump ring
    const addStuntRing = (x, y, z, rotationY) => {
       const ringGeo = new THREE.TorusGeometry(3.5, 0.2, 16, 64);
       const ringMat = new THREE.MeshStandardMaterial({
         color: 0xff3b30, // Bright neon red
         emissive: 0xff3b30,
         emissiveIntensity: 1.5
       });
       const ringMesh = new THREE.Mesh(ringGeo, ringMat);
       ringMesh.position.set(x, y, z);
       ringMesh.rotation.y = rotationY;
       scene.add(ringMesh);
       
    };

    // Spinning kinetic windmill obstacle
    const addWindmill = (x, z) => {
       const pylonGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 8);
       const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1f232d, roughness: 0.5 });
       const pylon = new THREE.Mesh(pylonGeo, pylonMat);
       pylon.position.set(x, 3, z);
       pylon.castShadow = true;
       scene.add(pylon);

       // Spinner blades
       const bladeGroup = new THREE.Group();
       const bladeMat = new THREE.MeshStandardMaterial({
         color: 0xffd43b, // Yellow neon
         emissive: 0xffd43b,
         emissiveIntensity: 1.2
       });
       
       for (let i = 0; i < 4; i++) {
         const blade = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 0.1), bladeMat);
         blade.rotation.z = (i * Math.PI) / 2;
         blade.position.x = 1.75 * Math.cos((i * Math.PI) / 2);
         blade.position.y = 1.75 * Math.sin((i * Math.PI) / 2);
         bladeGroup.add(blade);
       }
       bladeGroup.position.set(x, 5.5, z + 0.4);
       scene.add(bladeGroup);

       // Physics pylon (static)
       const pylonBody = new CANNON.Body({ mass: 0 });
       pylonBody.addShape(new CANNON.Cylinder(0.5, 0.5, 6, 8));
       pylonBody.position.set(x, 3, z);
       const q = new CANNON.Quaternion();
       q.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
       pylonBody.quaternion.copy(q);
       world.addBody(pylonBody);

       // Physics blades (static, manually updated rotation)
       const bladeBody = new CANNON.Body({ mass: 0 });
       bladeBody.addShape(new CANNON.Box(new CANNON.Vec3(3.5, 0.25, 0.1)));
       bladeBody.addShape(new CANNON.Box(new CANNON.Vec3(0.25, 3.5, 0.1)));
       bladeBody.position.set(x, 5.5, z + 0.4);
       world.addBody(bladeBody);

       windmills.push({ mesh: bladeGroup, body: bladeBody, angle: 0 });
       props.push({ body: bladeBody, mesh: bladeGroup });
    };

    // Populate Environment
    addRamp(-5, -10, 0);
    addRamp(20, -15, Math.PI/2);
    addRamp(-25, -25, -Math.PI/4);
    addRamp(5, -45, Math.PI);
    addRamp(30, -50, Math.PI/2);

    // Stunt jumps and rings
    addCurvedRamp(0, -6, Math.PI); // Jump right after start
    addStuntRing(0, 4.2, -12.5, 0); // Jump ring

    addCurvedRamp(5, -45, Math.PI); // Jump in the middle
    addStuntRing(5, 4.2, -51.5, 0); // Jump ring

    // Kinetic Windmills
    addWindmill(-8, -35);
    addWindmill(10, -22);

    const zonePositions = [
      { x: -15, z: -20 },
      { x: 18, z: -32 },
      { x: -25, z: -45 },
      { x: 10, z: -55 },
      { x: 28, z: -68 },
      { x: -5, z: -82 }
    ];

    // Generate canyon walls
    // Back Wall
    for (let x = -50; x <= 50; x += 12) {
      addCliff(x, -95, 6 + Math.random() * 4);
    }
    // Front Wall (with opening in center)
    for (let x = -50; x <= 50; x += 12) {
      if (Math.abs(x) < 15) continue;
      addCliff(x, 20, 6 + Math.random() * 4);
    }
    // Left Wall
    for (let z = -95; z <= 20; z += 12) {
      addCliff(-45, z, 6 + Math.random() * 4);
    }
    // Right Wall
    for (let z = -95; z <= 20; z += 12) {
      addCliff(45, z, 6 + Math.random() * 4);
    }

    // Populate scattered props
    for(let i=0; i<65; i++) {
       let tx, tz;
       let ok = false;
       while(!ok) {
         tx = (Math.random() - 0.5) * 80;
         tz = (Math.random() - 0.5) * 90 - 35;
         
         const distToStart = Math.sqrt(tx*tx + (tz-5)*(tz-5));
         if (distToStart < 8) continue;

         let tooClose = false;
         for (let j = 0; j < zonePositions.length; j++) {
           const z = zonePositions[j];
           const dist = Math.sqrt((tx-z.x)*(tx-z.x) + (tz-z.z)*(tz-z.z));
           if (dist < 6.5) {
             tooClose = true;
             break;
           }
         }
         if (!tooClose) ok = true;
       }
       if (i % 6 === 0) {
         addBlock(tx, tz, Math.random() * Math.PI);
       } else {
         addTree(tx, tz);
       }
    }

    // Set up pins in multiple locations
    [[-10,-20], [-10.5,-20.5], [-9.5,-20.5], [-11,-21], [-10,-21], [-9,-21]].forEach(pos => addPin(pos[0], pos[1]));
    [[15,-25], [15.5,-25.5], [14.5,-25.5], [16,-26], [15,-26], [14,-26]].forEach(pos => addPin(pos[0], pos[1]));
    [[-15,-50], [-15.5,-50.5], [-14.5,-50.5], [-16,-51], [-15,-51], [-14,-51]].forEach(pos => addPin(pos[0], pos[1]));

    // Road network generation
    const roadColorStartToHiresia = 0x4dabf7; // Blue
    const roadColorHiresiaToRapid = 0x38d9a9; // Green
    const roadColorRapidToAbout = 0xbe4bdb;   // Purple
    const roadColorAboutToExp = 0xffd43b;     // Yellow
    const roadColorExpToStack = 0xff922b;     // Orange
    const roadColorStackToContact = 0xff6b6b; // Red

    const roadPoints = [
      { pos: { x: 0, z: 5 }, color: roadColorStartToHiresia },
      { pos: { x: -15, z: -20 }, color: roadColorHiresiaToRapid },
      { pos: { x: 18, z: -32 }, color: roadColorRapidToAbout },
      { pos: { x: -25, z: -45 }, color: roadColorAboutToExp },
      { pos: { x: 10, z: -55 }, color: roadColorExpToStack },
      { pos: { x: 28, z: -68 }, color: roadColorStackToContact },
      { pos: { x: -5, z: -82 }, color: 0xff6b6b }
    ];

    const createRoadSegment = (p1, p2, roadColor) => {
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      const angle = Math.atan2(dx, dz);

      const roadMat = new THREE.MeshStandardMaterial({
        color: theme === 'dark' ? 0x16181f : 0xe2e4e8,
        roughness: 0.8,
        metalness: 0.1,
      });

      const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.0, dist), roadMat);
      roadMesh.position.set((p1.x + p2.x) / 2, 0.002, (p1.z + p2.z) / 2);
      roadMesh.rotation.order = 'YXZ';
      roadMesh.rotation.y = angle;
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.receiveShadow = true;

      // Glow borders
      const borderGeo = new THREE.PlaneGeometry(0.12, dist);
      const borderMat = new THREE.MeshBasicMaterial({
        color: roadColor,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
      });

      const leftBorder = new THREE.Mesh(borderGeo, borderMat);
      leftBorder.position.set(-2.5, 0, 0.001);
      const rightBorder = new THREE.Mesh(borderGeo, borderMat);
      rightBorder.position.set(2.5, 0, 0.001);

      roadMesh.add(leftBorder);
      roadMesh.add(rightBorder);

      scene.add(roadMesh);
    };

    for (let i = 0; i < roadPoints.length - 1; i++) {
      createRoadSegment(roadPoints[i].pos, roadPoints[i + 1].pos, roadPoints[i].color);
    }

    // Glowing beacons above project zones
    const addBeacon = (x, z, color) => {
      const beaconGeo = new THREE.CylinderGeometry(0.1, 0.5, 45, 12, 1, true);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(x, 22.5, z);
      scene.add(beaconMesh);
    };
    
    addBeacon(-15, -20, 0x4dabf7);
    addBeacon(18, -32, 0x38d9a9);
    addBeacon(-25, -45, 0xbe4bdb);
    addBeacon(10, -55, 0xffd43b);
    addBeacon(28, -68, 0xff922b);
    addBeacon(-5, -82, 0xff6b6b);

    // Sky dust particles setup
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = [];

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 160;
      dustPositions[i * 3 + 1] = 2 + Math.random() * 30; // Float between y=2 and y=32
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 160 - 35;
      
      dustVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        -0.05 - Math.random() * 0.1, // float downwards
        (Math.random() - 0.5) * 0.05
      ));
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: theme === 'dark' ? 0xffffff : 0xffaa00,
      size: 0.15,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    scene.add(dustMesh);

    // Zone monuments — positioned near their respective zone pads
    const monMat1 = new THREE.MeshStandardMaterial({ color: 0xFF6B6B, roughness: 0.2, metalness: 0.8 });
    const monMat2 = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.2, metalness: 0.8 });
    const monMat3 = new THREE.MeshStandardMaterial({ color: 0x66FCF1, roughness: 0.2, metalness: 0.8 });

    const hMon = new THREE.Group();
    [0, 1.2, 2.4].forEach(y => { const srv = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), monMat1); srv.position.y = y; srv.castShadow = true; hMon.add(srv); });
    hMon.position.set(-15, 0.5, -20);
    hMon.scale.set(0.001, 0.001, 0.001);
    scene.add(hMon);

    const rMon = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 16), monMat2);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI), monMat2);
    dish.position.y = 1.5; dish.rotation.x = -Math.PI/4;
    rMon.add(base); rMon.add(dish);
    rMon.position.set(18, 0.5, -32);
    rMon.scale.set(0.001, 0.001, 0.001);
    scene.add(rMon);

    const aboutMon = new THREE.Mesh(new THREE.OctahedronGeometry(1.8, 0), monMat1);
    aboutMon.position.set(-25, 2.0, -45);
    aboutMon.castShadow = true;
    aboutMon.scale.set(0.001, 0.001, 0.001);
    scene.add(aboutMon);

    const eMon = new THREE.Mesh(new THREE.BoxGeometry(4, 10, 4), monMat3);
    eMon.position.set(10, 5, -55);
    eMon.castShadow = true;
    eMon.scale.set(0.001, 0.001, 0.001);
    scene.add(eMon);

    const stackMon = new THREE.Group();
    [0, 1.0, 2.0].forEach(y => {
      const layer = new THREE.Mesh(new THREE.CylinderGeometry(1.8 - y*0.3, 1.8 - y*0.3, 0.8, 8), monMat2);
      layer.position.y = y;
      layer.rotation.y = y * Math.PI / 4;
      layer.castShadow = true;
      stackMon.add(layer);
    });
    stackMon.position.set(28, 0.5, -68);
    stackMon.scale.set(0.001, 0.001, 0.001);
    scene.add(stackMon);

    const contactMon = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.3, 16, 32), monMat3);
    contactMon.position.set(-5, 2.0, -82);
    contactMon.castShadow = true;
    contactMon.scale.set(0.001, 0.001, 0.001);
    scene.add(contactMon);

    const zones = [];
    const createZone = (id, x, z, color, monument) => {
      const padGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.1, 32);
      const padMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(x, 0.05, z);
      pad.receiveShadow = true;
      scene.add(pad);
      
      const ringGeo = new THREE.TorusGeometry(3.0, 0.08, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, 1.5, z);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      scene.add(ring);
      
      zones.push({ id, position: new THREE.Vector3(x, 0, z), ring, monument });
    };

    // Zones — spread well apart so player needs to actually explore
    createZone('hiresia',    -15, -20,  0x4dabf7, hMon);
    createZone('rapidrescue', 18, -32,  0x38d9a9, rMon);
    createZone('about',      -25, -45,  0xbe4bdb, aboutMon);
    createZone('experience',  10, -55,  0xffd43b, eMon);
    createZone('stack',       28, -68,  0xff922b, stackMon);
    createZone('contact',     -5, -82,  0xff6b6b, contactMon);

    // ── SMOKE PARTICLES & SKID MARKS ─────────────────────────────────────────
    const smokeParticleCount = 200;
    const smokeParticles = [];
    const smokeDummy = new THREE.Object3D();
    const smokeColorData = new Float32Array(smokeParticleCount * 3);
    let smokeParticleIndex = 0;

    const smokeGeo = new THREE.PlaneGeometry(1, 1);
    smokeGeo.setAttribute('color', new THREE.InstancedBufferAttribute(smokeColorData, 3));

    // Create a procedural smoke texture using HTML5 Canvas to avoid 404 errors
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 64;
    smokeCanvas.height = 64;
    const smokeCtx = smokeCanvas.getContext('2d');
    const smokeGrad = smokeCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    smokeGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    smokeGrad.addColorStop(0.3, 'rgba(230, 230, 230, 0.85)');
    smokeGrad.addColorStop(0.6, 'rgba(160, 160, 160, 0.2)');
    smokeGrad.addColorStop(1, 'rgba(160, 160, 160, 0)');
    smokeCtx.fillStyle = smokeGrad;
    smokeCtx.fillRect(0, 0, 64, 64);
    const smokeTexture = new THREE.CanvasTexture(smokeCanvas);

    const smokeMat = new THREE.MeshBasicMaterial({
      map: smokeTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true, // Use vertex colors for individual opacity/color
    });

    for (let i = 0; i < smokeParticleCount; i++) {
      smokeColorData[i * 3 + 0] = 0;
      smokeColorData[i * 3 + 1] = 0;
      smokeColorData[i * 3 + 2] = 0;
    }

    const smokeMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, smokeParticleCount);
    smokeMesh.frustumCulled = false;
    scene.add(smokeMesh);

    // Skid marks (Tyre Marks)
    const skidMarkCount = 800;
    const skidMarks = [];
    const skidDummy = new THREE.Object3D();
    let skidMarkIndex = 0;

    const skidGeo = new THREE.PlaneGeometry(0.3, 0.5); // Width of tyre (0.3m), segment length
    skidGeo.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const skidMat = new THREE.MeshBasicMaterial({
      color: theme === 'dark' ? 0x0c0f16 : 0x3d2b1f, // Darker tyre color matching themes
      transparent: true,
      opacity: 0.48, // Increased opacity for better visibility
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const skidMesh = new THREE.InstancedMesh(skidGeo, skidMat, skidMarkCount);
    skidMesh.frustumCulled = false;
    scene.add(skidMesh);

    for (let i = 0; i < skidMarkCount; i++) {
      skidDummy.position.set(0, -100, 0);
      skidDummy.updateMatrix();
      skidMesh.setMatrixAt(i, skidDummy.matrix);
      skidMarks.push({ age: Infinity, maxAge: 8.0 });
    }
    skidMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < smokeParticleCount; i++) {
      smokeParticles.push({
        position: new THREE.Vector3(),
        scale: 1,
        age: Infinity, // Start as inactive
        maxAge: 1 + Math.random(), // Lifespan of 1 to 2 seconds
        velocity: new THREE.Vector3(0, 0.2 + Math.random() * 0.3, 0),
      });
    }

    const spawnSmokeParticle = (position) => {
      const p = smokeParticles[smokeParticleIndex];
      p.position.copy(position);
      p.age = 0;
      p.scale = 0.1 + Math.random() * 0.4;
      
      // Give it a slight random sideways velocity
      p.velocity.x = (Math.random() - 0.5) * 0.3;
      p.velocity.z = (Math.random() - 0.5) * 0.3;

      smokeParticleIndex = (smokeParticleIndex + 1) % smokeParticleCount;
    };

    const spawnSkidMark = (position, rotationY) => {
      const i = skidMarkIndex;
      skidMarks[i].age = 0;
      
      skidDummy.position.copy(position);
      skidDummy.position.y = position.y - 0.39; // 0.4 wheel radius, 0.01 offset above ground/ramp to prevent z-fighting
      skidDummy.rotation.set(0, rotationY, 0);
      skidDummy.scale.set(1, 1, 1);
      skidDummy.updateMatrix();
      skidMesh.setMatrixAt(i, skidDummy.matrix);
      
      skidMarkIndex = (skidMarkIndex + 1) % skidMarkCount;
      skidMesh.instanceMatrix.needsUpdate = true;
    };

    // ── AUDIO ENGINE ──────────────────────────────────────────────────────
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const engineSound = new THREE.Audio(listener);
    const skidSound = new THREE.Audio(listener);
    const collisionSound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('/engine.mp3', (buffer) => {
      engineSound.setBuffer(buffer);
      engineSound.setLoop(true);
      engineSound.setVolume(0.3);
      // engineSound.play(); // Will be enabled later
    });
    audioLoader.load('/skid.mp3', (buffer) => {
      skidSound.setBuffer(buffer);
      skidSound.setLoop(true);
      skidSound.setVolume(0); // Start silent
      // skidSound.play(); // Will be enabled later
    });
    audioLoader.load('/impact.mp3', (buffer) => {
      collisionSound.setBuffer(buffer);
      collisionSound.setLoop(false);
    });


    // ── BRUNO SIMON STYLE CAR ───────────────────────────────────────────────
    const { chassisBody, vehicle, carGroup, wheels } = createCar(theme);
    vehicle.addToWorld(world);
    scene.add(carGroup);
    wheels.forEach(w => scene.add(w));

    // Collision sound
    chassisBody.addEventListener('collide', (e) => {
      const impact = e.contact.getImpactVelocityAlongNormal();
      if (impact > 2.0 && !collisionSound.isPlaying) {
        collisionSound.setVolume(Math.min(1.0, impact / 20));
        collisionSound.play();
      }
    });

    // ── CONTROLS ────────────────────────────────────────────────────────────
    const keys = { up: false, down: false, left: false, right: false, space: false, r: false };
    const onKey = e => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        if (e.target === document.body) e.preventDefault();
      }
      const isDown = e.type === 'keydown';
      if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.up    = isDown;
      if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.down  = isDown;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys.left  = isDown;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = isDown;
      if (e.code === 'Space')                            keys.space = isDown;
      if (e.code === 'KeyR')                             keys.r     = isDown;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    let currentEngineForce = 0, steerVal = 0;
    let autopilotTarget = null;

    const camTarget = new THREE.Vector3();

    // Autopilot for testing/demo (press T to toggle)
    let testAutoDrive = false;
    window.addEventListener('keydown', e => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      if (e.code === 'KeyT') {
        testAutoDrive = !testAutoDrive;
        if (!testAutoDrive) {
          keys.up = false;
          keys.down = false;
          keys.space = false;
          keys.left = false;
          keys.right = false;
        }
        console.log("Autopilot toggled:", testAutoDrive);
      }
    });

    const onDriveTo = (e) => {
      const zoneId = e.detail;
      if (zoneId === 'reset') {
        autopilotTarget = new THREE.Vector3(0, 0, 5);
        testAutoDrive = false;
        return;
      }
      const targetZone = zones.find(z => z.id === zoneId);
      if (targetZone) {
        autopilotTarget = targetZone.position;
        testAutoDrive = false;
      }
    };
    window.addEventListener('drive-to-zone', onDriveTo);

    // Intersection Observer
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    observer.observe(container);

    // ── ANIMATION LOOP ───────────────────────────────────────────────────────
    let reqId;
    const clock = new THREE.Clock();
    const windmillQ = new CANNON.Quaternion();

    function animate() {
      reqId = requestAnimationFrame(animate);
      if (!isVisible) return;
      
      const delta = Math.min(clock.getDelta(), 0.1);
      const dt = delta;

      const hasManualInput = (
        keys.up || keys.down || keys.left || keys.right || keys.space
      );

      if (hasManualInput) {
        autopilotTarget = null;
        testAutoDrive = false;
      }

      // Physics Reset / Flip-recovery (Press R)
      if (keys.r) {
        chassisBody.position.y = Math.max(chassisBody.position.y, 0) + 2.5;
        chassisBody.velocity.set(0, 0, 0);
        chassisBody.angularVelocity.set(0, 0, 0);
        // Extract current yaw from chassis quaternion and reset to upright
        const fwd = new THREE.Vector3(0, 0, 1);
        fwd.applyQuaternion(new THREE.Quaternion(
          chassisBody.quaternion.x, chassisBody.quaternion.y,
          chassisBody.quaternion.z, chassisBody.quaternion.w
        ));
        const headingAngle = Math.atan2(fwd.x, fwd.z);
        chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), headingAngle);
        keys.r = false;
      }

      // ── ENGINE & STEERING CONTROL (Manual + Autopilot)
      const maxEngineForce = 800; // Reduced from 3500 to prevent wheelie/flipping
      const speedVal = chassisBody.velocity.length();
      const speedKmh = speedVal * 3.6;
      const maxSteerVal = speedKmh > 60 ? Math.max(0.2, THREE.MathUtils.lerp(0.55, 0.2, (speedKmh - 60) / 60)) : 0.55;

      let targetSteer = 0;
      let brakeForce = 0;

      if (autopilotTarget) {
        const dx = autopilotTarget.x - chassisBody.position.x;
        const dz = autopilotTarget.z - chassisBody.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        const brakeDist = Math.max(3.5, speedVal * 0.8);

        if (dist > brakeDist) {
          const targetAngle = Math.atan2(dx, dz);
          const chassisQ = new THREE.Quaternion(
            chassisBody.quaternion.x, chassisBody.quaternion.y,
            chassisBody.quaternion.z, chassisBody.quaternion.w
          );
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQ);
          const currentAngle = Math.atan2(forward.x, forward.z);
          let angleDiff = targetAngle - currentAngle;
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

          targetSteer = Math.max(-maxSteerVal, Math.min(maxSteerVal, angleDiff * 1.8));
          currentEngineForce = -maxEngineForce * 0.6; // Autopilot drives forward
          brakeForce = 0;
        } else {
          // Smooth braking on target arrival
          if (speedVal > 0.5) {
             currentEngineForce = 0;
             brakeForce = 150;
             targetSteer = 0;
          } else {
             currentEngineForce = 0;
             brakeForce = 150;
             autopilotTarget = null;
             testAutoDrive = false;
          }
        }
      } else if (testAutoDrive) {
        const dx = 0 - chassisBody.position.x;
        const dz = -35 - chassisBody.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        const brakeDist = Math.max(3.5, speedVal * 0.8);

        if (dist > brakeDist) {
          const targetAngle = Math.atan2(dx, dz);
          const chassisQ = new THREE.Quaternion(
            chassisBody.quaternion.x, chassisBody.quaternion.y,
            chassisBody.quaternion.z, chassisBody.quaternion.w
          );
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQ);
          const currentAngle = Math.atan2(forward.x, forward.z);
          let angleDiff = targetAngle - currentAngle;
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

          targetSteer = Math.max(-maxSteerVal, Math.min(maxSteerVal, angleDiff * 1.8));
          currentEngineForce = -maxEngineForce * 0.6;
          brakeForce = 0;
        } else {
          if (speedVal > 0.5) {
             currentEngineForce = 0;
             brakeForce = 150;
             targetSteer = 0;
          } else {
             currentEngineForce = 0;
             brakeForce = 150;
             testAutoDrive = false;
          }
        }
      } else {
        // Manual controls
        if (keys.up && keys.down) {
          currentEngineForce = 0;
        } else if (keys.up) {
          currentEngineForce = -maxEngineForce;
        } else if (keys.down) {
          currentEngineForce =  maxEngineForce;
        } else {
          currentEngineForce *= 0.4; // Decays engine force rapidly
          if (Math.abs(currentEngineForce) < 50) currentEngineForce = 0;
        }

        targetSteer = keys.left ? maxSteerVal : keys.right ? -maxSteerVal : 0;

        // Brakes detection
        const _fq = new THREE.Quaternion(chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w);
        const _fv = new THREE.Vector3(0, 0, 1).applyQuaternion(_fq);
        const forwardSpeed = chassisBody.velocity.dot(new CANNON.Vec3(_fv.x, _fv.y, _fv.z));
        
        if (keys.down && forwardSpeed > 0.2) {
          brakeForce = 100;
        } else if (keys.up && forwardSpeed < -0.2) {
          brakeForce = 100;
        } else if (!keys.up && !keys.down && !keys.space) {
          // Automatic engine braking to stop coasting inertia instantly
          brakeForce = 8.5;
        } else if (keys.space) {
          brakeForce = 0; // Disable regular braking when drifting
        }
        
        if (brakeForce > 0) currentEngineForce = 0;
      }

      // Snappier steering response, frame-rate independent
      steerVal += (targetSteer - steerVal) * (1.0 - Math.exp(-33.0 * delta));

      // Apply steering to front wheels
      vehicle.setSteeringValue(steerVal, 0); 
      vehicle.setSteeringValue(steerVal, 1);
      
      // Apply engine force to ALL FOUR wheels (All-Wheel-Drive) for instant torque
      vehicle.applyEngineForce(currentEngineForce, 0);
      vehicle.applyEngineForce(currentEngineForce, 1);
      vehicle.applyEngineForce(currentEngineForce, 2);
      vehicle.applyEngineForce(currentEngineForce, 3);
      
      // Apply brakes to all wheels
      for (let i = 0; i < 4; i++) vehicle.setBrake(brakeForce, i);

      // --- ARCADE DRIFTING LOGIC ---
      if (keys.space) {
        // Lower friction on rear wheels to initiate slide. 1.0 is a good starting point.
        vehicle.wheelInfos[2].frictionSlip = 1.0;
        vehicle.wheelInfos[3].frictionSlip = 1.0;

        // Apply a yaw torque to kick the tail out, but only if turning
        let yawTorque = 0;
        if (keys.left) yawTorque = 1.5;
        if (keys.right) yawTorque = -1.5;
        
        // Only apply torque if moving at a reasonable speed
        if (speedVal > 5 && yawTorque !== 0) {
          chassisBody.angularVelocity.y += yawTorque * delta * 15;
        }

        // Spawn smoke particles and skid marks from rear wheels during any handbrake slide
        if (speedVal > 0.5) {
            const wlTouch = vehicle.wheelInfos[2].raycastResult.hasHit;
            const wrTouch = vehicle.wheelInfos[3].raycastResult.hasHit;

            // Extract yaw heading to align skid marks
            const fwd = new THREE.Vector3(0, 0, 1);
            fwd.applyQuaternion(new THREE.Quaternion(
              chassisBody.quaternion.x, chassisBody.quaternion.y,
              chassisBody.quaternion.z, chassisBody.quaternion.w
            ));
            const headingAngle = Math.atan2(fwd.x, fwd.z);

            if (wlTouch) {
                const hitPt = vehicle.wheelInfos[2].raycastResult.hitPointWorld;
                const contactPos = new THREE.Vector3(hitPt.x, hitPt.y + 0.012, hitPt.z);
                spawnSmokeParticle(contactPos);
                spawnSkidMark(contactPos, headingAngle);
            }

            if (wrTouch) {
                const hitPt = vehicle.wheelInfos[3].raycastResult.hitPointWorld;
                const contactPos = new THREE.Vector3(hitPt.x, hitPt.y + 0.012, hitPt.z);
                spawnSmokeParticle(contactPos);
                spawnSkidMark(contactPos, headingAngle);
            }
        }
      } else {
        // When spacebar is released, smoothly restore friction
        vehicle.wheelInfos[2].frictionSlip = THREE.MathUtils.lerp(vehicle.wheelInfos[2].frictionSlip, 4.0, delta * 8);
        vehicle.wheelInfos[3].frictionSlip = THREE.MathUtils.lerp(vehicle.wheelInfos[3].frictionSlip, 4.0, delta * 8);
      }
      
      // --- AUDIO LOGIC --- (Commented out as requested)
      // engineSound.setPlaybackRate(0.8 + (speedVal / 30));
      // const targetSkidVolume = (keys.space && speedVal > 5) ? 0.7 : 0;
      // skidSound.setVolume(THREE.MathUtils.lerp(skidSound.volume, targetSkidVolume, delta * 10));
      // --- AUDIO LOGIC ---
      // // engineSound.setPlaybackRate(0.8 + (speedVal / 30));
      // // const targetSkidVolume = (keys.space && speedVal > 5) ? 0.7 : 0;
      // // skidSound.setVolume(THREE.MathUtils.lerp(skidSound.volume, targetSkidVolume, delta * 10));

      // Downforce
      chassisBody.applyForce(new CANNON.Vec3(0, -speedVal * speedVal * 0.15, 0), new CANNON.Vec3(0, 0, 0));

      // Update smoke particles
      smokeParticles.forEach((p, i) => {
        if (p.age < p.maxAge) {
          p.age += delta;

          const lifeFactor = p.age / p.maxAge;
          const invLifeFactor = 1 - lifeFactor;

          // Scale up over lifetime
          p.scale = (0.1 + Math.random() * 0.4) * (1 + lifeFactor * 2);
          
          // Update particle's position
          p.position.addScaledVector(p.velocity, delta);

          smokeDummy.position.copy(p.position);
          smokeDummy.scale.set(p.scale, p.scale, p.scale);
          smokeDummy.updateMatrix();
          smokeMesh.setMatrixAt(i, smokeDummy.matrix);

          // Update color: Start light-gray and fade to black (which is transparent in AdditiveBlending)
          const color = new THREE.Color(0xd0d0d0);
          color.multiplyScalar(invLifeFactor * 0.45);
          color.toArray(smokeColorData, i * 3);

        } else {
          // Hide inactive particles by setting scale to 0
          smokeDummy.scale.set(0, 0, 0);
          smokeDummy.updateMatrix();
          smokeMesh.setMatrixAt(i, smokeDummy.matrix);
        }
      });
      smokeMesh.instanceMatrix.needsUpdate = true;
      smokeMesh.geometry.attributes.color.needsUpdate = true;

      // Update skid marks age and hide expired ones
      let skidMeshNeedsUpdate = false;
      skidMarks.forEach((s, i) => {
        if (s.age < s.maxAge) {
          s.age += delta;
          if (s.age >= s.maxAge) {
            skidDummy.position.set(0, -100, 0);
            skidDummy.updateMatrix();
            skidMesh.setMatrixAt(i, skidDummy.matrix);
            skidMeshNeedsUpdate = true;
          }
        }
      });
      if (skidMeshNeedsUpdate) {
        skidMesh.instanceMatrix.needsUpdate = true;
      }

      world.step(1 / 60, delta, 3);

      // Sync chassis + wheels
      carGroup.position.copy(chassisBody.interpolatedPosition);
      carGroup.quaternion.copy(chassisBody.interpolatedQuaternion);
      for (let i = 0; i < vehicle.wheelInfos.length; i++) {
        vehicle.updateWheelTransform(i);
        const t = vehicle.wheelInfos[i].worldTransform;
        wheels[i].position.copy(t.position);
        wheels[i].quaternion.copy(t.quaternion);
      }

      // Sync props (pins, blocks, ramps, cliffs)
      props.forEach(p => {
         p.mesh.position.copy(p.body.position);
         if (p.isPin) {
            const q = new THREE.Quaternion().copy(p.body.quaternion);
            const fixQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
            p.mesh.quaternion.copy(q.multiply(fixQ));
         } else {
            p.mesh.quaternion.copy(p.body.quaternion);
         }
      });

      // Animate sky dust particles
      const positions = dustMesh.geometry.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        positions[i * 3 + 0] += dustVelocities[i].x * delta * 15;
        positions[i * 3 + 1] += dustVelocities[i].y * delta * 15;
        positions[i * 3 + 2] += dustVelocities[i].z * delta * 15;

        // Reset if they hit the ground
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 0] = (Math.random() - 0.5) * 160;
          positions[i * 3 + 1] = 30;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 160 - 35;
        }
      }
      dustMesh.geometry.attributes.position.needsUpdate = true;

      // Rotate kinetic windmills
      windmills.forEach(w => {
        w.angle += delta * 1.5;
        windmillQ.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), w.angle);
        w.body.quaternion.copy(windmillQ);
      });

      // Zone Logic & Monument animations
      zones.forEach(z => {
         z.ring.rotation.z += 0.02;
         z.ring.position.y = 1.5 + Math.sin(clock.elapsedTime * 2 + z.position.x) * 0.2;
         if (z.monument) {
             const targetScale = (activeZoneRef.current === z.id) ? 1.0 : 0.001;
             z.monument.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
             
             if (z.id === 'about') {
                z.monument.rotation.y += 0.01;
                z.monument.rotation.x += 0.005;
             } else if (z.id === 'stack') {
                z.monument.children.forEach((child, idx) => {
                   child.rotation.y += (idx % 2 === 0 ? 0.01 : -0.01);
                 });
             } else if (z.id === 'contact') {
                z.monument.rotation.y += 0.015;
                z.monument.rotation.z = Math.sin(clock.elapsedTime * 1.5) * 0.25;
             }
         }
      });

      let closestZone = null;
      let minZoneDist = Infinity;
      zones.forEach(z => {
         const dx = z.position.x - chassisBody.position.x;
         const dz = z.position.z - chassisBody.position.z;
         const dist = Math.sqrt(dx*dx + dz*dz);
         if (dist < minZoneDist) {
            minZoneDist = dist;
            if (dist < 4.0) {
               closestZone = z.id;
            }
         }
      });

      // State machine for zone entry/exit
      if (activeZoneRef.current) {
         const activeZoneObj = zones.find(z => z.id === activeZoneRef.current);
         let shouldExit = true;
         if (activeZoneObj) {
            const dx = activeZoneObj.position.x - chassisBody.position.x;
            const dz = activeZoneObj.position.z - chassisBody.position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < 5.0) {
               shouldExit = false;
            }
         }
         if (shouldExit) {
            activeZoneRef.current = null;
            window.dispatchEvent(new CustomEvent('zone-leave'));
         }
      } else {
         if (closestZone) {
            activeZoneRef.current = closestZone;
            window.dispatchEvent(new CustomEvent('zone-enter', { detail: closestZone }));
         }
      }

      // Camera — frame-rate independent lerp using delta, use interpolated state to avoid stutter
      const interpQ = chassisBody.interpolatedQuaternion;
      const camQ = new THREE.Quaternion(interpQ.x, interpQ.y, interpQ.z, interpQ.w);
      const camFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(camQ);
      const camYaw = Math.atan2(camFwd.x, camFwd.z);
      const carPos = new THREE.Vector3().copy(chassisBody.interpolatedPosition);
      let distBehind = 6, targetFov = 45;
      if (speedKmh > 60) { distBehind = THREE.MathUtils.lerp(6, 8, (speedKmh-60)/40); targetFov = THREE.MathUtils.lerp(45, 65, (speedKmh-60)/40); }
      
      const lerpFactorFast = 1.0 - Math.exp(-6.0 * delta);
      const lerpFactorSlow = 1.0 - Math.exp(-3.0 * delta);

      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, lerpFactorSlow); camera.updateProjectionMatrix();
      const camOffset = new THREE.Vector3(0, 3, -distBehind).applyAxisAngle(new THREE.Vector3(0,1,0), camYaw);
      camera.position.lerp(carPos.clone().add(camOffset), lerpFactorSlow);
      camTarget.lerp(carPos, lerpFactorFast);
      camera.lookAt(camTarget);
      camera.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), steerVal * 2 * Math.PI / 180));

      renderer.render(scene, camera);

      // ── MINIMAP DRAWING ───────────────────────────────────────────────────
      const minimapCanvas = minimapRef.current;
      if (minimapCanvas) {
        const ctx = minimapCanvas.getContext('2d');
        if (ctx) {
          const width = minimapCanvas.width;
          const height = minimapCanvas.height;
          const cx = width / 2;
          const cy = height / 2;
          
          ctx.clearRect(0, 0, width, height);

          // Transparent glassmorphic-styled map background
          ctx.fillStyle = theme === 'dark' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.arc(cx, cy, cx - 4, 0, Math.PI * 2);
          ctx.fill();

          // Outer glowing indicator ring
          ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, cx - 4, 0, Math.PI * 2);
          ctx.stroke();

          // Get car position and yaw
          const carX = chassisBody.interpolatedPosition.x;
          const carZ = chassisBody.interpolatedPosition.z;
          
          const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisBody.interpolatedQuaternion);
          const carYaw = Math.atan2(fwd.x, fwd.z);

          // Map scale: 1 unit in 3D = 1.1 pixels on canvas
          const mapScale = 1.1;

          // Draw zones
          zones.forEach(zone => {
            const dx = zone.position.x - carX;
            const dz = zone.position.z - carZ;
            
            // Rotate relative to car's yaw (so car's heading is UP)
            const rx = dx * Math.cos(-carYaw) - dz * Math.sin(-carYaw);
            const rz = dx * Math.sin(-carYaw) + dz * Math.cos(-carYaw);
            
            // Convert to screen coords (rz is forward/up, rx is right)
            const screenX = cx + rx * mapScale;
            const screenY = cy - rz * mapScale;
            
            const distFromCenter = Math.sqrt((screenX - cx) * (screenX - cx) + (screenY - cy) * (screenY - cy));
            const maxRadius = cx - 12;

            if (distFromCenter < maxRadius) {
              // Draw zone dot
              ctx.fillStyle = '#' + zone.ring.material.color.getHexString();
              ctx.beginPath();
              ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
              ctx.fill();
              
              // Border around zone dot
              ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Zone label text
              ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#1e293b';
              ctx.font = 'bold 9px "Space Grotesk", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const labelMap = {
                hiresia: 'HI',
                rapidrescue: 'RR',
                about: 'AB',
                experience: 'EX',
                stack: 'ST',
                contact: 'CO'
              };
              const label = labelMap[zone.id] || zone.id.substring(0, 2).toUpperCase();
              ctx.fillText(label, screenX, screenY + 12);
            } else {
              // Draw off-screen indicator on the border
              const angle = Math.atan2(screenY - cy, screenX - cx);
              const borderX = cx + Math.cos(angle) * (cx - 8);
              const borderY = cy + Math.sin(angle) * (cy - 8);
              
              ctx.fillStyle = '#' + zone.ring.material.color.getHexString();
              ctx.beginPath();
              ctx.arc(borderX, borderY, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          // Draw the car (always in center of rotation map)
          ctx.save();
          ctx.translate(cx, cy);
          
          // Draw a small futuristic triangle arrow pointing UP (towards screen -Y)
          ctx.shadowColor = theme === 'dark' ? '#66fcf1' : '#1144ff';
          ctx.shadowBlur = 8;
          ctx.fillStyle = theme === 'dark' ? '#66fcf1' : '#1144ff';
          
          ctx.beginPath();
          ctx.moveTo(0, -8);  // Nose
          ctx.lineTo(-6, 6);  // Left tail
          ctx.lineTo(0, 2);   // Center rear
          ctx.lineTo(6, 6);   // Right tail
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Reset shadow
          ctx.shadowBlur = 0;

          // Draw compass labels (N, S, E, W) rotating around the car
          ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.5)';
          ctx.font = '900 10px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const directions = [
            { label: 'N', angle: -carYaw - Math.PI / 2 },
            { label: 'E', angle: -carYaw },
            { label: 'S', angle: -carYaw + Math.PI / 2 },
            { label: 'W', angle: -carYaw + Math.PI }
          ];

          directions.forEach(dir => {
            const labelX = cx + Math.cos(dir.angle) * (cx - 14);
            const labelY = cy + Math.sin(dir.angle) * (cy - 14);
            
            // Draw N in red/cyan to highlight it
            if (dir.label === 'N') {
              ctx.fillStyle = theme === 'dark' ? '#ff6b6b' : '#ff2200';
            } else {
              ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.5)';
            }
            ctx.fillText(dir.label, labelX, labelY);
          });
        }
      }
    }
    setTimeout(() => setIsLoaded(true), 400);
    animate();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    setTimeout(() => { if (container) container.style.opacity = '1'; }, 200);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('drive-to-zone', onDriveTo);
      cancelAnimationFrame(reqId);
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  // Custom Cursor
  useEffect(() => {
    if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    const cursorDot = cursorDotRef.current;
    const cursorRing = cursorRingRef.current;
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let requestRef;

    let isMoving = false;
    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorDot) {
        cursorDot.style.transform = `translate3d(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%), 0)`;
      }
      if (!isMoving) {
        isMoving = true;
        requestRef = requestAnimationFrame(renderCursor);
      }
    };

    const renderCursor = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (cursorRing) {
        cursorRing.style.transform = `translate3d(calc(${ringX}px - 50%), calc(${ringY}px - 50%), 0)`;
      }
      
      if (Math.abs(mouseX - ringX) > 0.1 || Math.abs(mouseY - ringY) > 0.1) {
        requestRef = requestAnimationFrame(renderCursor);
      } else {
        isMoving = false;
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    const onMouseDown = () => document.body.classList.add('cursor-click');
    const onMouseUp = () => document.body.classList.remove('cursor-click');
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(requestRef);
    };
  }, [prefersReducedMotion]);

  // Scroll Progress & Navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 80);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollY / docHeight) * 100;
      setScrollProgress(progress);

      const sections = document.querySelectorAll('section');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 150) {
          current = section.getAttribute('id');
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for Reveal
  useEffect(() => {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.stagger || 0;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px"
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [prefersReducedMotion, theme]);

  const handleInteractiveEnter = () => document.body.classList.add('cursor-hover');
  const handleInteractiveLeave = () => document.body.classList.remove('cursor-hover');

  const InteractiveEl = ({ as: Component = 'div', className, onMouseEnter, onMouseLeave, children, ...props }) => (
    <Component
      className={`cursor-interactive ${className || ''}`}
      onMouseEnter={(e) => { handleInteractiveEnter(); if (onMouseEnter) onMouseEnter(e); }}
      onMouseLeave={(e) => { handleInteractiveLeave(); if (onMouseLeave) onMouseLeave(e); }}
      {...props}
    >
      {children}
    </Component>
  );

  return (
    <>
      <div id="cursor-dot" ref={cursorDotRef}></div>
      <div id="cursor-ring" ref={cursorRingRef}></div>

      <div id="progress-bar" style={{ width: `${scrollProgress}%` }}></div>

      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
        {theme === 'light' ? (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        )}
      </button>

      {/* Project Modal Overlay */}
      <div className={`modal-overlay ${selectedProject ? 'active' : ''}`} onClick={() => setSelectedProject(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedProject(null)}>&times;</button>
          {selectedProject && (
            <>
              <img src={projectsData[selectedProject].image} alt={projectsData[selectedProject].title} className="modal-img" />
              <div className="work-tag">{projectsData[selectedProject].tag}</div>
              <h3 className="work-title" style={{marginBottom: '16px'}}>{projectsData[selectedProject].title}</h3>
              <ul className="project-bullets">
                {projectsData[selectedProject].bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
              <InteractiveEl as="a" href={projectsData[selectedProject].link} target="_blank" rel="noreferrer" className="btn-primary" style={{display: 'inline-block', marginTop: '16px'}}>Visit Live Platform</InteractiveEl>
            </>
          )}
        </div>
      </div>

      <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
        <div className="container nav-inner">
          <InteractiveEl as="a" href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('drive-to-zone', { detail: 'reset' })); }} className="logo">HITESH.DEV</InteractiveEl>
          <div className="nav-links">
            <InteractiveEl as="a" href="#work" onClick={(e) => handleNavClick(e, 'hiresia')} className={`nav-item ${activeZone === 'hiresia' || activeZone === 'rapidrescue' ? 'active' : ''}`}>Work</InteractiveEl>
            <InteractiveEl as="a" href="#about" onClick={(e) => handleNavClick(e, 'about')} className={`nav-item ${activeZone === 'about' || activeZone === 'experience' ? 'active' : ''}`}>About</InteractiveEl>
            <InteractiveEl as="a" href="#stack" onClick={(e) => handleNavClick(e, 'stack')} className={`nav-item ${activeZone === 'stack' ? 'active' : ''}`}>Stack</InteractiveEl>
            <InteractiveEl as="a" href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className={`nav-item ${activeZone === 'contact' ? 'active' : ''}`}>Contact</InteractiveEl>
          </div>
        </div>
      </nav>

      <main>
        <section id="hero" className="hero-modern">

          {/* ── Gamified Loader ─────────────────────────────────────────── */}
          {!isLoaded && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 200,
              background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.8s ease',
              opacity: loadProgress >= 100 && isLoaded ? 0 : 1,
              pointerEvents: isLoaded ? 'none' : 'all',
            }}>
              <svg width="90" height="48" viewBox="0 0 90 48" style={{ marginBottom: '32px', filter: 'drop-shadow(0 0 20px #1144ff88)' }}>
                <rect x="8" y="20" width="74" height="18" rx="5" fill="#1144ff"/>
                <rect x="22" y="10" width="46" height="16" rx="4" fill="#3366ff"/>
                <rect x="26" y="12" width="16" height="9" rx="2" fill="rgba(180,220,255,0.35)"/>
                <rect x="48" y="12" width="16" height="9" rx="2" fill="rgba(180,220,255,0.35)"/>
                <circle cx="22" cy="39" r="7" fill="#0a0a0f" stroke="#555" strokeWidth="2"/>
                <circle cx="22" cy="39" r="3" fill="#888"/>
                <circle cx="68" cy="39" r="7" fill="#0a0a0f" stroke="#555" strokeWidth="2"/>
                <circle cx="68" cy="39" r="3" fill="#888"/>
                <rect x="8" y="23" width="7" height="5" rx="1" fill="white" opacity="0.95"/>
                <rect x="75" y="23" width="7" height="5" rx="1" fill="#ff2200" opacity="0.95"/>
              </svg>

              <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#4dabf7', fontFamily: '"Space Grotesk", monospace', marginBottom: '10px', textTransform: 'uppercase' }}>
                HITESH.DEV
              </div>
              <div style={{ fontSize: '30px', fontWeight: '800', color: '#fff', fontFamily: '"Space Grotesk", sans-serif', marginBottom: '8px', letterSpacing: '-1px' }}>
                Loading World
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginBottom: '44px', height: '16px' }}>
                {loadProgress < 30 ? '> Initializing physics engine...' : loadProgress < 60 ? '> Building environment...' : loadProgress < 90 ? '> Placing car on track...' : '> Starting engine... 🏎️'}
              </div>

              <div style={{ width: '300px', height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                  height: '100%', borderRadius: '99px',
                  background: 'linear-gradient(90deg, #1144ff, #4dabf7, #66fcf1)',
                  width: loadProgress + '%', transition: 'width 0.12s ease',
                  boxShadow: '0 0 14px #4dabf7'
                }}/>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#4dabf7', fontWeight: 'bold' }}>{loadProgress}%</div>

              <div style={{ position: 'absolute', bottom: '36px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1144ff, #4dabf7)',
                    animation: `loaderPulse 1.4s ease-in-out ${i * 0.22}s infinite`,
                  }}/>
                ))}
              </div>
              <style>{`
                @keyframes loaderPulse {
                  0%, 100% { opacity: 0.15; transform: scale(0.7); }
                  50% { opacity: 1; transform: scale(1.3); box-shadow: 0 0 10px #4dabf7; }
                }
              `}</style>
            </div>
          )}

          <div id="canvas-container" ref={canvasContainerRef}></div>
          
          
          {/* Bruno Simon Style HUD / Overlays */}
          {activeZone && (
            <div className="game-hud-scroll" style={{
              position: 'absolute', top: '0', right: '0', bottom: '0', width: '450px',
              background: theme === 'dark' ? 'rgba(10, 10, 12, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(30px)', borderLeft: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              color: theme === 'dark' ? '#fff' : '#000', zIndex: 100,
              boxShadow: '-20px 0 40px rgba(0,0,0,0.3)',
              padding: '60px 40px', overflowY: 'auto',
              animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex', flexDirection: 'column'
            }}>
              <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .game-hud-scroll::-webkit-scrollbar { width: 6px; }
                .game-hud-scroll::-webkit-scrollbar-track { background: transparent; }
                .game-hud-scroll::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 10px; }
              `}</style>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#8FAF8C' }}>
                  {activeZone === 'hiresia' || activeZone === 'rapidrescue' ? 'PROJECT UNLOCKED' : 'ZONE REACHED'}
                </span>
                <span style={{ fontSize: '11px', opacity: 0.5, fontStyle: 'italic' }}>Zone: {activeZone}</span>
              </div>

              {/* Hiresia Zone */}
              {activeZone === 'hiresia' && (
                <div>
                  <h2 style={{margin: '0 0 8px 0', fontSize: '42px', fontFamily: '"Instrument Serif", serif', lineHeight: '1.1'}}>Hiresia ATS</h2>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: '#FF6B6B', color: '#fff', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>FULL STACK ATS</span>
                  <p style={{lineHeight: '1.8', marginBottom: '24px', opacity: 0.8, fontSize: '15px'}}>A complete MERN-based Applicant Tracking System featuring advanced analytics, role-based access control, and seamless scheduling. Designed to handle hundreds of concurrent applications with zero downtime.</p>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '24px', fontSize: '14px', opacity: 0.85 }}>
                    {projectsData.hiresia.bullets.map((b, i) => <li key={i} style={{ marginBottom: '8px' }}>{b}</li>)}
                  </ul>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                     {['MongoDB', 'Express', 'React', 'Node.js', 'AWS', 'Vercel'].map(tech => (
                        <span key={tech} style={{ padding: '6px 12px', background: theme==='dark'?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                     ))}
                  </div>
                  <InteractiveEl as="a" href={projectsData.hiresia.link} target="_blank" rel="noreferrer" className="btn-primary" style={{display: 'inline-block', textDecoration: 'none'}}>Visit Live Platform &rarr;</InteractiveEl>
                </div>
              )}

              {/* RapidRescueQ Zone */}
              {activeZone === 'rapidrescue' && (
                <div>
                  <h2 style={{margin: '0 0 8px 0', fontSize: '42px', fontFamily: '"Instrument Serif", serif', lineHeight: '1.1'}}>RapidRescueQ</h2>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: '#4CAF50', color: '#fff', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>COORDINATION PLATFORM</span>
                  <p style={{lineHeight: '1.8', marginBottom: '24px', opacity: 0.8, fontSize: '15px'}}>A live camera-based emergency reporting and coordination platform for public reporters and NGOs. Utilizes WebRTC for live streaming and geolocation for immediate dispatch.</p>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '24px', fontSize: '14px', opacity: 0.85 }}>
                    {projectsData.rapidrescue.bullets.map((b, i) => <li key={i} style={{ marginBottom: '8px' }}>{b}</li>)}
                  </ul>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                     {['React Native', 'WebRTC', 'Socket.io', 'Node.js', 'Expo', 'Render'].map(tech => (
                        <span key={tech} style={{ padding: '6px 12px', background: theme==='dark'?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                     ))}
                  </div>
                </div>
              )}

              {/* About Zone */}
              {activeZone === 'about' && (
                <div>
                  <h2 style={{margin: '0 0 8px 0', fontSize: '42px', fontFamily: '"Instrument Serif", serif', lineHeight: '1.1'}}>About Me</h2>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: '#be4bdb', color: '#fff', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>CREATIVE DEVELOPER</span>
                  <p style={{lineHeight: '1.8', marginBottom: '20px', opacity: 0.85, fontSize: '15px'}}>
                    Hello! I'm Hitesh, a software engineer with a deep love for building fluid mobile applications and investor-facing web platforms.
                  </p>
                  <p style={{lineHeight: '1.8', marginBottom: '24px', opacity: 0.8, fontSize: '15px'}}>
                    I specialize in full-stack JavaScript development, reactive user interfaces, and engaging 3D web spaces. My goal is to make computing intuitive, performant, and delightful to interact with.
                  </p>
                  <h3 style={{ fontSize: '18px', marginBottom: '12px', borderBottom: theme==='dark'?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>Education & Interests</h3>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '14px', opacity: 0.85, marginBottom: '0' }}>
                    <li style={{ marginBottom: '6px' }}><strong>B.Tech in Computer Science</strong> — focus on systems and interfaces.</li>
                    <li style={{ marginBottom: '6px' }}><strong>Creative Coding</strong> — Three.js, WebGL, shaders, and physics engines.</li>
                    <li style={{ marginBottom: '6px' }}><strong>App Development</strong> — Expo, React Native, and mobile design systems.</li>
                  </ul>
                </div>
              )}

              {/* Experience Zone */}
              {activeZone === 'experience' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{margin: '0 0 8px 0', fontSize: '42px', fontFamily: '"Instrument Serif", serif', lineHeight: '1.1'}}>Experience</h2>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: '#ffd43b', color: '#000', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>CAREER TIMELINE</span>
                  
                  <div style={{ marginBottom: '24px', borderLeft: '2px solid #ffd43b', paddingLeft: '16px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', fontWeight: 'bold' }}>APR 2024 – PRESENT</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>Software Dev Intern</div>
                    <div style={{ fontSize: '14px', color: '#ffd43b', fontWeight: '500', marginBottom: '8px' }}>Grade Capital</div>
                    <p style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.6' }}>Contributed to production-ready mobile apps and investor-facing web platforms using React Native and React.js.</p>
                  </div>
                  
                  <div style={{ marginBottom: '24px', borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '16px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', fontWeight: 'bold' }}>DEC 2023 – APR 2024</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>App Dev Intern</div>
                    <div style={{ fontSize: '14px', color: '#be4bdb', fontWeight: '500', marginBottom: '8px' }}>Yzxx</div>
                    <p style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.6' }}>Designed and developed a cross-platform mobile application using React Native and Expo.</p>
                  </div>
                </div>
              )}

              {/* Stack Zone */}
              {activeZone === 'stack' && (
                <div>
                  <h2 style={{margin: '0 0 8px 0', fontSize: '42px', fontFamily: '"Instrument Serif", serif', lineHeight: '1.1'}}>Tech Stack</h2>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: '#ff922b', color: '#fff', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>SKILLS MATRIX</span>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Frontend & Immersive</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                       {['React.js', 'React Native', 'Expo', 'Three.js', 'WebGL', 'JavaScript (ES6+)'].map(tech => (
                          <span key={tech} style={{ padding: '6px 12px', background: 'rgba(255,146,43,0.15)', border: '1px solid rgba(255,146,43,0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                       ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Backend & Real-Time</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                       {['Node.js', 'Express', 'Socket.io', 'RESTful APIs'].map(tech => (
                          <span key={tech} style={{ padding: '6px 12px', background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                       ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Databases & Cloud</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                       {['MongoDB', 'PostgreSQL', 'AWS', 'Vercel', 'Render', 'Docker'].map(tech => (
                          <span key={tech} style={{ padding: '6px 12px', background: 'rgba(77,171,247,0.15)', border: '1px solid rgba(77,171,247,0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Zone */}
              {activeZone === 'contact' && (
                <div>
                  <h2 style={{margin: '0 0 8px 0', fontSize: '42px', fontFamily: '"Instrument Serif", serif', lineHeight: '1.1'}}>Contact Me</h2>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: '#ff6b6b', color: '#fff', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>GET IN TOUCH</span>
                  
                  <div style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.85 }}>
                    <p style={{ marginBottom: '8px' }}><strong>Email:</strong> hitesh@example.com</p>
                    <p style={{ marginBottom: '8px' }}><strong>GitHub:</strong> github.com/hitesh</p>
                    <p style={{ marginBottom: '16px' }}><strong>LinkedIn:</strong> linkedin.com/in/hitesh</p>
                  </div>
                  
                  <div style={{ borderTop: theme==='dark'?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)', paddingTop: '20px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Send a Message</h4>
                    <ContactForm theme={theme} />
                  </div>
                </div>
              )}

              <div style={{marginTop: 'auto', paddingTop: '40px', fontSize: '13px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '8px'}}>
                 <span style={{background: theme === 'dark' ? '#333' : '#ddd', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: theme==='dark'?'#fff':'#000'}}>W</span>
                 Drive away or press W to exit
              </div>
            </div>
          )}

          {/* Minimap HUD */}
          <div style={{
            position: 'absolute',
            bottom: '125px',
            left: '30px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(10px)',
            border: theme === 'dark' ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(0, 0, 0, 0.08)',
            boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(255,255,255,0.05)' : '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 0 12px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            pointerEvents: 'none',
            transition: 'opacity 0.5s ease',
            opacity: isLoaded ? 1 : 0
          }}>
            <canvas ref={minimapRef} width="160" height="160" style={{ display: 'block' }} />
          </div>

          <div style={{
            position: 'absolute', bottom: '30px', left: '30px', zIndex: 10,
            background: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(8px)', padding: '16px 24px', borderRadius: '16px',
            display: 'flex', gap: '20px', color: theme === 'dark' ? '#fff' : '#000',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
          }}>
            <div style={{textAlign: 'center'}}><div style={{fontWeight: 'bold', fontSize: '22px', fontFamily: '"Space Grotesk", sans-serif'}}>WASD</div><div style={{fontSize: '11px', opacity: 0.6, letterSpacing: '1px'}}>DRIVE</div></div>
            <div style={{width: '1px', background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}}></div>
            <div style={{textAlign: 'center'}}><div style={{fontWeight: 'bold', fontSize: '22px', fontFamily: '"Space Grotesk", sans-serif'}}>SPACE</div><div style={{fontSize: '11px', opacity: 0.6, letterSpacing: '1px'}}>BRAKE</div></div>
            <div style={{width: '1px', background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}}></div>
            <div style={{textAlign: 'center'}}><div style={{fontWeight: 'bold', fontSize: '22px', fontFamily: '"Space Grotesk", sans-serif'}}>R</div><div style={{fontSize: '11px', opacity: 0.6, letterSpacing: '1px'}}>FLIP / RESET</div></div>
          </div>
          </section>
      </main>

      
    </>
  );
}

export default App;
