// Utility Functions

// Find the positions of the winning pieces
function findWinningPositions(state, winnerColor) {
    // Helper function to check four pieces
    function checkFour(positions) {
        const [a, b, c, d] = positions;
        if (state[a.row][a.col] !== null && 
            state[a.row][a.col] === state[b.row][b.col] && 
            state[b.row][b.col] === state[c.row][c.col] && 
            state[c.row][c.col] === state[d.row][d.col]) {
            return {
                start: a,
                end: d
            };
        }
        return null;
    }
    
    // Check horizontal
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            const result = checkFour([
                {row, col},
                {row, col: col+1},
                {row, col: col+2},
                {row, col: col+3}
            ]);
            
            if (result) return result;
        }
    }
    
    // Check vertical
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 7; col++) {
            const result = checkFour([
                {row, col},
                {row: row+1, col},
                {row: row+2, col},
                {row: row+3, col}
            ]);
            
            if (result) return result;
        }
    }
    
    // Check diagonal (down-right)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            const result = checkFour([
                {row, col},
                {row: row+1, col: col+1},
                {row: row+2, col: col+2},
                {row: row+3, col: col+3}
            ]);
            
            if (result) return result;
        }
    }
    
    // Check diagonal (up-right)
    for (let row = 3; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            const result = checkFour([
                {row, col},
                {row: row-1, col: col+1},
                {row: row-2, col: col+2},
                {row: row-3, col: col+3}
            ]);
            
            if (result) return result;
        }
    }
    
    return null;
}

// Find the lowest empty row in a column
function findLowestEmptyRow(gameState, column) {
    for (let row = 5; row >= 0; row--) {
        if (gameState[row][column] === null) {
            return row;
        }
    }
    return -1; // Column is full
}

// Add objects to both player scenes
function addToAllScenes(object) {
    players.forEach(player => {
        player.scene.add(object.clone());
    });
}

// Sync scenes by ensuring all objects exist in both scenes
function syncScenes() {
    // Sync game pieces
    pieces.forEach(piece => {
        players.forEach(player => {
            // Find matching piece in player scene
            const matchingPiece = player.scene.children.find(obj => 
                obj.geometry && obj.geometry.type === piece.geometry.type &&
                Math.abs(obj.position.x - piece.position.x) < 0.1 &&
                Math.abs(obj.position.y - piece.position.y) < 0.1 &&
                Math.abs(obj.position.z - piece.position.z) < 0.1
            );
            
            // Add if not found
            if (!matchingPiece) {
                player.scene.add(piece.clone());
            }
        });
    });
    
    // Sync winning line
    if (winningLine) {
        players.forEach(player => {
            const matchingLine = player.scene.children.find(obj => 
                obj.geometry && obj.geometry.type === "CylinderGeometry" &&
                obj.material && obj.material.color.getHex() === 0x00ff8a
            );
            
            if (!matchingLine) {
                player.scene.add(winningLine.clone());
            }
        });
    }
}
