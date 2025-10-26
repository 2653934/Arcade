// UI updates and display

function updateSpeedDisplay() {
    const speedElement = document.getElementById('speed');
    if (speedElement && carBody) {
        // Calculate actual velocity magnitude
        const velocityVec = new THREE.Vector3(carBody.velocity.x, carBody.velocity.y, carBody.velocity.z);
        const actualSpeed = velocityVec.length();
        speedElement.textContent = Math.abs(Math.round(actualSpeed));
    }
}

function updateDirectionDisplay() {
    const directionElement = document.getElementById('direction');
    if (directionElement) {
        if (carDirection > 0) {
            directionElement.textContent = 'Forward';
        } else if (carDirection < 0) {
            directionElement.textContent = 'Reverse';
        } else {
            directionElement.textContent = 'Stopped';
        }
    }
}

function updateFPS(deltaTime) {
    frameCount++;
    fpsTimer += deltaTime;
    
    if (fpsTimer >= fpsUpdateInterval) {
        fps = Math.round(frameCount / fpsTimer);
        frameCount = 0;
        fpsTimer = 0;
        
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = fps;
        }
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

