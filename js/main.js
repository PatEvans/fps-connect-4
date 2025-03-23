// Main Game initialization and global variables

// Game state variables
let winner = null;
let gameStarted = false;
let gameState = Array(6).fill().map(() => Array(7).fill(null));

// Player variables
const players = [
    {
        id: 1,
        color: 'Red',
        colorHex: 0xff3b30,
        position: new THREE.Vector3(-10, 12, 35),
        velocity: new THREE.Vector3(),
        onGround: false,
        inTube: false,
        selectedColumn: -1,
        canJump: false,
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        object: null,
        collider: null,
        camera: null,
        renderer: null,
        scene: null,
        controls: {
            forward: 'KeyW',
            left: 'KeyA',
            backward: 'KeyS',
            right: 'KeyD',
            jump: 'Space'
        }
    },
    {
        id: 2,
        color: 'Yellow',
        colorHex: 0xffcc00,
        position: new THREE.Vector3(10, 12, 35),
        velocity: new THREE.Vector3(),
        onGround: false,
        inTube: false,
        selectedColumn: -1,
        canJump: false,
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        object: null,
        collider: null,
        camera: null,
        renderer: null,
        scene: null,
        controls: {
            forward: 'ArrowUp',
            left: 'ArrowLeft',
            backward: 'ArrowDown',
            right: 'ArrowRight',
            jump: 'Enter'
        }
    }
];

// Physics variables
let gravity = 30;
let jumpForce = 10;
let moveSpeed = 8;

// Three.js shared variables
let clock;
let boardGroup;
let tubes = [];
let columnPositions = [];
let pieces = [];
let winningLine = null;

// Game world variables
let worldObjects = [];

// 2D board variables
let board2DCanvas;
let board2DContext;

// Initialize the game
function init() {
    // Initialize 2D board canvas
    board2DCanvas = document.getElementById('board2DCanvas');
    board2DContext = board2DCanvas.getContext('2d');
    render2DBoard();
    
    // Hide instructions when Start button is clicked
    document.getElementById('startButton').addEventListener('click', () => {
        document.getElementById('instructions').style.display = 'none';
        gameStarted = true;
    });
    
    // Set up clock
    clock = new THREE.Clock();
    
    // Initialize each player's scene and camera
    players.forEach((player, index) => {
        initPlayerView(player, index);
    });
    
    // Create game environment (shared between both players)
    createEnvironment();
    
    // Create players
    players.forEach(player => createPlayer(player));
    
    // Initialize the minimap (adding this back)
    initMinimap();
    
    // Add event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    document.getElementById('resetButton').addEventListener('click', resetGame);
    
    // Start animation loop
    animate();
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', init);
