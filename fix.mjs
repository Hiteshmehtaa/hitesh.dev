import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Visual Car +Z Orientation (Swap Z coordinates)
content = content.replace(
    'topBody.position.set(0, 1.05, 0.1);',
    'topBody.position.set(0, 1.05, -0.1);'
);
content = content.replace(
    'bumper.position.set(0, 0.5, -1.25);',
    'bumper.position.set(0, 0.5, 1.25);'
);
content = content.replace(
    'hL.position.set(-0.4, 0.6, -1.22);',
    'hL.position.set(-0.4, 0.6, 1.22);'
);
content = content.replace(
    'hR.position.set(0.4, 0.6, -1.22);',
    'hR.position.set(0.4, 0.6, 1.22);'
);

// 2. Lower center of mass
content = content.replace(
    'chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.5, 0));',
    'chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.2, 0));'
);

// 3. Increase maxForce
content = content.replace(
    'const maxForce = 240;',
    'const maxForce = 350;'
);
content = content.replace(
    'const maxSteerVal = 0.5;',
    'const maxSteerVal = 0.55;'
);

// 4. Fix Autopilot +Z Math and Smooth Stopping
const autopilot_old = `      if (autopilotTarget) {
        const dx = autopilotTarget.x - chassisBody.position.x;
        const dz = autopilotTarget.z - chassisBody.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist > 3.5) {
          const targetAngle = Math.atan2(-dx, -dz);
          const chassisQ = new THREE.Quaternion(
            chassisBody.quaternion.x, chassisBody.quaternion.y,
            chassisBody.quaternion.z, chassisBody.quaternion.w
          );
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(chassisQ);
          const currentAngle = Math.atan2(forward.x, forward.z);
          let angleDiff = targetAngle - currentAngle;
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

          steerValue = Math.max(-maxSteerVal, Math.min(maxSteerVal, -angleDiff * 1.8));
          engineForce = -maxForce * 0.7;
          currentBrake = 0;
        } else {
          engineForce = 0;
          currentBrake = brakeForce;
          autopilotTarget = null;
          // Clear active keys
          keys['KeyW'] = false;
          keys['KeyS'] = false;
          keys['Space'] = false;
          keys['ArrowUp'] = false;
          keys['ArrowDown'] = false;
        }
      } else if (testAutoDrive) {`;

const autopilot_new = `      // Break out of autopilot if manual controls are used
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
          const targetAngle = Math.atan2(dx, dz); // +Z is forward
          const chassisQ = new THREE.Quaternion(
            chassisBody.quaternion.x, chassisBody.quaternion.y,
            chassisBody.quaternion.z, chassisBody.quaternion.w
          );
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQ); // +Z is forward
          const currentAngle = Math.atan2(forward.x, forward.z);
          let angleDiff = targetAngle - currentAngle;
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

          steerValue = Math.max(-maxSteerVal, Math.min(maxSteerVal, angleDiff * 1.8));
          engineForce = maxForce * 0.7; // positive to move forward
          currentBrake = 0;
        } else {
          // Smooth braking
          if (speed > 0.5) {
             engineForce = 0;
             currentBrake = brakeForce;
             steerValue = 0;
          } else {
             engineForce = 0;
             currentBrake = brakeForce;
             autopilotTarget = null;
             keys['KeyW'] = false; keys['KeyS'] = false; keys['Space'] = false; keys['ArrowUp'] = false; keys['ArrowDown'] = false;
          }
        }
      } else if (testAutoDrive) {`;

content = content.replace(autopilot_old, autopilot_new);

// 5. Fix testAutoDrive fallback
const testAuto_old = `      } else if (testAutoDrive) {
        const dx = 0 - chassisBody.position.x;
        const dz = -35 - chassisBody.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist > 3.5) {
          const targetAngle = Math.atan2(-dx, -dz);
          const chassisQ2 = new THREE.Quaternion(
            chassisBody.quaternion.x, chassisBody.quaternion.y,
            chassisBody.quaternion.z, chassisBody.quaternion.w
          );
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(chassisQ2);
          const currentAngle = Math.atan2(forward.x, forward.z);
          let angleDiff = targetAngle - currentAngle;
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

          steerValue = Math.max(-maxSteerVal, Math.min(maxSteerVal, -angleDiff * 1.8));
          engineForce = -maxForce * 0.7;
          currentBrake = 0;
        } else {
          engineForce = 0;
          currentBrake = brakeForce;
        }
      }`;

const testAuto_new = `      } else if (testAutoDrive) {
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
      }`;

content = content.replace(testAuto_old, testAuto_new);

// 6. Manual Controls
const manual_old = `      } else {
        // Manual steering — positive steer value = RIGHT, negative = LEFT
        if (keys['ArrowLeft'] || keys['KeyA']) steerValue = -maxSteerVal;
        else if (keys['ArrowRight'] || keys['KeyD']) steerValue = maxSteerVal;

        // Manual engine force
        if (keys['ArrowUp'] || keys['KeyW']) engineForce = -maxForce;
        else if (keys['ArrowDown'] || keys['KeyS']) engineForce = maxForce;

        if (keys['Space']) currentBrake = brakeForce;
      }

      // Apply controls
      vehicle.setSteeringValue(steerValue, 0);
      vehicle.setSteeringValue(steerValue, 1);
      vehicle.applyEngineForce(engineForce, 2);
      vehicle.applyEngineForce(engineForce, 3);`;

const manual_new = `      } else {
        // Manual steering: +Z is forward, so steering left (+X) is positive steering angle
        if (keys['ArrowLeft'] || keys['KeyA']) steerValue = maxSteerVal;
        else if (keys['ArrowRight'] || keys['KeyD']) steerValue = -maxSteerVal;

        // Manual engine force: +Z is forward, positive force moves forward
        if (keys['ArrowUp'] || keys['KeyW']) engineForce = maxForce;
        else if (keys['ArrowDown'] || keys['KeyS']) engineForce = -maxForce;

        if (keys['Space']) {
           currentBrake = brakeForce;
           engineForce = 0;
        }
      }

      // Apply controls
      vehicle.setSteeringValue(steerValue, 2); // Front Left (at +Z)
      vehicle.setSteeringValue(steerValue, 3); // Front Right (at +Z)
      vehicle.applyEngineForce(engineForce, 0); // Rear Left (at -Z)
      vehicle.applyEngineForce(engineForce, 1); // Rear Right (at -Z)`;

content = content.replace(manual_old, manual_new);

// 7. Remove HUD speed threshold
content = content.replace(
    'if (closestZone && speedKmh < 8.0) {',
    'if (closestZone) {'
);

// 8. Update Camera to sit behind +Z car
const cam_old = `         // Upright Chase Camera (No roll/pitch orientation tracking to avoid disorientation)
         const cameraQ = new THREE.Quaternion(
           chassisBody.quaternion.x, chassisBody.quaternion.y,
           chassisBody.quaternion.z, chassisBody.quaternion.w
         );
         const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQ);
         const yaw = Math.atan2(forward.x, forward.z);
         
         const carPos = new THREE.Vector3(
           chassisBody.position.x, chassisBody.position.y, chassisBody.position.z
         );
         const offset = new THREE.Vector3(0, 5, 11);
         offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);`;

const cam_new = `         // Upright Chase Camera
         const cameraQ = new THREE.Quaternion(
           chassisBody.quaternion.x, chassisBody.quaternion.y,
           chassisBody.quaternion.z, chassisBody.quaternion.w
         );
         const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(cameraQ);
         const yaw = Math.atan2(forward.x, forward.z);
         
         const carPos = new THREE.Vector3(
           chassisBody.position.x, chassisBody.position.y, chassisBody.position.z
         );
         const offset = new THREE.Vector3(0, 5, -11); // Offset behind the +Z facing car
         offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);`;

content = content.replace(cam_old, cam_new);

fs.writeFileSync('src/App.jsx', content);

console.log("Done");
