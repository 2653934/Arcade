// Scene setup and initialization

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    // Increased fog distance for larger scene - match sky color
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
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

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

