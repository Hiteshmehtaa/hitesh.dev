import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const projectsData = {
  hiresia: {
    title: 'Hiresia',
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

    for(let i=0; i<15; i++) {
       addTree((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
    }

    // Set up pins
    [[-10,-20], [-10.5,-20.5], [-9.5,-20.5], [-11,-21], [-10,-21], [-9,-21]].forEach(pos => addPin(pos[0], pos[1]));

    // ── DISCOVERY ZONES ──────────────────────────────────────────────────────
    
    // Zone Monuments
    const monMat1 = new THREE.MeshStandardMaterial({ color: 0xFF6B6B, roughness: 0.2, metalness: 0.8 });
    const monMat2 = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.2, metalness: 0.8 });
    const monMat3 = new THREE.MeshStandardMaterial({ color: 0x66FCF1, roughness: 0.2, metalness: 0.8 });

    const hMon = new THREE.Group();
    [0, 1.2, 2.4].forEach(y => { const srv = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), monMat1); srv.position.y = y; srv.castShadow = true; hMon.add(srv); });
    hMon.position.set(-16, 0.5, -15);
    hMon.scale.set(0.001, 0.001, 0.001);
    scene.add(hMon);

    const rMon = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 16), monMat2);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI), monMat2);
    dish.position.y = 1.5; dish.rotation.x = -Math.PI/4;
    rMon.add(base); rMon.add(dish);
    rMon.position.set(19, 0.5, -20);
    rMon.scale.set(0.001, 0.001, 0.001);
    scene.add(rMon);

    const eMon = new THREE.Mesh(new THREE.BoxGeometry(4, 10, 4), monMat3);
    eMon.position.set(0, 5, -40);
    eMon.castShadow = true;
    eMon.scale.set(0.001, 0.001, 0.001);
    scene.add(eMon);

    const zones = [];
    const createZone = (id, x, z, color, monument) => {
      const padGeo = new THREE.CylinderGeometry(3.0, 3.0, 0.1, 32);
      const padMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(x, 0.05, z);
      pad.receiveShadow = true;
      scene.add(pad);
      
      const ringGeo = new THREE.TorusGeometry(2.5, 0.08, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, 1.5, z);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      scene.add(ring);
      
      zones.push({ id, position: new THREE.Vector3(x, 0, z), ring, monument });
    };

    createZone('hiresia', -12, -15, 0x4dabf7, hMon);
    createZone('rapidrescue', 15, -20, 0x38d9a9, rMon);
    createZone('experience', 0, -35, 0xffd43b, eMon);

    // ── TOY BUGGY PHYSICS (SPHERE CONTROLLER) ────────────────────────────────
    const sphereRadius = 0.6;
    const sphereMat = new CANNON.Material('sphere');
    world.addContactMaterial(new CANNON.ContactMaterial(sphereMat, groundMat, {
      friction: 0.1,
      restitution: 0.1
    }));

    const chassisBody = new CANNON.Body({
      mass: 25,
      shape: new CANNON.Sphere(sphereRadius),
      material: sphereMat,
      linearDamping: 0.1,
      angularDamping: 0.99
    });
    chassisBody.position.set(0, 2, 5); // Start higher to fall safely
    world.addBody(chassisBody);

    // ── TOY BUGGY VISUALS ────────────────────────────────────────────────────
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    const buggyColor = theme === 'dark' ? 0xff6b6b : 0xe03131; // deep vibrant red
    const bodyVisual = new THREE.MeshStandardMaterial({ color: buggyColor, roughness: 0.2, metalness: 0.1 });
    const darkVisual = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const lightVisual = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 1.0 });
    const rimVisual = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    // Main Chassis
    const mainBodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.4), bodyVisual);
    mainBodyMesh.position.y = 0.6;
    mainBodyMesh.castShadow = true;
    mainBodyMesh.receiveShadow = true;
    carGroup.add(mainBodyMesh);

    // Cabin
    const topBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), darkVisual);
    topBody.position.set(0, 1.05, 0.1);
    topBody.castShadow = true;
    carGroup.add(topBody);

    // Front Bumper
    const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.4, 16), darkVisual);
    bumper.rotation.z = Math.PI / 2;
    bumper.position.set(0, 0.5, -1.25);
    bumper.castShadow = true;
    carGroup.add(bumper);

    // Headlights
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.05), lightVisual);
    hL.position.set(-0.4, 0.6, -1.22);
    carGroup.add(hL);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.05), lightVisual);
    hR.position.set(0.4, 0.6, -1.22);
    carGroup.add(hR);

    // Wheels
    const wheelGroups = [];
    const wheelOffsets = [
      [-0.75, -0.25, -0.9], // Front Left
      [0.75, -0.25, -0.9],  // Front Right
      [-0.75, -0.25, 0.9],  // Rear Left
      [0.75, -0.25, 0.9]   // Rear Right
    ];

    wheelOffsets.forEach(([x, y, z]) => {
      const wg = new THREE.Group();
      wg.position.set(x, y, z);
      
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

      carGroup.add(wg);
      wheelGroups.push({ group: wg, spinGroup: wheelSpinGroup, isFront: z < 0 });
    });

    // ── CONTROLS ────────────────────────────────────────────────────────────
    const keys = {};
    const onKey = e => { 
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        if(e.target === document.body) e.preventDefault();
      }
      keys[e.code] = e.type === 'keydown'; 
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    let carYaw = 0;
    const visualNormal = new THREE.Vector3(0, 1, 0);
    const camTarget = new THREE.Vector3();

    // Autopilot for testing/demo (press T to toggle)
    let testAutoDrive = false;
    window.addEventListener('keydown', e => {
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

    // Intersection Observer
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    observer.observe(container);

    // ── ANIMATION LOOP ───────────────────────────────────────────────────────
    let reqId;
    const clock = new THREE.Clock();
    const fixedStep = 1 / 60;
    let accumulated = 0;

    function animate() {
      reqId = requestAnimationFrame(animate);
      if (!isVisible) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      accumulated += delta;

      if (testAutoDrive) {
        // Target: Experience zone at (0, -35)
        const dx = 0 - chassisBody.position.x;
        const dz = -35 - chassisBody.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist > 3.0) {
          keys['KeyW'] = true;
          keys['Space'] = false;
        } else {
          keys['KeyW'] = false;
          keys['Space'] = true;
        }
      }

      const velocity = chassisBody.velocity;

      while (accumulated >= fixedStep) {
        // Ground checking
        let isOnGround = false;
        const groundNormal = new CANNON.Vec3(0, 1, 0);

        for (let i = 0; i < world.contacts.length; i++) {
          const contact = world.contacts[i];
          if (contact.bi === chassisBody || contact.bj === chassisBody) {
            const normal = contact.bi === chassisBody ? contact.ni.negate() : contact.ni;
            if (normal.y > 0.5) {
              groundNormal.copy(normal);
              isOnGround = true;
            }
          }
        }

        // Steer inputs change carYaw
        let steerInput = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) steerInput = 1;
        else if (keys['ArrowRight'] || keys['KeyD']) steerInput = -1;

        // Steering rotation scale with velocity (so we don't turn instantly when completely stopped, but still can wiggle)
        const speed = chassisBody.velocity.length();
        const steerScale = speed < 1.0 ? 0.5 + 0.5 * speed : 1.0;
        const STEER_SPEED = 3.5;
        carYaw += steerInput * STEER_SPEED * steerScale * fixedStep;

        // Calculate forward direction on horizontal plane
        const forwardX = -Math.sin(carYaw);
        const forwardZ = -Math.cos(carYaw);

        // Project onto ground normal to get sloped forward vector
        let fwdX = forwardX;
        let fwdY = 0;
        let fwdZ = forwardZ;

        if (isOnGround) {
          const dot = forwardX * groundNormal.x + forwardZ * groundNormal.z;
          fwdX = forwardX - groundNormal.x * dot;
          fwdY = -groundNormal.y * dot;
          fwdZ = forwardZ - groundNormal.z * dot;
          
          const len = Math.sqrt(fwdX*fwdX + fwdY*fwdY + fwdZ*fwdZ);
          if (len > 0.0001) {
            fwdX /= len;
            fwdY /= len;
            fwdZ /= len;
          }
        }

        // Right vector (horizontal perpendicular)
        const rightX = -forwardZ;
        const rightZ = forwardX;

        // Current speed in sloped forward direction
        const currentSpeed = chassisBody.velocity.x * fwdX + chassisBody.velocity.y * fwdY + chassisBody.velocity.z * fwdZ;

        // Acceleration and braking
        let targetSpeed = 0;
        let accelRate = 0;

        const MAX_SPEED = 22.0;       // Max forward speed
        const MAX_REVERSE = 10.0;     // Max reverse speed
        const ACCEL = 40.0;           // Snappy acceleration
        const DECEL = 15.0;           // Smooth rolling resistance
        const BRAKE = 60.0;           // Hard brakes

        if (keys['ArrowUp'] || keys['KeyW']) {
          targetSpeed = MAX_SPEED;
          accelRate = ACCEL;
        } else if (keys['ArrowDown'] || keys['KeyS']) {
          targetSpeed = -MAX_REVERSE;
          accelRate = ACCEL;
        } else {
          targetSpeed = 0;
          accelRate = DECEL;
        }

        if (keys['Space']) {
          targetSpeed = 0;
          accelRate = BRAKE;
        }

        // Interpolate forward speed
        const speedDiff = targetSpeed - currentSpeed;
        const newSpeed = currentSpeed + speedDiff * accelRate * fixedStep;

        // Apply new speed along sloped forward direction
        chassisBody.velocity.x = fwdX * newSpeed;
        if (isOnGround) {
          chassisBody.velocity.y = fwdY * newSpeed;
        }
        chassisBody.velocity.z = fwdZ * newSpeed;

        // Damp lateral velocity (grip)
        const lateralSpeed = chassisBody.velocity.x * rightX + chassisBody.velocity.z * rightZ;
        const GRIP = 0.93; // 93% lateral velocity damped per step
        chassisBody.velocity.x -= rightX * lateralSpeed * GRIP;
        chassisBody.velocity.z -= rightZ * lateralSpeed * GRIP;

        world.fixedStep(fixedStep);
        accumulated -= fixedStep;
      }

      // Find ground normal for visuals
      let isOnGround = false;
      const groundNormal = new CANNON.Vec3(0, 1, 0);
      for (let i = 0; i < world.contacts.length; i++) {
        const contact = world.contacts[i];
        if (contact.bi === chassisBody || contact.bj === chassisBody) {
          const normal = contact.bi === chassisBody ? contact.ni.negate() : contact.ni;
          if (normal.y > 0.5) {
            groundNormal.copy(normal);
            isOnGround = true;
          }
        }
      }

      const targetNormal = isOnGround 
        ? new THREE.Vector3(groundNormal.x, groundNormal.y, groundNormal.z).normalize() 
        : new THREE.Vector3(0, 1, 0);

      visualNormal.lerp(targetNormal, 0.1);

      // Reconstruct target basis from visual normal and yaw
      const fwdHorizontal = new THREE.Vector3(-Math.sin(carYaw), 0, -Math.cos(carYaw));
      const dot = fwdHorizontal.dot(visualNormal);
      const fwdSloped = new THREE.Vector3()
        .copy(fwdHorizontal)
        .sub(visualNormal.clone().multiplyScalar(dot))
        .normalize();

      const backward = fwdSloped.clone().negate().normalize();
      const right = new THREE.Vector3().crossVectors(visualNormal, backward).normalize();
      const up = new THREE.Vector3().crossVectors(backward, right).normalize();

      const matrix = new THREE.Matrix4();
      matrix.makeBasis(right, up, backward);
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(matrix);

      // Sync visuals
      carGroup.position.copy(chassisBody.position);
      carGroup.quaternion.slerp(targetQuat, 0.15);

      // Roll and steering animations for wheels
      let currentForwardSpeed = velocity.dot(fwdSloped);
      if (Math.abs(currentForwardSpeed) < 0.05) currentForwardSpeed = 0;
      const wheelRadius = 0.35;
      const rollDelta = (currentForwardSpeed / wheelRadius) * delta;

      wheelGroups.forEach(w => {
        w.spinGroup.rotation.x += rollDelta;
        if (w.isFront) {
          let targetWheelSteer = 0;
          if (keys['ArrowLeft'] || keys['KeyA']) targetWheelSteer = 0.4;
          else if (keys['ArrowRight'] || keys['KeyD']) targetWheelSteer = -0.4;
          w.group.rotation.y += (targetWheelSteer - w.group.rotation.y) * 0.2;
        }
      });

      // Sync dynamic scenery/props
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
         }
      });

      // Calculate speed for HUD/zones (using local forward speed relative to visual heading)
      const speedVal = velocity.dot(fwdSloped);
      const speedKmh = Math.abs(speedVal) * 3.6;

      let closestZone = null;
      let minZoneDist = Infinity;
      zones.forEach(z => {
         const dx = z.position.x - chassisBody.position.x;
         const dz = z.position.z - chassisBody.position.z;
         const dist = Math.sqrt(dx*dx + dz*dz);
         if (dist < minZoneDist) {
            minZoneDist = dist;
            if (dist < 3.5) {
               closestZone = z.id;
            }
         }
      });

      // State machine for zone entry/exit with speed/distance hysteresis
      if (activeZoneRef.current) {
         const activeZoneObj = zones.find(z => z.id === activeZoneRef.current);
         let shouldExit = true;
         if (activeZoneObj) {
            const dx = activeZoneObj.position.x - chassisBody.position.x;
            const dz = activeZoneObj.position.z - chassisBody.position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            // Remain in zone only if we are still close and haven't accelerated to high speed
            if (dist < 4.0 && speedKmh < 5.0) {
               shouldExit = false;
            }
         }
         if (shouldExit) {
            activeZoneRef.current = null;
            window.dispatchEvent(new CustomEvent('zone-leave'));
         }
      } else {
         // Enter zone if parked (speed < 1.0 km/h) inside the zone radius (< 3.5)
         if (closestZone && speedKmh < 1.0) {
            activeZoneRef.current = closestZone;
            window.dispatchEvent(new CustomEvent('zone-enter', { detail: closestZone }));
         }
      }

      // Camera Logic
      if (activeZoneRef.current) {
         // Area View Camera
         const areaTarget = new THREE.Vector3().copy(chassisBody.position);
         const areaOffset = new THREE.Vector3(-15, 20, 15); // High diagonal overhead view
         const desiredCamPos = areaTarget.clone().add(areaOffset);
         camera.position.lerp(desiredCamPos, 0.03); // Slower, cinematic pan
         camTarget.lerp(areaTarget, 0.05);
      } else {
         // Chase Camera
         const carPos = new THREE.Vector3().copy(chassisBody.position);
         const offset = new THREE.Vector3(0, 6, 12).applyQuaternion(carGroup.quaternion);
         const desiredCamPos = carPos.clone().add(offset);
         camera.position.lerp(desiredCamPos, 0.08); // Snappier chase
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
      cancelAnimationFrame(reqId);
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [prefersReducedMotion]); // Kept empty to prevent re-instantiation

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
          <InteractiveEl as="a" href="#" className="logo">HITESH.DEV</InteractiveEl>
          <div className="nav-links">
            <InteractiveEl as="a" href="#work" className={`nav-item ${activeSection === 'work' ? 'active' : ''}`}>Work</InteractiveEl>
            <InteractiveEl as="a" href="#about" className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}>About</InteractiveEl>
            <InteractiveEl as="a" href="#stack" className={`nav-item ${activeSection === 'stack' ? 'active' : ''}`}>Stack</InteractiveEl>
            <InteractiveEl as="a" href="#contact" className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`}>Contact</InteractiveEl>
          </div>
        </div>
      </nav>

      <main>
        <section id="hero" className="hero-modern">
          <div id="canvas-container" ref={canvasContainerRef}></div>
          
          
          {/* Bruno Simon Style HUD / Overlays */}
          {activeZone && (
            <div style={{
              position: 'absolute', top: '0', right: '0', bottom: '0', width: '450px',
              background: theme === 'dark' ? 'rgba(10, 10, 12, 0.85)' : 'rgba(255, 255, 255, 0.85)',
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
              <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#8FAF8C', marginBottom: '16px' }}>
                {activeZone === 'hiresia' || activeZone === 'rapidrescue' ? 'PROJECT UNLOCKED' : 'AREA UNLOCKED'}
              </div>
              <h2 style={{margin: '0 0 24px 0', fontSize: '42px', fontFamily: '"Instrument Serif", serif', lineHeight: '1.1'}}>
                {activeZone === 'hiresia' ? 'Hiresia ATS' : activeZone === 'rapidrescue' ? 'RapidRescueQ' : 'Experience & Skills'}
              </h2>
              
              {activeZone === 'hiresia' && (
                <div>
                  <span style={{ display: 'inline-block', padding: '6px 12px', background: '#FF6B6B', color: '#fff', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>FULL STACK ATS</span>
                  <p style={{lineHeight: '1.8', marginBottom: '24px', opacity: 0.8, fontSize: '15px'}}>A complete MERN-based Applicant Tracking System featuring advanced analytics, role-based access control, and seamless scheduling. Designed to handle hundreds of concurrent applications with zero downtime.</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                     {['MongoDB', 'Express', 'React', 'Node.js', 'AWS'].map(tech => (
                        <span key={tech} style={{ padding: '6px 12px', background: theme==='dark'?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                     ))}
                  </div>
                </div>
              )}

              {activeZone === 'rapidrescue' && (
                <div>
                  <span style={{ display: 'inline-block', padding: '6px 12px', background: '#4CAF50', color: '#fff', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '24px' }}>COORDINATION PLATFORM</span>
                  <p style={{lineHeight: '1.8', marginBottom: '24px', opacity: 0.8, fontSize: '15px'}}>A live camera-based emergency reporting and coordination platform for public reporters and NGOs. Utilizes WebRTC for live streaming and geolocation for immediate dispatch.</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                     {['React Native', 'WebRTC', 'Socket.io', 'Node.js'].map(tech => (
                        <span key={tech} style={{ padding: '6px 12px', background: theme==='dark'?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                     ))}
                  </div>
                </div>
              )}

              {(activeZone === 'experience' || activeZone === 'about') && (
                <div className="game-hud-scroll" style={{ overflowY: 'auto', paddingRight: '10px' }}>
                  <p style={{lineHeight: '1.8', marginBottom: '40px', opacity: 0.9, fontSize: '16px'}}>I am a passionate software developer specializing in building production-ready mobile applications and investor-facing web platforms.</p>
                  
                  <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: theme==='dark'?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>Experience</h3>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', fontWeight: 'bold' }}>APR 2024 – PRESENT</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Software Dev Intern @ Grade Capital</div>
                    <p style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.6' }}>Contributed to production-ready mobile apps and investor-facing web platforms using React Native and React.js.</p>
                  </div>
                  
                  <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', fontWeight: 'bold' }}>DEC 2023 – APR 2024</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>App Dev Intern @ Yzxx</div>
                    <p style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.6' }}>Designed and developed a cross-platform mobile application using React Native and Expo.</p>
                  </div>

                  <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: theme==='dark'?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>Core Skills</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                     {['JavaScript', 'React Native', 'React.js', 'Node.js', 'MongoDB', 'AWS', 'Expo'].map(tech => (
                        <span key={tech} style={{ padding: '6px 12px', background: theme==='dark'?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tech}</span>
                     ))}
                  </div>
                </div>
              )}

              <div style={{marginTop: 'auto', paddingTop: '40px', fontSize: '13px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '8px'}}>
                 <span style={{background: theme === 'dark' ? '#333' : '#ddd', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: theme==='dark'?'#fff':'#000'}}>W</span>
                 Press W to drive away and exit
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
          </div>
          </section>
  </main>

      
    </>
  );
}

export default App;
