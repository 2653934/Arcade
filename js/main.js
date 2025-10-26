// Main animation loop and initialization

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    // Update FPS counter
    updateFPS(deltaTime);
    
    // Toggle orbit controls based on camera mode
    controls.enabled = !cameraFollowMode;
    controls.update();
    
    // Step physics simulation
    if (world) {
        world.step(timeStep);
    }
    
    if (carWrapper && carBody) {
        // Update shadow camera to follow the car
        if (mainDirectionalLight) {
            mainDirectionalLight.position.set(
                carWrapper.position.x + 20,
                30,
                carWrapper.position.z + 20
            );
            mainDirectionalLight.target.position.copy(carWrapper.position);
            mainDirectionalLight.target.updateMatrixWorld();
        }
        
        // Calculate turn angle based on steering
        const maxSteerAngle = Math.PI / 4; // 45 degrees max steering for sharper turns
        const steerAngle = carDirection * maxSteerAngle;
        
        // Update front wheel rotation for visual steering with smooth animation
        if (frontWheelsGroup) {
            const targetRotation = -1 * steerAngle;
            if (frontWheelsGroup.wheels) {
                frontWheelsGroup.wheels.forEach(function (wheel) {
                    gsap.to(wheel.rotation, {
                        y: targetRotation,
                        duration: 0.25, // Faster response for snappier feel
                        ease: "power2.out"
                    });
                });
            } else {
                frontWheelsGroup.traverse(function (node) {
                    if (node.name === "FrontRightWheel" || node.name === "FrontLeftWheel") {
                        gsap.to(node.rotation, {
                            y: targetRotation,
                            duration: 0.25, // Faster response for snappier feel
                            ease: "power2.out"
                        });
                    }
                });
            }
        }
        
        // Wake up the physics body to ensure it responds
        carBody.wakeUp();
        
        // Force the car to stay perfectly level (no pitch or roll)
        const euler = new CANNON.Vec3();
        carBody.quaternion.toEuler(euler);
        carBody.quaternion.setFromEuler(0, euler.y, 0); // Keep only Y rotation
        
        // Zero out any X or Z angular velocity to prevent tipping
        carBody.angularVelocity.x = 0;
        carBody.angularVelocity.z = 0;
        
        // Update car movement
        updateCarMovement();
        
        // Dampen Y velocity to prevent bouncing/jittering
        if (Math.abs(carBody.velocity.y) < 0.5) {
            carBody.velocity.y *= 0.8;
        }
        
        // More controlled turning
        if (Math.abs(carDirection) > 0.01 && Math.abs(carSpeed) > 0.1) {
            // Use carSpeed directly (not abs) so steering inverts naturally when reversing
            const turnTorque = -carDirection * carSpeed * 15;
            carBody.torque.set(0, turnTorque, 0);
            
            // Lower max turning speed
            const maxAngularSpeed = 2.5; // Reduced from 4.0
            if (Math.abs(carBody.angularVelocity.y) > maxAngularSpeed) {
                carBody.angularVelocity.y = Math.sign(carBody.angularVelocity.y) * maxAngularSpeed;
            }
        } else {
            // Gentler snap back to center
            const counterTorque = -carBody.angularVelocity.y * 70; // Reduced from 100
            carBody.torque.set(0, counterTorque, 0);
        }
        
        // Sync Three.js visual model with physics body
        carWrapper.quaternion.copy(carBody.quaternion);
        
        // Rotate the offset based on current rotation, then subtract from physics position
        const rotatedOffset = carPhysicsOffset.clone();
        rotatedOffset.applyQuaternion(carWrapper.quaternion);
        carWrapper.position.copy(carBody.position).sub(rotatedOffset);
        
        // Update collision helper to match physics body (no offset needed)
        if (carHelper) {
            carHelper.position.copy(carBody.position);
            carHelper.quaternion.copy(carBody.quaternion);
        }
        
        // Update camera position
        updateCameraPosition();
    }
    
    // Update UI and systems
    updateDirectionDisplay();
    updateBoost(timeStep);
    updateDeliverySystem(timeStep);
    drawMinimap();
    
    // Render main scene
    renderer.render(scene, camera);
}

function init() {
    initScene();
    initPhysics();
    setupCamera();
    setupRenderer();
    setupControls();
    setupLighting();
    setupSky();
    setupShadowGround();
    createDeliveryZones();
    setupMinimap();
    
    // Load car model
    loadCarModel();
    
    // Start animation loop
    animate();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Add toggle colliders button event
    const toggleBtn = document.getElementById('toggle-colliders');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleColliders);
    }
    
    // Add toggle day/night button event
    const dayNightBtn = document.getElementById('toggle-daynight');
    if (dayNightBtn) {
        dayNightBtn.addEventListener('click', toggleDayNight);
        dayNightBtn.textContent = 'Night Mode'; // Default to day mode
    }
    
    // Set initial headlight status (off in day mode) and hide UI
    const headlightStatusEl = document.getElementById('headlights-status');
    if (headlightStatusEl) {
        headlightStatusEl.textContent = 'OFF';
        headlightStatusEl.style.color = '#888';
    }
    
    // Hide headlights UI in day mode (default)
    const headlightsUI = document.getElementById('headlights-ui');
    if (headlightsUI) {
        headlightsUI.style.display = 'none';
    }
    
    // Set initial boost status (off by default)
    const boostStatusEl = document.getElementById('boost-status');
    if (boostStatusEl) {
        boostStatusEl.textContent = 'OFF';
        boostStatusEl.style.color = '#888';
    }
    
    // Set initial boost bar to 100%
    const boostBarFill = document.getElementById('boost-bar-fill');
    const boostPercentageEl = document.getElementById('boost-percentage');
    if (boostBarFill) {
        boostBarFill.style.width = '100%';
    }
    if (boostPercentageEl) {
        boostPercentageEl.textContent = '100%';
    }
}

// Start the application when DOM is loaded
window.addEventListener('DOMContentLoaded', init);

