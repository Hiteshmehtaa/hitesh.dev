import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

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
  
  // Platform Features State
  const [theme, setTheme] = useState('light');
  const [selectedProject, setSelectedProject] = useState(null);
  const [carHitItem, setCarHitItem] = useState(null);
  const [activeZone, setActiveZone] = useState(null);

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
    sun.shadow.mapSize.set(4096, 4096); // High res shadows
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
    const blockMat = new THREE.MeshStandardMaterial({ color: 0xffa8a8, roughness: 0.4 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xc89666, roughness: 0.8 });
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Function to add a ramp
    const addRamp = (x, z, rotationY) => {
       const w = 4, h = 1.5, d = 4;
       
       // Physics shape: wedge
       const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2));
       const body = new CANNON.Body({ mass: 0 }); // static
       body.addShape(shape);
       body.position.set(x, 0, z);
       body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI/12); // Slanted
       // Lower the ramp into the ground so there is no vertical lip
       body.position.y = -0.55;
       world.addBody(body);

       // We rotate the body locally, then apply rotationY
       const euler = new CANNON.Vec3();
       body.quaternion.toEuler(euler);
       const qY = new CANNON.Quaternion();
       qY.setFromAxisAngle(new CANNON.Vec3(0,1,0), rotationY);
       body.quaternion = qY.mult(body.quaternion);

       const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
       mesh.castShadow = true;
       mesh.receiveShadow = true;
       scene.add(mesh);
       props.push({ body, mesh, static: true });
    };

    // Add trees (Static cylinders and cones)
    const addTree = (x, z) => {
       const treeGroup = new THREE.Group();
       const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8), trunkMat);
       trunk.position.y = 0.75;
       trunk.castShadow = true;
       treeGroup.add(trunk);
       
       const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), treeMat);
       leaves.position.y = 2.5;
       leaves.castShadow = true;
       

       treeGroup.add(leaves);
       treeGroup.position.set(x, 0, z);
       scene.add(treeGroup);
       
       const body = new CANNON.Body({ mass: 0 });
       body.addShape(new CANNON.Cylinder(0.4, 0.4, 1.5, 8));
       body.position.set(x, 0.75, z);
       // Cannon cylinder needs rotation
       const q = new CANNON.Quaternion();
       q.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
       body.quaternion.copy(q);
       world.addBody(body);
    };

    // Add bowling pins (Dynamic)
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

       const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 16), pinMat);
       mesh.castShadow = true;
       mesh.receiveShadow = true;
       scene.add(mesh);
       props.push({ body, mesh });
    };

    // Populate Environment
    addRamp(-5, -10, 0);
    addRamp(20, -15, Math.PI/2);

    // Zone positions — used to avoid placing trees too close
    const zonePositions = [
      { x: -20, z: -25 },
      { x: 22, z: -38 },
      { x: -35, z: -55 },
      { x: 8, z: -70 },
      { x: 40, z: -88 },
      { x: 0, z: -108 }
    ];

    for(let i=0; i<25; i++) {
       let tx, tz;
       let ok = false;
       while(!ok) {
         tx = (Math.random() - 0.5) * 110;
         tz = (Math.random() - 0.5) * 110;
         
         // Don't place near start (0, 5)
         const distToStart = Math.sqrt(tx*tx + (tz-5)*(tz-5));
         if (distToStart < 8) continue;

         // Check distance to all zones
         let tooClose = false;
         for (let j = 0; j < zonePositions.length; j++) {
           const z = zonePositions[j];
           const dist = Math.sqrt((tx-z.x)*(tx-z.x) + (tz-z.z)*(tz-z.z));
           if (dist < 8) {
             tooClose = true;
             break;
           }
         }
         if (!tooClose) ok = true;
       }
       addTree(tx, tz);
    }

    // Set up pins
    [[-10,-20], [-10.5,-20.5], [-9.5,-20.5], [-11,-21], [-10,-21], [-9,-21]].forEach(pos => addPin(pos[0], pos[1]));

    // Zone monuments — positioned near their respective zone pads
    const monMat1 = new THREE.MeshStandardMaterial({ color: 0xFF6B6B, roughness: 0.2, metalness: 0.8 });
    const monMat2 = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.2, metalness: 0.8 });
    const monMat3 = new THREE.MeshStandardMaterial({ color: 0x66FCF1, roughness: 0.2, metalness: 0.8 });

    const hMon = new THREE.Group();
    [0, 1.2, 2.4].forEach(y => { const srv = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), monMat1); srv.position.y = y; srv.castShadow = true; hMon.add(srv); });
    hMon.position.set(-20, 0.5, -25);
    hMon.scale.set(0.001, 0.001, 0.001);
    scene.add(hMon);

    const rMon = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 16), monMat2);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI), monMat2);
    dish.position.y = 1.5; dish.rotation.x = -Math.PI/4;
    rMon.add(base); rMon.add(dish);
    rMon.position.set(22, 0.5, -38);
    rMon.scale.set(0.001, 0.001, 0.001);
    scene.add(rMon);

    const aboutMon = new THREE.Mesh(new THREE.OctahedronGeometry(1.8, 0), monMat1);
    aboutMon.position.set(-35, 2.0, -55);
    aboutMon.castShadow = true;
    aboutMon.scale.set(0.001, 0.001, 0.001);
    scene.add(aboutMon);

    const eMon = new THREE.Mesh(new THREE.BoxGeometry(4, 10, 4), monMat3);
    eMon.position.set(8, 5, -70);
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
    stackMon.position.set(40, 0.5, -88);
    stackMon.scale.set(0.001, 0.001, 0.001);
    scene.add(stackMon);

    const contactMon = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.3, 16, 32), monMat3);
    contactMon.position.set(0, 2.0, -108);
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
    createZone('hiresia',    -20, -25,  0x4dabf7, hMon);
    createZone('rapidrescue', 22, -38,  0x38d9a9, rMon);
    createZone('about',      -35, -55,  0xbe4bdb, aboutMon);
    createZone('experience',   8, -70,  0xffd43b, eMon);
    createZone('stack',       40, -88,  0xff922b, stackMon);
    createZone('contact',      0, -108, 0xff6b6b, contactMon);

    // ── TOY BUGGY PHYSICS (CANNON.RAYCASTVEHICLE) ───────────────────────────
    const chassisShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.25, 1.2)); // width/2, height/2, length/2
    const chassisBody = new CANNON.Body({
      mass: 120,
      material: carMat,
      linearDamping: 0.1,
      angularDamping: 0.6
    });
    // Shift shape UP by 0.2 so the physical Center of Mass drops DOWN by 0.2
    chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.2, 0));
    chassisBody.position.set(0, 1.5, 5); // Start position
    // NOTE: Do NOT call world.addBody(chassisBody) here — vehicle.addToWorld() does this

    const vehicle = new CANNON.RaycastVehicle({
      chassisBody: chassisBody,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2
    });

    const wheelOptions = {
      radius: 0.35,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 25,
      suspensionRestLength: 0.4,
      maxSuspensionForce: 100000,
      maxSuspensionTravel: 0.35,
      dampingRelaxation: 2.3,
      dampingCompression: 4.4,
      frictionSlip: 1.4,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
      rollInfluence: 0.05
    };

    // Add 4 wheels — connection points relative to chassis center
    vehicle.addWheel({
      ...wheelOptions,
      chassisConnectionPointLocal: new CANNON.Vec3(-0.7, -0.15, -0.85) // FL
    });
    vehicle.addWheel({
      ...wheelOptions,
      chassisConnectionPointLocal: new CANNON.Vec3(0.7, -0.15, -0.85)  // FR
    });
    vehicle.addWheel({
      ...wheelOptions,
      chassisConnectionPointLocal: new CANNON.Vec3(-0.7, -0.15, 0.85)  // RL
    });
    vehicle.addWheel({
      ...wheelOptions,
      chassisConnectionPointLocal: new CANNON.Vec3(0.7, -0.15, 0.85)   // RR
    });

    vehicle.addToWorld(world); // This also adds chassisBody to world

    // ── TOY BUGGY VISUALS ────────────────────────────────────────────────────
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    const buggyColor = theme === 'dark' ? 0xff6b6b : 0xe03131; // deep vibrant red
    const bodyVisual = new THREE.MeshStandardMaterial({ color: buggyColor, roughness: 0.2, metalness: 0.1 });
    const darkVisual = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 });
    const rimVisual = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    // Main Chassis
    const mainBodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.4), bodyVisual);
    mainBodyMesh.position.y = 0.6;
    mainBodyMesh.castShadow = true;
    mainBodyMesh.receiveShadow = true;
    carGroup.add(mainBodyMesh);

    // Cabin
    const topBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), darkVisual);
    topBody.position.set(0, 1.05, -0.1); // Shifted backwards
    topBody.castShadow = true;
    carGroup.add(topBody);

    // Front Bumper
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.3), darkVisual);
    bumper.position.set(0, 0.5, 1.25); // +Z is front
    bumper.castShadow = true;
    carGroup.add(bumper);

    // Headlights
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), headlightMat);
    hL.position.set(-0.4, 0.6, 1.22); // +Z is front
    carGroup.add(hL);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), headlightMat);
    hR.position.set(0.4, 0.6, 1.22); // +Z is front
    carGroup.add(hR);

    // Wheels
    const wheelGroups = [];
    const wheelOffsets = [
      [-0.75, -0.25, 0.9],  // FL
      [0.75, -0.25, 0.9],   // FR
      [-0.75, -0.25, -0.9], // RL
      [0.75, -0.25, -0.9]   // RR
    ];

    wheelOffsets.forEach(([x, y, z]) => {
      const wg = new THREE.Group();
      const wheelSpinGroup = new THREE.Group();
      wg.add(wheelSpinGroup);

      // Tire
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 24), darkVisual);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      wheelSpinGroup.add(tire);
      
      // Hubcap
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.27, 16), rimVisual);
      hub.rotation.z = Math.PI / 2;
      wheelSpinGroup.add(hub);

      scene.add(wg); // Added directly to scene to prevent double translation
      wheelGroups.push({ group: wg, spinGroup: wheelSpinGroup, isFront: z > 0 });
    });

    // ── CONTROLS ────────────────────────────────────────────────────────────
    const keys = {};
    let autopilotTarget = null;

    const onKey = e => { 
      // Avoid controlling the car when typing in input fields
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        if(e.target === document.body) e.preventDefault();
      }
      keys[e.code] = e.type === 'keydown'; 
      
      // Manual input cancels any autopilot target or test autopilot
      if (e.type === 'keydown' && ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        autopilotTarget = null;
        testAutoDrive = false;
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

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
          keys['KeyW'] = false;
          keys['KeyS'] = false;
          keys['Space'] = false;
          keys['ArrowUp'] = false;
          keys['ArrowDown'] = false;
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

    function animate() {
      reqId = requestAnimationFrame(animate);
      if (!isVisible) return;
      
      const delta = Math.min(clock.getDelta(), 0.1);
      const dt = delta;

      const hasManualInput = (
        keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
        keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'] ||
        keys['Space']
      );

      if (hasManualInput) {
        autopilotTarget = null;
        testAutoDrive = false;
      }

      // Physics Reset / Flip-recovery (Press R)
      if (keys['KeyR']) {
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
        keys['KeyR'] = false;
      }

      const maxSteerVal = 0.5;
      const maxForce = 240; // Slightly faster than before
      const brakeForce = 40;

      let steerValue = 0;
      let engineForce = 0;
      let currentBrake = 0;

      // Allow user to break out of autopilot instantly
      if (autopilotTarget || testAutoDrive) {
         if (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] || keys['Space'] || 
             keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']) {
            autopilotTarget = null;
            testAutoDrive = false;
         }
      }

      if (autopilotTarget) {
        const dx = autopilotTarget.x - chassisBody.position.x;
        const dz = autopilotTarget.z - chassisBody.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        const speed = chassisBody.velocity.length();
        const brakeDist = Math.max(3.5, speed * 0.8);

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

          steerValue = Math.max(-maxSteerVal, Math.min(maxSteerVal, angleDiff * 1.8));
          engineForce = maxForce * 0.7;
          currentBrake = 0;
        } else {
          // Smooth brake
          if (speed > 0.5) {
             engineForce = 0;
             currentBrake = brakeForce;
             steerValue = 0;
          } else {
             engineForce = 0;
             currentBrake = brakeForce;
             autopilotTarget = null;
             keys['KeyW'] = false; keys['KeyS'] = false; keys['Space'] = false;
          }
        }
      } else if (testAutoDrive) {
        const dx = 0 - chassisBody.position.x;
        const dz = -35 - chassisBody.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        const speed = chassisBody.velocity.length();
        const brakeDist = Math.max(3.5, speed * 0.8);

        if (dist > brakeDist) {
          const targetAngle = Math.atan2(dx, dz);
          const chassisQ2 = new THREE.Quaternion(
            chassisBody.quaternion.x, chassisBody.quaternion.y,
            chassisBody.quaternion.z, chassisBody.quaternion.w
          );
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQ2);
          const currentAngle = Math.atan2(forward.x, forward.z);
          let angleDiff = targetAngle - currentAngle;
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

          steerValue = Math.max(-maxSteerVal, Math.min(maxSteerVal, angleDiff * 1.8));
          engineForce = maxForce * 0.7;
          currentBrake = 0;
        } else {
          if (speed > 0.5) {
             engineForce = 0;
             currentBrake = brakeForce;
             steerValue = 0;
          } else {
             engineForce = 0;
             currentBrake = brakeForce;
             testAutoDrive = false;
          }
        }
      } else {
        // Manual steering
        if (keys['ArrowLeft'] || keys['KeyA']) steerValue = -maxSteerVal;
        else if (keys['ArrowRight'] || keys['KeyD']) steerValue = maxSteerVal;

        // Manual engine force: Negative force drives forward (-Z)
        if (keys['ArrowUp'] || keys['KeyW']) engineForce = -maxForce;
        else if (keys['ArrowDown'] || keys['KeyS']) engineForce = maxForce;

        if (keys['Space']) {
           currentBrake = brakeForce;
           engineForce = 0; // Cut throttle when braking
        }
      }

      // Apply controls
      vehicle.setSteeringValue(steerValue, 0);
      vehicle.setSteeringValue(steerValue, 1);
      vehicle.applyEngineForce(engineForce, 2);
      vehicle.applyEngineForce(engineForce, 3);
      for (let i = 0; i < 4; i++) {
        vehicle.setBrake(currentBrake, i);
      }

      // Step physics world — RaycastVehicle runs inside world.step() automatically
      world.step(dt);

      // Sync visual chassis — explicitly copy CANNON quaternion xyzw to THREE
      carGroup.position.set(
        chassisBody.position.x,
        chassisBody.position.y,
        chassisBody.position.z
      );
      carGroup.quaternion.set(
        chassisBody.quaternion.x,
        chassisBody.quaternion.y,
        chassisBody.quaternion.z,
        chassisBody.quaternion.w
      );

      // ── WHEEL VISUAL SYNC ────────────────────────────────────────────
      // The tire mesh already has rotation.z = PI/2 locally (cylinder axis = X, disc faces ±X).
      // The physics wheel quaternion encodes correct rolling + steering around the X axle.
      // Just copy the quaternion directly — NO extra offset needed.
      for (let i = 0; i < vehicle.wheelInfos.length; i++) {
        vehicle.updateWheelTransform(i);
        const t = vehicle.wheelInfos[i].worldTransform;
        const wg = wheelGroups[i].group;
        wg.position.set(t.position.x, t.position.y, t.position.z);
        wg.quaternion.set(t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w);
      }

      // Sync dynamic props (pins)
      props.forEach(p => {
        if(!p.static) {
           p.mesh.position.copy(p.body.position);
           const q = new THREE.Quaternion().copy(p.body.quaternion);
           const fixQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
           p.mesh.quaternion.copy(q.multiply(fixQ));
        }
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

      // Calculate speed for HUD/zones (using actual velocity)
      const speedVal = chassisBody.velocity.length();
      const speedKmh = speedVal * 3.6;

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

      // Camera Logic (Chase & Area Camera)
      if (activeZoneRef.current) {
         // Area View Camera
         const areaTarget = new THREE.Vector3(
           chassisBody.position.x, chassisBody.position.y, chassisBody.position.z
         );
         const areaOffset = new THREE.Vector3(-15, 20, 15);
         const desiredCamPos = areaTarget.clone().add(areaOffset);
         camera.position.lerp(desiredCamPos, 0.03);
         camTarget.lerp(areaTarget, 0.05);
      } else {
         // Upright Chase Camera (No roll/pitch orientation tracking to avoid disorientation)
         const cameraQ = new THREE.Quaternion(
           chassisBody.quaternion.x, chassisBody.quaternion.y,
           chassisBody.quaternion.z, chassisBody.quaternion.w
         );
         const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(cameraQ); // +Z is forward
         const yaw = Math.atan2(forward.x, forward.z);
         
         const carPos = new THREE.Vector3(
           chassisBody.position.x, chassisBody.position.y, chassisBody.position.z
         );
         const offset = new THREE.Vector3(0, 5, -11); // Offset behind the +Z facing car
         offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
         
         const desiredCamPos = carPos.clone().add(offset);
         camera.position.lerp(desiredCamPos, 0.08);
         camTarget.lerp(carPos, 0.15);
      }
      camera.lookAt(camTarget);

      renderer.render(scene, camera);
    }
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
