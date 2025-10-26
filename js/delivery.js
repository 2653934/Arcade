// Delivery system

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

function updateDelivery(deltaTime) {
    if (!carWrapper) return;
    
    const carPos = carWrapper.position;
    
    switch (deliveryState) {
        case 'idle':
            // Check if near pickup zone
            const distToPickup = Math.sqrt(
                Math.pow(carPos.x - pickupLocation.x, 2) +
                Math.pow(carPos.z - pickupLocation.z, 2)
            );
            
            if (distToPickup < deliveryRadius) {
                deliveryState = 'picking_up';
                pickupTimer = 0;
            }
            break;
            
        case 'picking_up':
            // Check if still in pickup zone
            const distToPickup2 = Math.sqrt(
                Math.pow(carPos.x - pickupLocation.x, 2) +
                Math.pow(carPos.z - pickupLocation.z, 2)
            );
            
            if (distToPickup2 < deliveryRadius) {
                pickupTimer += deltaTime;
                
                // Animate pickup zone
                const scale = 1 + Math.sin(pickupTimer * 5) * 0.1;
                pickupZone.scale.set(scale, 1, scale);
                
                if (pickupTimer >= pickupRequired) {
                    // Package picked up!
                    deliveryState = 'has_package';
                    pickupZone.visible = false;
                    deliveryZone.visible = true;
                    pickupTimer = 0;
                }
            } else {
                // Left zone before pickup complete
                deliveryState = 'idle';
                pickupTimer = 0;
                pickupZone.scale.set(1, 1, 1);
            }
            break;
            
        case 'has_package':
            // Check if near delivery zone
            const distToDelivery = Math.sqrt(
                Math.pow(carPos.x - deliveryLocation.x, 2) +
                Math.pow(carPos.z - deliveryLocation.z, 2)
            );
            
            if (distToDelivery < deliveryRadius) {
                // Package delivered!
                deliveryState = 'delivered';
                deliveryZone.material.color.setHex(0x00ff00);
                deliveryZone.material.emissive.setHex(0x00ff00);
                
                // Reset after 3 seconds
                setTimeout(() => {
                    deliveryState = 'idle';
                    pickupZone.visible = true;
                    deliveryZone.visible = false;
                    deliveryZone.material.color.setHex(0x0088ff);
                    deliveryZone.material.emissive.setHex(0x0088ff);
                }, 3000);
            }
            
            // Animate delivery zone
            const scale2 = 1 + Math.sin(performance.now() * 0.003) * 0.1;
            deliveryZone.scale.set(scale2, 1, scale2);
            break;
            
        case 'delivered':
            // Waiting for reset
            break;
    }
    
    // Update UI
    const statusElement = document.getElementById('delivery-status');
    if (statusElement) {
        switch (deliveryState) {
            case 'idle':
                statusElement.textContent = 'Find Pickup (Green Zone)';
                break;
            case 'picking_up':
                statusElement.textContent = `Picking up... ${Math.round(pickupTimer)}/${pickupRequired}s`;
                break;
            case 'has_package':
                statusElement.textContent = 'Deliver Package (Blue Zone)';
                break;
            case 'delivered':
                statusElement.textContent = 'Delivered!';
                break;
        }
    }
}

