// Minimap rendering

function setupMinimap() {
    minimapCanvas = document.getElementById('minimap');
    minimapOverlayCanvas = document.getElementById('minimap-overlay');
    
    if (!minimapCanvas || !minimapOverlayCanvas) {
        console.error('Minimap canvases not found!');
        return;
    }
    
    // Setup 3D minimap renderer
    minimapRenderer = new THREE.WebGLRenderer({ 
        canvas: minimapCanvas,
        antialias: true,
        alpha: true
    });
    minimapRenderer.setSize(mapSize, mapSize);
    minimapRenderer.shadowMap.enabled = false; // Disable shadows on minimap for performance
    
    // Setup orthographic camera for top-down view
    const viewSize = 50; // How many world units to show
    minimapCamera = new THREE.OrthographicCamera(
        -viewSize, viewSize,  // left, right
        viewSize, -viewSize,  // top, bottom
        0.1, 200             // near, far
    );
    minimapCamera.position.set(0, 100, 0);
    minimapCamera.up.set(0, 0, -1); // Rotate camera so Z points up
    minimapCamera.lookAt(0, 0, 0);
    
    // Setup 2D overlay context for indicators
    minimapOverlayCtx = minimapOverlayCanvas.getContext('2d');
    
    console.log('Minimap setup complete');
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

