// Keyboard input and car controls

function handleKeyDown(event) {
    keys[event.code] = true;
    
    // Camera controls
    if (event.code === 'KeyF') {
        cameraFollowMode = !cameraFollowMode;
    }
    
    if (event.code === 'KeyQ') {
        cameraAngle = (cameraAngle + 1) % 2;
        cameraFollowMode = true;
    }
    
    if (event.code === 'KeyL') {
        // Only allow toggling headlights at night
        if (isNightMode) {
            toggleHeadlights();
        }
    }
    
    if (event.code === 'Space') {
        // Only allow boosting if we have boost available
        if (boostAmount > 0) {
            isBoosting = true;
            event.preventDefault(); // Prevent page scroll
            // Update UI
            const boostStatus = document.getElementById('boost-status');
            if (boostStatus) {
                boostStatus.textContent = 'ON';
                boostStatus.style.color = '#ffff00';
            }
        } else {
            event.preventDefault(); // Prevent page scroll even if no boost
        }
    }
    
    updateCarControls();
}

function handleKeyUp(event) {
    keys[event.code] = false;
    
    if (event.code === 'Space') {
        isBoosting = false;
        // Update UI
        const boostStatus = document.getElementById('boost-status');
        if (boostStatus) {
            if (boostAmount <= 0) {
                boostStatus.textContent = 'EMPTY';
                boostStatus.style.color = '#ff4444';
            } else {
                boostStatus.textContent = 'OFF';
                boostStatus.style.color = '#64b5f6';
            }
        }
    }
    
    updateCarControls();
}

function updateCarControls() {
    carSpeed = 0;
    carDirection = 0;
    
    if (keys['KeyW'] || keys['ArrowUp']) {
        carSpeed = 10;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        carSpeed = -10;
    }
    
    if (keys['KeyA'] || keys['ArrowLeft']) {
        carDirection = -1;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        carDirection = 1;
    }
}

function updateCameraPosition() {
    if (!carWrapper || !cameraFollowMode) return;
    
    // Track camera angle changes for potential future use
    lastCameraAngle = cameraAngle;
    
    if (cameraAngle === 0) {
        // Behind the car view
        const cameraDistance = 20;
        const cameraHeight = 10;
        
        // Get the car's backward direction
        const backwardDirection = new THREE.Vector3(-1, 0, 0);
        backwardDirection.applyQuaternion(carWrapper.quaternion);

        camera.position.set(
            carWrapper.position.x + backwardDirection.x * cameraDistance,
            carWrapper.position.y + cameraHeight,
            carWrapper.position.z + backwardDirection.z * cameraDistance
        );
        
        camera.lookAt(carWrapper.position);
    } else {
        // Top-down view
        camera.position.set(
            carWrapper.position.x,
            carWrapper.position.y + 50,  // Above the car
            carWrapper.position.z
        );
        camera.lookAt(carWrapper.position);
    }
}

function updateCarMovement() {
    if (!carBody || !carWrapper) return;
    
    // PHYSICS-BASED MOVEMENT with forces and momentum
    const forwardVector = new CANNON.Vec3(1, 0, 0);
    carBody.quaternion.vmult(forwardVector, forwardVector);
    
    if (Math.abs(carSpeed) > 0.1) {
        // Gradually interpolate acceleration toward target (smooth buildup)
        const targetAcceleration = carSpeed;
        const accelerationRate = 0.08; // How fast to reach max acceleration (0-1, lower = slower)
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
        
        // Calculate current speed
        const currentSpeed = Math.sqrt(
            carBody.velocity.x ** 2 + carBody.velocity.z ** 2
        );
        
        // Lower top speed
        const maxSpeed = Math.abs(carSpeed) * 1.0;
        if (currentSpeed > maxSpeed) {
            const dragForce = new CANNON.Vec3(
                -carBody.velocity.x * 150,
                0,
                -carBody.velocity.z * 150
            );
            carBody.applyForce(dragForce, carBody.position);
        }
        
        // Trackmania drift: Apply lateral friction to allow sliding
        // Get the right vector (perpendicular to forward)
        const rightVector = new CANNON.Vec3(0, 0, 1);
        carBody.quaternion.vmult(rightVector, rightVector);
        
        // Calculate lateral (sideways) velocity
        const lateralVel = carBody.velocity.x * rightVector.x + 
                          carBody.velocity.z * rightVector.z;
        
        // Apply grip force (less = more drift)
        const gripForce = -lateralVel * 150; // Lower = more sliding
        const lateralForce = new CANNON.Vec3(
            rightVector.x * gripForce,
            0,
            rightVector.z * gripForce
        );
        carBody.applyForce(lateralForce, carBody.position);
        
    } else {
        // Gradually reduce acceleration when not pressing keys
        currentAcceleration *= 0.9;
        
        // Very gentle slowdown when not accelerating (Trackmania keeps momentum)
        const frictionForce = new CANNON.Vec3(
            -carBody.velocity.x * 50,
            0,
            -carBody.velocity.z * 50
        );
        carBody.applyForce(frictionForce, carBody.position);
    }
    
}