// Scene Setup Module

// Initialize a player's view (scene, camera, renderer)
function initPlayerView(player, index) {
    // Create scene
    player.scene = new THREE.Scene();
    player.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    player.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
    
    // Set up camera
    player.camera = new THREE.PerspectiveCamera(80, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    player.camera.position.set(0, 1.2, 3); // Position will be relative to player
    
    // Set up renderer
    const canvasId = index === 0 ? 'player1Canvas' : 'player2Canvas';
    player.renderer = new THREE.WebGLRenderer({ antialias: true });
    player.renderer.setSize(window.innerWidth / 2, window.innerHeight);
    player.renderer.shadowMap.enabled = true;
    player.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById(canvasId).appendChild(player.renderer.domElement);
    
    // Add lighting to the scene
    addLighting(player.scene);
}

// Add lighting to a scene
function addLighting(scene) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffcc, 0.5);
    fillLight.position.set(-50, 20, -50);
    scene.add(fillLight);
}

// Create the game environment
function createEnvironment() {
    // Create the sky/backdrop for each player's scene
    players.forEach(player => {
        createSkyDome(player.scene);
    });
    
    // Create the terrain/ground
    createTerrain();
    
    // Create the Connect 4 board (central feature)
    createConnectFourBoard();
    
    // Create Nuketown-inspired buildings and structures
    createNuketownStructures();
    
    // Create the tubes/slides that lead to each column (scattered around the map)
    createTubes();
    
    // Add decoration elements
    createDecorations();
    
    // Add all objects to both player scenes
    syncScenes();
}

// Create a sky dome
function createSkyDome(scene) {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    // Invert the geometry so we see the inside
    skyGeometry.scale(-1, 1, 1);
    
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x87CEEB),
        side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
}

// Create the main terrain
function createTerrain() {
    // Main ground
    const groundGeometry = new THREE.PlaneGeometry(150, 150);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x8BC34A,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    
    // Add to both player scenes
    players.forEach(player => player.scene.add(ground.clone()));
    
    // Add to collider list with explicit plane dimensions
    worldObjects.push({
        type: 'plane',
        width: 150,
        height: 150,
        position: new THREE.Vector3(0, 0, 0), // Explicit Vector3 to avoid reference issues
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0), // Store rotation for collision detection
        mesh: ground
    });
    
    // Add streets - main road
    const roadGeometry = new THREE.PlaneGeometry(10, 80);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const mainRoad = new THREE.Mesh(roadGeometry, roadMaterial);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.01, 0); // Slightly above ground to prevent z-fighting
    mainRoad.receiveShadow = true;
    
    // Add road markings - dashed line
    const lineGeometry = new THREE.PlaneGeometry(0.5, 40);
    const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF
    });
    
    const roadLine = new THREE.Mesh(lineGeometry, lineMaterial);
    roadLine.rotation.x = -Math.PI / 2;
    roadLine.position.set(0, 0.02, 0); // Slightly above road
    
    // Add to both player scenes
    players.forEach(player => {
        player.scene.add(mainRoad.clone());
        player.scene.add(roadLine.clone());
    });
    
    // Create a cross street
    const crossRoadGeometry = new THREE.PlaneGeometry(60, 10);
    const crossRoad = new THREE.Mesh(crossRoadGeometry, roadMaterial);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(0, 0.01, 15); // Positioned north of center
    crossRoad.receiveShadow = true;
    
    // Add to both player scenes
    players.forEach(player => player.scene.add(crossRoad.clone()));
    
    // Create sidewalks
    const sidewalkMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        roughness: 0.8
    });
    
    // Sidewalk next to main road - west side
    const sidewalk1 = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 80),
        sidewalkMaterial
    );
    sidewalk1.rotation.x = -Math.PI / 2;
    sidewalk1.position.set(-6, 0.02, 0);
    
    // Sidewalk next to main road - east side
    const sidewalk2 = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 80),
        sidewalkMaterial
    );
    sidewalk2.rotation.x = -Math.PI / 2;
    sidewalk2.position.set(6, 0.02, 0);
    
    // Add to both player scenes
    players.forEach(player => {
        player.scene.add(sidewalk1.clone());
        player.scene.add(sidewalk2.clone());
    });
}

// Create Connect Four board
function createConnectFourBoard() {
    boardGroup = new THREE.Group();
    
    // Board dimensions
    const boardWidth = 28;
    const boardHeight = 24;
    const boardDepth = 2;
    const cellSize = 4; // Size of each cell/hole
    
    // Create board frame
    const frameGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a56e8, // Blue
        roughness: 0.3,
        metalness: 0.7
    });
    
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, boardHeight/2, 0);
    frame.receiveShadow = true;
    frame.castShadow = true;
    boardGroup.add(frame);
    
    // Add to collider list
    worldObjects.push({
        type: 'box',
        width: boardWidth,
        height: boardHeight,
        depth: boardDepth,
        position: frame.position.clone(),
        mesh: frame
    });
    
    // Create grid of holes
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            // Calculate the position of each hole
            const x = (col - 3) * cellSize;
            const y = (2.5 - row) * cellSize;
            
            // Store column positions for the tubes
            if (row === 0) {
                columnPositions.push(x);
            }
            
            // Create hole cylinder
            const holeGeometry = new THREE.CylinderGeometry(cellSize/2 - 0.1, cellSize/2 - 0.1, boardDepth + 0.5, 32);
            const holeMaterial = new THREE.MeshStandardMaterial({
                color: 0x000814,
                roughness: 1.0,
                metalness: 0.0,
                side: THREE.BackSide
            });
            
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            hole.rotation.x = Math.PI / 2; // Rotate to face forward
            hole.position.set(x, y, boardDepth/2);
            boardGroup.add(hole);
            
            // Create rim around the hole
            const rimGeometry = new THREE.TorusGeometry(cellSize/2, 0.2, 16, 32);
            const rimMaterial = new THREE.MeshStandardMaterial({
                color: 0x1144aa,
                roughness: 0.4,
                metalness: 0.6
            });
            
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.x = Math.PI / 2; // Align with the hole
            rim.position.set(x, y, boardDepth/2);
            boardGroup.add(rim);
            
            // Add funnel/entrance at the top of each column
            if (row === 0) {
                const funnelMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1a56e8,
                    roughness: 0.5,
                    metalness: 0.5,
                    transparent: true,
                    opacity: 0.8
                });
                
                // Create a funnel using a truncated cone
                const funnelGeometry = new THREE.CylinderGeometry(cellSize/2 - 0.1, cellSize, 2, 32, 1, true);
                const funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
                funnel.rotation.x = Math.PI / 2; // Rotate to face forward
                funnel.position.set(x, y + 3, boardDepth/2);
                boardGroup.add(funnel);
            }
        }
    }
    
    // Position the board at the center of the map
    boardGroup.position.set(0, 12, -20); // Positioned towards the north side of the map
    
    // Add to both player scenes
    players.forEach(player => {
        const boardClone = boardGroup.clone();
        player.scene.add(boardClone);
    });
    
    // Add a platform under the board for players to stand on
    const platformGeometry = new THREE.BoxGeometry(30, 1, 10);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x4CAF50,
        roughness: 0.8
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 1, -15); // In front of the board
    platform.receiveShadow = true;
    
    // Add to both scenes
    players.forEach(player => player.scene.add(platform.clone()));
    
    // Add to collider list
    worldObjects.push({
        type: 'box',
        width: 30,
        height: 1,
        depth: 10,
        position: platform.position,
        mesh: platform
    });
}

// Create Nuketown-inspired buildings and structures
function createNuketownStructures() {
    // 1. Blue House (West Side)
    createHouse(-25, 0, -25, 0x4fc3f7, 'blue');
    
    // 2. Yellow House (East Side)
    createHouse(25, 0, -25, 0xFFD54F, 'yellow');
    
    // 3. Central Gazebo
    createGazebo(0, 0, 15);
    
    // 4. Bus (on the main road)
    createBus(-15, 0, 32);
    
    // 5. Truck (east side)
    createTruck(35, 0, 10);
    
    // 6. Crates and Barriers (scattered throughout)
    createCrates();
    
    // 7. Mannequins (Nuketown classic feature)
    createMannequins();
}

// Create a house building
function createHouse(x, y, z, color, name) {
    // House group
    const house = new THREE.Group();
    house.position.set(x, y, z);
    
    // Main structure
    const houseGeometry = new THREE.BoxGeometry(18, 10, 14);
    const houseMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.2
    });
    
    const houseBody = new THREE.Mesh(houseGeometry, houseMaterial);
    houseBody.position.y = 5; // Half height
    houseBody.castShadow = true;
    houseBody.receiveShadow = true;
    house.add(houseBody);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 18,
        height: 10,
        depth: 14,
        position: new THREE.Vector3(x, y + 5, z),
        mesh: houseBody
    });
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(15, 6, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Brown roof
        roughness: 0.8
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 13; // Top of the house
    roof.rotation.y = Math.PI / 4; // Rotate 45 degrees
    roof.castShadow = true;
    house.add(roof);
    
    // Door
    const doorGeometry = new THREE.PlaneGeometry(3, 6);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        side: THREE.DoubleSide
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 3, 7.01); // Front of house
    house.add(door);
    
    // Windows
    const windowGeometry = new THREE.PlaneGeometry(3, 2);
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xE3F2FD,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    // Front windows
    const frontWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
    frontWindow1.position.set(-4, 5, 7.01);
    house.add(frontWindow1);
    
    const frontWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
    frontWindow2.position.set(4, 5, 7.01);
    house.add(frontWindow2);
    
    // Side windows
    const sideWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
    sideWindow1.position.set(9.01, 5, 0);
    sideWindow1.rotation.y = Math.PI / 2;
    house.add(sideWindow1);
    
    const sideWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
    sideWindow2.position.set(-9.01, 5, 0);
    sideWindow2.rotation.y = Math.PI / 2;
    house.add(sideWindow2);
    
    // House sign (indicates tube entry point)
    const signGeometry = new THREE.BoxGeometry(5, 2, 0.5);
    const signMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.2
    });
    
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 12, 8);
    sign.castShadow = true;
    house.add(sign);
    
    // Steps to the door
    const stepsGeometry = new THREE.BoxGeometry(5, 1, 3);
    const stepsMaterial = new THREE.MeshStandardMaterial({
        color: 0x9E9E9E,
        roughness: 0.9
    });
    
    const steps = new THREE.Mesh(stepsGeometry, stepsMaterial);
    steps.position.set(0, 0.5, 9);
    steps.receiveShadow = true;
    house.add(steps);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 5,
        height: 1,
        depth: 3,
        position: new THREE.Vector3(x, y + 0.5, z + 9),
        mesh: steps
    });
    
    // Add house to both scenes
    players.forEach(player => {
        player.scene.add(house.clone());
    });
    
    // House name (data only)
    house.userData = { name: name + "_house" };
}

// Create a gazebo in the center
function createGazebo(x, y, z) {
    // Gazebo group
    const gazebo = new THREE.Group();
    gazebo.position.set(x, y, z);
    
    // Floor
    const floorGeometry = new THREE.CylinderGeometry(8, 8, 0.5, 8);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0.25;
    floor.receiveShadow = true;
    gazebo.add(floor);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 8,
        height: 0.5,
        position: new THREE.Vector3(x, y + 0.25, z),
        mesh: floor
    });
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(9, 4, 8);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x795548,
        roughness: 0.7
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 8;
    roof.castShadow = true;
    gazebo.add(roof);
    
    // Columns
    const columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    const columnMaterial = new THREE.MeshStandardMaterial({
        color: 0xDDDDDD,
        roughness: 0.5
    });
    
    // Create 8 columns around the perimeter
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const columnX = Math.sin(angle) * 7;
        const columnZ = Math.cos(angle) * 7;
        
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(columnX, 4, columnZ);
        column.castShadow = true;
        gazebo.add(column);
        
        // Add to colliders
        worldObjects.push({
            type: 'cylinder',
            radius: 0.5,
            height: 8,
            position: new THREE.Vector3(x + columnX, y + 4, z + columnZ),
            mesh: column
        });
    }
    
    // Add gazebo to both scenes
    players.forEach(player => {
        player.scene.add(gazebo.clone());
    });
}

// Create a bus
function createBus(x, y, z) {
    // Bus group
    const bus = new THREE.Group();
    bus.position.set(x, y, z);
    
    // Bus body
    const busBodyGeometry = new THREE.BoxGeometry(7, 4, 16);
    const busBodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xFDD835, // School bus yellow
        roughness: 0.7,
        metalness: 0.3
    });
    
    const busBody = new THREE.Mesh(busBodyGeometry, busBodyMaterial);
    busBody.position.y = 2.5;
    busBody.castShadow = true;
    busBody.receiveShadow = true;
    bus.add(busBody);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 7,
        height: 4,
        depth: 16,
        position: new THREE.Vector3(x, y + 2.5, z),
        mesh: busBody
    });
    
    // Windows (black tint)
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    
    // Side windows
    const sideWindowGeometry = new THREE.BoxGeometry(0.1, 1.5, 12);
    
    // Left side windows
    const leftWindows = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindows.position.set(-3.55, 3, 0);
    bus.add(leftWindows);
    
    // Right side windows
    const rightWindows = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindows.position.set(3.55, 3, 0);
    bus.add(rightWindows);
    
    // Front/back windows
    const frontWindowGeometry = new THREE.BoxGeometry(7, 1.5, 0.1);
    
    // Front window
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 3, 8.05);
    bus.add(frontWindow);
    
    // Back window
    const backWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    backWindow.position.set(0, 3, -8.05);
    bus.add(backWindow);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.4
    });
    
    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.position.set(-3.5, 1, 6);
    bus.add(frontLeftWheel);
    
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(3.5, 1, 6);
    bus.add(frontRightWheel);
    
    // Back wheels
    const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backLeftWheel.rotation.z = Math.PI / 2;
    backLeftWheel.position.set(-3.5, 1, -6);
    bus.add(backLeftWheel);
    
    const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backRightWheel.rotation.z = Math.PI / 2;
    backRightWheel.position.set(3.5, 1, -6);
    bus.add(backRightWheel);
    
    // Door
    const doorGeometry = new THREE.PlaneGeometry(1.5, 3);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(2.5, 2, 8.01);
    bus.add(door);
    
    // Add bus to both scenes
    players.forEach(player => {
        player.scene.add(bus.clone());
    });
}

// Create a truck
function createTruck(x, y, z) {
    // Truck group
    const truck = new THREE.Group();
    truck.position.set(x, y, z);
    
    // Truck cab
    const cabGeometry = new THREE.BoxGeometry(5, 3, 4);
    const cabMaterial = new THREE.MeshStandardMaterial({
        color: 0xD32F2F, // Red
        roughness: 0.7,
        metalness: 0.4
    });
    
    const cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(0, 2, 3);
    cab.castShadow = true;
    cab.receiveShadow = true;
    truck.add(cab);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 5,
        height: 3,
        depth: 4,
        position: new THREE.Vector3(x, y + 2, z + 3),
        mesh: cab
    });
    
    // Truck bed
    const bedGeometry = new THREE.BoxGeometry(5, 2, 6);
    const bedMaterial = new THREE.MeshStandardMaterial({
        color: 0x607D8B, // Dark grey
        roughness: 0.8,
        metalness: 0.4
    });
    
    const bed = new THREE.Mesh(bedGeometry, bedMaterial);
    bed.position.set(0, 1.5, -3);
    bed.castShadow = true;
    bed.receiveShadow = true;
    truck.add(bed);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 5,
        height: 2,
        depth: 6,
        position: new THREE.Vector3(x, y + 1.5, z - 3),
        mesh: bed
    });
    
    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x88CCFF,
        transparent: true,
        opacity: 0.7
    });
    
    // Windshield
    const windshieldGeometry = new THREE.PlaneGeometry(4, 1.5);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(0, 2.5, 5.01);
    truck.add(windshield);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.8, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9
    });
    
    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.position.set(-2.5, 1, 3);
    truck.add(frontLeftWheel);
    
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(2.5, 1, 3);
    truck.add(frontRightWheel);
    
    // Back wheels
    const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backLeftWheel.rotation.z = Math.PI / 2;
    backLeftWheel.position.set(-2.5, 1, -3);
    truck.add(backLeftWheel);
    
    const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backRightWheel.rotation.z = Math.PI / 2;
    backRightWheel.position.set(2.5, 1, -3);
    truck.add(backRightWheel);
    
    // Add truck to both scenes
    players.forEach(player => {
        player.scene.add(truck.clone());
    });
}

// Create crates and barriers
function createCrates() {
    // Crate positions (x, z)
    const cratePositions = [
        { x: -10, z: 25 },
        { x: 15, z: 30 },
        { x: -30, z: 0 },
        { x: 30, z: -10 },
        { x: -15, z: -35 },
        { x: 12, z: 5 },
        { x: -5, z: -5 }
    ];
    
    // Create crates
    const crateGeometry = new THREE.BoxGeometry(3, 3, 3);
    const crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x8D6E63,
        roughness: 0.7,
        bumpScale: 0.002
    });
    
    cratePositions.forEach(pos => {
        const crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(pos.x, 1.5, pos.z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        
        // Add to both scenes
        players.forEach(player => {
            player.scene.add(crate.clone());
        });
        
        // Add to colliders
        worldObjects.push({
            type: 'box',
            width: 3,
            height: 3,
            depth: 3,
            position: new THREE.Vector3(pos.x, 1.5, pos.z),
            mesh: crate
        });
    });
    
    // Barrier positions
    const barrierPositions = [
        { x: -5, z: 0, rotation: 0 },
        { x: 5, z: 0, rotation: 0 },
        { x: 15, z: -15, rotation: Math.PI / 2 },
        { x: -15, z: -15, rotation: Math.PI / 2 },
        { x: 0, z: 30, rotation: 0 }
    ];
    
    // Create barriers
    const barrierGeometry = new THREE.BoxGeometry(5, 1.2, 0.5);
    const barrierMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFB300,
        roughness: 0.5,
        metalness: 0.3
    });
    
    barrierPositions.forEach(pos => {
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.set(pos.x, 0.6, pos.z);
        barrier.rotation.y = pos.rotation;
        barrier.castShadow = true;
        barrier.receiveShadow = true;
        
        // Add to both scenes
        players.forEach(player => {
            player.scene.add(barrier.clone());
        });
        
        // Add to colliders
        worldObjects.push({
            type: 'box',
            width: 5,
            height: 1.2,
            depth: 0.5,
            position: barrier.position,
            rotation: barrier.rotation,
            mesh: barrier
        });
    });
}

// Create mannequins (Nuketown iconic feature)
function createMannequins() {
    const mannequinPositions = [
        { x: -20, z: -10, rotation: Math.PI / 4 },
        { x: 20, z: 5, rotation: -Math.PI / 6 },
        { x: 0, z: 35, rotation: Math.PI }
    ];
    
    mannequinPositions.forEach(pos => {
        // Mannequin group
        const mannequin = new THREE.Group();
        mannequin.position.set(pos.x, 0, pos.z);
        mannequin.rotation.y = pos.rotation;
        
        // Body (simplified)
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xEEEEEE,
            roughness: 0.9
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2.5;
        body.castShadow = true;
        mannequin.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 4.2;
        head.castShadow = true;
        mannequin.add(head);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.8, 3, 0);
        leftArm.rotation.z = Math.PI / 4;
        leftArm.castShadow = true;
        mannequin.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.8, 3, 0);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.castShadow = true;
        mannequin.add(rightArm);
        
        // Add to both scenes
        players.forEach(player => {
            player.scene.add(mannequin.clone());
        });
        
        // Add to colliders (just the body)
        worldObjects.push({
            type: 'cylinder',
            radius: 0.5,
            height: 3,
            position: new THREE.Vector3(pos.x, 2.5, pos.z),
            mesh: body
        });
    });
}

// Create tubes/slides that lead to each column
function createTubes() {
    const tubeRadius = 2.0; // Wider tubes for easier entry
    
    // Create an array of tube materials with different colors
    const tubeColors = [
        0xff5252, // Red
        0xff9800, // Orange
        0xffeb3b, // Yellow
        0x4caf50, // Green
        0x2196f3, // Blue
        0x673ab7, // Purple
        0xf06292  // Pink
    ];
    
    // Define strategic locations around the map for tube entrances
    const tubeLocations = [
        { x: -25, y: 3, z: -25, name: "Blue House" }, // Inside the blue house
        { x: 25, y: 3, z: -25, name: "Yellow House" }, // Inside the yellow house
        { x: -15, y: 4, z: 32, name: "Bus" }, // On top of the bus
        { x: 35, y: 4, z: 10, name: "Truck" }, // On the truck bed
        { x: 0, y: 1, z: 15, name: "Gazebo" }, // Inside the gazebo
        { x: -20, y: 1, z: 10, name: "Backyard" }, // Near the mannequin
        { x: 15, y: 1, z: 30, name: "Backroad" } // Near the road
    ];
    
    // Create a tube for each column
    for (let col = 0; col < 7; col++) {
        const x = columnPositions[col];
        
        // Create a unique color for each tube
        const tubeMaterial = new THREE.MeshStandardMaterial({
            color: tubeColors[col],
            roughness: 0.3,
            metalness: 0.7,
            transparent: true,
            opacity: 0.8
        });
        
        // Get the entry point location for this tube
        const entryPoint = tubeLocations[col];
        
        // Calculate board connection point - top of each column
        const cellSize = 4;
        const boardConnectX = x;
        const boardConnectY = 12 + cellSize * 2.5; // Top row position
        const boardConnectZ = -20; // The board's z position
        
        // Create curved tube path
        const curvePoints = [];
        
        // Entry point
        curvePoints.push(new THREE.Vector3(entryPoint.x, entryPoint.y, entryPoint.z));
        
        // Add control points for a nice curve
        if (col < 3) { // Left side tubes
            curvePoints.push(new THREE.Vector3(-10, 10, 0)); // Common midpoint for left tubes
        } else if (col > 3) { // Right side tubes
            curvePoints.push(new THREE.Vector3(10, 10, 0)); // Common midpoint for right tubes
        } else { // Center tube
            curvePoints.push(new THREE.Vector3(0, 12, 0)); // Straight up for center tube
        }
        
        // Add a point just above the board
        curvePoints.push(new THREE.Vector3(boardConnectX, boardConnectY + 5, boardConnectZ));
        
        // Final connection point at the board
        curvePoints.push(new THREE.Vector3(boardConnectX, boardConnectY, boardConnectZ));
        
        // Create a smooth curve
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        
        // Create tube geometry along the curve
        const tubeGeometry = new THREE.TubeGeometry(curve, 30, tubeRadius, 16, false);
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.userData = { 
            column: col,
            path: curve,
            name: entryPoint.name
        };
        
        // Add to both player scenes
        players.forEach(player => {
            const tubeClone = tube.clone();
            tubeClone.userData = { column: col, path: curve, name: entryPoint.name };
            player.scene.add(tubeClone);
        });
        
        tubes.push(tube);
        
        // Add entrance platform with glowing effect
        const platformGeometry = new THREE.CylinderGeometry(3.0, 3.0, 0.5, 32);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: tubeColors[col],
            roughness: 0.5,
            metalness: 0.6,
            emissive: tubeColors[col],
            emissiveIntensity: 0.3
        });
        
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(entryPoint.x, entryPoint.y + 0.3, entryPoint.z);
        
        // Add to both player scenes
        players.forEach(player => {
            player.scene.add(platform.clone());
        });
        
        // Add column number above the entrance
        const textBgGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16);
        const textBgMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0xffffff,
            emissiveIntensity: 0.2
        });
        
        const textBg = new THREE.Mesh(textBgGeometry, textBgMaterial);
        textBg.position.set(entryPoint.x, entryPoint.y + 2.2, entryPoint.z);
        
        // Add to both player scenes
        players.forEach(player => {
            player.scene.add(textBg.clone());
        });
        
        // Add the number (col+1) on the disk
        const numberGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.1);
        const numberMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.8
        });
        
        const number = new THREE.Mesh(numberGeometry, numberMaterial);
        number.position.set(entryPoint.x, entryPoint.y + 2.2, entryPoint.z + 0.22);
        
        // Add to both player scenes
        players.forEach(player => {
            player.scene.add(number.clone());
        });
        
        // Add entrance arrows pointing into the tube
        const arrowGeometry = new THREE.ConeGeometry(0.8, 1.6, 8);
        const arrowMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        
        // Calculate direction toward the tube
        const tubeDirection = new THREE.Vector3();
        tubeDirection.subVectors(curvePoints[1], curvePoints[0]).normalize();
        
        // Position and orient the arrow
        arrow.position.set(entryPoint.x, entryPoint.y + 1.5, entryPoint.z);
        arrow.lookAt(curvePoints[1]);
        arrow.rotateX(Math.PI / 2); // Adjust to point downward
        
        // Add to both player scenes
        players.forEach(player => {
            player.scene.add(arrow.clone());
        });
        
        // Add pulsing animation to the arrow
        const arrowAnimation = {
            time: 0,
            arrow: arrow,
            startX: entryPoint.x,
            startY: entryPoint.y,
            startZ: entryPoint.z,
            update: function(deltaTime) {
                this.time += deltaTime;
                const pulse = 0.8 + 0.2 * Math.sin(this.time * 5);
                
                // Apply to both scenes
                players.forEach(player => {
                    const arrows = player.scene.children.filter(child => 
                        child.geometry && child.geometry.type === "ConeGeometry" && 
                        Math.abs(child.position.x - this.startX) < 0.1 &&
                        Math.abs(child.position.z - this.startZ) < 0.1
                    );
                    
                    arrows.forEach(arrowMesh => {
                        arrowMesh.scale.set(pulse, pulse, pulse);
                        arrowMesh.position.y = this.startY + 1.5 + 0.2 * Math.sin(this.time * 3);
                    });
                });
            }
        };
        
        animationObjects.push(arrowAnimation);
        
        // Add decorative elements and animations for the tube
        addTubeDecorations(curve, tubeColors[col], tubeRadius, col);
    }
}

// Add additional decorations
function createDecorations() {
    // Add trees
    const treePositions = [
        { x: -40, z: -40 },
        { x: 40, z: -40 },
        { x: 40, z: 40 },
        { x: -40, z: 40 },
        { x: -30, z: 20 },
        { x: 30, z: 20 },
        { x: -20, z: 40 },
        { x: 20, z: 40 }
    ];
    
    treePositions.forEach(pos => {
        createTree(pos.x, pos.z);
    });
    
    // Add streetlights
    const lightPositions = [
        { x: -10, z: -10 },
        { x: 10, z: -10 },
        { x: 10, z: 30 },
        { x: -10, z: 30 },
        { x: -20, z: 0 },
        { x: 20, z: 0 }
    ];
    
    lightPositions.forEach(pos => {
        createStreetlight(pos.x, pos.z);
    });
    
    // Add signage for tube locations
    for (let col = 0; col < 7; col++) {
        // Get tube entry point
        const tube = tubes[col];
        const entryPoint = { 
            x: tube.userData.path.getPoint(0).x,
            y: tube.userData.path.getPoint(0).y,
            z: tube.userData.path.getPoint(0).z
        };
        
        // Create sign post pointing to the tube
        createDirectionalSign(entryPoint.x, entryPoint.z, col + 1);
    }
}

// Create a tree
function createTree(x, z) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.8, 1, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Foliage (multiple layers)
    const foliageGeometry = new THREE.ConeGeometry(4, 5, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x2E7D32,
        roughness: 0.8
    });
    
    const foliageBottom = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliageBottom.position.y = 4;
    foliageBottom.castShadow = true;
    tree.add(foliageBottom);
    
    const foliageMiddle = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliageMiddle.position.y = 6;
    foliageMiddle.scale.set(0.8, 0.8, 0.8);
    foliageMiddle.castShadow = true;
    tree.add(foliageMiddle);
    
    const foliageTop = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliageTop.position.y = 8;
    foliageTop.scale.set(0.5, 0.5, 0.5);
    foliageTop.castShadow = true;
    tree.add(foliageTop);
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(tree.clone());
    });
    
    // Add trunk to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 0.8,
        height: 5,
        position: new THREE.Vector3(x, 2.5, z),
        mesh: trunk
    });
}

// Create a streetlight
function createStreetlight(x, z) {
    const light = new THREE.Group();
    light.position.set(x, 0, z);
    
    // Post
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.5,
        metalness: 0.8
    });
    
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = 3;
    post.castShadow = true;
    light.add(post);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 0.2,
        height: 6,
        position: new THREE.Vector3(x, 3, z),
        mesh: post
    });
    
    // Lamp
    const lampGeometry = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const lampMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFF99,
        emissiveIntensity: 0.3
    });
    
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.y = 6;
    lamp.rotation.x = Math.PI;
    light.add(lamp);
    
    // Add light source
    const pointLight = new THREE.PointLight(0xFFFF99, 1, 15);
    pointLight.position.set(0, 5.8, 0);
    light.add(pointLight);
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(light.clone());
    });
}

// Create directional sign pointing to tubes
function createDirectionalSign(x, z, tubeNumber) {
    // Calculate position on a path around the tube entry
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 3;
    
    const signX = x + Math.cos(angle) * distance;
    const signZ = z + Math.sin(angle) * distance;
    
    // Create sign
    const sign = new THREE.Group();
    sign.position.set(signX, 0, signZ);
    
    // Post
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9
    });
    
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = 1.5;
    post.castShadow = true;
    sign.add(post);
    
    // Sign plate
    const plateGeometry = new THREE.BoxGeometry(2, 1, 0.1);
    const plateMaterial = new THREE.MeshStandardMaterial({
        color: 0xEFEFEF,
        roughness: 0.5
    });
    
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.y = 2.5;
    plate.castShadow = true;
    
    // Rotate sign to point toward tube entry
    const direction = new THREE.Vector2(x - signX, z - signZ).normalize();
    const angle2D = Math.atan2(direction.y, direction.x);
    plate.rotation.y = angle2D;
    
    sign.add(plate);
    
    // Add tube number
    const numberGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.05);
    const numberMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000
    });
    
    const number = new THREE.Mesh(numberGeometry, numberMaterial);
    number.position.set(0, 0, 0.08);
    plate.add(number);
    
    // Arrow
    const arrowGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
    const arrowMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000
    });
    
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.set(0, -0.3, 0.08);
    arrow.rotation.z = Math.PI; // Point in direction of tube
    plate.add(arrow);
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(sign.clone());
    });
}

// Add decorative elements to tubes
function addTubeDecorations(curve, color, tubeRadius, columnIndex) {
    // Add glowing rings around the tube entrance
    const tubeStart = curve.getPoint(0);
    
    const ringGeometry = new THREE.TorusGeometry(tubeRadius + 0.2, 0.2, 16, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(tubeStart);
    
    // Orient ring to face the direction of the tube
    const tangent = curve.getTangent(0);
    const lookTarget = new THREE.Vector3().addVectors(tubeStart, tangent);
    ring.lookAt(lookTarget);
    
    // Add to both player scenes
    players.forEach(player => {
        player.scene.add(ring.clone());
    });
    
    // Add decorative lights along the tube
    for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const point = curve.getPoint(t);
        
        const lightGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1
        });
        
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.copy(point);
        
        // Offset the light to the side of the tube
        const tangent = curve.getTangent(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        light.position.add(normal.multiplyScalar(tubeRadius * 0.8));
        
        // Add to both player scenes
        players.forEach(player => {
            player.scene.add(light.clone());
        });
        
        // Add pulsing animation to lights
        const lightAnimation = {
            time: Math.random() * Math.PI * 2, // Random starting phase
            lightPosition: light.position.clone(),
            update: function(deltaTime) {
                this.time += deltaTime;
                const pulse = 0.7 + 0.3 * Math.sin(this.time * 3);
                
                // Apply to both scenes
                players.forEach(player => {
                    const lights = player.scene.children.filter(child => 
                        child.geometry && child.geometry.type === "SphereGeometry" &&
                        child.geometry.parameters.radius === 0.4 &&
                        Math.abs(child.position.x - this.lightPosition.x) < 0.1 &&
                        Math.abs(child.position.y - this.lightPosition.y) < 0.1 &&
                        Math.abs(child.position.z - this.lightPosition.z) < 0.1
                    );
                    
                    lights.forEach(lightMesh => {
                        lightMesh.scale.set(pulse, pulse, pulse);
                    });
                });
            }
        };
        
        animationObjects.push(lightAnimation);
    }
}
