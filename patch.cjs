const fs = require('fs');
const appFile = 'src/App.jsx';
let code = fs.readFileSync(appFile, 'utf8');
// Normalize to LF internally, restore CRLF at end
const hasCRLF = code.includes('\r\n');
if (hasCRLF) code = code.replace(/\r\n/g, '\n');

// ── 1. Insert createCar before projectsData ────────────────────────────────
const createCarFn = `
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

  // Physics chassis
  const chassisShape = new CANNON.Box(new CANNON.Vec3(0.7, 0.2, 1.4));
  const chassisBody = new CANNON.Body({ mass: 150 });
  chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.2, 0));
  chassisBody.position.set(0, 1.5, 5);

  const vehicle = new CANNON.RaycastVehicle({ chassisBody, indexRightAxis: 0, indexUpAxis: 1, indexForwardAxis: 2 });

  const wheelOpts = {
    radius: 0.4, directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 50, suspensionRestLength: 0.3,
    maxSuspensionForce: 100000, maxSuspensionTravel: 0.3,
    dampingRelaxation: 2.3, dampingCompression: 4.5,
    axleLocal: new CANNON.Vec3(-1, 0, 0), rollInfluence: 0.05,
  };
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 1.2, chassisConnectionPointLocal: new CANNON.Vec3(-0.8, -0.1,  1.0) });
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 1.2, chassisConnectionPointLocal: new CANNON.Vec3( 0.8, -0.1,  1.0) });
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 1.5, chassisConnectionPointLocal: new CANNON.Vec3(-0.8, -0.1, -1.0) });
  vehicle.addWheel({ ...wheelOpts, frictionSlip: 1.5, chassisConnectionPointLocal: new CANNON.Vec3( 0.8, -0.1, -1.0) });

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

`;

if (!code.includes('function createCar')) {
  code = code.replace('const projectsData = {', createCarFn + 'const projectsData = {');
  console.log('✓ createCar inserted');
} else {
  console.log('⊘ createCar already present, skipping');
}

// ── 2. Add isLoaded + loadProgress state ───────────────────────────────────
const stateTarget = '  const [activeZone, setActiveZone] = useState(null);';
if (!code.includes('isLoaded')) {
  code = code.replace(stateTarget, stateTarget + '\n  const [isLoaded, setIsLoaded] = useState(false);\n  const [loadProgress, setLoadProgress] = useState(0);');
  console.log('✓ isLoaded state added');
}

// ── 3. Add load interval after container cleared ───────────────────────────
const clearTarget = '    while (container.firstChild) container.removeChild(container.firstChild);\n\n    const W';
if (!code.includes('_loadInterval')) {
  code = code.replace(clearTarget, `    while (container.firstChild) container.removeChild(container.firstChild);\n\n    // Simulated load progress\n    let _prog = 0;\n    const _loadInterval = setInterval(() => {\n      _prog += Math.random() * 18 + 4;\n      if (_prog >= 100) { _prog = 100; clearInterval(_loadInterval); }\n      setLoadProgress(Math.round(_prog));\n    }, 120);\n\n    const W`);
  console.log('✓ load interval inserted');
}

// ── 4. Replace old car physics + visual block with createCar call ───────────
const carBlockStart = '    // ── TOY BUGGY PHYSICS (CANNON.RAYCASTVEHICLE) ───────────────────────────';
const carBlockEnd   = '    vehicle.addToWorld(world); // This also adds chassisBody to world';
if (code.includes(carBlockStart) && code.includes(carBlockEnd)) {
  const si = code.indexOf(carBlockStart);
  const ei = code.indexOf(carBlockEnd) + carBlockEnd.length;
  // Also eat the old visual block that follows
  const visualEnd = '      wheelGroups.push({ group: wg, spinGroup: wheelSpinGroup, isFront: z > 0 });\n    });';
  let endIdx = ei;
  if (code.indexOf(visualEnd, ei) !== -1) {
    endIdx = code.indexOf(visualEnd, ei) + visualEnd.length;
  }
  code = code.substring(0, si) +
`    // ── BRUNO SIMON STYLE CAR ───────────────────────────────────────────────
    const { chassisBody, vehicle, carGroup, wheels } = createCar(theme);
    vehicle.addToWorld(world);
    scene.add(carGroup);
    wheels.forEach(w => scene.add(w));` +
    code.substring(endIdx);
  console.log('✓ Old car block replaced with createCar()');
} else {
  console.log('⊘ Car block not found (may already be replaced)');
}

// ── 5. Replace old controls block ─────────────────────────────────────────
const oldCtrlStart = '    // ── CONTROLS ────────────────────────────────────────────────────────────\n    const keys = {};';
const oldCtrlEnd   = '    window.addEventListener(\'keydown\', onKey);\n    window.addEventListener(\'keyup\', onKey);';
if (code.includes(oldCtrlStart) && !code.includes('keys.up')) {
  const ci = code.indexOf(oldCtrlStart);
  const ce = code.indexOf(oldCtrlEnd, ci) + oldCtrlEnd.length;
  code = code.substring(0, ci) +
`    // ── CONTROLS ────────────────────────────────────────────────────────────
    const keys = { up: false, down: false, left: false, right: false, space: false };
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
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    let currentEngineForce = 0, steerVal = 0;` +
    code.substring(ce);
  console.log('✓ Controls replaced');
}

// ── 6. Remove old autopilot listeners (T key, drive-to-zone) ────────────────
// Remove the T-key autopilot block
const autoPilotBlock = /    \/\/ Autopilot for testing\/demo[\s\S]*?console\.log\("Autopilot toggled:", testAutoDrive\);\n    \}\);\n\n/;
code = code.replace(autoPilotBlock, '    let autopilotTarget = null; let testAutoDrive = false;\n\n');

// ── 7. Remove old animate physics block, insert new one ───────────────────
const oldPhysicsStart = '      const maxSteerVal = 0.5;';
const oldPhysicsEnd   = '      world.step(dt);';
if (code.includes(oldPhysicsStart)) {
  const ps = code.indexOf(oldPhysicsStart);
  const pe = code.indexOf(oldPhysicsEnd, ps) + oldPhysicsEnd.length;
  code = code.substring(0, ps) +
`      // ── ENGINE: ramp up 100/frame → 2000 max, ramp down 200/frame on release
      const maxEngineForce = 2000;
      const speedVal = chassisBody.velocity.length();
      const speedKmh = speedVal * 3.6;
      if (keys.up)        currentEngineForce = Math.max(currentEngineForce - 100, -maxEngineForce);
      else if (keys.down) currentEngineForce = Math.min(currentEngineForce + 100,  maxEngineForce);
      else { currentEngineForce += currentEngineForce < 0 ? 200 : currentEngineForce > 0 ? -200 : 0; if (Math.abs(currentEngineForce) < 200) currentEngineForce = 0; }

      // ── STEERING: lerp 0.12, speed-sensitive max steer
      const maxSteerVal = speedKmh > 80 ? Math.max(0.15, THREE.MathUtils.lerp(0.4, 0.15, (speedKmh - 80) / 40)) : 0.4;
      const targetSteer = keys.left ? maxSteerVal : keys.right ? -maxSteerVal : 0;
      steerVal += (targetSteer - steerVal) * 0.12;

      // ── BRAKES: detect reversing via dot product (THREE, not CANNON)
      const _fq = new THREE.Quaternion(chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w);
      const _fv = new THREE.Vector3(0, 0, 1).applyQuaternion(_fq);
      const isReversing = chassisBody.velocity.dot(new CANNON.Vec3(_fv.x, _fv.y, _fv.z)) > 0.1;
      let brakeForce = 0;
      if (keys.down && !isReversing && speedKmh > 5) brakeForce = 40;
      if (keys.up   &&  isReversing && speedKmh > 5) brakeForce = 40;
      if (keys.space) brakeForce = 40;
      if (brakeForce > 0) currentEngineForce = 0;

      vehicle.setSteeringValue(steerVal, 0); vehicle.setSteeringValue(steerVal, 1);
      vehicle.applyEngineForce(currentEngineForce, 2); vehicle.applyEngineForce(currentEngineForce, 3);
      for (let i = 0; i < 4; i++) vehicle.setBrake(brakeForce, i);

      // Downforce
      chassisBody.applyForce(new CANNON.Vec3(0, -speedVal * speedVal * 0.5, 0), new CANNON.Vec3(0, 0, 0));

      world.step(delta);` +
    code.substring(pe);
  console.log('✓ Animate physics replaced');
}

// ── 8. Replace old autopilot in animate (large block) with nothing ──────────
const autoInAnim = /      \/\/ Allow user to break out of autopilot[\s\S]*?} else \{\n        \/\/ Manual steering\n        if \(keys\['ArrowLeft'\] \|\| keys\['KeyA'\]\) steerValue[\s\S]*?}\n      }\n\n      \/\/ Apply controls/;
code = code.replace(autoInAnim, '      // Apply controls');

// ── 9. Replace old chassis+wheel sync ─────────────────────────────────────
const oldSyncStart = '      // Sync visual chassis — explicitly copy CANNON quaternion xyzw to THREE';
const oldSyncEnd   = '        wg.quaternion.set(t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w);\n      }';
if (code.includes(oldSyncStart)) {
  const ss = code.indexOf(oldSyncStart);
  const se = code.indexOf(oldSyncEnd, ss) + oldSyncEnd.length;
  code = code.substring(0, ss) +
`      // Sync chassis + wheels
      carGroup.position.copy(chassisBody.position);
      carGroup.quaternion.copy(chassisBody.quaternion);
      for (let i = 0; i < vehicle.wheelInfos.length; i++) {
        vehicle.updateWheelTransform(i);
        const t = vehicle.wheelInfos[i].worldTransform;
        wheels[i].position.copy(t.position);
        wheels[i].quaternion.copy(t.quaternion);
      }` +
    code.substring(se);
  console.log('✓ Sync block replaced');
}

// ── 10. Replace old camera block ──────────────────────────────────────────
const oldCamStart = '      // Camera Logic (Chase & Area Camera)';
const oldCamEnd   = '      camera.lookAt(camTarget);';
if (code.includes(oldCamStart)) {
  const cs = code.indexOf(oldCamStart);
  const ce2 = code.indexOf(oldCamEnd, cs) + oldCamEnd.length;
  code = code.substring(0, cs) +
`      // Camera — lerp 0.05 pos / 0.1 lookAt, dynamic FOV, corner tilt
      const camQ = new THREE.Quaternion(chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w);
      const camFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(camQ);
      const camYaw = Math.atan2(camFwd.x, camFwd.z);
      const carPos = new THREE.Vector3().copy(chassisBody.position);
      let distBehind = 6, targetFov = 45;
      if (speedKmh > 60) { distBehind = THREE.MathUtils.lerp(6, 8, (speedKmh-60)/40); targetFov = THREE.MathUtils.lerp(45, 65, (speedKmh-60)/40); }
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05); camera.updateProjectionMatrix();
      const camOffset = new THREE.Vector3(0, 3, -distBehind).applyAxisAngle(new THREE.Vector3(0,1,0), camYaw);
      camera.position.lerp(carPos.clone().add(camOffset), 0.05);
      camTarget.lerp(carPos, 0.1);
      camera.lookAt(camTarget);
      camera.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), steerVal * 2 * Math.PI / 180));` +
    code.substring(ce2);
  console.log('✓ Camera replaced');
}

// ── 11. Remove old steer/engine/speed after camera if dangling ──────────────
// Remove "const speedVal = chassisBody.velocity.length();" if it's now duplicated above animate
// (it now lives inside animate, second occurrence from old code is after zones — already removed above)

// ── 12. Fix cleanup to remove stale onDriveTo / testAutoDrive references ─────
code = code.replace(
  "      window.removeEventListener('drive-to-zone', onDriveTo);\n      cancelAnimationFrame(reqId);",
  "      cancelAnimationFrame(reqId);"
);

// ── 13. Add setIsLoaded after animate() ───────────────────────────────────
if (!code.includes('setIsLoaded(true)')) {
  code = code.replace(
    '    animate();\n\n    const onResize',
    '    setTimeout(() => setIsLoaded(true), 400);\n    animate();\n\n    const onResize'
  );
  console.log('✓ setIsLoaded(true) added');
}

// ── 14. Insert gamified loader JSX before canvas container ───────────────
const loaderJSX = `
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
                    animation: \`loaderPulse 1.4s ease-in-out \${i * 0.22}s infinite\`,
                  }}/>
                ))}
              </div>
              <style>{\`
                @keyframes loaderPulse {
                  0%, 100% { opacity: 0.15; transform: scale(0.7); }
                  50% { opacity: 1; transform: scale(1.3); box-shadow: 0 0 10px #4dabf7; }
                }
              \`}</style>
            </div>
          )}

`;

if (!code.includes('Gamified Loader')) {
  code = code.replace(
    '          <div id="canvas-container" ref={canvasContainerRef}></div>',
    loaderJSX + '          <div id="canvas-container" ref={canvasContainerRef}></div>'
  );
  console.log('✓ Gamified loader JSX inserted');
}

// ── Write back ─────────────────────────────────────────────────────────────
if (hasCRLF) code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(appFile, code, 'utf8');
console.log('\n✅ All patches applied!');
