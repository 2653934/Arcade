// Physics setup with Cannon.js

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

function createCarPhysicsBody() {
    // Create a box shape for the car based on its bounding box
    const box = new THREE.Box3().setFromObject(carWrapper);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Calculate offset between carWrapper position and actual center
    carPhysicsOffset.copy(center).sub(carWrapper.position);
    
    const carShape = new CANNON.Box(new CANNON.Vec3(
        size.x / 2,
        size.y / 2,
        size.z / 2
    ));
    
    carBody = new CANNON.Body({
        mass: 5,
        shape: carShape,
        material: new CANNON.Material({ friction: 0.05, restitution: 0 }), // Low friction, no bounce
        linearDamping: 0.01, // Minimal linear damping
        angularDamping: 0.05 // Minimal angular damping
    });
    
    // Position the physics body at the center of the mesh
    const groundY = -0.5;
    const clearance = 0.2; // Small clearance above ground
    
    carBody.position.set(
        center.x,
        groundY + (size.y / 2) + clearance,
        center.z
    );
    
    carBody.quaternion.set(
        carWrapper.quaternion.x,
        carWrapper.quaternion.y,
        carWrapper.quaternion.z,
        carWrapper.quaternion.w
    );
    
    // Lock X and Z rotation (only allow Y-axis rotation for turning)
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

