// Game Logic Module

// Render the 2D board
function render2DBoard() {
    const ctx = board2DContext;
    const cellWidth = 30;
    const cellHeight = 30;
    
    // Clear the canvas
    ctx.clearRect(0, 0, board2DCanvas.width, board2DCanvas.height);
    
    // Draw board background
    ctx.fillStyle = '#1a56e8'; // Blue background
    ctx.fillRect(0, 0, board2DCanvas.width, board2DCanvas.height);
    
    // Draw grid cells
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            // Draw cell background
            ctx.fillStyle = '#000814'; // Dark blue for empty cells
            ctx.beginPath();
            ctx.arc(col * cellWidth + cellWidth/2, row * cellHeight + cellHeight/2, cellWidth/2 - 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw game pieces
            if (gameState[row][col] !== null) {
                ctx.fillStyle = gameState[row][col] === 'Red' ? '#ff3b30' : '#ffcc00';
                ctx.beginPath();
                ctx.arc(col * cellWidth + cellWidth/2, row * cellHeight + cellHeight/2, cellWidth/2 - 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Add highlight
                ctx.fillStyle = gameState[row][col] === 'Red' ? '#ff6e66' : '#ffe066';
                ctx.beginPath();
                ctx.arc(col * cellWidth + cellWidth/2 - 5, row * cellHeight + cellHeight/2 - 5, 
                        cellWidth/4 - 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // If there's a winning line, highlight it
    const winningPositions = winner && winner !== 'Draw' ? findWinningPositions(gameState, winner) : null;
    if (winningPositions) {
        const startRow = winningPositions.start.row;
        const startCol = winningPositions.start.col;
        const endRow = winningPositions.end.row;
        const endCol = winningPositions.end.col;
        
        // Draw a line connecting winning pieces
        ctx.strokeStyle = '#00ff8a'; // Bright green
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startCol * cellWidth + cellWidth/2, startRow * cellHeight + cellHeight/2);
        ctx.lineTo(endCol * cellWidth + cellWidth/2, endRow * cellHeight + cellHeight/2);
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = '#00ff8a';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Draw column numbers
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    for (let col = 0; col < 7; col++) {
        ctx.fillText((col + 1).toString(), col * cellWidth + cellWidth/2, board2DCanvas.height - 4);
    }
}

// Create a game piece (red or yellow disc)
function createGamePiece(column, row, isRed) {
    const cellSize = 4;
    
    // Get the Connect 4 board position
    // Board is at position (0, 12, -5)
    // Calculate the local position in the board
    const boardHeight = 24;
    const x = (column - 3) * cellSize;
    const y = (2.5 - row) * cellSize - boardHeight/2;
    const z = -5;
    
    // Convert to world position by adding board position
    const worldX = x;
    const worldY = y + 12; // Add board's Y position
    const worldZ = z;
    
    // Create the disc
    const discGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.6, 32);
    const discMaterial = new THREE.MeshStandardMaterial({
        color: isRed ? 0xff3b30 : 0xffcc00, // Red or Yellow
        roughness: 0.2,
        metalness: 0.7,
        emissive: isRed ? 0xff3b30 : 0xffcc00,
        emissiveIntensity: 0.2
    });
    
    const disc = new THREE.Mesh(discGeometry, discMaterial);
    disc.rotation.x = Math.PI / 2; // Rotate to face forward
    disc.position.set(worldX, worldY, worldZ);
    disc.castShadow = true;
    
    // Add to both player scenes
    players.forEach(player => {
        player.scene.add(disc.clone());
    });
    
    pieces.push(disc);
    
    // Animate the piece dropping into place
    const startY = worldY + 10; // Start 10 units above final position
    
    // Set initial position in both scenes
    players.forEach(player => {
        const piece = player.scene.children.find(child => 
            child.geometry && child.geometry.type === "CylinderGeometry" &&
            child.geometry.parameters.radiusTop === 1.8 &&
            Math.abs(child.position.x - worldX) < 0.1 &&
            Math.abs(child.position.z - worldZ) < 0.1
        );
        
        if (piece) {
            piece.position.y = startY;
        }
    });
    
    const dropAnimation = {
        duration: 1000,
        startTime: Date.now(),
        startY: startY,
        endY: worldY,
        worldX: worldX,
        worldZ: worldZ,
        update: function() {
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // Bounce easing
            function bounce(t) {
                const n1 = 7.5625;
                const d1 = 2.75;
                
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            }
            
            const yPos = this.startY + (this.endY - this.startY) * bounce(progress);
            const zRot = progress * Math.PI * 4;
            
            // Update in both scenes
            players.forEach(player => {
                const piece = player.scene.children.find(child => 
                    child.geometry && child.geometry.type === "CylinderGeometry" &&
                    child.geometry.parameters.radiusTop === 1.8 &&
                    Math.abs(child.position.x - this.worldX) < 0.1 &&
                    Math.abs(child.position.z - this.worldZ) < 0.1
                );
                
                if (piece) {
                    piece.position.y = yPos;
                    piece.rotation.z = zRot;
                }
            });
            
            return progress < 1;
        }
    };
    
    activeAnimations.push(dropAnimation);
    
    // Update the 2D board
    render2DBoard();
    
    return disc;
}

// Place a game piece after sliding down a tube
function placeGamePiece(player, column) {
    if (winner) {
        resetPlayerPosition(player);
        return;
    }
    
    // Find the lowest empty row in the selected column
    const row = findLowestEmptyRow(gameState, column);
    
    // If column is full, reset player without placing a piece
    if (row === -1) {
        console.log(`Column ${column} is full!`);
        resetPlayerPosition(player);
        return;
    }
    
    console.log(`Player ${player.id} placing ${player.color} piece in column ${column}, row ${row}`);
    
    // Update game state
    gameState[row][column] = player.color;
    
    // Create the piece
    createGamePiece(column, row, player.color === 'Red');
    
    // Check for winner
    const newWinner = checkWinner(gameState);
    if (newWinner) {
        winner = newWinner;
        showGameControls(newWinner);
        
        // Highlight winning line
        highlightWinningLine(newWinner);
        
        // Update 2D board to show winning line
        render2DBoard();
    } else {
        // Check for draw
        const isDraw = checkDraw(gameState);
        if (isDraw) {
            winner = 'Draw';
            showGameControls('Draw');
        }
    }
    
    // Reset player position
    resetPlayerPosition(player);
}

// Check for a winner
function checkWinner(state) {
    // Helper function to check four pieces
    function checkFour(a, b, c, d) {
        return (a !== null && a === b && b === c && c === d);
    }
    
    // Check horizontal
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (checkFour(state[row][col], state[row][col+1], state[row][col+2], state[row][col+3])) {
                return state[row][col];
            }
        }
    }
    
    // Check vertical
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 7; col++) {
            if (checkFour(state[row][col], state[row+1][col], state[row+2][col], state[row+3][col])) {
                return state[row][col];
            }
        }
    }
    
    // Check diagonal (down-right)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            if (checkFour(state[row][col], state[row+1][col+1], state[row+2][col+2], state[row+3][col+3])) {
                return state[row][col];
            }
        }
    }
    
    // Check diagonal (up-right)
    for (let row = 3; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (checkFour(state[row][col], state[row-1][col+1], state[row-2][col+2], state[row-3][col+3])) {
                return state[row][col];
            }
        }
    }
    
    return null;
}

// Check for a draw
function checkDraw(state) {
    return state[0].every(cell => cell !== null);
}

// Highlight the winning line
function highlightWinningLine(winner) {
    const cellSize = 4;
    const winningPositions = findWinningPositions(gameState, winner);
    
    if (winningPositions) {
        const startPos = winningPositions.start;
        const endPos = winningPositions.end;
        
        // Create start and end 3D coordinates
        const startX = (startPos.col - 3) * cellSize;
        const startY = (2.5 - startPos.row) * cellSize - 12;
        const endX = (endPos.col - 3) * cellSize;
        const endY = (2.5 - endPos.row) * cellSize - 12;
        
        const start = new THREE.Vector3(startX, startY, -5);
        const end = new THREE.Vector3(endX, endY, -5);
        
        // Create a glowing line
        const lineGeometry = new THREE.CylinderGeometry(0.2, 0.2, start.distanceTo(end), 8);
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff8a,
            transparent: true,
            opacity: 0.8,
            emissive: 0x00ff8a,
            emissiveIntensity: 1.5
        });
        
        winningLine = new THREE.Mesh(lineGeometry, lineMaterial);
        
        // Position at the midpoint
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        winningLine.position.copy(midpoint);
        
        // Orient the cylinder
        const direction = new THREE.Vector3().subVectors(end, start);
        const arrow = new THREE.ArrowHelper(direction.clone().normalize(), new THREE.Vector3(0, 0, 0), 1);
        winningLine.quaternion.copy(arrow.quaternion);
        winningLine.rotateX(Math.PI / 2);
        
        // Add to both scenes
        players.forEach(player => {
            player.scene.add(winningLine.clone());
        });
        
        // Add particles/stars around the winning line
        for (let i = 0; i < 20; i++) {
            const t = i / 19;
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;
            const z = start.z;
            
            const particleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff8a,
                emissive: 0x00ff8a,
                emissiveIntensity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(x, y, z);
            
            // Add animation data
            particle.userData = {
                time: Math.random() * Math.PI * 2,
                speed: 2 + Math.random() * 3,
                basePosition: new THREE.Vector3(x, y, z)
            };
            
            // Add to both scenes
            players.forEach(player => {
                const particleClone = particle.clone();
                particleClone.userData = { ...particle.userData };
                player.scene.add(particleClone);
            });
            
            pieces.push(particle); // Add to cleanup array
        }
    }
}

// Show game controls with winner message
function showGameControls(winningPlayer) {
    const gameControls = document.getElementById('gameControls');
    const gameStatus = document.getElementById('gameStatus');
    
    if (winningPlayer === 'Draw') {
        gameStatus.innerHTML = "Game ended in a Draw!";
    } else {
        gameStatus.innerHTML = `Player <span id="player${winningPlayer}">${winningPlayer}</span> wins!`;
    }
    
    gameControls.style.display = 'block';
}

// Reset the game
function resetGame() {
    // Clear all pieces from scenes
    pieces.forEach(piece => {
        players.forEach(player => {
            const piecesToRemove = player.scene.children.filter(child => 
                child.geometry && 
                ((child.geometry.type === "CylinderGeometry" && child.geometry.parameters.radiusTop === 1.8) ||
                (child.geometry.type === "SphereGeometry" && child.geometry.parameters.radius === 0.3 && 
                 child.material && child.material.color.getHex() === 0x00ff8a))
            );
            
            piecesToRemove.forEach(p => player.scene.remove(p));
        });
    });
    pieces = [];
    
    // Remove winning line if it exists
    if (winningLine) {
        players.forEach(player => {
            const linesToRemove = player.scene.children.filter(child => 
                child.geometry && child.geometry.type === "CylinderGeometry" && 
                child.material && child.material.color.getHex() === 0x00ff8a
            );
            
            linesToRemove.forEach(line => player.scene.remove(line));
        });
        winningLine = null;
    }
    
    // Reset game state
    gameState = Array(6).fill().map(() => Array(7).fill(null));
    winner = null;
    
    // Reset both players
    players.forEach(player => {
        resetPlayerPosition(player);
    });
    
    // Hide game controls
    document.getElementById('gameControls').style.display = 'none';
    
    // Update 2D board
    render2DBoard();
}

// Handle window resize
function onWindowResize() {
    players.forEach(player => {
        player.camera.aspect = window.innerWidth / 2 / window.innerHeight;
        player.camera.updateProjectionMatrix();
        player.renderer.setSize(window.innerWidth / 2, window.innerHeight);
    });
}
