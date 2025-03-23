// Player Module

// Create a player
function createPlayer(player) {
    // Create an invisible collider for physics
    player.collider = new THREE.Object3D();
    player.collider.position.copy(player.position);
    player.scene.add(player.collider);
    
    // Add a visible representation for the player
    const playerGroup = new THREE.Group();
    
    // Main body sphere
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const playerMaterial = new THREE.MeshStandardMaterial({
        color: player.colorHex,
        roughness: 0.3,
        metalness: 0.7,
        emissive: player.colorHex,
        emissiveIntensity: 0.2
    });
    
    const body = new THREE.Mesh(bodyGeometry, playerMaterial);
    body.castShadow = true;
    playerGroup.add(body);
    
    // Add smaller spheres around for more visual detail
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 0.4;
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        const detailGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const detail = new THREE.Mesh(detailGeometry, playerMaterial);
        detail.position.set(x, y, 0.5);
        detail.castShadow = true;
        playerGroup.add(detail);
    }
    
    // Add a trail effect
    const trailGeometry = new THREE.ConeGeometry(0.5, 1.5, 16);
    const trailMaterial = new THREE.MeshStandardMaterial({
        color: player.colorHex,
        transparent: true,
        opacity: 0.6,
        emissive: player.colorHex,
        emissiveIntensity: 0.3
    });
    
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.x = Math.PI;
    trail.position.z = -1;
    playerGroup.add(trail);
    
    player.object = playerGroup;
    player.collider.add(playerGroup);
    
    // Set camera position and attach to player
    player.camera.position.set(0, 1.2, 3); // Slightly above and behind the player
    player.collider.add(player.camera);
    
    // Ensure proper initial collision detection with multiple checks
    for (let i = 0; i < 3; i++) {
        checkCollisions(player);
    }
    player.onGround = true;
    player.canJump = true;
    
    // Add player to other player's scene (simplified version)
    const otherPlayer = players.find(p => p.id !== player.id);
    const otherPlayerObj = new THREE.Group();
    
    const otherPlayerBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshStandardMaterial({
            color: player.colorHex,
            roughness: 0.3,
            metalness: 0.7,
            emissive: player.colorHex,
            emissiveIntensity: 0.2
        })
    );
    
    otherPlayerObj.add(otherPlayerBody);
    
    // Add name label above player
    const labelGeometry = new THREE.BoxGeometry(2, 0.5, 0.1);
    const labelMaterial = new THREE.MeshBasicMaterial({
        color: player.colorHex,
        emissive: player.colorHex,
        emissiveIntensity: 0.5
    });
    
    const nameLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    nameLabel.position.set(0, 1.5, 0);
    otherPlayerObj.add(nameLabel);
    
    // Add to the other player's scene
    const otherPlayerCollider = new THREE.Object3D();
    otherPlayerCollider.position.copy(player.position);
    otherPlayerCollider.add(otherPlayerObj);
    otherPlayer.scene.add(otherPlayerCollider);
    
    // Store reference to this other player view
    player.otherView = {
        collider: otherPlayerCollider,
        object: otherPlayerObj
    };
}

// Update player physics and movement
function updatePlayer(player, deltaTime) {
    if (!gameStarted || player.inTube) return;
    
    // Get player's forward and right directions relative to the camera
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.camera.quaternion);
    forward.y = 0; // Keep movement on xz plane
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.camera.quaternion);
    right.y = 0;
    right.normalize();
    
    // Calculate movement direction
    const movementDirection = new THREE.Vector3(0, 0, 0);
    
    // Only allow movement after stabilization period
    if (gameStabilized) {
        if (player.moveForward) movementDirection.add(forward);
        if (player.moveBackward) movementDirection.sub(forward);
        if (player.moveRight) movementDirection.add(right);
        if (player.moveLeft) movementDirection.sub(right);
    }
    
    // Normalize if moving diagonally
    if (movementDirection.length() > 0) {
        movementDirection.normalize();
    }
    
    // Apply movement
    const velocity = movementDirection.multiplyScalar(moveSpeed * deltaTime);
    player.collider.position.add(velocity);
    
    // Apply gravity
    if (!player.onGround) {
        player.velocity.y -= gravity * deltaTime;
    }
    
    // Update vertical position
    player.collider.position.y += player.velocity.y * deltaTime;
    
    // Check for collisions
    player.onGround = false;
    checkCollisions(player);
    
    // Check if player has entered a tube
    checkTubeEntry(player);
    
    // Check for falling off the world
    if (player.collider.position.y < -20) {
        resetPlayerPosition(player);
    }
    
    // Animate player's trail based on movement
    if (player.object && player.object.children && player.object.children.length > 0) {
        // Find the trail (last child)
        const trail = player.object.children[player.object.children.length - 1];
        if (trail) {
            // Scale the trail based on movement speed
            const speed = movementDirection.length();
            trail.scale.z = 1 + speed * 3;
            
            // Make trail more transparent when not moving
            if (speed > 0.1) {
                trail.material.opacity = 0.6;
            } else {
                trail.material.opacity = 0.3;
            }
        }
    }
    
    // Update player's rotation based on movement direction
    if (movementDirection.length() > 0) {
        // Calculate rotation to face movement direction
        const targetRotation = Math.atan2(movementDirection.x, movementDirection.z);
        
        // Smoothly rotate toward movement direction
        const currentRotation = player.object.rotation.y;
        const rotationDiff = targetRotation - currentRotation;
        
        // Handle angle wrapping
        const wrappedDiff = ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
        
        // Apply smooth rotation
        player.object.rotation.y += wrappedDiff * 5 * deltaTime;
    }
    
    // Update other player's view of this player
    const otherPlayer = players.find(p => p.id !== player.id);
    if (otherPlayer && player.otherView) {
        player.otherView.collider.position.copy(player.collider.position);
        player.otherView.object.rotation.copy(player.object.rotation);
    }
}

// Check for collisions with world objects
function checkCollisions(player) {
    const playerRadius = 1;
    const playerPosition = player.collider.position.clone();
    
    for (const object of worldObjects) {
        if (object.type === 'box') {
            // Simple box collision
            const box = {
                minX: object.position.x - object.width / 2,
                maxX: object.position.x + object.width / 2,
                minY: object.position.y - object.height / 2,
                maxY: object.position.y + object.height / 2,
                minZ: object.position.z - object.depth / 2,
                maxZ: object.position.z + object.depth / 2
            };
            
            // Check if player is above the box
            if (playerPosition.x >= box.minX - playerRadius &&
                playerPosition.x <= box.maxX + playerRadius &&
                playerPosition.z >= box.minZ - playerRadius &&
                playerPosition.z <= box.maxZ + playerRadius) {
                
                const playerBottom = playerPosition.y - playerRadius;
                const boxTop = box.maxY;
                
                // If player is close to the top of the box and falling
                if (playerBottom <= boxTop + 0.5 && playerBottom >= boxTop - 0.2 && player.velocity.y <= 0) {
                    player.collider.position.y = boxTop + playerRadius;
                    player.velocity.y = 0;
                    player.onGround = true;
                    player.canJump = true;
                }
            }
        }
        else if (object.type === 'plane') {
            // Plane collision (for ground/floor)
            const planeY = object.position.y;
            
            // If player is close enough to the plane
            const playerBottom = playerPosition.y - playerRadius;
            
            // Check if player is within the plane's boundaries
            if (Math.abs(playerPosition.x - object.position.x) <= object.width / 2 &&
                Math.abs(playerPosition.z - object.position.z) <= object.height / 2) {
                
                // If player is close to the plane's surface and falling
                if (playerBottom <= planeY + 0.5 && playerBottom >= planeY - 0.2 && player.velocity.y <= 0) {
                    player.collider.position.y = planeY + playerRadius;
                    player.velocity.y = 0;
                    player.onGround = true;
                    player.canJump = true;
                }
            }
        }
        else if (object.type === 'cylinder') {
            // Cylinder collision (for posts, trees, etc.)
            const dx = playerPosition.x - object.position.x;
            const dz = playerPosition.z - object.position.z;
            const horizontalDist = Math.sqrt(dx * dx + dz * dz);
            
            // If player is within the cylinder's radius
            if (horizontalDist < object.radius + playerRadius) {
                // Check vertical collision
                const playerBottom = playerPosition.y - playerRadius;
                const cylinderTop = object.position.y + object.height / 2;
                
                // If player is close to the top of the cylinder and falling
                if (playerBottom <= cylinderTop + 0.5 && playerBottom >= cylinderTop - 0.2 && player.velocity.y <= 0) {
                    player.collider.position.y = cylinderTop + playerRadius;
                    player.velocity.y = 0;
                    player.onGround = true;
                    player.canJump = true;
                }
            }
        }
    }
    
    // Check collisions with other players
    const otherPlayer = players.find(p => p.id !== player.id);
    if (otherPlayer && otherPlayer.collider) {
        const otherPosition = otherPlayer.collider.position.clone();
        const distance = playerPosition.distanceTo(otherPosition);
        
        // If players are colliding
        if (distance < playerRadius * 2) {
            // Simple push back (half the overlap distance)
            const pushDirection = new THREE.Vector3()
                .subVectors(playerPosition, otherPosition)
                .normalize();
            
            const overlapDistance = playerRadius * 2 - distance;
            const pushAmount = overlapDistance * 0.5;
            
            // Move both players
            player.collider.position.add(
                pushDirection.clone().multiplyScalar(pushAmount)
            );
            
            otherPlayer.collider.position.add(
                pushDirection.clone().multiplyScalar(-pushAmount)
            );
        }
    }
}

// Check if player has entered a tube
function checkTubeEntry(player) {
    if (player.inTube || winner) return;
    
    const playerPosition = player.collider.position.clone();
    
    // Check each tube
    for (let i = 0; i < tubes.length; i++) {
        const tube = tubes[i];
        const tubePath = tube.userData.path;
        const tubeStart = tubePath.getPoint(0);
        
        // Calculate distance to tube entrance
        const distanceToEntrance = playerPosition.distanceTo(tubeStart);
        
        // Show notification when player is near a tube (but not extremely close yet)
        if (distanceToEntrance < 10.0 && Math.abs(playerPosition.y - tubeStart.y) < 3) {
            // If this is a new tube proximity
            if (player.nearTube !== i) {
                player.nearTube = i;
                showTubeNotification(player, i);
            }
        } else if (player.nearTube === i) {
            // Player moved away from this tube
            player.nearTube = -1;
        }
        
        // Much wider detection radius for actually entering
        if (distanceToEntrance < 3.0 && Math.abs(playerPosition.y - tubeStart.y) < 1.5) {
            console.log(`Player ${player.id} entering tube: ${i}`);
            enterTube(player, tube.userData.column);
            break;
        }
    }
}

// Enter a tube and slide down
function enterTube(player, column) {
    if (winner || player.inTube) return;
    
    console.log(`Player ${player.id} sliding down tube ${column}`);
    player.inTube = true;
    player.selectedColumn = column;
    
    // Hide the player during sliding
    player.object.visible = false;
    
    // Hide in other player's view too
    const otherPlayer = players.find(p => p.id !== player.id);
    if (otherPlayer && player.otherView) {
        player.otherView.object.visible = false;
    }
    
    // Get the tube
    const tube = tubes[column];
    const tubePath = tube.userData.path;
    
    // Create slide animation along tube path
    const slideAnimation = {
        duration: 1500, // Fast slide (1.5 sec)
        startTime: Date.now(),
        player: player,
        path: tubePath,
        update: function() {
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // Accelerate as the player slides down
            const easeProgress = Math.pow(progress, 1.5);
            
            // Get position along the tube
            const point = this.path.getPoint(easeProgress);
            this.player.collider.position.copy(point);
            
            // Update other player's view
            const otherPlayer = players.find(p => p.id !== this.player.id);
            if (otherPlayer && this.player.otherView) {
                this.player.otherView.collider.position.copy(point);
            }
            
            // Rotate to face direction of movement
            if (progress < 0.95) {
                const tangent = this.path.getTangent(easeProgress);
                const lookTarget = point.clone().add(tangent);
                
                // Adjust camera to follow the curve
                this.player.camera.lookAt(lookTarget);
            }
            
            // When animation is complete
            if (progress >= 1) {
                placeGamePiece(this.player, column);
                return false;
            }
            
            return true;
        }
    };
    
    activeAnimations.push(slideAnimation);
    
    // Add particle effects for the slide
    createSlideParticles(tubePath, new THREE.Color(tube.material.color.getHex()));
}

// Reset player position after placing a piece
function resetPlayerPosition(player) {
    player.inTube = false;
    player.object.visible = true;
    player.collider.position.copy(player.position);
    player.velocity.set(0, 0, 0);
    
    // Reset camera orientation
    player.camera.position.set(0, 1.2, 3);
    player.camera.lookAt(0, 0, 0);
    
    // Make visible in other player's scene
    const otherPlayer = players.find(p => p.id !== player.id);
    if (otherPlayer && player.otherView) {
        player.otherView.object.visible = true;
        player.otherView.collider.position.copy(player.position);
    }
}

// Handle keydown events
function onKeyDown(event) {
    if (!gameStarted) return;
    
    // Check which player's controls were activated
    players.forEach(player => {
        switch (event.code) {
            case player.controls.forward:
                player.moveForward = true;
                break;
            case player.controls.left:
                player.moveLeft = true;
                break;
            case player.controls.backward:
                player.moveBackward = true;
                break;
            case player.controls.right:
                player.moveRight = true;
                break;
            case player.controls.jump:
                if (player.canJump) {
                    player.velocity.y = jumpForce;
                    player.canJump = false;
                }
                break;
        }
    });
}

// Handle keyup events
function onKeyUp(event) {
    // Check which player's controls were released
    players.forEach(player => {
        switch (event.code) {
            case player.controls.forward:
                player.moveForward = false;
                break;
            case player.controls.left:
                player.moveLeft = false;
                break;
            case player.controls.backward:
                player.moveBackward = false;
                break;
            case player.controls.right:
                player.moveRight = false;
                break;
        }
    });
}
