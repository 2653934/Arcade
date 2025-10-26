// Lighting setup and day/night cycle

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

