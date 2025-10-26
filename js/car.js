// Car model loading and components

function loadCarModel() {
    const loader = new THREE.GLTFLoader();
    loader.load('./Car.glb', onModelLoaded, onLoadingProgress, onLoadingError);
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

function logModelHierarchy(object, indent = '') {
    console.log(`${indent}${object.name || '(unnamed)'} [${object.type}]`);
    object.children.forEach(child => logModelHierarchy(child, indent + '  '));
}

function findObjectInHierarchy(root, name) {
    if (root.name === name) {
        return root;
    }
    
    for (let child of root.children) {
        const found = findObjectInHierarchy(child, name);
        if (found) return found;
    }
    
    return null;
}

function onModelLoaded(gltf) {
    carModel = gltf.scene;
    
    carWrapper = new THREE.Group();
    
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
    
    if (groundObject) {
        groundObject.position.set(0, -0.5, 0);
        groundObject.updateMatrixWorld(true);
        groundObject.visible = true;
        groundObject.receiveShadow = true;
        groundObject.traverse(function(node) {
            if (node.isMesh) {
                node.receiveShadow = true;
                node.visible = true;
                
                if (node.material) {
                    const materials = Array.isArray(node.material) ? node.material : [node.material];
                    materials.forEach(mat => {
                        if (mat && mat.type === 'MeshStandardMaterial') {
                            mat.side = THREE.DoubleSide;
                            mat.flatShading = false;
                        }
                    });
                }
            }
        });
    }
    
    scene.add(carModel);
    
    const box = new THREE.Box3().setFromObject(carWrapper);
    const center = box.getCenter(new THREE.Vector3());
    
    carWrapper.position.x = -center.x;
    carWrapper.position.y = -center.y;
    carWrapper.position.z = -center.z;
    
    if (groundObject) {
        const carBox = new THREE.Box3().setFromObject(carWrapper);
        const carBottomY = carBox.min.y;
        const groundY = -0.5;
        const yOffset = groundY - carBottomY;
        carWrapper.position.y += yOffset;
    }
    
    carModel.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            if (node.material) {
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach(mat => {
                    if (mat && mat.type === 'MeshStandardMaterial') {
                        mat.side = THREE.DoubleSide;
                        mat.flatShading = false;
                    }
                });
            }
        }
    });
    
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
    
    const loadingEl = document.getElementById('loading');
    loadingEl.classList.add('hidden');
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
    
    // Search for headlight and backlight objects in the model
    carWrapper.traverse(function (node) {
        if (node.name === 'Headlight') {
            headlightMesh = node;
        }
        if (node.name === 'Backlight') {
            backlightMesh = node;
        }
    });
    
    let headlightPos = new THREE.Vector3();
    let backlightPos = new THREE.Vector3();
    
    if (headlightMesh) {
        headlightMesh.getWorldPosition(headlightPos);
        carWrapper.worldToLocal(headlightPos);
    } else {
        headlightPos.set(0, 0.5, -2);
    }
    
    if (backlightMesh) {
        backlightMesh.getWorldPosition(backlightPos);
        carWrapper.worldToLocal(backlightPos);
    } else {
        backlightPos.set(0, 0.5, 2);
    }
    
    const sideOffset = 0.85;
    const forwardOffset = 0.2;
    const backwardOffset = -0.2;
    
    // Create left headlight (warm white, bright)
    leftHeadlight = new THREE.SpotLight(0xfff8e1, 5, 50, Math.PI / 6, 0.5, 1.5);
    leftHeadlight.position.set(headlightPos.x - sideOffset, headlightPos.y, headlightPos.z + forwardOffset);
    leftHeadlight.castShadow = false; // Off in day mode
    leftHeadlight.shadow.mapSize.width = 1024;
    leftHeadlight.shadow.mapSize.height = 1024;
    leftHeadlight.shadow.camera.near = 0.1;
    leftHeadlight.shadow.camera.far = 20;
    leftHeadlight.shadow.bias = -0.002;
    leftHeadlight.shadow.normalBias = 0.05;
    leftHeadlight.shadow.radius = 3;
    leftHeadlight.visible = false; // Off by default in day mode
    
    // Point forward (positive X in car's local space)
    leftHeadlight.target = new THREE.Object3D();
    leftHeadlight.target.position.set(headlightPos.x - sideOffset + 10, headlightPos.y, headlightPos.z + forwardOffset);
    carWrapper.add(leftHeadlight.target);
    carWrapper.add(leftHeadlight);
    
    // Create right headlight (warm white, bright)
    rightHeadlight = new THREE.SpotLight(0xfff8e1, 5, 50, Math.PI / 6, 0.5, 1.5);
    rightHeadlight.position.set(headlightPos.x + sideOffset, headlightPos.y, headlightPos.z + forwardOffset);
    rightHeadlight.castShadow = false; // Off in day mode
    rightHeadlight.shadow.mapSize.width = 1024;
    rightHeadlight.shadow.mapSize.height = 1024;
    rightHeadlight.shadow.camera.near = 0.1;
    rightHeadlight.shadow.camera.far = 20;
    rightHeadlight.shadow.bias = -0.002;
    rightHeadlight.shadow.normalBias = 0.05;
    rightHeadlight.shadow.radius = 3;
    rightHeadlight.visible = false; // Off by default in day mode
    
    rightHeadlight.target = new THREE.Object3D();
    rightHeadlight.target.position.set(headlightPos.x + sideOffset + 10, headlightPos.y, headlightPos.z + forwardOffset);
    carWrapper.add(rightHeadlight.target);
    carWrapper.add(rightHeadlight);
    
    // Create left backlight (red, dim)
    leftBacklight = new THREE.SpotLight(0xff0000, 0.5, 15, Math.PI / 4, 0.5, 2);
    leftBacklight.position.set(backlightPos.x - sideOffset, backlightPos.y, backlightPos.z + backwardOffset);
    leftBacklight.castShadow = false;
    leftBacklight.visible = false;
    
    leftBacklight.target = new THREE.Object3D();
    leftBacklight.target.position.set(backlightPos.x - sideOffset - 5, backlightPos.y, backlightPos.z + backwardOffset);
    carWrapper.add(leftBacklight.target);
    carWrapper.add(leftBacklight);
    
    // Create right backlight (red, dim)
    rightBacklight = new THREE.SpotLight(0xff0000, 0.5, 15, Math.PI / 4, 0.5, 2);
    rightBacklight.position.set(backlightPos.x + sideOffset, backlightPos.y, backlightPos.z + backwardOffset);
    rightBacklight.castShadow = false;
    rightBacklight.visible = false;
    
    rightBacklight.target = new THREE.Object3D();
    rightBacklight.target.position.set(backlightPos.x + sideOffset - 5, backlightPos.y, backlightPos.z + backwardOffset);
    carWrapper.add(rightBacklight.target);
    carWrapper.add(rightBacklight);
    
    // Create visible light source meshes
    const lightSphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const headlightSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const backlightSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
    
    const leftHeadlightSphere = new THREE.Mesh(lightSphereGeometry, headlightSphereMaterial);
    leftHeadlightSphere.position.copy(leftHeadlight.position);
    leftHeadlight.add(leftHeadlightSphere);
    
    const rightHeadlightSphere = new THREE.Mesh(lightSphereGeometry, headlightSphereMaterial);
    rightHeadlightSphere.position.set(0, 0, 0);
    rightHeadlight.add(rightHeadlightSphere);
    
    const leftBacklightSphere = new THREE.Mesh(lightSphereGeometry, backlightSphereMaterial);
    leftBacklightSphere.position.set(0, 0, 0);
    leftBacklight.add(leftBacklightSphere);
    
    const rightBacklightSphere = new THREE.Mesh(lightSphereGeometry, backlightSphereMaterial);
    rightBacklightSphere.position.set(0, 0, 0);
    rightBacklight.add(rightBacklightSphere);
}

function toggleHeadlights() {
    headlightsOn = !headlightsOn;
    
    if (leftHeadlight && rightHeadlight) {
        leftHeadlight.visible = headlightsOn;
        rightHeadlight.visible = headlightsOn;
        leftBacklight.visible = headlightsOn;
        rightBacklight.visible = headlightsOn;
        
        // Headlights cast shadows in night mode always, but in day mode too (less prominent)
        if (headlightsOn) {
            leftHeadlight.castShadow = true;
            rightHeadlight.castShadow = true;
            
            // Adjust intensity based on day/night
            if (isNightMode) {
                leftHeadlight.intensity = 5; // Bright at night
                rightHeadlight.intensity = 5;
            } else {
                leftHeadlight.intensity = 3; // Less bright during day
                rightHeadlight.intensity = 3;
            }
        } else {
            leftHeadlight.castShadow = false;
            rightHeadlight.castShadow = false;
        }
    }
    
    const status = document.getElementById('headlights-status');
    if (status) {
        status.textContent = headlightsOn ? 'ON' : 'OFF';
        status.style.color = headlightsOn ? '#ffff00' : '#888';
    }
}

