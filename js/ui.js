// UI updates and display

function updateDirectionDisplay() {
    // Update wheel direction
    const wheelDirEl = document.getElementById('wheel-direction');
    if (wheelDirEl) {
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
    }
    
    // Update car heading (convert from radians to degrees, normalize to 0-360)
    if (carWrapper) {
        let heading = (carWrapper.rotation.y * (180 / Math.PI)) % 360;
        if (heading < 0) heading += 360;
        const headingEl = document.getElementById('car-heading');
        if (headingEl) {
            headingEl.textContent = Math.round(heading) + '°';
        }
    }
    
    // Update speed - show actual velocity magnitude
    if (carBody) {
        const actualSpeed = Math.sqrt(
            carBody.velocity.x ** 2 + carBody.velocity.z ** 2
        );
        const speedEl = document.getElementById('car-speed');
        if (speedEl) {
            speedEl.textContent = actualSpeed.toFixed(1);
        }
    } else {
        const speedEl = document.getElementById('car-speed');
        if (speedEl) {
            speedEl.textContent = '0.0';
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

