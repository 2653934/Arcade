// Keyboard input and car controls

function handleKeyDown(event) {
    keys[event.code] = true;
    
    // Camera controls
    if (event.code === 'KeyC') {
        cameraFollowMode = !cameraFollowMode;
        controls.enabled = !cameraFollowMode;
    }
    
    if (!cameraFollowMode) {
        return;
    }
    
    // Camera rotation with Q and E
    if (event.code === 'KeyQ') {
        cameraAngle = (cameraAngle + 1) % 4;
    } else if (event.code === 'KeyE') {
        cameraAngle = (cameraAngle - 1 + 4) % 4;
    }
    
    // Boost with Space
    if (event.code === 'Space') {
        // Only allow boosting if we have boost available
        if (boostAmount > 0) {
            isBoosting = true;
            event.preventDefault(); // Prevent page scroll
            // Update UI
            const boostStatus = document.getElementById('boost-status');
            if (boostStatus) {
                boostStatus.textContent = 'ACTIVE';
                boostStatus.style.color = '#ffdd00';
            }
        }
    }
    
    // Toggle colliders with 'V'
    if (event.code === 'KeyV') {
        toggleColliders();
    }
    
    // Toggle headlights with 'L' (only in night mode)
    if (event.code === 'KeyL' && isNightMode) {
        toggleHeadlights();
    }
}

function handleKeyUp(event) {
    keys[event.code] = false;
    
    if (event.code === 'Space') {
        isBoosting = false;
        // Update UI
        const boostStatus = document.getElementById('boost-status');
        if (boostStatus) {
            boostStatus.textContent = 'OFF';
            boostStatus.style.color = '#888';
        }
    }
}

function updateCameraPosition() {
    if (!carWrapper || !cameraFollowMode) return;
    
    const carPosition = carWrapper.position.clone();
    const carRotation = carWrapper.rotation.y;
    
    // Calculate camera offset based on selected angle
    let offset;
    switch (cameraAngle) {
        case 0: // Behind (default) - Flipped direction
            offset = new THREE.Vector3(0, 4, 8);
            break;
        case 1: // Left side
            offset = new THREE.Vector3(8, 4, 0);
            break;
        case 2: // Front
            offset = new THREE.Vector3(0, 4, -8);
            break;
        case 3: // Right side
            offset = new THREE.Vector3(-8, 4, 0);
            break;
    }
    
    // Rotate offset based on car rotation
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation);
    
    // Position camera
    camera.position.copy(carPosition).add(offset);
    
    // Look at car
    camera.lookAt(carPosition);
}

function updateCarMovement() {
    if (!carBody || !carWrapper) return;
    
    // Get current velocity for display
    const velocityVec = new THREE.Vector3(carBody.velocity.x, carBody.velocity.y, carBody.velocity.z);
    const currentSpeed = velocityVec.length();
    carSpeed = currentSpeed;
    
    // Calculate car direction for UI (-1 = backward, 0 = still, 1 = forward)
    const carForward = new THREE.Vector3(-1, 0, 0);
    carForward.applyQuaternion(carWrapper.quaternion);
    const velocityDirection = new THREE.Vector3(carBody.velocity.x, 0, carBody.velocity.z).normalize();
    
    if (currentSpeed > 0.5) {
        const dot = carForward.dot(velocityDirection);
        carDirection = dot > 0 ? 1 : -1;
    } else {
        carDirection = 0;
    }
    
    // Get input keys
    const forward = keys['KeyW'] || keys['ArrowUp'];
    const backward = keys['KeyS'] || keys['ArrowDown'];
    const left = keys['KeyA'] || keys['ArrowLeft'];
    const right = keys['KeyD'] || keys['ArrowRight'];
    
    // Get car forward direction vector
    const forwardVector = new THREE.Vector3(-1, 0, 0);
    forwardVector.applyQuaternion(carWrapper.quaternion).normalize();
    
    // Smooth acceleration buildup
    let targetAcceleration = 0;
    if (forward) targetAcceleration = 1;
    else if (backward) targetAcceleration = -1;
    
    const accelerationRate = 0.08;
    currentAcceleration += (targetAcceleration - currentAcceleration) * accelerationRate;
    
    // Apply force based on current (smoothed) acceleration
    let acceleration = currentAcceleration * 300;
    
    // Apply boost multiplier when space is pressed
    if (isBoosting) {
        acceleration *= 2.0; // 2x speed boost (100%)
    }
    
    const driveForce = new CANNON.Vec3(
        forwardVector.x * acceleration,
        0,
        forwardVector.z * acceleration
    );
    carBody.applyForce(driveForce, carBody.position);
    
    // Add drag force (air resistance)
    const dragCoefficient = 3.5;
    const dragForce = new CANNON.Vec3(
        -carBody.velocity.x * dragCoefficient,
        0,
        -carBody.velocity.z * dragCoefficient
    );
    carBody.applyForce(dragForce, carBody.position);
    
    // Calculate grip force (simulate tire grip when moving)
    const lateralVelocity = new CANNON.Vec3();
    const rightVector = new THREE.Vector3(0, 0, 1);
    rightVector.applyQuaternion(carWrapper.quaternion);
    
    const lateralSpeed = carBody.velocity.dot(new CANNON.Vec3(rightVector.x, 0, rightVector.z));
    const gripCoefficient = 35;
    const gripForce = new CANNON.Vec3(
        -rightVector.x * lateralSpeed * gripCoefficient,
        0,
        -rightVector.z * lateralSpeed * gripCoefficient
    );
    carBody.applyForce(gripForce, carBody.position);
    
    // Soft speed cap
    const maxSpeed = 25;
    if (currentSpeed > maxSpeed) {
        carBody.velocity.x *= maxSpeed / currentSpeed;
        carBody.velocity.z *= maxSpeed / currentSpeed;
    }
    
    // Apply turning torque (only when moving and turning keys pressed)
    if ((left || right) && Math.abs(currentSpeed) > 0.5) {
        let turnInput = 0;
        if (left) turnInput = 1;
        if (right) turnInput = -1;
        
        // Natural turning: torque depends on speed and direction
        const turnTorque = -turnInput * currentSpeed * carDirection * 15;
        carBody.torque.set(0, turnTorque, 0);
        
        // Animate wheels
        if (frontWheelsGroup) {
            const maxSteerAngle = Math.PI / 4;
            const targetRotation = turnInput * maxSteerAngle;
            
            gsap.to(frontWheelsGroup.rotation, {
                y: targetRotation,
                duration: 0.1,
                ease: "power2.out"
            });
        }
    } else {
        carBody.torque.set(0, 0, 0);
        
        // Return wheels to center
        if (frontWheelsGroup) {
            gsap.to(frontWheelsGroup.rotation, {
                y: 0,
                duration: 0.15,
                ease: "power2.out"
            });
        }
    }
    
    // Apply counter-torque for stability
    const counterTorque = -carBody.angularVelocity.y * 8;
    carBody.torque.y += counterTorque;
    
    // Cap angular velocity
    const maxAngularSpeed = 2.5;
    if (Math.abs(carBody.angularVelocity.y) > maxAngularSpeed) {
        carBody.angularVelocity.y = Math.sign(carBody.angularVelocity.y) * maxAngularSpeed;
    }
    
    // Dampen small vertical movements
    if (Math.abs(carBody.velocity.y) < 0.5) {
        carBody.velocity.y *= 0.8;
    }
}

