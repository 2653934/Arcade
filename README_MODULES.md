# Modular Code Structure

The original 1503-line `script.js` has been split into organized modules for better maintainability.

## File Structure

```
Arcade/
├── index.html          # Main HTML file (updated to load all modules)
├── style.css          # Styles
├── Car.glb            # Car 3D model
└── js/                # JavaScript modules
    ├── config.js      # Global variables and constants
    ├── scene.js       # Three.js scene, camera, renderer setup
    ├── physics.js     # Cannon.js physics engine setup
    ├── lighting.js    # Lighting and day/night cycle
    ├── car.js         # Car model loading and components
    ├── controls.js    # Keyboard input and car movement
    ├── ui.js          # UI updates (speed, direction, FPS, boost)
    ├── delivery.js    # Delivery system logic
    ├── minimap.js     # Minimap rendering
    └── main.js        # Animation loop and initialization
```

## Module Responsibilities

### 1. **config.js** (Must load first)
- Defines all global variables
- Scene objects, camera, renderer
- Car components and physics references
- UI state (night mode, headlights, boost)
- Delivery system state

### 2. **scene.js**
- `initScene()` - Create Three.js scene
- `setupCamera()` - Configure perspective camera
- `setupRenderer()` - Setup WebGL renderer
- `setupControls()` - Setup OrbitControls
- `handleResize()` - Window resize handler

### 3. **physics.js**
- `initPhysics()` - Create Cannon.js physics world
- `createCarPhysicsBody()` - Create car collision box
- Physics helpers and debug visualization

### 4. **lighting.js**
- `setupLighting()` - Create all lights (ambient, directional, point)
- `setupSky()` - Create gradient sky dome
- `setupShadowGround()` - Create shadow-receiving plane
- `toggleDayNight()` - Switch between day/night modes
- `toggleColliders()` - Show/hide physics debug helpers

### 5. **car.js**
- `loadCarModel()` - Load GLTF car model
- `onModelLoaded()` - Handle model loaded event
- `findCarComponents()` - Find wheels and body parts
- `createHeadlights()` - Create SpotLights for headlights/backlights
- `toggleHeadlights()` - Turn lights on/off

### 6. **controls.js**
- `handleKeyDown()` - Keyboard input handler
- `handleKeyUp()` - Key release handler
- `updateCameraPosition()` - Update camera based on mode
- `updateCarMovement()` - Apply physics forces for car movement

### 7. **ui.js**
- `updateSpeedDisplay()` - Update speed indicator
- `updateDirectionDisplay()` - Update direction text
- `updateFPS()` - Calculate and display FPS
- `updateBoost()` - Manage boost bar and depletion

### 8. **delivery.js**
- `createDeliveryZones()` - Create pickup/delivery zones
- `updateDelivery()` - Handle delivery state machine

### 9. **minimap.js**
- `setupMinimap()` - Initialize minimap canvases and camera
- `drawMinimap()` - Render top-down view and indicators

### 10. **main.js** (Must load last)
- `animate()` - Main animation loop
- `init()` - Initialize entire application
- Event listener setup

## Load Order

The modules **must** be loaded in this specific order (already configured in `index.html`):

1. **config.js** - Variables must exist before other modules reference them
2. **scene.js** - Scene setup
3. **physics.js** - Physics setup
4. **lighting.js** - Lighting functions
5. **car.js** - Car loading
6. **controls.js** - Input handling
7. **ui.js** - UI updates
8. **delivery.js** - Game logic
9. **minimap.js** - Minimap rendering
10. **main.js** - Must be last (calls init() which depends on all other modules)

## Benefits

✅ **Easier to navigate** - Find code by feature/responsibility
✅ **Better maintainability** - Edit one module without affecting others
✅ **Clearer dependencies** - See what code depends on what
✅ **Reusability** - Modules can be reused in other projects
✅ **Team collaboration** - Multiple developers can work on different modules
✅ **Debugging** - Easier to isolate issues

## Future Improvements

Consider migrating to:
- ES6 modules (`import`/`export`)
- TypeScript for type safety
- Build tools like Webpack or Vite
- Module bundling for production

