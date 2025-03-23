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
    
    // Create the terrain/ground with Hunger Games style landscape
    createTerrain();
    
    // Create the Connect 4 board at the center (cornucopia)
    createConnectFourBoard();
    
    // Create cornucopia structure around the Connect 4 board
    createCornucopia();
    
    // Create forest and natural elements
    createForest();
    
    // Create scattered structures and resources
    createScatteredStructures();
    
    // Create the tubes/slides that lead to each column (scattered around the arena)
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
    // Main ground - larger for Hunger Games arena
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
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
    
    // Add to collider list with explicit plane dimensions and rotation
    worldObjects.push({
        type: 'plane',
        width: 200,
        height: 200,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        mesh: ground
    });
    
    // Create paths radiating out from the center (like Hunger Games sectors)
    const pathCount = 8;
    const pathMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        roughness: 0.9,
        metalness: 0.1
    });
    
    for (let i = 0; i < pathCount; i++) {
        const angle = (i / pathCount) * Math.PI * 2;
        const pathGeometry = new THREE.PlaneGeometry(5, 60);
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        
        path.rotation.x = -Math.PI / 2;
        path.rotation.z = angle;
        path.position.y = 0.01; // Slightly above ground
        path.receiveShadow = true;
        
        // Add to both scenes
        players.forEach(player => player.scene.add(path.clone()));
    }
    
    // Create center circular plaza
    const plazaGeometry = new THREE.CircleGeometry(20, 32);
    const plazaMaterial = new THREE.MeshStandardMaterial({
        color: 0xBDBDBD,
        roughness: 0.7,
        metalness: 0.2
    });
    
    const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02; // Slightly above ground
    plaza.receiveShadow = true;
    
    // Add to both scenes
    players.forEach(player => player.scene.add(plaza.clone()));
    
    // Add some terrain variations (hills and depressions)
    createTerrainVariations();
}

// Create terrain variations (hills and depressions)
function createTerrainVariations() {
    // Create some hills around the map
    const hillPositions = [
        { x: -40, z: -30, height: 5, radius: 15 },
        { x: 50, z: 20, height: 7, radius: 18 },
        { x: -20, z: 60, height: 4, radius: 12 },
        { x: 30, z: -50, height: 6, radius: 20 }
    ];
    
    hillPositions.forEach(hill => {
        const hillGeometry = new THREE.CylinderGeometry(hill.radius, hill.radius + 5, hill.height, 20);
        const hillMaterial = new THREE.MeshStandardMaterial({
            color: 0x8D6E63,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const hillMesh = new THREE.Mesh(hillGeometry, hillMaterial);
        hillMesh.position.set(hill.x, hill.height / 2, hill.z);
        hillMesh.receiveShadow = true;
        hillMesh.castShadow = true;
        
        // Add to both scenes
        players.forEach(player => player.scene.add(hillMesh.clone()));
        
        // Add to colliders
        worldObjects.push({
            type: 'cylinder',
            radius: hill.radius,
            height: hill.height,
            position: new THREE.Vector3(hill.x, hill.height / 2, hill.z),
            mesh: hillMesh
        });
    });
    
    // Create a water feature (lake)
    const lakeGeometry = new THREE.CircleGeometry(25, 32);
    const lakeMaterial = new THREE.MeshStandardMaterial({
        color: 0x4FC3F7,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
    });
    
    const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-40, 0.05, 40); // Slightly above ground to prevent z-fighting
    lake.receiveShadow = true;
    
    // Add to both scenes
    players.forEach(player => player.scene.add(lake.clone()));
}

// Create Connect Four board at center of the arena
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
    boardGroup.position.set(0, 12, 0); // Center of the map
    
    // Add to both player scenes
    players.forEach(player => {
        const boardClone = boardGroup.clone();
        player.scene.add(boardClone);
    });
    
    // Add elevated platform under the board
    const platformGeometry = new THREE.CylinderGeometry(18, 15, 3, 16);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x9E9E9E,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 1.5, 0); // Center under board
    platform.receiveShadow = true;
    
    // Add to both scenes
    players.forEach(player => player.scene.add(platform.clone()));
    
    // Add to collider list
    worldObjects.push({
        type: 'cylinder',
        radius: 18,
        height: 3,
        position: new THREE.Vector3(0, 1.5, 0),
        mesh: platform
    });
    
    // Add stairs to access the platform from 4 directions
    createPlatformStairs();
}

// Create stairs to the central platform
function createPlatformStairs() {
    const directions = [
        { angle: 0, name: "North" },
        { angle: Math.PI / 2, name: "East" },
        { angle: Math.PI, name: "South" },
        { angle: Math.PI * 3 / 2, name: "West" }
    ];
    
    directions.forEach(dir => {
        // Create stairs group
        const stairsGroup = new THREE.Group();
        
        const stairWidth = 8;
        const stairDepth = 1;
        const stairHeight = 0.5;
        const stairCount = 6;
        
        // Create each step
        for (let i = 0; i < stairCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, stairDepth);
            const stepMaterial = new THREE.MeshStandardMaterial({
                color: 0x9E9E9E,
                roughness: 0.8
            });
            
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(0, i * stairHeight, (stairCount - i) * stairDepth);
            step.receiveShadow = true;
            step.castShadow = true;
            stairsGroup.add(step);
            
            // Add to colliders
            const stepWorldPos = new THREE.Vector3(
                Math.sin(dir.angle) * ((stairCount - i) * stairDepth + 15),
                i * stairHeight + stairHeight/2,
                Math.cos(dir.angle) * ((stairCount - i) * stairDepth + 15)
            );
            
            worldObjects.push({
                type: 'box',
                width: stairWidth,
                height: stairHeight,
                depth: stairDepth,
                position: stepWorldPos,
                rotation: new THREE.Euler(0, dir.angle, 0),
                mesh: step
            });
        }
        
        // Position the stairs relative to the central platform
        stairsGroup.position.set(0, 0, 15); // Distance from center
        stairsGroup.rotation.y = dir.angle;
        
        // Add to both scenes
        players.forEach(player => {
            player.scene.add(stairsGroup.clone());
        });
    });
}

// Create cornucopia structure around the board
function createCornucopia() {
    // Create a semi-circular structure around the board (like Hunger Games cornucopia)
    const cornucopiaGroup = new THREE.Group();
    
    // Remove the large golden shell that was obscuring the board
    // (The shell code that was here has been removed)
    
    // Create supporting pillars
    const pillarPositions = [
        { x: -15, z: -15 },
        { x: 15, z: -15 },
        { x: -25, z: -25 },
        { x: 25, z: -25 }
    ];
    
    pillarPositions.forEach(pos => {
        const pillarGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0xDAA520, // Golden rod
            roughness: 0.3,
            metalness: 0.7
        });
        
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(pos.x, 10, pos.z);
        pillar.castShadow = true;
        cornucopiaGroup.add(pillar);
        
        // Add to colliders
        worldObjects.push({
            type: 'cylinder',
            radius: 1.5,
            height: 20,
            position: new THREE.Vector3(pos.x, 10, pos.z),
            mesh: pillar
        });
    });
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(cornucopiaGroup.clone());
    });
}

// Create forest environment
function createForest() {
    // Create clusters of trees
    const forestClusters = [
        { x: -50, z: -40, radius: 25, count: 12 },
        { x: 60, z: 20, radius: 20, count: 10 },
        { x: -30, z: 70, radius: 30, count: 15 },
        { x: 40, z: -60, radius: 25, count: 12 },
        { x: 80, z: -20, radius: 15, count: 8 },
        { x: -70, z: 10, radius: 20, count: 10 }
    ];
    
    forestClusters.forEach(cluster => {
        for (let i = 0; i < cluster.count; i++) {
            // Random position within the cluster radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * cluster.radius;
            const x = cluster.x + Math.sin(angle) * distance;
            const z = cluster.z + Math.cos(angle) * distance;
            
            // Randomize tree appearance
            const treeHeight = 8 + Math.random() * 6;
            const trunkRadius = 0.6 + Math.random() * 0.4;
            
            createTree(x, z, treeHeight, trunkRadius);
        }
    });
    
    // Create some scattered trees
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Don't place trees too close to the center
        if (Math.sqrt(x*x + z*z) > 25) {
            const treeHeight = 6 + Math.random() * 5;
            const trunkRadius = 0.4 + Math.random() * 0.5;
            createTree(x, z, treeHeight, trunkRadius);
        }
    }
    
    // Create undergrowth and bushes
    for (let i = 0; i < 60; i++) {
        const x = (Math.random() - 0.5) * 190;
        const z = (Math.random() - 0.5) * 190;
        
        // Don't place bushes too close to the center
        if (Math.sqrt(x*x + z*z) > 22) {
            createBush(x, z);
        }
    }
}

// Create a tree with customizable parameters
function createTree(x, z, height = 10, trunkRadius = 0.8) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, height * 0.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = height * 0.25;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Foliage (multiple layers)
    const foliageColor = Math.random() > 0.2 ? 0x2E7D32 : 0x1B5E20; // Occasional darker tree
    
    const foliageGeometry = new THREE.ConeGeometry(height * 0.35, height * 0.65, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
        color: foliageColor,
        roughness: 0.8
    });
    
    const foliageBottom = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliageBottom.position.y = height * 0.5;
    foliageBottom.castShadow = true;
    tree.add(foliageBottom);
    
    const foliageMiddle = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliageMiddle.position.y = height * 0.65;
    foliageMiddle.scale.set(0.8, 0.8, 0.8);
    foliageMiddle.castShadow = true;
    tree.add(foliageMiddle);
    
    const foliageTop = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliageTop.position.y = height * 0.8;
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
        radius: trunkRadius,
        height: height * 0.5,
        position: new THREE.Vector3(x, height * 0.25, z),
        mesh: trunk
    });
}

// Create a bush
function createBush(x, z) {
    const bush = new THREE.Group();
    bush.position.set(x, 0, z);
    
    // Random properties
    const bushSize = 0.7 + Math.random() * 1.3;
    const bushColor = 0x2E7D32; // Base green color
    
    // Create bush using multiple spheres
    const bushGeometry = new THREE.SphereGeometry(bushSize, 8, 8);
    const bushMaterial = new THREE.MeshStandardMaterial({
        color: bushColor,
        roughness: 0.9
    });
    
    // Main bush part
    const mainBush = new THREE.Mesh(bushGeometry, bushMaterial);
    mainBush.position.y = bushSize;
    mainBush.castShadow = true;
    bush.add(mainBush);
    
    // Add some variations with smaller spheres
    const variations = Math.floor(2 + Math.random() * 3);
    for (let i = 0; i < variations; i++) {
        const variationSize = bushSize * (0.6 + Math.random() * 0.4);
        const variation = new THREE.Mesh(
            new THREE.SphereGeometry(variationSize, 8, 8),
            bushMaterial
        );
        
        const angle = Math.random() * Math.PI * 2;
        const distance = bushSize * 0.5;
        
        variation.position.set(
            Math.sin(angle) * distance,
            bushSize * 0.7 + Math.random() * bushSize * 0.6,
            Math.cos(angle) * distance
        );
        
        variation.castShadow = true;
        bush.add(variation);
    }
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(bush.clone());
    });
    
    // Add to colliders (simple bounding sphere)
    worldObjects.push({
        type: 'sphere',
        radius: bushSize * 1.5,
        position: new THREE.Vector3(x, bushSize, z),
        mesh: mainBush
    });
}

// Create scattered structures around the arena
function createScatteredStructures() {
    // Create survival stations (places for tubes to connect)
    const stationPositions = [
        { x: -70, y: 0, z: -50, type: "watchtower" },
        { x: 60, y: 0, z: -60, type: "ruins" },
        { x: -60, y: 0, z: 70, type: "cave" },
        { x: 80, y: 0, z: 30, type: "bunker" },
        { x: 0, y: 0, z: -80, type: "camp" },
        { x: -80, y: 0, z: 0, type: "shrine" },
        { x: 50, y: 0, z: 70, type: "hut" }
    ];
    
    stationPositions.forEach(station => {
        switch(station.type) {
            case "watchtower":
                createWatchtower(station.x, station.y, station.z);
                break;
            case "ruins":
                createRuins(station.x, station.y, station.z);
                break;
            case "cave":
                createCave(station.x, station.y, station.z);
                break;
            case "bunker":
                createBunker(station.x, station.y, station.z);
                break;
            case "camp":
                createCamp(station.x, station.y, station.z);
                break;
            case "shrine":
                createShrine(station.x, station.y, station.z);
                break;
            case "hut":
                createHut(station.x, station.y, station.z);
                break;
        }
    });
    
    // Add smaller resource crates scattered around the map
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50; // Between 30-80 units from center
        
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        createSupplyCrate(x, z);
    }
}

// Create a watchtower
function createWatchtower(x, y, z) {
    const tower = new THREE.Group();
    tower.position.set(x, y, z);
    
    // Base platform
    const baseGeometry = new THREE.BoxGeometry(10, 1, 10);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.receiveShadow = true;
    base.castShadow = true;
    tower.add(base);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 10,
        height: 1,
        depth: 10,
        position: new THREE.Vector3(x, y + 0.5, z),
        mesh: base
    });
    
    // Support columns
    const columnPositions = [
        { x: -4, z: -4 },
        { x: 4, z: -4 },
        { x: -4, z: 4 },
        { x: 4, z: 4 }
    ];
    
    columnPositions.forEach(pos => {
        const columnGeometry = new THREE.BoxGeometry(1, 15, 1);
        const column = new THREE.Mesh(columnGeometry, baseMaterial);
        column.position.set(pos.x, 8, pos.z);
        column.castShadow = true;
        tower.add(column);
        
        // Add to colliders
        worldObjects.push({
            type: 'box',
            width: 1,
            height: 15,
            depth: 1,
            position: new THREE.Vector3(x + pos.x, y + 8, z + pos.z),
            mesh: column
        });
    });
    
    // Top platform
    const topGeometry = new THREE.BoxGeometry(12, 1, 12);
    const top = new THREE.Mesh(topGeometry, baseMaterial);
    top.position.y = 16;
    top.receiveShadow = true;
    top.castShadow = true;
    tower.add(top);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 12,
        height: 1,
        depth: 12,
        position: new THREE.Vector3(x, y + 16, z),
        mesh: top
    });
    
    // Add railing
    const railingGeometry = new THREE.BoxGeometry(12, 1, 0.5);
    const railingMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8
    });
    
    // Front railing
    const frontRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    frontRailing.position.set(0, 17, 5.75);
    tower.add(frontRailing);
    
    // Back railing
    const backRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    backRailing.position.set(0, 17, -5.75);
    tower.add(backRailing);
    
    // Left railing
    const leftRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    leftRailing.rotation.y = Math.PI / 2;
    leftRailing.position.set(-5.75, 17, 0);
    tower.add(leftRailing);
    
    // Right railing
    const rightRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    rightRailing.rotation.y = Math.PI / 2;
    rightRailing.position.set(5.75, 17, 0);
    tower.add(rightRailing);
    
    // Ladder
    const ladderGeometry = new THREE.BoxGeometry(1, 15, 2);
    const ladderMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9,
        transparent: true,
        opacity: 0.8
    });
    
    const ladder = new THREE.Mesh(ladderGeometry, ladderMaterial);
    ladder.position.set(0, 8, 5);
    tower.add(ladder);
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(tower.clone());
    });
}

// Create ruins
function createRuins(x, y, z) {
    const ruins = new THREE.Group();
    ruins.position.set(x, y, z);
    
    // Create broken walls
    const wallPositions = [
        { x: 0, z: 0, width: 10, height: 3, depth: 1, rotation: 0 },
        { x: -4, z: 5, width: 8, height: 2, depth: 1, rotation: Math.PI/2 },
        { x: 5, z: -3, width: 6, height: 4, depth: 1, rotation: Math.PI/4 },
        { x: -5, z: -4, width: 7, height: 2, depth: 1, rotation: -Math.PI/6 }
    ];
    
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x9E9E9E,
        roughness: 0.9
    });
    
    wallPositions.forEach(wall => {
        const wallGeometry = new THREE.BoxGeometry(wall.width, wall.height, wall.depth);
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        
        wallMesh.position.set(wall.x, wall.height/2, wall.z);
        wallMesh.rotation.y = wall.rotation;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        ruins.add(wallMesh);
        
        // Add to colliders
        worldObjects.push({
            type: 'box',
            width: wall.width,
            height: wall.height,
            depth: wall.depth,
            position: new THREE.Vector3(
                x + wall.x, 
                y + wall.height/2, 
                z + wall.z
            ),
            rotation: new THREE.Euler(0, wall.rotation, 0),
            mesh: wallMesh
        });
    });
    
    // Create broken columns
    const ruinColumnPositions = [
        { x: 3, z: 3, height: 5 },
        { x: -5, z: 2, height: 3 },
        { x: 4, z: -4, height: 2 }
    ];
    
    const columnMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        roughness: 0.7
    });
    
    ruinColumnPositions.forEach(column => {
        const columnGeometry = new THREE.CylinderGeometry(1, 1, column.height, 16);
        const columnMesh = new THREE.Mesh(columnGeometry, columnMaterial);
        
        columnMesh.position.set(column.x, column.height/2, column.z);
        columnMesh.castShadow = true;
        ruins.add(columnMesh);
        
        // Add to colliders
        worldObjects.push({
            type: 'cylinder',
            radius: 1,
            height: column.height,
            position: new THREE.Vector3(
                x + column.x,
                y + column.height/2,
                z + column.z
            ),
            mesh: columnMesh
        });
    });
    
    // Add rubble piles
    for (let i = 0; i < 5; i++) {
        const rubbleX = (Math.random() - 0.5) * 12;
        const rubbleZ = (Math.random() - 0.5) * 12;
        
        const rubbleGeometry = new THREE.SphereGeometry(1 + Math.random(), 5, 5);
        const rubbleMaterial = new THREE.MeshStandardMaterial({
            color: 0xAAAAAA,
            roughness: 1.0
        });
        
        const rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
        rubble.position.set(rubbleX, 0.5, rubbleZ);
        rubble.scale.y = 0.5; // Flatten the rubble
        rubble.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rubble.castShadow = true;
        rubble.receiveShadow = true;
        ruins.add(rubble);
    }
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(ruins.clone());
    });
}

// Create a cave
function createCave(x, y, z) {
    const cave = new THREE.Group();
    cave.position.set(x, y, z);
    
    // Create cave mouth (arch)
    const archMaterial = new THREE.MeshStandardMaterial({
        color: 0x5D4037,
        roughness: 1.0,
        metalness: 0.2
    });
    
    // Create cave walls using toruses
    const outerWallGeometry = new THREE.TorusGeometry(8, 4, 16, 16, Math.PI);
    const outerWall = new THREE.Mesh(outerWallGeometry, archMaterial);
    outerWall.rotation.x = -Math.PI / 2;
    outerWall.position.z = 4;
    outerWall.position.y = 8;
    outerWall.castShadow = true;
    cave.add(outerWall);
    
    // Create cave floor
    const floorGeometry = new THREE.CircleGeometry(8, 16, 0, Math.PI);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3E2723,
        roughness: 0.9
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = 4;
    floor.receiveShadow = true;
    cave.add(floor);
    
    // Create cave interior (blackness)
    const interiorGeometry = new THREE.BoxGeometry(15, 8, 10);
    const interiorMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.9
    });
    
    const interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
    interior.position.set(0, 4, -5);
    cave.add(interior);
    
    // Add some rocks at the entrance
    const rockPositions = [
        { x: -5, z: 8, scale: 1.5 },
        { x: 6, z: 7, scale: 2 },
        { x: 3, z: 9, scale: 1 },
        { x: -4, z: 10, scale: 1.2 }
    ];
    
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x616161,
        roughness: 0.9
    });
    
    rockPositions.forEach(pos => {
        const rockGeometry = new THREE.DodecahedronGeometry(pos.scale, 0);
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        rock.position.set(pos.x, pos.scale/2, pos.z);
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        cave.add(rock);
        
        // Add to colliders
        worldObjects.push({
            type: 'sphere',
            radius: pos.scale,
            position: new THREE.Vector3(
                x + pos.x,
                y + pos.scale/2,
                z + pos.z
            ),
            mesh: rock
        });
    });
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(cave.clone());
    });
}

// Create a bunker
function createBunker(x, y, z) {
    const bunker = new THREE.Group();
    bunker.position.set(x, y, z);
    
    // Create main bunker structure
    const bunkerGeometry = new THREE.BoxGeometry(12, 4, 8);
    const bunkerMaterial = new THREE.MeshStandardMaterial({
        color: 0x5D4037,
        roughness: 0.9,
        metalness: 0.2
    });
    
    const bunkerBody = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunkerBody.position.y = 2;
    bunkerBody.castShadow = true;
    bunkerBody.receiveShadow = true;
    bunker.add(bunkerBody);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 12,
        height: 4,
        depth: 8,
        position: new THREE.Vector3(x, y + 2, z),
        mesh: bunkerBody
    });
    
    // Create roof
    const roofGeometry = new THREE.BoxGeometry(14, 1, 10);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x4E342E,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4.5;
    roof.castShadow = true;
    bunker.add(roof);
    
    // Add entrance (hole in front)
    const entranceGeometry = new THREE.BoxGeometry(3, 2.5, 1);
    const entranceMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.8
    });
    
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 1.25, 4); // Front center
    bunker.add(entrance);
    
    // Add some metal details
    const detailMaterial = new THREE.MeshStandardMaterial({
        color: 0x757575,
        roughness: 0.5,
        metalness: 0.8
    });
    
    // Add horizontal metal band
    const bandGeometry = new THREE.BoxGeometry(12.2, 0.5, 8.2);
    const band = new THREE.Mesh(bandGeometry, detailMaterial);
    band.position.y = 3;
    bunker.add(band);
    
    // Add ventilation pipe
    const pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
    const pipe = new THREE.Mesh(pipeGeometry, detailMaterial);
    pipe.position.set(4, 3, 0);
    pipe.rotation.x = Math.PI / 2;
    bunker.add(pipe);
    
    // Add some sandbags for defense
    const sandbagMaterial = new THREE.MeshStandardMaterial({
        color: 0xA1887F,
        roughness: 1.0
    });
    
    const sandbagPositions = [
        { x: -5, z: 5, rot: 0 },
        { x: -3, z: 5, rot: 0 },
        { x: -1, z: 5, rot: 0 },
        { x: 2, z: 5, rot: 0 },
        { x: 4, z: 5, rot: 0 },
        { x: 5, z: 3, rot: Math.PI/2 },
        { x: 5, z: 1, rot: Math.PI/2 },
        { x: 5, z: -1, rot: Math.PI/2 },
        { x: 5, z: -3, rot: Math.PI/2 }
    ];
    
    sandbagPositions.forEach(pos => {
        const sandbagGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        const sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
        
        sandbag.position.set(pos.x, 0.5, pos.z);
        sandbag.rotation.x = Math.PI / 2;
        sandbag.rotation.z = pos.rot;
        bunker.add(sandbag);
    });
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(bunker.clone());
    });
}

// Create a camp site
function createCamp(x, y, z) {
    const camp = new THREE.Group();
    camp.position.set(x, y, z);
    
    // Create tent
    const tentMaterial = new THREE.MeshStandardMaterial({
        color: 0x004D40,  // Dark teal
        roughness: 0.9
    });
    
    // Tent body (triangular prism)
    const tentGeometry = new THREE.CylinderGeometry(0.1, 3, 4, 3);
    const tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(0, 2, 0);
    tent.rotation.y = Math.PI/6;
    tent.rotation.x = Math.PI/2;
    tent.castShadow = true;
    camp.add(tent);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 3,
        height: 4,
        position: new THREE.Vector3(x, y + 2, z),
        rotation: new THREE.Euler(Math.PI/2, Math.PI/6, 0),
        mesh: tent
    });
    
    // Create campfire
    const fireStonePositions = [
        { x: 4, z: 0, angle: 0 },
        { x: 4*Math.cos(Math.PI*2/5), z: 4*Math.sin(Math.PI*2/5), angle: Math.PI*2/5 },
        { x: 4*Math.cos(Math.PI*4/5), z: 4*Math.sin(Math.PI*4/5), angle: Math.PI*4/5 },
        { x: 4*Math.cos(Math.PI*6/5), z: 4*Math.sin(Math.PI*6/5), angle: Math.PI*6/5 },
        { x: 4*Math.cos(Math.PI*8/5), z: 4*Math.sin(Math.PI*8/5), angle: Math.PI*8/5 }
    ];
    
    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x757575,
        roughness: 1.0
    });
    
    fireStonePositions.forEach(pos => {
        const stoneGeometry = new THREE.BoxGeometry(1, 1, 1);
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        
        stone.position.set(pos.x, 0.5, pos.z);
        stone.rotation.set(
            Math.random() * Math.PI/4,
            Math.random() * Math.PI/4,
            Math.random() * Math.PI/4
        );
        stone.castShadow = true;
        camp.add(stone);
    });
    
    // Create fire logs
    const logMaterial = new THREE.MeshStandardMaterial({
        color: 0x5D4037,
        roughness: 0.9
    });
    
    const logGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    
    for (let i = 0; i < 3; i++) {
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.position.set(0, 0.3, 0);
        log.rotation.y = i * Math.PI / 3;
        log.rotation.x = Math.PI / 2;
        camp.add(log);
    }
    
    // Create fire glow (simple glowing sphere)
    const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF5722,
        transparent: true,
        opacity: 0.7
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, 0.5, 0);
    camp.add(glow);
    
    // Add a point light for the fire
    const fireLight = new THREE.PointLight(0xFF5722, 1, 15);
    fireLight.position.set(0, 1, 0);
    camp.add(fireLight);
    
    // Create some logs as seating
    const seatPositions = [
        { x: -3, z: 2, rot: 0 },
        { x: 2, z: -3, rot: Math.PI/3 }
    ];
    
    seatPositions.forEach(pos => {
        const seatLogGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
        const seatLog = new THREE.Mesh(seatLogGeometry, logMaterial);
        
        seatLog.position.set(pos.x, 0.5, pos.z);
        seatLog.rotation.y = pos.rot;
        seatLog.castShadow = true;
        camp.add(seatLog);
        
        // Add to colliders
        worldObjects.push({
            type: 'cylinder',
            radius: 0.5,
            height: 4,
            position: new THREE.Vector3(x + pos.x, y + 0.5, z + pos.z),
            rotation: new THREE.Euler(0, pos.rot, 0),
            mesh: seatLog
        });
    });
    
    // Add some supplies
    const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.MeshStandardMaterial({
            color: 0x8D6E63,
            roughness: 0.8
        })
    );
    crate.position.set(-2, 0.75, -2);
    crate.castShadow = true;
    camp.add(crate);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 1.5,
        height: 1.5,
        depth: 1.5,
        position: new THREE.Vector3(x - 2, y + 0.75, z - 2),
        mesh: crate
    });
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(camp.clone());
    });
    
    // Add to animation objects for fire flickering
    const fireAnimation = {
        time: 0,
        glow: glow,
        light: fireLight,
        basePosition: new THREE.Vector3(x, y, z),
        update: function(deltaTime) {
            this.time += deltaTime;
            const flicker = 0.8 + 0.4 * Math.sin(this.time * 10);
            
            // Apply to both scenes
            players.forEach(player => {
                const fires = player.scene.children.filter(child => 
                    child instanceof THREE.Group && 
                    Math.abs(child.position.x - this.basePosition.x) < 0.1 &&
                    Math.abs(child.position.z - this.basePosition.z) < 0.1
                );
                
                fires.forEach(campGroup => {
                    // Find the glow
                    const glowObj = campGroup.children.find(c => 
                        c.geometry && c.geometry.type === 'SphereGeometry' && 
                        c.material && c.material.opacity < 1
                    );
                    
                    if (glowObj) {
                        glowObj.scale.set(flicker, flicker, flicker);
                        glowObj.material.opacity = 0.5 + 0.3 * Math.sin(this.time * 5);
                    }
                    
                    // Find the light
                    const lightObj = campGroup.children.find(c => c instanceof THREE.PointLight);
                    if (lightObj) {
                        lightObj.intensity = 0.8 + 0.4 * Math.sin(this.time * 8);
                    }
                });
            });
        }
    };
    
    animationObjects.push(fireAnimation);
}

// Create a shrine or altar
function createShrine(x, y, z) {
    const shrine = new THREE.Group();
    shrine.position.set(x, y, z);
    
    // Create base platform
    const baseGeometry = new THREE.CylinderGeometry(8, 9, 1, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x9E9E9E,
        roughness: 0.8
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.receiveShadow = true;
    shrine.add(base);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 8,
        height: 1,
        position: new THREE.Vector3(x, y + 0.5, z),
        mesh: base
    });
    
    // Create steps
    const stepMaterial = new THREE.MeshStandardMaterial({
        color: 0xBDBDBD,
        roughness: 0.7
    });
    
    const step1Geometry = new THREE.CylinderGeometry(6, 7, 0.5, 8);
    const step1 = new THREE.Mesh(step1Geometry, stepMaterial);
    step1.position.y = 1.25;
    step1.receiveShadow = true;
    shrine.add(step1);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 6,
        height: 0.5,
        position: new THREE.Vector3(x, y + 1.25, z),
        mesh: step1
    });
    
    const step2Geometry = new THREE.CylinderGeometry(5, 6, 0.5, 8);
    const step2 = new THREE.Mesh(step2Geometry, stepMaterial);
    step2.position.y = 1.75;
    step2.receiveShadow = true;
    shrine.add(step2);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 5,
        height: 0.5,
        position: new THREE.Vector3(x, y + 1.75, z),
        mesh: step2
    });
    
    // Create central altar
    const altarGeometry = new THREE.BoxGeometry(4, 2, 4);
    const altarMaterial = new THREE.MeshStandardMaterial({
        color: 0x424242,
        roughness: 0.5,
        metalness: 0.5
    });
    
    const altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.y = 3;
    altar.castShadow = true;
    shrine.add(altar);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 4,
        height: 2,
        depth: 4,
        position: new THREE.Vector3(x, y + 3, z),
        mesh: altar
    });
    
    // Create central object (glowing sphere)
    const orbGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const orbMaterial = new THREE.MeshBasicMaterial({
        color: 0x4DD0E1,
        emissive: 0x4DD0E1,
        emissiveIntensity: 1
    });
    
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.y = 4.5;
    shrine.add(orb);
    
    // Add point light at orb
    const orbLight = new THREE.PointLight(0x4DD0E1, 1, 20);
    orbLight.position.y = 4.5;
    shrine.add(orbLight);
    
    // Add pillars around the shrine
    const pillarCount = 6;
    const radius = 7;
    
    for (let i = 0; i < pillarCount; i++) {
        const angle = (i / pillarCount) * Math.PI * 2;
        const pX = Math.sin(angle) * radius;
        const pZ = Math.cos(angle) * radius;
        
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
        const pillar = new THREE.Mesh(pillarGeometry, baseMaterial);
        
        pillar.position.set(pX, 4, pZ);
        pillar.castShadow = true;
        shrine.add(pillar);
        
        // Add to colliders
        worldObjects.push({
            type: 'cylinder',
            radius: 0.5,
            height: 8,
            position: new THREE.Vector3(x + pX, y + 4, z + pZ),
            mesh: pillar
        });
    }
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(shrine.clone());
    });
    
    // Add animation for the orb
    const orbAnimation = {
        time: 0,
        basePosition: new THREE.Vector3(x, y + 4.5, z),
        update: function(deltaTime) {
            this.time += deltaTime;
            const hoverHeight = 0.5 * Math.sin(this.time);
            const pulseIntensity = 0.7 + 0.5 * Math.sin(this.time * 2);
            
            players.forEach(player => {
                const shrines = player.scene.children.filter(child => 
                    child instanceof THREE.Group && 
                    Math.abs(child.position.x - (this.basePosition.x - x)) < 0.1 &&
                    Math.abs(child.position.z - (this.basePosition.z - z)) < 0.1
                );
                
                shrines.forEach(shrineGroup => {
                    // Find the orb
                    const orbObj = shrineGroup.children.find(c => 
                        c.geometry && c.geometry.type === 'SphereGeometry' && 
                        c.position.y > 4
                    );
                    
                    if (orbObj) {
                        orbObj.position.y = 4.5 + hoverHeight;
                    }
                    
                    // Find the light
                    const lightObj = shrineGroup.children.find(c => c instanceof THREE.PointLight);
                    if (lightObj) {
                        lightObj.position.y = 4.5 + hoverHeight;
                        lightObj.intensity = pulseIntensity;
                    }
                });
            });
        }
    };
    
    animationObjects.push(orbAnimation);
}

// Create a simple hut
function createHut(x, y, z) {
    const hut = new THREE.Group();
    hut.position.set(x, y, z);
    
    // Create base platform
    const baseGeometry = new THREE.CylinderGeometry(6, 6, 0.5, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x8D6E63,
        roughness: 0.9
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.receiveShadow = true;
    hut.add(base);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 6,
        height: 0.5,
        position: new THREE.Vector3(x, y + 0.25, z),
        mesh: base
    });
    
    // Create walls
    const wallGeometry = new THREE.CylinderGeometry(5, 5, 4, 16);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xA1887F,
        roughness: 0.7
    });
    
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 2.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    hut.add(walls);
    
    // Add to colliders
    worldObjects.push({
        type: 'cylinder',
        radius: 5,
        height: 4,
        position: new THREE.Vector3(x, y + 2.5, z),
        mesh: walls
    });
    
    // Create roof
    const roofGeometry = new THREE.ConeGeometry(6.5, 3, 16);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x4E342E,
        roughness: 0.8
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 6;
    roof.castShadow = true;
    hut.add(roof);
    
    // Create entrance
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3E2723,
        roughness: 0.7
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.5, 5);
    hut.add(door);
    
    // Create windows
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xE0F7FA,
        transparent: true,
        opacity: 0.7
    });
    
    const windowGeometry = new THREE.CircleGeometry(0.7, 16);
    
    // Add windows around the hut
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + Math.PI/5;
        
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
            Math.sin(angle) * 5,
            2.5,
            Math.cos(angle) * 5
        );
        window.rotation.y = angle;
        hut.add(window);
    }
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(hut.clone());
    });
}

// Create a supply crate
function createSupplyCrate(x, z) {
    const crate = new THREE.Group();
    crate.position.set(x, 0, z);
    
    // Create crate body
    const crateGeometry = new THREE.BoxGeometry(2, 2, 2);
    const crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x8D6E63,
        roughness: 0.8
    });
    
    const crateBody = new THREE.Mesh(crateGeometry, crateMaterial);
    crateBody.position.y = 1;
    crateBody.castShadow = true;
    crateBody.receiveShadow = true;
    crate.add(crateBody);
    
    // Add to colliders
    worldObjects.push({
        type: 'box',
        width: 2,
        height: 2,
        depth: 2,
        position: new THREE.Vector3(x, 1, z),
        mesh: crateBody
    });
    
    // Add some supplies on top
    const supplyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const supplyMaterial = new THREE.MeshStandardMaterial({
        color: 0xBDBDBD,
        roughness: 0.7
    });
    
    const supply = new THREE.Mesh(supplyGeometry, supplyMaterial);
    supply.position.set(0, 2.5, 0);
    supply.castShadow = true;
    crate.add(supply);
    
    // Add to both scenes
    players.forEach(player => {
        player.scene.add(crate.clone());
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
