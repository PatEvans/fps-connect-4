// Animation Module

// Array to store active animations
const activeAnimations = [];

// Array for persistent animation objects
let animationObjects = [];

// Update animations
function updateAnimations() {
    for (let i = activeAnimations.length - 1; i >= 0; i--) {
        const animation = activeAnimations[i];
        const isActive = animation.update();
        
        if (!isActive) {
            activeAnimations.splice(i, 1);
        }
    }
}

// Create particles for sliding effect
function createSlideParticles(path, color) {
    const particleCount = 30;
    const particles = [];
    
    // Create particle geometries
    for (let i = 0; i < particleCount; i++) {
        // Create a small glowing sphere
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            emissive: color,
            emissiveIntensity: 0.5
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Add to both scenes
        players.forEach(player => {
            const particleClone = particle.clone();
            player.scene.add(particleClone);
            
            // Set a random point along the path
            const t = Math.random();
            const position = path.getPoint(t);
            particleClone.position.copy(position);
            
            // Add to the array with scene reference
            particles.push({
                mesh: particleClone,
                scene: player.scene,
                t: t,
                speed: 0.2 + Math.random() * 0.3,
                life: 1.0
            });
        });
    }
    
    // Create an animation for the particles
    const particleAnimation = {
        duration: 1500,
        startTime: Date.now(),
        update: function() {
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // Update each particle
            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];
                
                // Move along the path
                particle.t += particle.speed * 0.01;
                if (particle.t > 1) particle.t = 0;
                
                const position = path.getPoint(particle.t);
                particle.mesh.position.copy(position);
                
                // Fade out over time
                particle.life = 1.0 - progress;
                particle.mesh.material.opacity = particle.life * 0.7;
                
                // Scale down
                const scale = particle.life * 0.3;
                particle.mesh.scale.set(scale, scale, scale);
            }
            
            // Remove particles when done
            if (progress >= 1) {
                for (let i = 0; i < particles.length; i++) {
                    particles[i].scene.remove(particles[i].mesh);
                }
                return false;
            }
            
            return true;
        }
    };
    
    activeAnimations.push(particleAnimation);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update each player
    players.forEach(player => {
        updatePlayer(player, deltaTime);
    });
    
    // Update animations
    updateAnimations();
    
    // Update custom animation objects
    for (let i = 0; i < animationObjects.length; i++) {
        if (animationObjects[i].update) {
            animationObjects[i].update(deltaTime);
        }
    }
    
    // Update minimap
    updateMinimap();
    
    // Animate particles in winning line
    if (winningLine) {
        players.forEach(player => {
            player.scene.children.forEach(child => {
                if (child.userData && child.userData.basePosition) {
                    child.userData.time += deltaTime * (child.userData.speed || 2);
                    
                    // Orbit around the base position
                    const orbit = 0.5 * Math.sin(child.userData.time);
                    child.position.z = child.userData.basePosition.z + orbit;
                    
                    // Pulsate size
                    const scale = 0.8 + 0.4 * Math.sin(child.userData.time * 2);
                    child.scale.set(scale, scale, scale);
                }
            });
            
            // Rotate winning lines
            const winningLines = player.scene.children.filter(child => 
                child.geometry && child.geometry.type === "CylinderGeometry" && 
                child.material && child.material.color.getHex() === 0x00ff8a
            );
            
            winningLines.forEach(line => {
                line.rotation.z += deltaTime * 0.5;
            });
        });
    }
    
    // Render each player's view
    players.forEach(player => {
        player.renderer.render(player.scene, player.camera);
    });
}
