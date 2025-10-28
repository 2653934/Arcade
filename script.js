import { EffectsSystem } from './src/effects/EffectsSystem.js';
import { UISystem } from './src/ui/UISystem.js';
import { InputSystem } from './src/input/InputSystem.js';
import { DeliverySystem } from './src/delivery/DeliverySystem.js';
import { LightingSystem } from './src/lighting/LightingSystem.js';
import { CameraSystem } from './src/camera/CameraSystem.js';
import { CarPhysicsSystem } from './src/physics/CarPhysicsSystem.js';
import { EnvironmentSystem } from './src/environment/EnvironmentSystem.js';

let scene, renderer;
let carWrapper = null; // Managed by EnvironmentSystem, but referenced in main
let frontWheelsGroup = null; // Managed by EnvironmentSystem, but referenced in main

// Environment objects (managed by EnvironmentSystem, but referenced in main)
let groundObject = null;
let environmentObjects = [];

// Modular Systems
let effectsSystem = null;
let uiSystem = null;
let inputSystem = null;
let deliverySystem = null;
let lightingSystem = null;
let cameraSystem = null;
let carPhysicsSystem = null;
let environmentSystem = null;

// Physics variables
let world;
let groundBody;
let timeStep = 1 / 60;

// Local references (managed by CarPhysicsSystem)
let carBody = null;
let carHelper = null;
let carPhysicsOffset = null;

// Debug helpers
let groundHelper;
let collidersVisible = true;

// Local references to camera and controls (managed by CameraSystem)
let camera = null;
let controls = null;

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    // Increased fog distance for larger scene - match sky color
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
}

function initPhysics() {
    // Create physics world
    world = new CANNON.World();
    world.gravity.set(0, -9.8, 0); // Increased gravity to keep car grounded
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    
    // Trackmania-style: Low friction for sliding
    world.defaultContactMaterial.friction = 0.05;
    world.defaultContactMaterial.restitution = 0;
    
    // Create ground plane with low friction
    const groundShape = new CANNON.Plane();
    groundBody = new CANNON.Body({
        mass: 0,
        shape: groundShape,
        material: new CANNON.Material({ friction: 0.05, restitution: 0 })
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    // Ground physics position will be updated after model loads
    // For now, use a higher default position
    groundBody.position.set(0, 0, 0);
    world.addBody(groundBody);
    
    // Create visual helper for ground (will be updated after model loads)
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    groundHelper = new THREE.Mesh(groundGeometry, groundMaterial);
    groundHelper.rotation.x = -Math.PI / 2;
    groundHelper.position.set(0, 0, 0);
    scene.add(groundHelper);
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance', // Request GPU acceleration
        stencil: false, // Disable stencil buffer if not needed
        logarithmicDepthBuffer: true // CRITICAL: Dramatically improves depth precision and reduces shadow flickering
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Good balance of quality/performance
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    // Performance optimizations
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    document.getElementById('container').appendChild(renderer.domElement);
}

function setupFloor() {
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3e,
        roughness: 0.8,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0; // Use Y=0 as ground level
    floor.receiveShadow = true;
    scene.add(floor);
}

function setupGrid() {
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x333333);
    gridHelper.position.y = 0; // Use Y=0 as ground level
    scene.add(gridHelper);
}

function setupShadowGround() {
    // Create a large ground plane specifically for receiving shadows
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.ShadowMaterial({
        opacity: 0.5, // Darker shadow for visibility
        depthWrite: false // Prevent z-fighting with ground
    });
    
    const shadowGround = new THREE.Mesh(groundGeometry, groundMaterial);
    shadowGround.rotation.x = -Math.PI / 2;
    shadowGround.position.y = 0.01; // Will be updated after model loads
    shadowGround.receiveShadow = true;
    shadowGround.renderOrder = 1; // Render after ground to prevent z-fighting
    
    // Use polygon offset to prevent z-fighting at close range
    shadowGround.material.polygonOffset = true;
    shadowGround.material.polygonOffsetFactor = -1; // Negative to push shadows slightly away
    shadowGround.material.polygonOffsetUnits = -1;
    
    scene.add(shadowGround);
    
    // Store reference for later update
    window.shadowGroundPlane = shadowGround;
}

/**
 * Called when environment system finishes loading the model
 */
function onEnvironmentModelLoaded(data) {
    // Get references from environment system
    carWrapper = data.carWrapper;
    groundObject = data.groundObject;
    environmentObjects = data.environmentObjects;
    frontWheelsGroup = data.frontWheelsGroup;
    
    // Setup ground physics
    const groundBBox = environmentSystem.setupGround();
        if (groundBBox) {
            const groundTopY = groundBBox.max.y;
            
            // Store ground level for camera collision detection
        const groundLevel = groundTopY + 1.5;
        if (cameraSystem) {
            cameraSystem.setGroundLevel(groundLevel);
        }
            
            // Update physics ground body position
            groundBody.position.y = groundTopY;
            
            // Update visual helper position
            if (groundHelper) {
                groundHelper.position.y = groundTopY;
            }
            
        // Update shadow ground position
            if (window.shadowGroundPlane) {
                window.shadowGroundPlane.position.y = groundTopY + 0.02;
            }
            
            // Update delivery zones to be on the ground
        if (deliverySystem) {
            deliverySystem.updateZonePositions(groundTopY);
        }
        } else {
            console.warn('⚠ Could not calculate ground bounding box - using default Y=0');
        const groundLevel = 1.5;
        if (cameraSystem) {
            cameraSystem.setGroundLevel(groundLevel);
        }
    }
    
    // Create headlights
    if (lightingSystem) {
        lightingSystem.createHeadlights(carWrapper);
    }
    
    // Create car physics body
    if (carPhysicsSystem) {
        carPhysicsSystem.createPhysicsBody(carWrapper);
        // Get references
        carBody = carPhysicsSystem.getPhysicsBody();
        carHelper = carPhysicsSystem.getCollisionHelper();
        carPhysicsOffset = carPhysicsSystem.getPhysicsOffset();
    }
    
    // Create environment physics
    environmentSystem.createEnvironmentPhysics(collidersVisible);
    
    // Setup collision listeners
    setupCollisionListeners();
    
    // Update camera system with environment objects
    if (cameraSystem) {
        cameraSystem.setEnvironmentObjects(environmentObjects);
    }
}

// Environment model loading and setup is now handled by EnvironmentSystem
// See onEnvironmentModelLoaded() callback above

function setupCollisionListeners() {
    if (!carBody) {
        console.warn('Car body not ready for collision listeners');
        return;
    }
    
    // Add collision event listener to car body
    carBody.addEventListener('collide', function(event) {
        const otherBody = event.body;
        
        // Don't create particles for ground collisions
        if (otherBody === groundBody) {
            return;
        }
        
        // Calculate collision point
        const contact = event.contact;
        const collisionPoint = new THREE.Vector3(
            contact.bi.position.x,
            contact.bi.position.y,
            contact.bi.position.z
        );
        
        // Calculate velocity at collision
        const velocity = new THREE.Vector3(
            carBody.velocity.x,
            carBody.velocity.y,
            carBody.velocity.z
        );
        
        const speed = velocity.length();
        
        // Only create effects for significant impacts
        if (speed > 3) {
            // Determine particle color based on speed
            let color = 0xffaa00; // Orange for light impacts
            if (speed > 8) {
                color = 0xff0000; // Red for hard impacts
            } else if (speed > 5) {
                color = 0xff6600; // Orange-red for medium impacts
            }
            
            // Create particle effects using effects system
            if (effectsSystem) {
                effectsSystem.createCollisionParticles(collisionPoint, velocity, color);
            
            // Screen shake based on impact speed
            const shakeIntensity = Math.min(speed / 10, 1.5);
                effectsSystem.triggerScreenShake(shakeIntensity);
            
            // Impact flash based on speed
                effectsSystem.triggerImpactFlash(speed);
            }
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = (currentTime - (uiSystem ? uiSystem.lastFrameTime : performance.now())) / 1000; // Convert to seconds
    if (uiSystem) {
        uiSystem.lastFrameTime = currentTime;
    }
    
    // Update camera system
    if (cameraSystem && carWrapper) {
        cameraSystem.update(deltaTime, carWrapper, carPhysicsOffset);
    }
    
    // Step physics simulation
    if (world) {
        world.step(timeStep);
    }
    
    // Update car physics and movement
    if (carPhysicsSystem && carWrapper) {
        carPhysicsSystem.update(carWrapper, frontWheelsGroup);
        
        // Update shadow camera to follow the car
        if (lightingSystem) {
            lightingSystem.updateShadowCamera(carWrapper);
        }
    }
    
    // Update input system (mobile joystick/keyboard controls)
    if (inputSystem) {
        inputSystem.update();
    }
    
    // Update boost system
    if (carPhysicsSystem) {
        carPhysicsSystem.updateBoost(deltaTime);
    }
    
    // Update delivery system (game logic + UI)
    if (deliverySystem) {
        deliverySystem.update(deltaTime, carWrapper);
    }
    
    // Update effects system (particles and screen shake)
    if (effectsSystem) {
        effectsSystem.update(deltaTime);
    }
    
    // Update UI System (FPS, HUD, minimap, etc.)
    if (uiSystem && deliverySystem && cameraSystem && carPhysicsSystem) {
        const gameState = {
            carDirection: carPhysicsSystem.getDirection(),
            carWrapper: carWrapper,
            carBody: carPhysicsSystem.getPhysicsBody(),
            boostAmount: carPhysicsSystem.getBoostAmount(),
            maxBoost: carPhysicsSystem.getMaxBoost(),
            isBoosting: carPhysicsSystem.getIsBoosting(),
            cameraAngle: cameraSystem.getCameraMode(),
            isUserControllingCamera: cameraSystem.isUserControlling(),
            cameraResetInProgress: cameraSystem.isResettingCamera(),
            deliveryState: deliverySystem.getState(),
            pickupLocation: deliverySystem.getPickupLocation(),
            deliveryLocation: deliverySystem.getDeliveryLocation()
        };
        uiSystem.update(deltaTime, gameState);
    }
    
    renderer.render(scene, camera);
}

function handleResize() {
    if (cameraSystem) {
        cameraSystem.handleResize();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function toggleColliders() {
    collidersVisible = !collidersVisible;
    
    if (carHelper) {
        carHelper.visible = collidersVisible;
    }
    
    if (groundHelper) {
        groundHelper.visible = collidersVisible;
    }
    
    environmentObjects.forEach(envObj => {
        if (envObj.object.userData.physicsHelper) {
            envObj.object.userData.physicsHelper.visible = collidersVisible;
        }
    });
    
    const btn = document.getElementById('toggle-colliders');
    btn.textContent = collidersVisible ? 'Hide Colliders' : 'Show Colliders';
}

function setupInputCallbacks() {
    // Set up callbacks for input system
    inputSystem.setCallbacks({
        onSpeedChange: (speed) => {
            if (carPhysicsSystem) {
                carPhysicsSystem.setSpeed(speed);
            }
        },
        onDirectionChange: (direction) => {
            if (carPhysicsSystem) {
                carPhysicsSystem.setDirection(direction);
            }
        },
        onBoostStart: () => {
            if (carPhysicsSystem) {
                carPhysicsSystem.startBoost();
            }
        },
        onBoostEnd: () => {
            if (carPhysicsSystem) {
                carPhysicsSystem.stopBoost();
            }
        },
        onCameraToggle: () => {
            if (cameraSystem) {
                const newMode = cameraSystem.toggleCameraMode();
                
                // Update UI
                if (uiSystem) {
                    uiSystem.updateCameraModeDisplay(newMode);
                }
            }
        },
        onHeadlightsToggle: () => {
            // Only allow toggling headlights at night
            if (lightingSystem && lightingSystem.isNight()) {
                lightingSystem.toggleHeadlights();
            }
        }
    });
}

// Debug function to force mobile mode (for desktop testing)
window.forceMobileMode = function() {
    if (inputSystem) {
        inputSystem.forceMobileMode();
    }
};

function init() {
    initScene();
    initPhysics();
    setupRenderer();
    setupShadowGround(); // Add shadow-receiving ground
    
    // Initialize Camera System
    cameraSystem = new CameraSystem(scene, renderer);
    cameraSystem.init();
    
    // Get camera and controls references
    camera = cameraSystem.getCamera();
    controls = cameraSystem.getControls();
    
    // Initialize Effects System
    effectsSystem = new EffectsSystem(scene, camera);
    effectsSystem.init();
    
    // Initialize UI System
    uiSystem = new UISystem(scene);
    uiSystem.init();
    
    // Initialize Input System
    inputSystem = new InputSystem();
    setupInputCallbacks();
    inputSystem.init();
    
    // Initialize Delivery System
    deliverySystem = new DeliverySystem(scene, uiSystem);
    deliverySystem.init();
    
    // Initialize Lighting System
    lightingSystem = new LightingSystem(scene, uiSystem);
    lightingSystem.init();
    
    // Initialize Car Physics System
    carPhysicsSystem = new CarPhysicsSystem(scene, world);
    
    // Initialize Environment System
    environmentSystem = new EnvironmentSystem(scene, world);
    environmentSystem.setOnModelLoadedCallback(onEnvironmentModelLoaded);
    
    // Load the car model
    environmentSystem.loadModel('./Car.glb');
    
    animate();
    
    window.addEventListener('resize', handleResize);
    
    // Add toggle colliders button event
    const toggleBtn = document.getElementById('toggle-colliders');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleColliders);
    }
    
    // Add toggle day/night button event
    const dayNightBtn = document.getElementById('toggle-daynight');
    if (dayNightBtn) {
        dayNightBtn.addEventListener('click', () => {
            if (lightingSystem) {
                lightingSystem.toggleDayNight();
            }
        });
        // Set button text for day mode
        dayNightBtn.textContent = 'Night Mode';
    }
    
    // Initial UI values are now set by UISystem
}

init();

