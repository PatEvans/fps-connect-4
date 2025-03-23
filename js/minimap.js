// Minimap Module

// Minimap variables
let minimapCanvas1, minimapCanvas2;
let minimapContext1, minimapContext2;
let minimapScale = 2.5; // Scale factor for the map (pixels per world unit)
let minimapSize = 200; // Minimap size in pixels
let minimapCenter = minimapSize / 2;
let tubeLocations = []; // Will store tube entry points

// Initialize the minimap
function initMinimap() {
    // Get canvas elements
    minimapCanvas1 = document.getElementById('minimap1Canvas');
    minimapCanvas2 = document.getElementById('minimap2Canvas');
    
    // Set canvas dimensions
    minimapCanvas1.width = minimapSize;
    minimapCanvas1.height = minimapSize;
    minimapCanvas2.width = minimapSize;
    minimapCanvas2.height = minimapSize;
    
    // Get contexts
    minimapContext1 = minimapCanvas1.getContext('2d');
    minimapContext2 = minimapCanvas2.getContext('2d');
    
    // Store tube locations for the minimap
    tubes.forEach(tube => {
        const entryPoint = tube.userData.path.getPoint(0);
        const tubeColor = new THREE.Color(tube.material.color.getHex());
        
        tubeLocations.push({
            x: entryPoint.x,
            z: entryPoint.z,
            color: `rgb(${Math.round(tubeColor.r * 255)}, ${Math.round(tubeColor.g * 255)}, ${Math.round(tubeColor.b * 255)})`,
            number: tube.userData.column + 1
        });
    });
}

// Update the minimap to show current game state
function updateMinimap() {
    // Check if contexts are initialized before attempting to use them
    if (!minimapContext1 || !minimapContext2) {
        console.warn('Minimap contexts not initialized');
        return;
    }
    
    // Clear both minimaps
    minimapContext1.clearRect(0, 0, minimapSize, minimapSize);
    minimapContext2.clearRect(0, 0, minimapSize, minimapSize);
    
    // Draw background
    minimapContext1.fillStyle = 'rgba(0, 0, 0, 0.4)';
    minimapContext1.fillRect(0, 0, minimapSize, minimapSize);
    minimapContext2.fillStyle = 'rgba(0, 0, 0, 0.4)';
    minimapContext2.fillRect(0, 0, minimapSize, minimapSize);
    
    // Draw map boundaries
    drawMapBoundaries(minimapContext1);
    drawMapBoundaries(minimapContext2);
    
    // Draw roads
    drawRoads(minimapContext1);
    drawRoads(minimapContext2);
    
    // Draw buildings
    drawBuildings(minimapContext1);
    drawBuildings(minimapContext2);
    
    // Draw tubes
    drawTubeLocations(minimapContext1);
    drawTubeLocations(minimapContext2);
    
    // Draw connect 4 board
    drawGameBoard(minimapContext1);
    drawGameBoard(minimapContext2);
    
    // Draw players (with different colors for each minimap to highlight "you")
    drawPlayers(minimapContext1, 0); // 0 means player 1 is "you"
    drawPlayers(minimapContext2, 1); // 1 means player 2 is "you"
}

// Draw map boundaries
function drawMapBoundaries(context) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 1;
    context.strokeRect(
        minimapCenter - 75 * minimapScale, 
        minimapCenter - 75 * minimapScale, 
        150 * minimapScale, 
        150 * minimapScale
    );
}

// Draw roads
function drawRoads(context) {
    context.fillStyle = '#555555';
    
    // Main road
    context.fillRect(
        minimapCenter - 5 * minimapScale,
        minimapCenter - 40 * minimapScale,
        10 * minimapScale,
        80 * minimapScale
    );
    
    // Cross road
    context.fillRect(
        minimapCenter - 30 * minimapScale,
        minimapCenter + 15 * minimapScale,
        60 * minimapScale,
        10 * minimapScale
    );
}

// Draw major buildings
function drawBuildings(context) {
    // Blue house
    context.fillStyle = '#4fc3f7';
    context.fillRect(
        minimapCenter + (-25 - 9) * minimapScale,
        minimapCenter + (-25 - 7) * minimapScale,
        18 * minimapScale,
        14 * minimapScale
    );
    
    // Yellow house
    context.fillStyle = '#FFD54F';
    context.fillRect(
        minimapCenter + (25 - 9) * minimapScale,
        minimapCenter + (-25 - 7) * minimapScale,
        18 * minimapScale,
        14 * minimapScale
    );
    
    // Gazebo
    context.fillStyle = '#8B4513';
    context.beginPath();
    context.arc(
        minimapCenter + 0 * minimapScale,
        minimapCenter + 15 * minimapScale,
        8 * minimapScale,
        0,
        Math.PI * 2
    );
    context.fill();
    
    // Bus
    context.fillStyle = '#FDD835';
    context.fillRect(
        minimapCenter + (-15 - 3.5) * minimapScale,
        minimapCenter + (32 - 8) * minimapScale,
        7 * minimapScale,
        16 * minimapScale
    );
    
    // Truck
    context.fillStyle = '#D32F2F';
    context.fillRect(
        minimapCenter + (35 - 2.5) * minimapScale,
        minimapCenter + (10 - 5) * minimapScale,
        5 * minimapScale,
        10 * minimapScale
    );
}

// Draw tube entry locations
function drawTubeLocations(context) {
    tubeLocations.forEach(tube => {
        // Draw a circle for each tube
        context.fillStyle = tube.color;
        context.beginPath();
        context.arc(
            minimapCenter + tube.x * minimapScale,
            minimapCenter + tube.z * minimapScale,
            4,
            0,
            Math.PI * 2
        );
        context.fill();
        
        // Add tube number
        context.fillStyle = 'white';
        context.font = '7px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(
            tube.number.toString(),
            minimapCenter + tube.x * minimapScale,
            minimapCenter + tube.z * minimapScale
        );
    });
}

// Draw the Connect 4 game board
function drawGameBoard(context) {
    // Board position
    const boardX = 0;
    const boardZ = -20;
    
    context.fillStyle = '#1a56e8';
    context.fillRect(
        minimapCenter + (boardX - 14) * minimapScale,
        minimapCenter + (boardZ - 1) * minimapScale,
        28 * minimapScale,
        2 * minimapScale
    );
}

// Draw players on the minimap
function drawPlayers(context, currentPlayerIndex) {
    players.forEach((player, index) => {
        // Set color - highlight current player, other player in their color
        if (index === currentPlayerIndex) {
            context.fillStyle = player.color === 'Red' ? '#ff3b30' : '#ffcc00';
            context.strokeStyle = 'white';
            context.lineWidth = 2;
        } else {
            context.fillStyle = player.color === 'Red' ? '#ff3b30' : '#ffcc00';
            context.strokeStyle = 'black';
            context.lineWidth = 1;
        }
        
        // Draw player dot
        const x = minimapCenter + player.collider.position.x * minimapScale;
        const z = minimapCenter + player.collider.position.z * minimapScale;
        
        // Draw with directional indicator (sort of an arrow shape)
        context.beginPath();
        
        // Get player's forward direction
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        // Calculate points for a triangle facing the direction
        const tipX = x + forward.x * 8;
        const tipZ = z + forward.z * 8;
        
        // Create a triangle
        context.beginPath();
        context.moveTo(tipX, tipZ);
        
        // Calculate points perpendicular to the forward direction
        const perpX = -forward.z;
        const perpZ = forward.x;
        
        context.lineTo(x - forward.x * 4 + perpX * 4, z - forward.z * 4 + perpZ * 4);
        context.lineTo(x - forward.x * 4 - perpX * 4, z - forward.z * 4 - perpZ * 4);
        context.closePath();
        
        context.fill();
        context.stroke();
    });
}

// Show a notification when a player approaches a tube
function showTubeNotification(player, tubeIndex) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'tube-notification';
    notification.innerText = `Tube ${tubeIndex + 1} Entry`;
    
    // Style based on tube color
    const tubeColor = tubes[tubeIndex].material.color;
    notification.style.borderLeft = `4px solid rgb(${tubeColor.r * 255}, ${tubeColor.g * 255}, ${tubeColor.b * 255})`;
    
    // Add to the correct player's side
    if (player.id === 1) {
        notification.style.left = '25%';
        document.getElementById('player1Canvas').appendChild(notification);
    } else {
        notification.style.left = '75%';
        document.getElementById('player2Canvas').appendChild(notification);
    }
    
    // Remove after animation completes
    setTimeout(() => {
        notification.remove();
    }, 2500);
}
