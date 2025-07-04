import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Initialize device detection - will be updated dynamically
        this.updateDeviceDetection();
        
        // Game states
        this.gameState = 'START'; // 'START', 'PLAYING', 'GAME_OVER', 'LEVEL_COMPLETE', 'DYING'
        
        // Debug mode for collision box adjustment
        this.debugMode = false; // Set to false when done adjusting
        this.selectedCloudIndex = 0; // Currently selected cloud for adjustment
        this.adjustmentStep = 1; // Pixels to move per key press
        
        // Game state
        this.player = null;
        this.sun = null;
        this.clouds = [];
        this.fireballs = [];
        this.gems = [];
        this.key = null;
        this.gate = null;
        
        // UI elements
        this.joystick = null;
        this.shieldButton = null;
        this.shieldDisplays = null;
        this.healthDisplays = null;
        this.startScreen = null;
        this.gameOverScreen = null;
        this.levelCompleteScreen = null;
        
        // Game mechanics
        this.playerHealth = 3; // Player dies after 3 unshielded hits
        this.shieldHealth = 3; // Shield blocks 3 hits before breaking
        this.maxShieldHealth = 3; // Maximum shield health
        this.isShielding = false;
        this.hasKey = false;
        this.gateOpen = false;
        this.levelComplete = false;
        this.invulnerable = false;
        this.lastCloudPosition = { x: 200, y: 850 }; // Updated to match new start position
        
        // Timers
        this.fireballTimer = 0;
        this.fireballInterval = 0.4; // Increased difficulty - faster fireball spawn rate
        this.invulnerabilityTimer = 0;
        
        // Input
        this.joystickInput = { x: 0, y: 0 };
        this.shieldPressed = false;
        
        // Constants
        this.GRAVITY = 1000;
        this.FIREBALL_GRAVITY = 500;
        this.PLAYER_SPEED = 200;
        this.JUMP_VELOCITY = -650; // Increased from -500 for longer jumps
        this.TERMINAL_VELOCITY = 800;
        this.FIREBALL_TERMINAL = 600;
        
        // Debug mode for collision box adjustment
        this.debugMode = false;
        this.selectedCloudIndex = 0;
        this.adjustmentStep = 5;
        this.debugText = null;
        this.debugKeys = null;    }

    updateDeviceDetection() {
        // Device detection and scaling - call this dynamically on orientation change
        this.isMobile = this.detectMobileDevice();
        
        // Enhanced scaling for landscape mobile devices
        if (this.isMobile && this.isLandscape) {
            // Landscape mobile: slightly larger scale since we have more horizontal space
            this.scaleFactor = 0.7;
            this.uiScaleFactor = 0.9;
        } else if (this.isMobile) {
            // Portrait mobile: smaller scale
            this.scaleFactor = 0.5;
            this.uiScaleFactor = 0.7;
        } else {
            // Desktop: full scale
            this.scaleFactor = 1.0;
            this.uiScaleFactor = 1.0;
        }
    }

    detectMobileDevice() {
        // Check for mobile devices using user agent and screen size
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Enhanced mobile detection for landscape mode
        const screenWidth = Math.max(window.innerWidth, window.screen.width);
        const screenHeight = Math.max(window.innerHeight, window.screen.height);
        const isSmallScreen = screenWidth <= 1024 || screenHeight <= 768; // More generous for landscape
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check if device is in landscape mode
        this.isLandscape = screenWidth > screenHeight;
        
        return isMobileUA || (isSmallScreen && isTouchDevice);
    }

    preload() {
        // Add loading progress feedback for debugging deployment issues
        this.load.on('progress', (value) => {
            console.log('Loading progress:', Math.round(value * 100) + '%');
        });
        
        this.load.on('filecomplete', (key, type, data) => {
            console.log('Loaded asset:', key, type);
        });
        
        this.load.on('loaderror', (file) => {
            console.error('Failed to load asset:', file.key, file.src);
        });
        
        // Load all assets from the public folder - using exact names (case-sensitive for deployment)
        this.load.image('bgFull', 'BG full.png');
        this.load.image('blurredBG', 'Blurred BG.png');
        this.load.image('player', 'Psyger-0.png');
        this.load.image('sun', 'Suhn.png');
        this.load.image('fireball', 'Fireball.png');
        this.load.image('cloud1', 'Cloud 1.png');
        this.load.image('cloud2', 'Cloud 2.png');
        this.load.image('cloud3', 'Cloud 3.png');
        this.load.image('gem', 'Gem.png');
        this.load.image('key', 'Key.png');
        this.load.image('gateClose', 'Gate close.png');
        this.load.image('gateOpen', 'Gate open.png');
        this.load.image('shield', 'Shield.png');
        this.load.image('shieldButton', 'Shield button.png');
        
        // UI Screen assets
        this.load.image('gameInfo', 'Game Info.png');
        this.load.image('gameOver', 'Game over.png');
        this.load.image('levelCompleted', 'Level completed.png');
        
        // Health UI assets - exact names (case-sensitive for deployment)
        this.load.image('health1', 'Health 1.png');
        this.load.image('health2', 'health 2.png');
        this.load.image('health3', 'Health 3.png');
        this.load.image('shield1', 'Shield 1.png');
        this.load.image('shield2', 'Shield 2.png');
        this.load.image('shield3', 'Shield 3.png');
        
        // Joystick assets
        this.load.image('joystick1', 'Joystick 1.png');
        this.load.image('joystick2', 'Joystick 2.png');
        this.load.image('joystick3', 'Joystick 3.png');
    }
    
    create() {
        // Create background using 'BG full' - stretch to cover entire screen with mobile scaling
        this.createResponsiveBackground();
        
        // Create start screen
        this.createStartScreen();
        
        // Initialize game objects (but don't make them visible yet)
        this.initializeGameObjects();
        
        // Create input handling
        this.createInput();
        
        // Add orientation change listener for mobile devices
        this.setupOrientationHandlers();
        
        // Start with the start screen
        this.showStartScreen();
    }
    
    createResponsiveBackground() {
        // Create background that adapts to screen size and orientation
        // Add error handling for missing background asset
        try {
            const bg = this.add.image(960, 540, 'bgFull');
            
            // Verify the background loaded properly
            if (!bg || !bg.texture || bg.texture.key === '__MISSING') {
                console.error('Background asset failed to load, using fallback');
                // Create a fallback colored background
                const fallbackBg = this.add.rectangle(960, 540, 1920, 1080, 0x87CEEB);
                this.backgroundImage = fallbackBg;
                return;
            }
            
            if (this.isMobile) {
                // For mobile, ensure background covers the entire screen regardless of orientation
                const gameWidth = this.cameras.main.width;
                const gameHeight = this.cameras.main.height;
                
                // Calculate scale to cover the entire screen
                const scaleX = gameWidth / bg.width;
                const scaleY = gameHeight / bg.height;
                const scale = Math.max(scaleX, scaleY);
                
                bg.setScale(scale);
                bg.setPosition(gameWidth / 2, gameHeight / 2);
            } else {
                // Desktop: use standard size
                bg.setDisplaySize(1920, 1080);
            }
            
            // Store reference for potential updates
            this.backgroundImage = bg;
            console.log('Background created successfully for', this.isMobile ? 'mobile' : 'desktop');
        } catch (error) {
            console.error('Error creating background:', error);
            // Create a fallback colored background
            const fallbackBg = this.add.rectangle(960, 540, 1920, 1080, 0x87CEEB);
            this.backgroundImage = fallbackBg;
        }
    }
    
    updateBackgroundScale() {
        // Update background scaling when orientation changes
        if (this.backgroundImage && this.isMobile) {
            const gameWidth = this.cameras.main.width;
            const gameHeight = this.cameras.main.height;
            
            const scaleX = gameWidth / this.backgroundImage.width;
            const scaleY = gameHeight / this.backgroundImage.height;
            const scale = Math.max(scaleX, scaleY);
            
            this.backgroundImage.setScale(scale);
            this.backgroundImage.setPosition(gameWidth / 2, gameHeight / 2);
        }
    }
    
    createStartScreen() {
        // Create start screen with Game Info asset
        this.startScreen = this.add.container(960, 540);
        
        // Add blurred background for start screen with mobile scaling
        const startBG = this.add.image(0, 0, 'blurredBG');
        if (this.isMobile) {
            const scaleX = this.cameras.main.width / startBG.width;
            const scaleY = this.cameras.main.height / startBG.height;
            const scale = Math.max(scaleX, scaleY);
            startBG.setScale(scale);
        } else {
            startBG.setDisplaySize(1920, 1080);
        }
        
        // Add game info image with mobile scaling
        const gameInfo = this.add.image(0, -100, 'gameInfo');
        gameInfo.setScale(0.8 * this.scaleFactor);
        
        // Add start button text with mobile responsive font size
        let fontSize;
        if (this.isMobile && this.isLandscape) {
            fontSize = '36px'; // Slightly larger for landscape
        } else if (this.isMobile) {
            fontSize = '28px'; // Smaller for portrait mobile
        } else {
            fontSize = '48px'; // Desktop size
        }
        const startText = this.add.text(0, 200, 'TAP TO START', {
            fontSize: fontSize,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add pulsing animation to start text
        this.tweens.add({
            targets: startText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.startScreen.add([startBG, gameInfo, startText]);
        this.startScreen.setDepth(1000);
    }
    
    createGameOverScreen() {
        // Create game over screen with Game Over asset
        this.gameOverScreen = this.add.container(960, 540);
        
        // Add blurred background with mobile scaling
        const gameOverBG = this.add.image(0, 0, 'blurredBG');
        if (this.isMobile) {
            const scaleX = this.cameras.main.width / gameOverBG.width;
            const scaleY = this.cameras.main.height / gameOverBG.height;
            const scale = Math.max(scaleX, scaleY);
            gameOverBG.setScale(scale);
        } else {
            gameOverBG.setDisplaySize(1920, 1080);
        }
        
        // Add game over image with mobile scaling
        const gameOverImage = this.add.image(0, -50, 'gameOver');
        gameOverImage.setScale(0.8 * this.scaleFactor);
        
        // Add restart button text with mobile responsive font size
        let fontSize;
        if (this.isMobile && this.isLandscape) {
            fontSize = '28px'; // Good size for landscape
        } else if (this.isMobile) {
            fontSize = '20px'; // Smaller for portrait mobile
        } else {
            fontSize = '36px'; // Desktop size
        }
        const restartText = this.add.text(0, 150, 'TAP TO RESTART', {
            fontSize: fontSize,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add pulsing animation
        this.tweens.add({
            targets: restartText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.gameOverScreen.add([gameOverBG, gameOverImage, restartText]);
        this.gameOverScreen.setDepth(1000);
        this.gameOverScreen.setVisible(false);
    }
    
    createLevelCompleteScreen() {
        // Create level complete screen with Level Completed asset
        this.levelCompleteScreen = this.add.container(960, 540);
        
        // Add blurred background with mobile scaling
        const completeBG = this.add.image(0, 0, 'blurredBG');
        if (this.isMobile) {
            const scaleX = this.cameras.main.width / completeBG.width;
            const scaleY = this.cameras.main.height / completeBG.height;
            const scale = Math.max(scaleX, scaleY);
            completeBG.setScale(scale);
        } else {
            completeBG.setDisplaySize(1920, 1080);
        }
        
        // Add level completed image with mobile scaling
        const levelCompleteImage = this.add.image(0, -50, 'levelCompleted');
        levelCompleteImage.setScale(0.8 * this.scaleFactor);
        
        // Add next level button text with mobile responsive font size
        let fontSize;
        if (this.isMobile && this.isLandscape) {
            fontSize = '28px'; // Good size for landscape
        } else if (this.isMobile) {
            fontSize = '20px'; // Smaller for portrait mobile
        } else {
            fontSize = '36px'; // Desktop size
        }
        const nextText = this.add.text(0, 150, 'TAP FOR NEXT LEVEL', {
            fontSize: fontSize,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add pulsing animation
        this.tweens.add({
            targets: nextText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.levelCompleteScreen.add([completeBG, levelCompleteImage, nextText]);
        this.levelCompleteScreen.setDepth(1000);
        this.levelCompleteScreen.setVisible(false);
    }
    
    initializeGameObjects() {
        
        // Create sun enemy at top-right corner
        this.sun = this.add.image(1700, 100, 'sun');
        this.sun.setScale(0.8 * this.scaleFactor);
        this.sun.setVisible(false); // Hidden initially
        
        // Create player at bottom-left cloud start position
        // Position player above the first cloud so they can land on it properly
        this.player = this.physics.add.sprite(200, 790, 'player'); // Positioned to land on first cloud
        
        // Apply mobile scaling to player
        const playerDisplayWidth = 48 * this.scaleFactor;
        const playerDisplayHeight = 72 * this.scaleFactor;
        const playerBodyWidth = 36 * this.scaleFactor;
        const playerBodyHeight = 66 * this.scaleFactor;
        
        this.player.setDisplaySize(playerDisplayWidth, playerDisplayHeight);
        this.player.body.setSize(playerBodyWidth, playerBodyHeight);
        this.player.setCollideWorldBounds(false);
        this.player.body.setGravityY(this.GRAVITY);
        this.player.body.setMaxVelocityY(this.TERMINAL_VELOCITY);
        this.player.isGrounded = false; // Start falling to land on cloud
        this.player.setVisible(false); // Hidden initially
        
        // Create clouds with physics using exact positions and cloud types
        this.createClouds();
        
        // Create gems on specific clouds
        this.createGems();
        
        // Create key on third-to-last cloud - positioned above the sixth cloud
        this.key = this.physics.add.sprite(1200, 320, 'key');
        
        // Apply mobile scaling to key
        const keySize = 30 * this.scaleFactor;
        this.key.setDisplaySize(keySize, keySize);
        this.key.body.setImmovable(true);
        this.key.body.setGravityY(0);
        this.key.floatDirection = 1;
        this.key.originalY = 320;
        this.key.setVisible(false); // Hidden initially
        
        // Create gate on final platform - positioned on the last cloud
        this.gate = this.physics.add.sprite(1500, 220, 'gateClose'); // Positioned on final cloud (1500, 250)
        this.gate.body.setImmovable(true);
        this.gate.body.setGravityY(0);
        
        // Apply mobile scaling to gate
        this.gate.setScale(this.scaleFactor);
        
        // Set collision box using optimized values with mobile scaling - increased width for better landing
        const gateCollisionWidth = 300 * this.scaleFactor;
        const gateCollisionHeight = 14.29 * this.scaleFactor;
        const gateOffsetX = -5.52 * this.scaleFactor;
        const gateOffsetY = 315.71 * this.scaleFactor;
        
        this.gate.body.setSize(gateCollisionWidth, gateCollisionHeight);
        this.gate.body.setOffset(gateOffsetX, gateOffsetY);
        this.gate.setVisible(false); // Hidden initially
        
        // Create UI (hidden initially)
        this.createUI();
        
        // Initialize fireballs group
        this.fireballs = this.physics.add.group();
        
        // Create shield effect (initially hidden)
        this.shieldEffect = this.add.image(0, 0, 'shield');
        this.shieldEffect.setScale(this.scaleFactor);
        this.shieldEffect.setVisible(false);
        this.shieldEffect.setAlpha(0.7);
        
        // Create debug text display
        if (this.debugMode) {
            this.debugText = this.add.text(16, 16, '', {
                fontSize: '16px',
                fill: '#00ff00',
                backgroundColor: '#000000',
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }).setScrollFactor(0).setDepth(1000);
            
            this.updateDebugText();
        }
        
        // Setup keyboard input for debug controls
        this.setupDebugControls();
    }
    
    showStartScreen() {
        this.gameState = 'START';
        this.startScreen.setVisible(true);
        
        // Hide all game elements
        this.hideGameElements();
    }
    
    showGameOverScreen() {
        this.gameState = 'GAME_OVER';
        if (!this.gameOverScreen) {
            this.createGameOverScreen();
        }
        this.gameOverScreen.setVisible(true);
        
        // Hide all game elements
        this.hideGameElements();
    }
    
    showLevelCompleteScreen() {
        this.gameState = 'LEVEL_COMPLETE';
        if (!this.levelCompleteScreen) {
            this.createLevelCompleteScreen();
        }
        this.levelCompleteScreen.setVisible(true);
        
        // Hide all game elements except background
        this.hideGameElements();
    }
    
    startGame() {
        this.gameState = 'PLAYING';
        
        // Hide all screens
        this.startScreen.setVisible(false);
        if (this.gameOverScreen) this.gameOverScreen.setVisible(false);
        if (this.levelCompleteScreen) this.levelCompleteScreen.setVisible(false);
        
        // Show all game elements
        this.showGameElements();
        
        // Reset game state
        this.resetGameState();
    }
    
    hideGameElements() {
        if (this.player) this.player.setVisible(false);
        if (this.sun) this.sun.setVisible(false);
        if (this.key) this.key.setVisible(false);
        if (this.gate) this.gate.setVisible(false);
        
        // Hide clouds
        this.clouds.forEach(cloud => cloud.setVisible(false));
        
        // Hide gems
        this.gems.forEach(gem => gem.setVisible(false));
        
        // Hide UI
        if (this.shieldDisplays) this.shieldDisplays.forEach(shield => shield.setVisible(false));
        if (this.healthDisplays) this.healthDisplays.forEach(health => health.setVisible(false));
        if (this.joystickBase) this.joystickBase.setVisible(false);
        if (this.joystickKnob) this.joystickKnob.setVisible(false);
        if (this.shieldButton) this.shieldButton.setVisible(false);
    }
    
    showGameElements() {
        if (this.player) this.player.setVisible(true);
        if (this.sun) this.sun.setVisible(true);
        if (this.key) this.key.setVisible(true);
        if (this.gate) this.gate.setVisible(true);
        
        // Show clouds
        this.clouds.forEach(cloud => cloud.setVisible(true));
        
        // Show gems
        this.gems.forEach(gem => gem.setVisible(true));
        
        // Show UI
        if (this.joystickBase) this.joystickBase.setVisible(true);
        if (this.joystickKnob) this.joystickKnob.setVisible(true);
        if (this.shieldButton) this.shieldButton.setVisible(true);
        
        // Update health UI to show current state
        this.updateHealthUI();
    }
    
    resetGameState() {
        // Reset player position and stats - position player above first cloud to land properly
        this.player.setPosition(200, 790); // Positioned to land on first cloud
        this.player.body.setVelocity(0, 0);
        this.player.isGrounded = false; // Start falling to land on cloud
        this.playerHealth = 3;
        this.shieldHealth = this.maxShieldHealth;
        this.hasKey = false;
        this.gateOpen = false;
        this.levelComplete = false;
        this.invulnerable = false;
        this.isShielding = false;
        
        // Reset gate
        this.gate.setTexture('gateClose');
        
        // Reset clouds
        this.clouds.forEach(cloud => {
            cloud.disappearTimer = -1;
            cloud.setAlpha(1);
            cloud.isSolid = true;
        });
        
        // Clear fireballs
        this.fireballs.clear(true, true);
        
        // Reset timers
        this.fireballTimer = 0;
        this.invulnerabilityTimer = 0;
        
        // Recreate key if it was destroyed
        if (!this.key || !this.key.active) {
            this.key = this.physics.add.sprite(1200, 320, 'key');
            const keySize = 30 * this.scaleFactor;
            this.key.setDisplaySize(keySize, keySize);
            this.key.body.setImmovable(true);
            this.key.body.setGravityY(0);
            this.key.floatDirection = 1;
            this.key.originalY = 320;
        } else {
            // Reset key properties if it already exists
            this.key.setPosition(1200, 320);
            this.key.setVisible(true);
            this.key.setAlpha(1);
            const keySize = 30 * this.scaleFactor;
            this.key.setDisplaySize(keySize, keySize);
        }
        
        // Reset sun visibility and properties
        if (this.sun) {
            this.sun.setVisible(true);
            this.sun.setAlpha(1);
            this.sun.setScale(0.8);
        }
        
        // Recreate gems if they were collected
        this.createGems();
        
        // Update UI
        this.updateHealthUI();
    }
    
    createClouds() {
        // Simplified cloud layout - 8 large clouds forming clear upward path from bottom-left to top-right
        const cloudData = [
            // Starting cloud - bottom left
            { x: 200, y: 850, type: 'cloud1', size: { w: 180, h: 60 }, 
              collision: { width: 400, height: 0.39, offsetX: 105, offsetY: 277.5 } },
            
            // Second cloud - step up and right
            { x: 450, y: 750, type: 'cloud2', size: { w: 170, h: 55 },
              collision: { width: 400, height: 0.37, offsetX: 20, offsetY: 285 } },
            
            // Third cloud - continue upward path
            { x: 700, y: 650, type: 'cloud3', size: { w: 175, h: 60 },
              collision: { width: 400, height: 0.33, offsetX: 55, offsetY: 282.5 } },
            
            // Fourth cloud - center area with key
            { x: 800, y: 550, type: 'cloud1', size: { w: 180, h: 65 },
              collision: { width: 400, height: 0.46, offsetX: 105, offsetY: 285 } },
            
            // Fifth cloud - continue climbing
            { x: 1000, y: 450, type: 'cloud2', size: { w: 170, h: 55 },
              collision: { width: 400, height: 0.37, offsetX: 30, offsetY: 275 } },
            
            // Sixth cloud - approach final area
            { x: 1200, y: 350, type: 'cloud3', size: { w: 175, h: 60 },
              collision: { width: 400, height: 0.33, offsetX: 55, offsetY: 327.5 } },
            
            // Seventh cloud - pre-final platform
            { x: 1350, y: 280, type: 'cloud1', size: { w: 160, h: 55 },
              collision: { width: 400, height: 0.33, offsetX: 130, offsetY: 315 } },
            
            // Final cloud - top right with gate (fixed collision box)
            { x: 1500, y: 250, type: 'cloud2', size: { w: 180, h: 65 },
              collision: { width: 400, height: 0.51, offsetX: 20, offsetY: 275 } }
        ];
        
        cloudData.forEach((data, index) => {
            try {
                const cloud = this.physics.add.sprite(data.x, data.y, data.type);
                
                // Check if cloud texture loaded properly
                if (!cloud || !cloud.texture || cloud.texture.key === '__MISSING') {
                    console.error(`Cloud ${index} asset (${data.type}) failed to load`);
                    // Create a fallback rectangle if texture failed to load
                    cloud.destroy();
                    const fallbackCloud = this.add.rectangle(data.x, data.y, data.size.w * this.scaleFactor, data.size.h * this.scaleFactor, 0xFFFFFF);
                    fallbackCloud.setStrokeStyle(2, 0x000000);
                    // Skip physics setup for fallback and continue
                    return;
                }
                
                cloud.setImmovable(true);
                cloud.body.setGravityY(0);
                
                // Set visual size with mobile scaling
                const scaledWidth = data.size.w * this.scaleFactor;
                const scaledHeight = data.size.h * this.scaleFactor;
                cloud.setDisplaySize(scaledWidth, scaledHeight);
                
                // Use optimized collision box settings from debug session with mobile scaling
                const scaledCollisionWidth = data.collision.width * this.scaleFactor;
                const scaledCollisionHeight = data.collision.height * this.scaleFactor;
                const scaledOffsetX = data.collision.offsetX * this.scaleFactor;
                const scaledOffsetY = data.collision.offsetY * this.scaleFactor;
                
                cloud.body.setSize(scaledCollisionWidth, scaledCollisionHeight);
                cloud.body.setOffset(scaledOffsetX, scaledOffsetY);
                
                cloud.disappearTimer = -1; // -1 means not activated
                cloud.originalAlpha = 1;
                cloud.isSolid = true;
                
                // Store platform dimensions for collision detection
                cloud.platformTop = data.y - data.size.h / 2;
                cloud.platformWidth = data.collision.width;
                
                // Add debug info for mobile deployment
                console.log(`Cloud ${index} created:`, {
                    type: data.type,
                    position: { x: data.x, y: data.y },
                    scaleFactor: this.scaleFactor,
                    collisionBox: {
                        width: scaledCollisionWidth,
                        height: scaledCollisionHeight,
                        offsetX: scaledOffsetX,
                        offsetY: scaledOffsetY
                    }
                });
                
                this.clouds.push(cloud);
            } catch (error) {
                console.error(`Error creating cloud ${index}:`, error);
            }
        });
    }
    
    createGems() {
        // Clear any existing gems first
        this.gems.forEach(gem => {
            if (gem && gem.active) {
                gem.destroy();
            }
        });
        this.gems = [];
        
        // Place gems on top of clouds - clean positioning
        const gemPositions = [
            { x: 450, y: 720 },  // On second cloud (450, 750)
            { x: 700, y: 620 },  // On third cloud (700, 650) 
            { x: 1000, y: 420 }, // On fifth cloud (1000, 450)
        ];
        
        gemPositions.forEach(pos => {
            const gem = this.physics.add.sprite(pos.x, pos.y, 'gem');
            
            // Apply mobile scaling to gems
            const gemSize = 24 * this.scaleFactor;
            gem.setDisplaySize(gemSize, gemSize);
            gem.body.setImmovable(true);
            gem.body.setGravityY(0);
            gem.floatDirection = 1;
            gem.originalY = pos.y;
            this.gems.push(gem);
        });
    }
    
    createUI() {
        // Create individual shield displays (3 shields in a row) with mobile positioning
        this.shieldDisplays = [];
        const shieldSpacing = this.isMobile ? 30 : 35;
        const shieldStartX = this.isMobile && this.isLandscape ? 15 : 20;
        const shieldY = this.isMobile && this.isLandscape ? 15 : 20;
        
        for (let i = 0; i < 3; i++) {
            const shield = this.add.image(shieldStartX + (i * shieldSpacing), shieldY, 'shield1');
            shield.setOrigin(0, 0);
            shield.setScale(0.6 * this.uiScaleFactor);
            this.shieldDisplays.push(shield);
        }
        
        // Create individual health displays (3 hearts in a row below shields) with mobile positioning
        this.healthDisplays = [];
        const healthStartX = this.isMobile && this.isLandscape ? 15 : 20;
        const healthY = this.isMobile && this.isLandscape ? 55 : 70;
        
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(healthStartX + (i * shieldSpacing), healthY, 'health1');
            heart.setOrigin(0, 0);
            heart.setScale(0.6 * this.uiScaleFactor);
            this.healthDisplays.push(heart);
        }
        
        // Create joystick using joystick assets with mobile-responsive positioning
        let joystickX, joystickY;
        if (this.isMobile && this.isLandscape) {
            // Landscape mobile: position closer to bottom-left corner
            joystickX = 80;
            joystickY = this.cameras.main.height - 80;
        } else if (this.isMobile) {
            // Portrait mobile: standard mobile positioning
            joystickX = 100;
            joystickY = this.cameras.main.height - 120;
        } else {
            // Desktop: fixed position
            joystickX = 100;
            joystickY = 980;
        }
        
        this.joystickBase = this.add.image(joystickX, joystickY, 'joystick1');
        this.joystickBase.setScale(0.8 * this.uiScaleFactor);
        this.joystickBase.setAlpha(0.7);
        this.joystickBase.setVisible(false); // Hidden initially
        
        this.joystickKnob = this.add.circle(joystickX, joystickY, 20 * this.uiScaleFactor, 0xffffff, 0.8);
        this.joystickKnob.setVisible(false); // Hidden initially
        this.joystickCenter = { x: joystickX, y: joystickY };
        
        // Create shield button with mobile-responsive positioning
        let shieldButtonX, shieldButtonY;
        if (this.isMobile && this.isLandscape) {
            // Landscape mobile: position closer to bottom-right corner
            shieldButtonX = this.cameras.main.width - 80;
            shieldButtonY = this.cameras.main.height - 80;
        } else if (this.isMobile) {
            // Portrait mobile: standard mobile positioning
            shieldButtonX = this.cameras.main.width - 120;
            shieldButtonY = this.cameras.main.height - 120;
        } else {
            // Desktop: fixed position
            shieldButtonX = 1820;
            shieldButtonY = 980;
        }
        
        this.shieldButton = this.add.image(shieldButtonX, shieldButtonY, 'shieldButton');
        this.shieldButton.setScale(0.8 * this.uiScaleFactor);
        this.shieldButton.setInteractive();
        this.shieldButton.setAlpha(0.8);
        this.shieldButton.setVisible(false); // Hidden initially
         this.updateHealthUI();
    }

    updateUIPositions() {
        // Update UI positions when orientation changes
        if (!this.joystickBase || !this.shieldButton) return;
        
        // Update background scaling first
        this.updateBackgroundScale();
        
        // Update joystick position
        let joystickX, joystickY;
        if (this.isMobile && this.isLandscape) {
            // Landscape mobile: position closer to bottom-left corner
            joystickX = 80;
            joystickY = this.cameras.main.height - 80;
        } else if (this.isMobile) {
            // Portrait mobile: standard mobile positioning
            joystickX = 100;
            joystickY = this.cameras.main.height - 120;
        } else {
            // Desktop: fixed position
            joystickX = 100;
            joystickY = 980;
        }
        
        this.joystickBase.setPosition(joystickX, joystickY);
        this.joystickKnob.setPosition(joystickX, joystickY);
        this.joystickCenter = { x: joystickX, y: joystickY };
        
        // Update shield button position
        let shieldButtonX, shieldButtonY;
        if (this.isMobile && this.isLandscape) {
            // Landscape mobile: position closer to bottom-right corner
            shieldButtonX = this.cameras.main.width - 80;
            shieldButtonY = this.cameras.main.height - 80;
        } else if (this.isMobile) {
            // Portrait mobile: standard mobile positioning
            shieldButtonX = this.cameras.main.width - 120;
            shieldButtonY = this.cameras.main.height - 120;
        } else {
            // Desktop: fixed position
            shieldButtonX = 1820;
            shieldButtonY = 980;
        }
        
        this.shieldButton.setPosition(shieldButtonX, shieldButtonY);
        
        // Update health and shield display positioning
        const shieldSpacing = this.isMobile ? 30 : 35;
        const shieldStartX = this.isMobile && this.isLandscape ? 15 : 20;
        const shieldY = this.isMobile && this.isLandscape ? 15 : 20;
        const healthStartX = this.isMobile && this.isLandscape ? 15 : 20;
        const healthY = this.isMobile && this.isLandscape ? 55 : 70;
        
        // Update shield displays
        for (let i = 0; i < this.shieldDisplays.length; i++) {
            this.shieldDisplays[i].setPosition(shieldStartX + (i * shieldSpacing), shieldY);
            this.shieldDisplays[i].setScale(0.6 * this.uiScaleFactor);
        }
        
        // Update health displays
        for (let i = 0; i < this.healthDisplays.length; i++) {
            this.healthDisplays[i].setPosition(healthStartX + (i * shieldSpacing), healthY);
            this.healthDisplays[i].setScale(0.6 * this.uiScaleFactor);
        }
        
        // Update joystick and button scales
        this.joystickBase.setScale(0.8 * this.uiScaleFactor);
        this.joystickKnob.setRadius(20 * this.uiScaleFactor);
        this.shieldButton.setScale(0.8 * this.uiScaleFactor);
    }

    createInput() {
        // Mouse/touch input for joystick and game state management
        this.input.on('pointerdown', (pointer) => {
            // Handle different game states
            if (this.gameState === 'START') {
                this.startGame();
                return;
            } else if (this.gameState === 'GAME_OVER') {
                this.startGame();
                return;
            } else if (this.gameState === 'LEVEL_COMPLETE') {
                this.startGame(); // For now, restart the same level
                return;
            }
            
            // Only handle joystick/shield input during gameplay
            if (this.gameState !== 'PLAYING') return;
            
            const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.joystickCenter.x, this.joystickCenter.y);
            const joystickRange = 60 * this.uiScaleFactor;
            if (distance <= joystickRange) {
                this.joystickActive = true;
                this.updateJoystick(pointer);
            }
            
            // Shield button with responsive positioning
            let shieldButtonX, shieldButtonY;
            if (this.isMobile && this.isLandscape) {
                // Landscape mobile: position closer to bottom-right corner
                shieldButtonX = this.cameras.main.width - 80;
                shieldButtonY = this.cameras.main.height - 80;
            } else if (this.isMobile) {
                // Portrait mobile: standard mobile positioning
                shieldButtonX = this.cameras.main.width - 120;
                shieldButtonY = this.cameras.main.height - 120;
            } else {
                // Desktop: fixed position
                shieldButtonX = 1820;
                shieldButtonY = 980;
            }
            
            const shieldDistance = Phaser.Math.Distance.Between(pointer.x, pointer.y, shieldButtonX, shieldButtonY);
            if (shieldDistance <= 60) {
                this.shieldPressed = true;
                this.shieldButton.setTint(0x888888);
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.joystickActive && this.gameState === 'PLAYING') {
                this.updateJoystick(pointer);
            }
        });
        
        this.input.on('pointerup', () => {
            if (this.gameState === 'PLAYING') {
                this.joystickActive = false;
                this.joystickInput = { x: 0, y: 0 };
                this.joystickKnob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
                
                this.shieldPressed = false;
                this.shieldButton.clearTint();
            }
        });
        
        // Keyboard fallback
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    
    updateJoystick(pointer) {
        const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.joystickCenter.x, this.joystickCenter.y);
        const angle = Phaser.Math.Angle.Between(this.joystickCenter.x, this.joystickCenter.y, pointer.x, pointer.y);
        
        // Scale joystick range for mobile
        const joystickRange = 60 * this.uiScaleFactor;
        
        if (distance <= joystickRange) {
            this.joystickKnob.setPosition(pointer.x, pointer.y);
            this.joystickInput.x = (pointer.x - this.joystickCenter.x) / joystickRange;
            this.joystickInput.y = (pointer.y - this.joystickCenter.y) / joystickRange;
        } else {
            const maxX = this.joystickCenter.x + Math.cos(angle) * joystickRange;
            const maxY = this.joystickCenter.y + Math.sin(angle) * joystickRange;
            this.joystickKnob.setPosition(maxX, maxY);
            this.joystickInput.x = Math.cos(angle);
            this.joystickInput.y = Math.sin(angle);
        }
    }
    
    createParticles() {
        // Particle effects will be added here if needed
    }
    
    update(time, delta) {
        const deltaSeconds = delta / 1000;
        
        // Only update game logic during PLAYING state
        if (this.gameState !== 'PLAYING') return;
        
        if (this.levelComplete) return;
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTimer -= deltaSeconds;
            this.player.setAlpha(Math.sin(time * 0.01) * 0.5 + 0.5);
            
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
                this.player.setAlpha(1);
            }
        }
        
        // Handle input and movement
        this.handleInput(deltaSeconds);
        
        // Debug mode collision box adjustment (only during gameplay)
        if (this.debugMode && this.gameState === 'PLAYING') {
            this.adjustSelectedCloudCollisionBox();
        }
        
        // Update shield state
        this.updateShield();
        
        // Update player physics
        this.updatePlayer(deltaSeconds);
        
        // Update gems floating animation
        this.updateGems(deltaSeconds);
        
        // Update key floating animation
        this.updateKey(deltaSeconds);
        
        // Update clouds
        this.updateClouds(deltaSeconds);
        
        // Update fireballs
        this.updateFireballs(deltaSeconds);
        
        // Spawn fireballs
        this.updateFireballSpawning(deltaSeconds);
        
        // Check collisions
        this.checkCollisions();
        
        // Check death conditions
        this.checkDeath();
        
        // Rotate sun
        if (this.sun.visible) {
            this.sun.rotation += deltaSeconds * 0.5;
        }
    }
    
    handleInput(deltaSeconds) {
        // Get input from joystick or keyboard
        let inputX = this.joystickInput.x;
        let inputY = this.joystickInput.y;
        
        // Keyboard fallback
        if (this.cursors.left.isDown || this.wasd.A.isDown) inputX = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) inputX = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) inputY = -1;
        
        // Shield input (only use spacebar if not in debug mode or if debug controls aren't active)
        let shieldInput = this.shieldPressed;
        if (!this.debugMode || this.gameState !== 'PLAYING') {
            shieldInput = shieldInput || this.spaceKey.isDown;
        }
        
        // Handle shield activation
        if (shieldInput && this.shieldHealth > 0 && !this.isShielding) {
            this.isShielding = true;
        } else if (!shieldInput) {
            this.isShielding = false;
        }
        
        // Movement (disabled when shielding)
        if (!this.isShielding) {
            // Horizontal movement
            if (inputX !== 0) {
                const targetVelocityX = inputX * this.PLAYER_SPEED;
                const currentVelocityX = this.player.body.velocity.x;
                const acceleration = 1000; // pixels/s²
                
                if (Math.abs(targetVelocityX - currentVelocityX) > acceleration * deltaSeconds) {
                    const direction = Math.sign(targetVelocityX - currentVelocityX);
                    this.player.body.setVelocityX(currentVelocityX + direction * acceleration * deltaSeconds);
                } else {
                    this.player.body.setVelocityX(targetVelocityX);
                }
            } else {
                // Deceleration
                const currentVelocityX = this.player.body.velocity.x;
                const deceleration = 500; // pixels/s²
                
                if (Math.abs(currentVelocityX) > deceleration * deltaSeconds) {
                    const direction = -Math.sign(currentVelocityX);
                    this.player.body.setVelocityX(currentVelocityX + direction * deceleration * deltaSeconds);
                } else {
                    this.player.body.setVelocityX(0);
                }
            }
            
            // Jumping
            if (inputY < -0.5 && this.player.isGrounded) {
                this.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.player.isGrounded = false;
            }
        } else {
            // Stop all movement when shielding
            this.player.body.setVelocity(0, 0);
        }
    }
    
    updateShield() {
        if (this.isShielding && this.shieldHealth > 0) {
            this.shieldEffect.setPosition(this.player.x, this.player.y);
            this.shieldEffect.setVisible(true);
            this.shieldButton.setTint(0x00ff00);
        } else {
            this.shieldEffect.setVisible(false);
            if (!this.shieldPressed) {
                this.shieldButton.clearTint();
            }
        }
    }
    
    updatePlayer(deltaSeconds) {
        // Check if player is grounded
        this.player.isGrounded = false;
        
        // Check collision with clouds
        this.clouds.forEach(cloud => {
            if (cloud.isSolid && this.physics.overlap(this.player, cloud)) {
                const playerBottom = this.player.y + this.player.body.height / 2;
                const playerCenterX = this.player.x;
                
                // Get the actual collision body bounds
                const cloudLeft = cloud.body.x;
                const cloudRight = cloud.body.x + cloud.body.width;
                const cloudTop = cloud.body.y;
                
                // More forgiving collision detection for mobile devices
                // Scale the tolerance based on device scale factor
                const horizontalTolerance = 10 * (this.isMobile ? 1.5 : 1.0);
                const verticalTolerance = 25 * (this.isMobile ? 1.5 : 1.0);
                const verticalOffset = 5 * (this.isMobile ? 1.5 : 1.0);
                
                // Check if player is landing on top of the platform and within horizontal bounds
                // More forgiving collision - allow landing if player is close to the top
                if (this.player.body.velocity.y >= 0 &&
                    playerCenterX >= cloudLeft - horizontalTolerance && 
                    playerCenterX <= cloudRight + horizontalTolerance &&
                    playerBottom >= cloudTop - verticalOffset &&
                    playerBottom <= cloudTop + verticalTolerance) {
                    
                    this.player.isGrounded = true;
                    this.player.y = cloudTop - this.player.body.height / 2;
                    this.player.body.setVelocityY(0);
                    
                    // Start cloud disappearing timer
                    if (cloud.disappearTimer === -1) {
                        cloud.disappearTimer = 5; // 5 seconds
                        this.lastCloudPosition = { x: cloud.x, y: cloud.y };
                    }
                }
            }
        });
        
        // Check collision with gate (player can stand on it)
        if (this.gate && this.physics.overlap(this.player, this.gate)) {
            const playerBottom = this.player.y + this.player.body.height / 2;
            const playerCenterX = this.player.x;
            
            // Get the actual collision body bounds for the gate
            const gateLeft = this.gate.body.x;
            const gateRight = this.gate.body.x + this.gate.body.width;
            const gateTop = this.gate.body.y;
            
            // Check if player is landing on top of the gate platform and within horizontal bounds
            // Only trigger landing if player is falling down onto the platform, not if already grounded
            if (this.player.body.velocity.y >= 0 &&
                playerCenterX >= gateLeft - 10 && 
                playerCenterX <= gateRight + 10 &&
                playerBottom >= gateTop - 5 &&
                playerBottom <= gateTop + 25 &&
                !this.player.isGrounded) { // Only land if not already grounded
                
                this.player.isGrounded = true;
                this.player.y = gateTop - this.player.body.height / 2;
                this.player.body.setVelocityY(0);
                
                // Update last position when standing on gate
                this.lastCloudPosition = { x: this.gate.x, y: this.gate.y };
            }
        }
        
        // Remove the ground collision - let player fall and trigger game over
        // If player falls below screen, it will be caught by checkDeath()
    }
    
    updateGems(deltaSeconds) {
        this.gems.forEach(gem => {
            // Floating animation
            gem.floatDirection = gem.y <= gem.originalY - 10 ? 1 : gem.y >= gem.originalY + 10 ? -1 : gem.floatDirection;
            gem.y += gem.floatDirection * 20 * deltaSeconds;
        });
    }
    
    updateKey(deltaSeconds) {
        if (this.key && this.key.active) {
            // Floating animation around the key position
            this.key.floatDirection = this.key.y <= this.key.originalY - 10 ? 1 : this.key.y >= this.key.originalY + 10 ? -1 : this.key.floatDirection;
            this.key.y += this.key.floatDirection * 20 * deltaSeconds;
        }
    }
    
    updateClouds(deltaSeconds) {
        this.clouds.forEach(cloud => {
            if (cloud.disappearTimer > 0) {
                cloud.disappearTimer -= deltaSeconds;
                
                // Update opacity based on timer
                if (cloud.disappearTimer > 4) {
                    cloud.setAlpha(1);
                } else if (cloud.disappearTimer > 2) {
                    cloud.setAlpha(0.6);
                } else if (cloud.disappearTimer > 0) {
                    cloud.setAlpha(0.2);
                } else {
                    cloud.setAlpha(0.2);
                    cloud.isSolid = false;
                }
            }
        });
    }
    
    updateFireballs(deltaSeconds) {
        this.fireballs.children.entries.forEach(fireball => {
            // Apply gravity
            fireball.body.setAccelerationY(this.FIREBALL_GRAVITY);
            
            // Limit terminal velocity
            if (fireball.body.velocity.y > this.FIREBALL_TERMINAL) {
                fireball.body.setVelocityY(this.FIREBALL_TERMINAL);
            }
            
            // Fireballs now pass through clouds - no collision with clouds
            
            // Remove fireballs that fall off screen
            if (fireball.y > 1100) {
                fireball.destroy();
            }
        });
    }
    
    updateFireballSpawning(deltaSeconds) {
        if (!this.sun.visible) return;
        
        this.fireballTimer += deltaSeconds;
        
        if (this.fireballTimer >= this.fireballInterval) {
            this.spawnFireball();
            this.fireballTimer = 0;
        }
    }
    
    spawnFireball() {
        // Spawn fireballs at sun position, aimed directly at cloud positions with physics prediction
        const sunX = 1700;
        const sunY = 100;
        
        // Target random cloud positions to threaten the climbing path
        const cloudTargets = [
            { x: 200, y: 850 },   // Starting cloud
            { x: 450, y: 750 },   // Second cloud
            { x: 700, y: 650 },   // Third cloud
            { x: 800, y: 550 },   // Fourth cloud (key)
            { x: 1000, y: 450 },  // Fifth cloud
            { x: 1200, y: 350 },  // Sixth cloud
            { x: 1350, y: 280 },  // Seventh cloud
            { x: 1500, y: 250 }   // Final cloud (gate)
        ];
        
        // Randomly select a cloud to target
        const target = cloudTargets[Math.floor(Math.random() * cloudTargets.length)];
        
        // Calculate distance to target
        const deltaX = target.x - sunX;
        const deltaY = target.y - sunY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Calculate time to reach target (accounting for gravity)
        const initialSpeed = 400;
        const timeToTarget = distance / initialSpeed;
        
        // Calculate initial velocity components to hit the target
        // Account for gravity affecting Y trajectory
        const velocityX = deltaX / timeToTarget;
        const velocityY = (deltaY - 0.5 * this.FIREBALL_GRAVITY * timeToTarget * timeToTarget) / timeToTarget;
        
        // Add small random spread (±10% of velocity for slight inaccuracy)
        const spreadFactor = 0.1;
        const finalVelocityX = velocityX + (Math.random() - 0.5) * Math.abs(velocityX) * spreadFactor;
        const finalVelocityY = velocityY + (Math.random() - 0.5) * Math.abs(velocityY) * spreadFactor;
        
        // Spawn at sun position with small offset
        const offsetX = Phaser.Math.Between(-20, 20);
        const offsetY = Phaser.Math.Between(-10, 10);
        const fireball = this.fireballs.create(sunX + offsetX, sunY + offsetY, 'fireball');
        
        // Set calculated velocity
        fireball.body.setVelocity(finalVelocityX, finalVelocityY);
        fireball.body.setGravityY(0); // We'll handle gravity manually
        fireball.setScale(0.8 * this.scaleFactor);
        
        // Apply mobile scaling to fireball size
        const fireballSize = 32 * this.scaleFactor;
        fireball.setDisplaySize(fireballSize, fireballSize);
        
        // Rotate fireball to match trajectory
        const angle = Math.atan2(finalVelocityY, finalVelocityX);
        fireball.setRotation(angle);
    }
    
    checkCollisions() {
        // Gem collection
        this.gems = this.gems.filter(gem => {
            if (this.physics.overlap(this.player, gem)) {
                this.collectGem(gem);
                // Don't destroy immediately - let the animation handle it
                this.time.delayedCall(300, () => {
                    if (gem && gem.active) {
                        gem.destroy();
                    }
                });
                return false;
            }
            return true;
        });
        
        // Key collection
        if (this.key && this.key.active && this.physics.overlap(this.player, this.key)) {
            this.collectKey();
        }
        
        // Gate entry - only works if player has the key
        if (this.hasKey && this.gateOpen && this.physics.overlap(this.player, this.gate)) {
            this.completeLevel();
        }
        
        // Fireball collisions
        this.fireballs.children.entries.forEach(fireball => {
            const distance = Phaser.Math.Distance.Between(fireball.x, fireball.y, this.player.x, this.player.y);
            
            if (distance < 40) {
                // In debug mode, just destroy fireballs without damaging player
                if (this.debugMode) {
                    fireball.destroy();
                    return;
                }
                
                if (this.isShielding && this.shieldHealth > 0) {
                    // Shield is actively being used and has health - blocks fireball and damages shield
                    this.damageShield();
                    fireball.destroy();
                } else if (!this.invulnerable) {
                    // Player is not shielding or shield is broken - takes health damage
                    this.damagePlayer();
                    fireball.destroy();
                }
            }
        });
    }
    
    collectGem(gem) {
        // Gems fully restore shield health
        this.shieldHealth = this.maxShieldHealth;
        this.updateHealthUI();
        
        // Add brief scale/fade animation using the gem sprite
        this.tweens.add({
            targets: gem,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2'
        });
        
        // Add visual effect - create and auto-destroy after animation with mobile scaling
        let fontSize;
        if (this.isMobile && this.isLandscape) {
            fontSize = '14px'; // Good size for landscape
        } else if (this.isMobile) {
            fontSize = '10px'; // Smaller for portrait mobile
        } else {
            fontSize = '16px'; // Desktop size
        }
        const shieldText = this.add.text(gem.x, gem.y - 30, 'Shield Restored!', {
            fontSize: fontSize,
            color: '#00ff00'
        }).setOrigin(0.5).setDepth(100);
        
        // Animate and destroy the text
        this.tweens.add({
            targets: shieldText,
            y: gem.y - 60,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                shieldText.destroy();
            }
        });
    }
    
    collectKey() {
        this.hasKey = true;
        
        // Key disappears with animation
        this.tweens.add({
            targets: this.key,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 500
        });
        
        // Remove sun and stop fireballs when key is collected
        this.removeSunAndFireballs();
        
        // Open the gate
        this.openGate();
        
        // Show message with mobile scaling
        let fontSize;
        if (this.isMobile && this.isLandscape) {
            fontSize = '28px'; // Good size for landscape
        } else if (this.isMobile) {
            fontSize = '20px'; // Smaller for portrait mobile
        } else {
            fontSize = '32px'; // Desktop size
        }
        this.add.text(960, 300, 'Key Collected! Reach the Gate!', {
            fontSize: fontSize,
            color: '#ffff00'
        }).setOrigin(0.5).setDepth(100);
    }
    
    openGate() {
        this.gateOpen = true;
        // Switch from 'Gate close' to 'Gate open' sprite
        this.gate.setTexture('gateOpen');
    }
    
    removeSunAndFireballs() {
        // Make the sun vanish when key is collected
        this.tweens.add({
            targets: this.sun,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 500,
            onComplete: () => {
                this.sun.setVisible(false);
            }
        });
        
        // Clear all existing fireballs
        this.fireballs.clear(true, true);
    }
    
    damageShield() {
        // Damage the shield when blocking a fireball
        this.shieldHealth--;
        this.updateHealthUI();
        
        // Stop shielding if shield is broken
        if (this.shieldHealth <= 0) {
            this.isShielding = false;
        }
    }
    
    damagePlayer() {
        this.playerHealth--;
        this.updateHealthUI();
        
        // Start invulnerability
        this.invulnerable = true;
        this.invulnerabilityTimer = 2;
        
        if (this.playerHealth <= 0) {
            this.playerDeath();
        }
    }
    
    checkDeath() {
        // Debug mode: disable death to allow collision box testing
        if (this.debugMode) {
            // Reset player to first cloud if they fall too far
            if (this.player.y > 1100) {
                this.player.setPosition(200, 790); // Reset to start position
                this.player.body.setVelocity(0, 0);
                this.player.isGrounded = false;
            }
            return;
        }
        
        // Check if player fell off screen - trigger game over earlier
        if (this.player.y > 1100) { // Trigger earlier at 1100 instead of 1180
            this.playerDeath();
        }
    }
    
    playerDeath() {
        // Prevent multiple death triggers
        if (this.gameState !== 'PLAYING') return;
        
        // Change game state immediately to prevent multiple calls
        this.gameState = 'DYING';
        
        // Fade to black
        const blackScreen = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0);
        blackScreen.setDepth(1000);

        this.tweens.add({
            targets: blackScreen,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                blackScreen.destroy();
                this.showGameOverScreen();
            }
        });
    }
    
    respawnPlayer() {
        // Reset player position to above the first cloud
        this.player.setPosition(200, 790); // Positioned to land on first cloud
        this.player.body.setVelocity(0, 0);
        this.player.isGrounded = false; // Start falling to land on cloud
        
        // Reset health and shield to full
        this.shieldHealth = this.maxShieldHealth;
        this.playerHealth = 3;
        this.updateHealthUI();
        
        // Reset all cloud timers and make them solid again
        this.clouds.forEach(cloud => {
            cloud.disappearTimer = -1; // Reset to not activated
            cloud.setAlpha(1); // Reset to full opacity
            cloud.isSolid = true; // Make solid again
        });
        
        // Reset game state if key was collected
        if (this.hasKey) {
            this.hasKey = false;
            this.gateOpen = false;
            this.gate.setTexture('gateClose');
            
            // Respawn the key only if it doesn't exist or was destroyed
            if (!this.key || !this.key.active) {
                this.key = this.physics.add.sprite(1200, 320, 'key');
                const keySize = 30 * this.scaleFactor;
                this.key.setDisplaySize(keySize, keySize);
                this.key.body.setImmovable(true);
                this.key.body.setGravityY(0);
                this.key.floatDirection = 1;
                this.key.originalY = 320;
            }
            
            // Respawn the sun
            this.sun.setVisible(true);
            this.sun.setAlpha(1);
            this.sun.setScale(0.8 * this.scaleFactor);
        }
        
        // Clear fireballs
        this.fireballs.clear(true, true);
        
        // Start invulnerability
        this.invulnerable = true;
        this.invulnerabilityTimer = 2;
    }
    
    completeLevel() {
        this.levelComplete = true;
        
        // Clear any remaining fireballs (should already be cleared)
        this.fireballs.clear(true, true);
        
        // Show level complete screen after a brief delay
        this.time.delayedCall(1000, () => {
            this.showLevelCompleteScreen();
        });
    }
    
    updateHealthUI() {
        // Update individual shield displays - only show active shields
        for (let i = 0; i < 3; i++) {
            if (i < this.shieldHealth) {
                this.shieldDisplays[i].setVisible(true);
                this.shieldDisplays[i].setAlpha(1);
            } else {
                this.shieldDisplays[i].setVisible(false); // Hide depleted shields completely
            }
        }
        
        // Update individual health displays - only show active health
        for (let i = 0; i < 3; i++) {
            if (i < this.playerHealth) {
                this.healthDisplays[i].setVisible(true);
                this.healthDisplays[i].setAlpha(1);
            } else {
                this.healthDisplays[i].setVisible(false); // Hide lost health completely
            }
        }
    }
    
    setupDebugControls() {
        if (!this.debugMode) return;
        
        // Create keyboard input handlers
        this.debugKeys = this.input.keyboard.addKeys({
            'TAB': Phaser.Input.Keyboard.KeyCodes.TAB,
            'ARROW_LEFT': Phaser.Input.Keyboard.KeyCodes.LEFT,
            'ARROW_RIGHT': Phaser.Input.Keyboard.KeyCodes.RIGHT,
            'ARROW_UP': Phaser.Input.Keyboard.KeyCodes.UP,
            'ARROW_DOWN': Phaser.Input.Keyboard.KeyCodes.DOWN,
            'SHIFT': Phaser.Input.Keyboard.KeyCodes.SHIFT,
            'CTRL': Phaser.Input.Keyboard.KeyCodes.CTRL,
            'ENTER': Phaser.Input.Keyboard.KeyCodes.ENTER,
            'SPACE': Phaser.Input.Keyboard.KeyCodes.SPACE
        });
        
        // Set up key listeners for debug controls (only when in debug mode and playing)
        this.input.keyboard.on('keydown-TAB', (event) => {
            if (this.debugMode && this.gameState === 'PLAYING') {
                event.preventDefault();
                this.selectNextCloud();
            }
        });
        
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.debugMode && this.gameState === 'PLAYING') {
                this.exportCollisionBoxData();
            }
        });
        
        this.input.keyboard.on('keydown-SPACE', (event) => {
            if (this.debugMode && this.gameState === 'PLAYING') {
                // Only prevent default if we're actually using it for debug
                event.preventDefault();
                this.resetSelectedCloudCollisionBox();
            }
        });
    }
    
    selectNextCloud() {
        if (!this.debugMode || !this.clouds || this.gameState !== 'PLAYING') return;
        
        // Include gate as the last selectable object (clouds + gate)
        const totalObjects = this.clouds.length + 1; // clouds + gate
        this.selectedCloudIndex = (this.selectedCloudIndex + 1) % totalObjects;
        this.updateDebugText();
    }
    
    updateDebugText() {
        if (!this.debugMode || !this.debugText || !this.clouds || this.gameState !== 'PLAYING') return;
        
        const totalObjects = this.clouds.length + 1; // clouds + gate
        const isGateSelected = this.selectedCloudIndex >= this.clouds.length;
        
        let selectedObject, body, objectName;
        
        if (isGateSelected) {
            selectedObject = this.gate;
            body = this.gate.body;
            objectName = "Gate";
        } else {
            selectedObject = this.clouds[this.selectedCloudIndex];
            if (!selectedObject) return;
            body = selectedObject.body;
            objectName = `Cloud ${this.selectedCloudIndex + 1}`;
        }
        
        const debugInfo = [
            'DEBUG MODE - Collision Box Adjustment',
            `Selected Object: ${objectName} (${this.selectedCloudIndex + 1}/${totalObjects})`,
            `Position: (${Math.round(selectedObject.x)}, ${Math.round(selectedObject.y)})`,
            `Collision Box: ${body.width}x${body.height}`,
            `Offset: (${body.offset.x}, ${body.offset.y})`,
            '',
            'Controls:',
            'TAB - Select next object (clouds + gate)',
            'Arrow Keys - Move collision box',
            'SHIFT + Arrows - Resize collision box',
            'CTRL + Arrows - Fine adjustment',
            'SPACE - Reset collision box',
            'ENTER - Export collision data'
        ];
        
        this.debugText.setText(debugInfo.join('\n'));
    }
    
    adjustSelectedCloudCollisionBox() {
        if (!this.debugMode || !this.clouds || this.gameState !== 'PLAYING') return;
        
        const isGateSelected = this.selectedCloudIndex >= this.clouds.length;
        const selectedObject = isGateSelected ? this.gate : this.clouds[this.selectedCloudIndex];
        if (!selectedObject) return;
        
        const keys = this.debugKeys;
        let step = this.adjustmentStep;
        
        // Fine adjustment with CTRL
        if (keys.CTRL.isDown) {
            step = 1;
        }
        
        // Resize mode with SHIFT
        if (keys.SHIFT.isDown) {
            if (keys.ARROW_LEFT.isDown) {
                selectedObject.body.setSize(Math.max(10, selectedObject.body.width - step), selectedObject.body.height);
            }
            if (keys.ARROW_RIGHT.isDown) {
                selectedObject.body.setSize(selectedObject.body.width + step, selectedObject.body.height);
            }
            if (keys.ARROW_UP.isDown) {
                selectedObject.body.setSize(selectedObject.body.width, Math.max(5, selectedObject.body.height - step));
            }
            if (keys.ARROW_DOWN.isDown) {
                selectedObject.body.setSize(selectedObject.body.width, selectedObject.body.height + step);
            }
        } else {
            // Move collision box
            if (keys.ARROW_LEFT.isDown) {
                selectedObject.body.setOffset(selectedObject.body.offset.x - step, selectedObject.body.offset.y);
            }
            if (keys.ARROW_RIGHT.isDown) {
                selectedObject.body.setOffset(selectedObject.body.offset.x + step, selectedObject.body.offset.y);
            }
            if (keys.ARROW_UP.isDown) {
                selectedObject.body.setOffset(selectedObject.body.offset.x, selectedObject.body.offset.y - step);
            }
            if (keys.ARROW_DOWN.isDown) {
                selectedObject.body.setOffset(selectedObject.body.offset.x, selectedObject.body.offset.y + step);
            }
        }
        
        this.updateDebugText();
    }
    
    resetSelectedCloudCollisionBox() {
        if (!this.debugMode || !this.clouds || this.gameState !== 'PLAYING') return;
        
        const isGateSelected = this.selectedCloudIndex >= this.clouds.length;
        
        if (isGateSelected) {
            // Reset gate to default collision box settings
            this.gate.body.setSize(120, 15); // Default gate platform
            this.gate.body.setOffset(20, 85); // Default gate offset
        } else {
            const selectedCloud = this.clouds[this.selectedCloudIndex];
            if (!selectedCloud) return;
            
            // Reset to default collision box settings based on the cloud data used in createClouds
            const cloudData = [
                { w: 180, h: 60 },  // cloud1
                { w: 170, h: 55 },  // cloud2  
                { w: 175, h: 60 },  // cloud3
                { w: 180, h: 65 },  // cloud1
                { w: 170, h: 55 },  // cloud2
                { w: 175, h: 60 },  // cloud3
                { w: 160, h: 55 },  // cloud1
                { w: 180, h: 65 }   // cloud2
            ];
            
            const data = cloudData[this.selectedCloudIndex];
            if (!data) return;
            
            const platformWidth = data.w * 0.8;
            const platformHeight = 25;
            const offsetX = 0;
            const offsetY = -data.h/2 + platformHeight/2;
            
            selectedCloud.body.setSize(platformWidth, platformHeight);
            selectedCloud.body.setOffset(offsetX, offsetY);
        }
        
        this.updateDebugText();
    }
    
    exportCollisionBoxData() {
        if (!this.debugMode || !this.clouds || this.gameState !== 'PLAYING') return;
        
        const collisionData = [];
        
        // Export cloud data
        this.clouds.forEach((cloud, index) => {
            const body = cloud.body;
            
            // Get original cloud size data
            const cloudSizes = [
                { w: 180, h: 60 },  // cloud1
                { w: 170, h: 55 },  // cloud2  
                { w: 175, h: 60 },  // cloud3
                { w: 180, h: 65 },  // cloud1
                { w: 170, h: 55 },  // cloud2
                { w: 175, h: 60 },  // cloud3
                { w: 160, h: 55 },  // cloud1
                { w: 180, h: 65 }   // cloud2
            ];
            
            const originalSize = cloudSizes[index];
            
            collisionData.push({
                type: 'cloud',
                index: index,
                texture: cloud.texture.key,
                originalSize: originalSize,
                collisionBox: {
                    width: body.width,
                    height: body.height,
                    offsetX: body.offset.x,
                    offsetY: body.offset.y
                },
                relativeToOriginal: {
                    widthRatio: body.width / originalSize.w,
                    heightRatio: body.height / originalSize.h,
                    offsetXRatio: body.offset.x / originalSize.w,
                    offsetYRatio: body.offset.y / originalSize.h
                }
            });
        });
        
        // Export gate data
        const gateBody = this.gate.body;
        collisionData.push({
            type: 'gate',
            texture: this.gate.texture.key,
            position: { x: this.gate.x, y: this.gate.y },
            collisionBox: {
                width: gateBody.width,
                height: gateBody.height,
                offsetX: gateBody.offset.x,
                offsetY: gateBody.offset.y
            }
        });
        
        console.log('Complete Collision Box Data (Clouds + Gate):');
        console.log(JSON.stringify(collisionData, null, 2));
        
        // Also show a summary in the debug text temporarily
        const summary = `Exported collision data for ${collisionData.length} objects to console`;
        const originalText = this.debugText.text;
        this.debugText.setText(summary);
        
        this.time.delayedCall(2000, () => {
            if (this.debugText) this.debugText.setText(originalText);
        });
    }
    
    setupOrientationHandlers() {
        // Add orientation change handlers for mobile devices
        if (this.isMobile) {
            // Handle screen orientation changes
            const handleOrientationChange = () => {
                // Use a small delay to ensure the screen dimensions have updated
                setTimeout(() => {
                    console.log('Orientation changed, updating device detection and UI');
                    this.updateDeviceDetection();
                    this.updateUIPositions();
                }, 100);
            };
            
            // Handle window resize (which includes orientation changes)
            const handleResize = () => {
                // Use a small delay to ensure the screen dimensions have updated
                setTimeout(() => {
                    console.log('Window resized, updating device detection and UI');
                    this.updateDeviceDetection();
                    this.updateUIPositions();
                }, 100);
            };
            
            // Add event listeners
            window.addEventListener('orientationchange', handleOrientationChange);
            window.addEventListener('resize', handleResize);
            
            // Also handle the visual viewport API if available (better for mobile)
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', handleResize);
            }
            
            console.log('Orientation change handlers set up for mobile device');
        }
    }

    // ...existing code...
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'app',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Disable debug for mobile performance
        }
    },
    scene: GameScene,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080,
        min: {
            width: 320,
            height: 180
        },
        max: {
            width: 1920,
            height: 1080
        },
        // Enhanced mobile handling
        fullscreenTarget: 'app',
        expandParent: true,
        // Force landscape on mobile devices
        forceOrientation: false
    },
    // Mobile optimizations
    render: {
        antialias: false,
        pixelArt: false,
        roundPixels: true
    },
    // Enable touch input for mobile
    input: {
        touch: true,
        mouse: true,
        activePointers: 3
    }
};

// Start the game
const game = new Phaser.Game(config);

// Enhanced orientation and resize handling for mobile devices
function handleOrientationChange() {
    // Small delay to ensure screen dimensions are updated
    setTimeout(() => {
        if (game.scene.scenes[0]) {
            const scene = game.scene.scenes[0];
            
            // Update device detection with new orientation
            scene.updateDeviceDetection();
            
            // Force a complete scale refresh
            game.scale.refresh();
            
            // Resize the game canvas to fill the screen
            game.scale.resize(window.innerWidth, window.innerHeight);
            
            // Update camera bounds
            scene.cameras.main.setBounds(0, 0, game.scale.gameSize.width, game.scale.gameSize.height);
            
            // If UI elements exist, recreate them with new positioning
            if (scene.joystickBase) {
                scene.updateUIPositions();
            }
        }
    }, 300); // Longer delay for orientation change
}

function handleResize() {
    if (game.scene.scenes[0]) {
        const scene = game.scene.scenes[0];
        
        // Update device detection
        scene.updateDeviceDetection();
        
        // Refresh the scale
        game.scale.refresh();
        
        // Update UI positions if they exist
        if (scene.joystickBase) {
            scene.updateUIPositions();
        }
    }
}

// Handle orientation changes for mobile devices
window.addEventListener('orientationchange', handleOrientationChange);

// Also handle window resize for better responsiveness
window.addEventListener('resize', handleResize);

// Handle device orientation API if available
if (screen.orientation) {
    screen.orientation.addEventListener('change', handleOrientationChange);
}