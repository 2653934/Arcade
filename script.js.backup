let scene, camera, renderer, controls;
let carModel = null;
let carWrapper = null;
let carChild = null;
let carBodyGroup = null;
let frontWheelsGroup = null;
let backWheelsGroup = null;

let carSpeed = 0;
let carDirection = 0;
let currentAcceleration = 0; // For smooth acceleration buildup
let isBoosting = false; // Speed boost activated
let boostAmount = 4.0; // Current boost available (seconds)
let maxBoost = 4.0; // Maximum boost (4 seconds)
let boostDrainRate = 1.0; // Boost drains at 1 second per second
let boostRefillRate = 0.5; // Boost refills at 0.5 seconds per second (slower refill)
let keys = {};
let initialCameraOffset = new THREE.Vector3(3, 2, 5);
let cameraFollowMode = true;
let cameraAngle = 0;
let lastCameraAngle = -1; // Track previous camera angle

// Physics variables
let world;
let carBody;
let groundBody;
let timeStep = 1 / 60;
let carPhysicsOffset = new THREE.Vector3(); // Offset between wrapper position and physics center

// Debug helpers
let carHelper;
let groundHelper;
let collidersVisible = true;

// Lighting references
let mainDirectionalLight;
let ambientLight;
let isNightMode = false; // Start in day mode
let skyDome;

// Car headlights
let leftHeadlight = null;
let rightHeadlight = null;
let leftBacklight = null;
let rightBacklight = null;
let headlightsOn = false; // Start with headlights off in day mode
let headlightMesh = null;
let backlightMesh = null;

// Delivery system
let deliveryState = 'idle'; // idle, picking_up, has_package, delivered
let pickupLocation = { x: 30, z: 30 };
let deliveryLocation = { x: -40, z: -40 };
let pickupZone = null;
let deliveryZone = null;
let pickupTimer = 0;
let pickupRequired = 5; // seconds
let deliveryRadius = 8;

// Minimap
let minimapCanvas = null;
let minimapOverlayCanvas = null;
let minimapOverlayCtx = null;
let minimapRenderer = null;
let minimapCamera = null;
let mapScale = 100; // World units to show on map
let mapSize = 200; // Canvas size

// FPS counter
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 60;
let fpsUpdateInterval = 0.5; // Update FPS display every 0.5 seconds
let fpsTimer = 0;

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
    groundBody.position.set(0, -0.5, 0);
    world.addBody(groundBody);
    
    // Create visual helper for ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    groundHelper = new THREE.Mesh(groundGeometry, groundMaterial);
    groundHelper.rotation.x = -Math.PI / 2;
    groundHelper.position.set(0, -0.5, 0);
    scene.add(groundHelper);
}

function setupCamera() {
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Start with behind-car view
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, 5);
    
    initialCameraOffset = new THREE.Vector3(0, 4, 8);
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Improve shadow quality and reduce artifacts
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('container').appendChild(renderer.domElement);
}

function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enabled = false;
    
    controls.keys = {
        LEFT: null,
        UP: null,
        RIGHT: null,
        BOTTOM: null
    };
}

function setupLighting() {
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainDirectionalLight.position.set(20, 30, 20);
    mainDirectionalLight.castShadow = true;
    // Shadow camera bounds - balance between range and quality
    mainDirectionalLight.shadow.camera.left = -70;
    mainDirectionalLight.shadow.camera.right = 70;
    mainDirectionalLight.shadow.camera.top = 70;
    mainDirectionalLight.shadow.camera.bottom = -70;
    mainDirectionalLight.shadow.camera.near = 0.5;
    mainDirectionalLight.shadow.camera.far = 80; // Limit shadow distance
    mainDirectionalLight.shadow.mapSize.width = 4096; // Higher resolution for smoother shadows
    mainDirectionalLight.shadow.mapSize.height = 4096;
    mainDirectionalLight.shadow.radius = 1; // More softening for antialiasing
    // Increased bias to prevent shadow acne
    mainDirectionalLight.shadow.bias = -0.001;
    mainDirectionalLight.shadow.normalBias = 0.05;
    scene.add(mainDirectionalLight);
    scene.add(mainDirectionalLight.target); // Add target to scene so it can be updated
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-20, 20, -20);
    scene.add(directionalLight2);
    
    const pointLight = new THREE.PointLight(0x64b5f6, 1.5, 100);
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);
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
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
}

function setupGrid() {
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x333333);
    gridHelper.position.y = -0.49;
    scene.add(gridHelper);
}

function setupSky() {
    // Create a large sky dome
    const skyGeometry = new THREE.SphereGeometry(500, 32, 15);
    
    // Create gradient material for sky
    const skyMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vWorldPosition;
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
        uniforms: {
            topColor: { value: new THREE.Color(0x0077ff) }, // Sky blue
            bottomColor: { value: new THREE.Color(0xffffff) }, // White horizon
            offset: { value: 33 },
            exponent: { value: 0.6 }
        },
        side: THREE.BackSide
    });
    
    skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyDome);
}

function setupShadowGround() {
    // Create a large ground plane specifically for receiving shadows
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.ShadowMaterial({
        opacity: 0.5 // Darker shadow for visibility
    });
    
    const shadowGround = new THREE.Mesh(groundGeometry, groundMaterial);
    shadowGround.rotation.x = -Math.PI / 2;
    shadowGround.position.y = -0.48; // Slightly higher to ensure it's visible
    shadowGround.receiveShadow = true;
    scene.add(shadowGround);
    
    console.log('Shadow ground created at Y:', shadowGround.position.y);
}

function createDeliveryZones() {
    // Create pickup zone (green circle)
    const pickupGeometry = new THREE.CylinderGeometry(deliveryRadius, deliveryRadius, 0.2, 32);
    const pickupMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        emissive: 0x00ff00,
        emissiveIntensity: 0.3
    });
    pickupZone = new THREE.Mesh(pickupGeometry, pickupMaterial);
    pickupZone.position.set(pickupLocation.x, -0.4, pickupLocation.z);
    scene.add(pickupZone);
    
    // Create delivery zone (blue circle) - hidden initially
    const deliveryGeometry = new THREE.CylinderGeometry(deliveryRadius, deliveryRadius, 0.2, 32);
    const deliveryMaterial = new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.5,
        emissive: 0x0088ff,
        emissiveIntensity: 0.3
    });
    deliveryZone = new THREE.Mesh(deliveryGeometry, deliveryMaterial);
    deliveryZone.position.set(deliveryLocation.x, -0.4, deliveryLocation.z);
    deliveryZone.visible = false; // Hidden until package picked up
    scene.add(deliveryZone);
}

function logModelHierarchy(object, indent = '') {
    console.log(`${indent}${object.name || '(unnamed)'} [${object.type}]`);
    object.children.forEach(child => logModelHierarchy(child, indent + '  '));
}

function findObjectInHierarchy(root, name) {
    // Check if this object matches
    if (root.name === name) {
        return root;
    }
    
    // Search in children
    for (let child of root.children) {
        const found = findObjectInHierarchy(child, name);
        if (found) return found;
    }
    
    return null;
}

function onModelLoaded(gltf) {
    carModel = gltf.scene;
    
    // logModelHierarchy(carModel);
    
    carWrapper = new THREE.Group();
    
    // Find Ground object anywhere in the hierarchy
    let groundObject = findObjectInHierarchy(carModel, "Ground");
    
    if (!groundObject) {
        console.warn('Ground object not found in model hierarchy!');
    }
    
    const childrenToMove = [];
    carModel.children.forEach(child => {
        if (child.name !== "Ground") {
            childrenToMove.push(child);
        }
    });
    
    childrenToMove.forEach(child => {
        carWrapper.add(child);
    });
    
    scene.add(carWrapper);
    
    // Reset Ground transformation BEFORE adding to scene
    if (groundObject) {
        // Reset Ground position only (keep original scale from Blender)
        // Position it lower to sit below the car
        groundObject.position.set(0, -0.5, 0);
        // Don't reset scale or rotation - keep original Blender values
        
        // Update the matrix to apply transformations
        groundObject.updateMatrixWorld(true);
        
        // Ensure Ground is properly set up
        groundObject.visible = true;
        groundObject.receiveShadow = true;
        groundObject.traverse(function(node) {
            if (node.isMesh) {
                node.receiveShadow = true;
                node.visible = true;
                
                // Fix shadow acne on ground
                if (node.material) {
                    const materials = Array.isArray(node.material) ? node.material : [node.material];
                    materials.forEach(mat => {
                        if (mat && mat.type === 'MeshStandardMaterial') {
                            mat.side = THREE.DoubleSide;
                            mat.flatShading = false;
                        }
                    });
                }
                
                // Ground mesh found
            }
        });
        
    }
    
    // Add the car model to scene (which includes the properly positioned Ground)
    scene.add(carModel);
    
    // Center the car at origin without scaling
    const box = new THREE.Box3().setFromObject(carWrapper);
    const center = box.getCenter(new THREE.Vector3());
    
    // Move car to center, preserving original Blender scale
    carWrapper.position.x = -center.x;
    carWrapper.position.y = -center.y;
    carWrapper.position.z = -center.z;
    
    // Adjust car vertical position to sit on ground
    if (groundObject) {
        const carBox = new THREE.Box3().setFromObject(carWrapper);
        const carBottomY = carBox.min.y;
        const groundY = -0.5; // Ground position we set earlier
        
        // Calculate the offset needed to place the bottom of the car on the ground
        const yOffset = groundY - carBottomY;
        carWrapper.position.y += yOffset;
        
    }
    
    // Enable shadows on all car meshes
    carModel.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // Fix shadow acne and rendering artifacts
            if (node.material) {
                // Handle both single materials and arrays
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach(mat => {
                    if (mat && mat.type === 'MeshStandardMaterial') {
                        // Increase shadow bias to reduce artifacts
                        mat.side = THREE.DoubleSide;
                        mat.flatShading = false;
                    }
                });
            }
        }
    });
    
    // Also ensure carWrapper casts shadows
    carWrapper.castShadow = true;
    carWrapper.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    
    findCarComponents();
    createHeadlights();
    createCarPhysicsBody();
    
    console.log('Shadow setup complete - car should cast shadows');
    
    const loadingEl = document.getElementById('loading');
    loadingEl.classList.add('hidden');
}

function onLoadingProgress(xhr) {
    const loadingEl = document.getElementById('loading');
    const percentage = (xhr.loaded / xhr.total) * 100;
    loadingEl.textContent = `Loading car model... ${Math.round(percentage)}%`;
}

function onLoadingError(error) {
    console.error('Error loading model:', error);
    const loadingEl = document.getElementById('loading');
    loadingEl.textContent = 'Error loading model';
    loadingEl.style.color = 'red';
}

function loadCarModel() {
    const loader = new THREE.GLTFLoader();
    loader.load('./Car.glb', onModelLoaded, onLoadingProgress, onLoadingError);
}

function findCarComponents() {
    if (!carWrapper) {
        console.error('Car wrapper not loaded yet!');
        return;
    }
    
    const frontWheels = [];
    carWrapper.traverse(function (node) {
        if (node.name === "Car_Body") {
            carBodyGroup = node;
        }
        if (node.name === "Front_Wheels") {
            frontWheelsGroup = node;
        }
        if (node.name === "Back_Wheels") {
            backWheelsGroup = node;
        }
        if (node.name === "FrontRightWheel" || node.name === "FrontLeftWheel") {
            frontWheels.push(node);
        }
    });
    
    if (!frontWheelsGroup && frontWheels.length > 0) {
        frontWheelsGroup = { wheels: frontWheels };
    }
}

function createHeadlights() {
    if (!carWrapper) {
        console.error('Car wrapper not loaded yet!');
        return;
    }
    
    console.log('=== SEARCHING FOR HEADLIGHTS IN MODEL ===');
    
    // Search for headlight and backlight objects in the model
    carWrapper.traverse(function (node) {
        if (node.name === 'Headlight') {
            headlightMesh = node;
            console.log('✓ Found Headlight mesh at position:', node.position);
        }
        if (node.name === 'Backlight') {
            backlightMesh = node;
            console.log('✓ Found Backlight mesh at position:', node.position);
        }
    });
    
    if (!headlightMesh) {
        console.warn('Headlight mesh not found in model!');
    }
    if (!backlightMesh) {
        console.warn('Backlight mesh not found in model!');
    }
    
    // Get headlight world position from mesh
    let headlightPos = new THREE.Vector3();
    let backlightPos = new THREE.Vector3();
    
    if (headlightMesh) {
        headlightMesh.getWorldPosition(headlightPos);
        // Convert to local car coordinates
        carWrapper.worldToLocal(headlightPos);
        console.log('Headlight world position converted to car local:', headlightPos);
    } else {
        headlightPos.set(0, 0.5, -2);
    }
    
    if (backlightMesh) {
        backlightMesh.getWorldPosition(backlightPos);
        // Convert to local car coordinates
        carWrapper.worldToLocal(backlightPos);
        console.log('Backlight world position converted to car local:', backlightPos);
    } else {
        backlightPos.set(0, 0.5, 2);
    }
    
    console.log('Using headlight position:', headlightPos);
    console.log('Using backlight position:', backlightPos);
    
    // Create left headlight (white/warm)
    leftHeadlight = new THREE.SpotLight(0xffffee, 5, 100, Math.PI / 6, 0.5, 1.5);
    leftHeadlight.castShadow = true;
    leftHeadlight.shadow.mapSize.width = 1024;
    leftHeadlight.shadow.mapSize.height = 1024;
    leftHeadlight.shadow.camera.near = 1;
    leftHeadlight.shadow.camera.far = 20; // Shorter shadow range for realistic fade
    leftHeadlight.shadow.bias = -0.001; // Reduce shadow acne
    leftHeadlight.shadow.normalBias = 0.2; // Further reduce acne on curved surfaces
    leftHeadlight.shadow.radius = 3; // Softer shadows with more blur
    // Add visible sphere for left headlight
    const leftHeadSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffee })
    );
    leftHeadlight.add(leftHeadSphere);
    
    // Create right headlight (white/warm)
    rightHeadlight = new THREE.SpotLight(0xffffee, 5, 100, Math.PI / 6, 0.5, 1.5);
    rightHeadlight.castShadow = true;
    rightHeadlight.shadow.mapSize.width = 1024;
    rightHeadlight.shadow.mapSize.height = 1024;
    rightHeadlight.shadow.camera.near = 1;
    rightHeadlight.shadow.camera.far = 20; // Shorter shadow range for realistic fade
    rightHeadlight.shadow.bias = -0.001; // Reduce shadow acne
    rightHeadlight.shadow.normalBias = 0.2; // Further reduce acne on curved surfaces
    rightHeadlight.shadow.radius = 3; // Softer shadows with more blur
    // Add visible sphere for right headlight
    const rightHeadSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffee })
    );
    rightHeadlight.add(rightHeadSphere);
    
    // Create left backlight (red, dim)
    leftBacklight = new THREE.SpotLight(0xff0000, 0.5, 15, Math.PI / 4, 0.8, 2);
    // Add visible sphere for left backlight
    const leftBackSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    leftBacklight.add(leftBackSphere);
    
    // Create right backlight (red, dim)
    rightBacklight = new THREE.SpotLight(0xff0000, 0.5, 15, Math.PI / 4, 0.8, 2);
    // Add visible sphere for right backlight
    const rightBackSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    rightBacklight.add(rightBackSphere);
    
    // Add lights to the car wrapper so they move with the car
    carWrapper.add(leftHeadlight);
    carWrapper.add(rightHeadlight);
    carWrapper.add(leftBacklight);
    carWrapper.add(rightBacklight);
    
    // Start with lights off (day mode)
    leftHeadlight.visible = false;
    rightHeadlight.visible = false;
    leftBacklight.visible = false;
    rightBacklight.visible = false;
    
    // Add targets for the spotlights
    leftHeadlight.target = new THREE.Object3D();
    rightHeadlight.target = new THREE.Object3D();
    leftBacklight.target = new THREE.Object3D();
    rightBacklight.target = new THREE.Object3D();
    carWrapper.add(leftHeadlight.target);
    carWrapper.add(rightHeadlight.target);
    carWrapper.add(leftBacklight.target);
    carWrapper.add(rightBacklight.target);
    
    // Position lights based on mesh positions
    const sideOffset = 0.8; // How far apart left/right lights are
    
    // Place lights at the exact mesh positions
    // Front headlights - point forward, parallel beams
    leftHeadlight.position.set(headlightPos.x, headlightPos.y, headlightPos.z - sideOffset);
    rightHeadlight.position.set(headlightPos.x, headlightPos.y, headlightPos.z + sideOffset);
    // Keep same Z offset in target for parallel beams (not converging)
    leftHeadlight.target.position.set(headlightPos.x + 10, headlightPos.y - 0.3, headlightPos.z - sideOffset);
    rightHeadlight.target.position.set(headlightPos.x + 10, headlightPos.y - 0.3, headlightPos.z + sideOffset);
    
    // Back lights - point backward, parallel beams
    leftBacklight.position.set(backlightPos.x, backlightPos.y, backlightPos.z - sideOffset);
    rightBacklight.position.set(backlightPos.x, backlightPos.y, backlightPos.z + sideOffset);
    leftBacklight.target.position.set(backlightPos.x - 5, backlightPos.y - 0.2, backlightPos.z - sideOffset);
    rightBacklight.target.position.set(backlightPos.x - 5, backlightPos.y - 0.2, backlightPos.z + sideOffset);
    
    console.log('✓ Headlights created at:', leftHeadlight.position, rightHeadlight.position);
    console.log('✓ Backlights created at:', leftBacklight.position, rightBacklight.position);
}

function toggleHeadlights() {
    headlightsOn = !headlightsOn;
    
    // Toggle headlights
    if (leftHeadlight) {
        leftHeadlight.visible = headlightsOn;
        leftHeadlight.castShadow = headlightsOn;
        // Adjust shadow intensity based on time of day
        if (headlightsOn) {
            leftHeadlight.intensity = isNightMode ? 5 : 3; // Dimmer in day
        }
    }
    if (rightHeadlight) {
        rightHeadlight.visible = headlightsOn;
        rightHeadlight.castShadow = headlightsOn;
        // Adjust shadow intensity based on time of day
        if (headlightsOn) {
            rightHeadlight.intensity = isNightMode ? 5 : 3; // Dimmer in day
        }
    }
    
    // Toggle backlights
    if (leftBacklight) {
        leftBacklight.visible = headlightsOn;
    }
    if (rightBacklight) {
        rightBacklight.visible = headlightsOn;
    }
    
    // Update UI
    const statusEl = document.getElementById('headlights-status');
    if (statusEl) {
        statusEl.textContent = headlightsOn ? 'ON' : 'OFF';
        statusEl.style.color = headlightsOn ? '#00ff00' : '#ff4444';
    }
    
    console.log('Headlights:', headlightsOn ? 'ON' : 'OFF');
    console.log('Backlights:', headlightsOn ? 'ON' : 'OFF');
}

function createCarPhysicsBody() {
    // Create a box shape for the car based on its bounding box
    const box = new THREE.Box3().setFromObject(carWrapper);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Calculate the offset between wrapper position and bounding box center
    // This is crucial because the car mesh might be offset from the wrapper's origin
    carPhysicsOffset.copy(center).sub(carWrapper.position);
    
    // Create physics body with box shape
    const carShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    carBody = new CANNON.Body({
        mass: 5,
        shape: carShape,
        material: new CANNON.Material({ friction: 0.05, restitution: 0 }),
        linearDamping: 0.01, // Trackmania: Very low damping for momentum
        angularDamping: 0.05 // Low rotational resistance for quick turns
    });
    
    // Position the physics body at the CENTER of the bounding box (matching the visual model)
    const groundY = -0.5;
    
    // Position physics body well above ground to ensure clean landing without clipping
    // Calculate proper Y position so bottom of box is above ground
    const clearance = 0.2; // Extra clearance to prevent ground clipping
    carBody.position.set(
        center.x,
        groundY + (size.y / 2) + clearance, // Bottom of box at ground level + clearance
        center.z
    );
    
    // Set initial rotation
    carBody.quaternion.set(
        carWrapper.quaternion.x,
        carWrapper.quaternion.y,
        carWrapper.quaternion.z,
        carWrapper.quaternion.w
    );
    
    // Lock rotation on X and Z axes to prevent flipping/tipping
    // Only allow rotation around Y-axis (turning)
    carBody.angularFactor = new CANNON.Vec3(0, 1, 0);
    carBody.updateMassProperties();
    
    world.addBody(carBody);
    
    // Create visual helper for car collision box
    const helperGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const helperMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });
    carHelper = new THREE.Mesh(helperGeometry, helperMaterial);
    scene.add(carHelper);
    
    console.log('=== INITIAL POSITIONS ===');
    console.log('Car wrapper position:', carWrapper.position);
    console.log('Car bounding box center:', center);
    console.log('Offset (center - wrapper):', carPhysicsOffset);
    console.log('Car physics body position:', carBody.position);
    console.log('Car size:', size);
    console.log('Ground at Y:', groundY);
    console.log('Bounding box min:', box.min);
    console.log('Bounding box max:', box.max);
    console.log('========================');
    
    // Debug: check position after a few frames
    setTimeout(() => {
        console.log('=== AFTER 1 SECOND ===');
        console.log('Car wrapper position:', carWrapper.position);
        console.log('Car physics body position:', carBody.position);
        console.log('Car velocity:', carBody.velocity);
        console.log('=====================');
    }, 1000);
}

function getCarDirection() {
    return carDirection;
}

function setCarSpeed(speed) {
    carSpeed = speed;
}

function setCarDirection(dir) {
    carDirection = Math.max(-1, Math.min(1, dir));
}

function updateDirectionDisplay() {
    // Update wheel direction
    const wheelDirEl = document.getElementById('wheel-direction');
    if (carDirection < -0.1) {
        wheelDirEl.textContent = 'Left';
        wheelDirEl.style.color = '#ff6b6b';
    } else if (carDirection > 0.1) {
        wheelDirEl.textContent = 'Right';
        wheelDirEl.style.color = '#4ecdc4';
    } else {
        wheelDirEl.textContent = 'Straight';
        wheelDirEl.style.color = '#64b5f6';
    }
    
    // Update car heading (convert from radians to degrees, normalize to 0-360)
    if (carWrapper) {
        let heading = (carWrapper.rotation.y * (180 / Math.PI)) % 360;
        if (heading < 0) heading += 360;
        document.getElementById('car-heading').textContent = Math.round(heading) + '°';
    }
    
    // Update speed - show actual velocity magnitude
    if (carBody) {
        const actualSpeed = Math.sqrt(
            carBody.velocity.x ** 2 + carBody.velocity.z ** 2
        );
        document.getElementById('car-speed').textContent = actualSpeed.toFixed(1);
    } else {
        document.getElementById('car-speed').textContent = '0.0';
    }
}

function updateBoost(deltaTime) {
    // Drain boost when boosting
    if (isBoosting && boostAmount > 0) {
        boostAmount -= boostDrainRate * deltaTime;
        if (boostAmount <= 0) {
            boostAmount = 0;
            isBoosting = false; // Stop boosting when depleted
            // Update UI
            const boostStatus = document.getElementById('boost-status');
            if (boostStatus) {
                boostStatus.textContent = 'EMPTY';
                boostStatus.style.color = '#ff4444';
            }
        }
    }
    
    // Refill boost when not boosting
    if (!isBoosting && boostAmount < maxBoost) {
        boostAmount += boostRefillRate * deltaTime;
        if (boostAmount > maxBoost) {
            boostAmount = maxBoost;
        }
    }
    
    // Update boost bar UI
    const boostPercentage = (boostAmount / maxBoost) * 100;
    const boostBarFill = document.getElementById('boost-bar-fill');
    const boostPercentageEl = document.getElementById('boost-percentage');
    
    if (boostBarFill) {
        boostBarFill.style.width = boostPercentage + '%';
        // Add low class when below 25%
        if (boostPercentage < 25) {
            boostBarFill.classList.add('low');
        } else {
            boostBarFill.classList.remove('low');
        }
    }
    
    if (boostPercentageEl) {
        boostPercentageEl.textContent = Math.round(boostPercentage) + '%';
    }
}

function updateDeliverySystem(deltaTime) {
    if (!carWrapper) return;
    
    const carPos = carWrapper.position;
    const statusEl = document.getElementById('delivery-status');
    
    // Check distance to pickup zone
    const distToPickup = Math.sqrt(
        (carPos.x - pickupLocation.x) ** 2 + 
        (carPos.z - pickupLocation.z) ** 2
    );
    
    // Check distance to delivery zone
    const distToDelivery = Math.sqrt(
        (carPos.x - deliveryLocation.x) ** 2 + 
        (carPos.z - deliveryLocation.z) ** 2
    );
    
    // State machine
    if (deliveryState === 'idle' || deliveryState === 'picking_up') {
        if (distToPickup < deliveryRadius) {
            deliveryState = 'picking_up';
            pickupTimer += deltaTime;
            
            // Pulsing effect on zone
            pickupZone.material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
            
            const remaining = Math.max(0, pickupRequired - pickupTimer);
            statusEl.textContent = `Picking up... ${remaining.toFixed(1)}s`;
            statusEl.style.color = '#ffff00';
            
            if (pickupTimer >= pickupRequired) {
                deliveryState = 'has_package';
                pickupZone.visible = false;
                deliveryZone.visible = true;
                pickupTimer = 0;
                statusEl.textContent = 'Go to blue zone!';
                statusEl.style.color = '#00ff00';
            }
        } else if (deliveryState === 'picking_up') {
            // Left the zone
            deliveryState = 'idle';
            pickupTimer = 0;
            pickupZone.material.opacity = 0.5;
            statusEl.textContent = 'Go to green zone';
            statusEl.style.color = '#64b5f6';
        }
    } else if (deliveryState === 'has_package') {
        if (distToDelivery < deliveryRadius) {
            deliveryState = 'delivered';
            deliveryZone.material.color.setHex(0xffff00);
            statusEl.textContent = 'Delivered! 🎉';
            statusEl.style.color = '#00ff00';
            
            // Reset after 3 seconds
            setTimeout(() => {
                deliveryState = 'idle';
                pickupTimer = 0;
                pickupZone.visible = true;
                deliveryZone.visible = false;
                deliveryZone.material.color.setHex(0x0088ff);
                statusEl.textContent = 'Go to green zone';
                statusEl.style.color = '#64b5f6';
            }, 3000);
        }
    }
}

function drawMinimap() {
    if (!minimapRenderer || !minimapCamera || !carWrapper || !minimapOverlayCtx) return;
    
    // Position camera directly above the car
    const height = 80; // Height above the car
    minimapCamera.position.set(
        carWrapper.position.x,
        carWrapper.position.y + height,
        carWrapper.position.z
    );
    
    // Look straight down at the car
    minimapCamera.lookAt(carWrapper.position);
    
    // Render the scene from the top-down camera
    minimapRenderer.render(scene, minimapCamera);
    
    // Draw 2D overlay for off-screen indicators on the separate overlay canvas
    const ctx = minimapOverlayCtx;
    ctx.clearRect(0, 0, mapSize, mapSize); // Clear the overlay
    const center = mapSize / 2;
    const viewSize = 50; // Match the camera's view size
    const edgeMargin = 15; // Distance from edge to draw indicators
    
    // Helper function to draw edge indicator
    function drawEdgeIndicator(worldX, worldZ, color, label) {
        // Calculate relative position to car
        const relX = worldX - carWrapper.position.x;
        const relZ = worldZ - carWrapper.position.z;
        const distance = Math.sqrt(relX * relX + relZ * relZ);
        
        // Check if outside view
        if (Math.abs(relX) < viewSize * 0.8 && Math.abs(relZ) < viewSize * 0.8) {
            return; // It's visible, don't draw indicator
        }
        
        // Calculate angle to objective
        const angle = Math.atan2(relZ, relX);
        
        // Calculate where the indicator should be on the edge
        const maxDist = Math.max(Math.abs(relX), Math.abs(relZ));
        const scale = (center - edgeMargin) / (viewSize * 0.6);
        
        // Clamp to edge
        const clampFactor = Math.min(1, (viewSize * 0.8) / maxDist);
        const edgeX = center + relX * scale;
        const edgeY = center + relZ * scale;
        
        // Clamp to square bounds
        const clampedX = Math.max(edgeMargin, Math.min(mapSize - edgeMargin, edgeX));
        const clampedY = Math.max(edgeMargin, Math.min(mapSize - edgeMargin, edgeY));
        
        // Draw arrow pointing to objective
        ctx.save();
        ctx.translate(clampedX, clampedY);
        ctx.rotate(angle);
        
        // Draw arrow
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -6);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        // Draw distance text
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        const distText = Math.floor(distance) + 'm';
        ctx.strokeText(distText, clampedX, clampedY - 12);
        ctx.fillText(distText, clampedX, clampedY - 12);
    }
    
    // Draw indicator for pickup zone (if not picked up yet)
    if (deliveryState === 'idle' || deliveryState === 'picking_up') {
        drawEdgeIndicator(pickupLocation.x, pickupLocation.z, '#00ff00', 'Pickup');
    }
    
    // Draw indicator for delivery zone (if has package)
    if (deliveryState === 'has_package') {
        drawEdgeIndicator(deliveryLocation.x, deliveryLocation.z, '#0088ff', 'Delivery');
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate FPS
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;
    
    frameCount++;
    fpsTimer += deltaTime;
    
    if (fpsTimer >= fpsUpdateInterval) {
        fps = Math.round(frameCount / fpsTimer);
        document.getElementById('fps').textContent = fps;
        frameCount = 0;
        fpsTimer = 0;
    }
    
    controls.enabled = !cameraFollowMode;
    
    controls.update();
    
    // Step physics simulation
    if (world) {
        world.step(timeStep);
    }
    
    if (carWrapper && carBody) {
        // Update shadow camera to follow the car
        if (mainDirectionalLight) {
            // Keep light offset relative to car
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
        // Apply rotation first, then adjust position with rotated offset
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
        
        if (cameraFollowMode) {
            // Track camera angle changes for potential future use
            lastCameraAngle = cameraAngle;
            
            if (cameraAngle === 0) {      
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

                camera.position.set(
                    carWrapper.position.x,
                    carWrapper.position.y + 50,  // Above the car
                    carWrapper.position.z
                );
                camera.lookAt(carWrapper.position);
            }
        }
    }
    
    updateDirectionDisplay();
    updateBoost(timeStep);
    updateDeliverySystem(timeStep);
    drawMinimap();
    renderer.render(scene, camera);
}

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeyDown(event) {
    keys[event.code] = true;
    
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
    setCarSpeed(0);
    setCarDirection(0);
    
    if (keys['KeyW'] || keys['ArrowUp']) {
        setCarSpeed(10);
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        setCarSpeed(-10);
    }
    
    if (keys['KeyA'] || keys['ArrowLeft']) {
        setCarDirection(-1);
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        setCarDirection(1);
    }
}

function toggleColliders() {
    collidersVisible = !collidersVisible;
    
    if (carHelper) {
        carHelper.visible = collidersVisible;
    }
    if (groundHelper) {
        groundHelper.visible = collidersVisible;
    }
    
    const btn = document.getElementById('toggle-colliders');
    btn.textContent = collidersVisible ? 'Hide Colliders' : 'Show Colliders';
}

function toggleDayNight() {
    isNightMode = !isNightMode;
    
    if (isNightMode) {
        // Night mode: PITCH BLACK - only car lights illuminate
        mainDirectionalLight.intensity = 0; // No moonlight
        mainDirectionalLight.castShadow = false; // Sun doesn't cast shadows at night
        ambientLight.intensity = 0.15; // Small ambient light for minimap visibility
        
        // Show headlights UI in night mode
        const headlightsUI = document.getElementById('headlights-ui');
        if (headlightsUI) {
            headlightsUI.style.display = 'block';
        }
        
        // Adjust headlight intensity for night
        if (headlightsOn && leftHeadlight && rightHeadlight) {
            leftHeadlight.intensity = 5; // Bright at night
            rightHeadlight.intensity = 5;
        }
        
        // Turn on headlights in night mode
        if (!headlightsOn) {
            toggleHeadlights();
        }
        
        // Update sky colors - very dark
        if (skyDome && skyDome.material.uniforms) {
            skyDome.material.uniforms.topColor.value.setHex(0x000000); // Pure black
            skyDome.material.uniforms.bottomColor.value.setHex(0x000005); // Almost black
        }
        
        // Update scene background and fog - very dark
        scene.background.setHex(0x000000);
        scene.fog.color.setHex(0x000000);
        scene.fog.near = 10; // Fog closer
        scene.fog.far = 50; // Fog density increased for darkness
        
    } else {
        // Day mode: bright, warm colors
        mainDirectionalLight.color.setHex(0xffffff); // White sunlight
        mainDirectionalLight.intensity = 0.8;
        mainDirectionalLight.castShadow = true; // Sun casts shadows during day
        ambientLight.intensity = 0.5;
        
        // Hide headlights UI in day mode
        const headlightsUI = document.getElementById('headlights-ui');
        if (headlightsUI) {
            headlightsUI.style.display = 'none';
        }
        
        // Turn off headlights in day mode
        if (headlightsOn) {
            toggleHeadlights();
        }
        
        // Update sky colors
        if (skyDome && skyDome.material.uniforms) {
            skyDome.material.uniforms.topColor.value.setHex(0x0077ff); // Sky blue
            skyDome.material.uniforms.bottomColor.value.setHex(0xffffff); // White horizon
        }
        
        // Update scene background and fog
        scene.background.setHex(0x87CEEB);
        scene.fog.color.setHex(0x87CEEB);
        scene.fog.near = 50;
        scene.fog.far = 300;
    }
    
    const btn = document.getElementById('toggle-daynight');
    btn.textContent = isNightMode ? 'Day Mode' : 'Night Mode';
}

function init() {
    initScene();
    initPhysics();
    setupCamera();
    setupRenderer();
    setupControls();
    setupLighting();
    setupSky(); // Add sky
    setupShadowGround(); // Add shadow-receiving ground
    createDeliveryZones(); // Add delivery system
    
    // Initialize minimap
    minimapCanvas = document.getElementById('minimap');
    minimapOverlayCanvas = document.getElementById('minimap-overlay');
    if (minimapCanvas && minimapOverlayCanvas) {
        // Create a separate renderer for the minimap
        minimapRenderer = new THREE.WebGLRenderer({ 
            canvas: minimapCanvas, 
            antialias: true,
            alpha: false
        });
        minimapRenderer.setSize(mapSize, mapSize);
        minimapRenderer.shadowMap.enabled = true;
        
        // Get 2D context for the overlay canvas
        minimapOverlayCtx = minimapOverlayCanvas.getContext('2d');
        
        // Create orthographic camera for top-down view
        const aspect = 1; // Square minimap
        const viewSize = 50; // How much of the world to show
        minimapCamera = new THREE.OrthographicCamera(
            -viewSize * aspect, // left
            viewSize * aspect,  // right
            viewSize,           // top
            -viewSize,          // bottom
            1,                  // near
            200                 // far
        );
        minimapCamera.up.set(0, 0, -1); // Set "up" direction for proper orientation
    }
    
    // setupFloor();
    // setupGrid();
    loadCarModel();
    animate();
    
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
        // Set button text for day mode
        dayNightBtn.textContent = 'Night Mode';
    }
    
    // Set initial headlight status (off in day mode) and hide UI
    const headlightStatusEl = document.getElementById('headlights-status');
    if (headlightStatusEl) {
        headlightStatusEl.textContent = 'OFF';
        headlightStatusEl.style.color = '#ff4444';
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
        boostStatusEl.style.color = '#64b5f6';
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
    
    window.getCarDirection = getCarDirection;
    window.setCarSpeed = setCarSpeed;
    window.setCarDirection = setCarDirection;
}

init();
