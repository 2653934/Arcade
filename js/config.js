// Global variables and configuration
let scene, camera, renderer, controls;
let carModel = null;
let carWrapper = null;
let carChild = null;
let carBodyGroup = null;
let frontWheelsGroup = null;
let backWheelsGroup = null;

// Car movement
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
let carPhysicsOffset = new THREE.Vector3();

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

