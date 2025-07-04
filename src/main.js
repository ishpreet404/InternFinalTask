import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Initialize basic values - device detection will happen in create()
        this.isMobile = false;
        this.isLandscape = false;
        this.scaleFactor = 1;
        this.uiScaleFactor = 1;
        
        // Game states
        this.gameState = 'START'; // 'START', 'PLAYING', 'GAME_OVER', 'LEVEL_COMPLETE', 'DYING'
        
        // Debug mode for collision box adjustment
        this.debugMode = false; // Set to false when done adjusting
        this.selectedCloudIndex = 0; // Currently selected cloud for adjustment
        this.adjustmentStep = 1; // Pixels to move per key press
        
        // Audio system
        this.sounds = {};
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.audioEnabled = true;
        
        // Game state
        this.player = null;
        this.sun = null;
        this.clouds = [];
        this.fireballs = [];
        this.gems = [];
        this.key = null;
        this.gate = null;
        
        // Side-scroller specific properties
        this.worldWidth = 3000; // Extended world width for side-scrolling
        this.worldHeight = 1080; // Standard height
        this.cameraFollowEnabled = false;
        this.levelStartX = 100; // Starting X position
        this.levelEndX = 2800; // End X position
        
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
        this.lastCloudPosition = { x: 100, y: 550 }; // Updated to match side-scroller start position
        
        // Timers
        this.fireballTimer = 0;
        this.fireballInterval = 0.4; // Increased difficulty - faster fireball spawn rate
        this.invulnerabilityTimer = 0;
        
        // Input
        this.joystickInput = { x: 0, y: 0 };
        this.shieldPressed = false;
        
        // Constants for side-scroller
        this.GRAVITY = 1000;
        this.FIREBALL_GRAVITY = 500;
        this.PLAYER_SPEED = 250; // Increased for side-scrolling
        this.JUMP_VELOCITY = -550; // Adjusted for horizontal platforming
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
        
        // Get current screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        this.isLandscape = screenWidth > screenHeight;
        
        // Calculate responsive scale factor based on screen size
        const baseWidth = 1920;
        const baseHeight = 1080;
        
        // Calculate scale to fit screen while maintaining aspect ratio
        const scaleX = screenWidth / baseWidth;
        const scaleY = screenHeight / baseHeight;
        const baseScale = Math.min(scaleX, scaleY);
        
        // Apply device-specific scaling adjustments
        if (this.isMobile) {
            if (this.isLandscape) {
                // Mobile landscape: use calculated scale with reasonable limits
                this.scaleFactor = Math.max(0.4, Math.min(1.0, baseScale * 1.1));
                this.uiScaleFactor = Math.max(0.6, Math.min(1.2, baseScale * 1.3));
            } else {
                // Mobile portrait: smaller scale for compact layout
                this.scaleFactor = Math.max(0.3, Math.min(0.8, baseScale * 0.9));
                this.uiScaleFactor = Math.max(0.5, Math.min(1.0, baseScale * 1.4));
            }
        } else {
            // Desktop: use calculated scale with reasonable limits
            this.scaleFactor = Math.max(0.6, Math.min(1.2, baseScale));
            this.uiScaleFactor = Math.max(0.8, Math.min(1.0, baseScale));
        }
        
        console.log('Device detection updated:', {
            isMobile: this.isMobile,
            isLandscape: this.isLandscape,
            screenSize: { width: screenWidth, height: screenHeight },
            scaleFactor: this.scaleFactor,
            uiScaleFactor: this.uiScaleFactor
        });
    }

    detectMobileDevice() {
        // Enhanced mobile detection for better reliability
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Get the actual screen dimensions
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Use the larger dimension as reference for mobile detection
        const maxScreenDimension = Math.max(screenWidth, screenHeight, windowWidth, windowHeight);
        const minScreenDimension = Math.min(screenWidth, screenHeight, windowWidth, windowHeight);
        
        // Mobile detection criteria
        const isSmallScreen = maxScreenDimension <= 1366 && minScreenDimension <= 768; // Tablet/mobile size
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const hasDevicePixelRatio = window.devicePixelRatio > 1; // Common on mobile devices
        
        // Check viewport characteristics
        const hasViewport = window.visualViewport !== undefined;
        
        const isMobile = isMobileUA || (isSmallScreen && isTouchDevice) || 
                        (isTouchDevice && hasDevicePixelRatio && hasViewport);
        
        console.log('Mobile detection:', {
            userAgent: isMobileUA,
            screenSize: { width: screenWidth, height: screenHeight },
            windowSize: { width: windowWidth, height: windowHeight },
            maxDimension: maxScreenDimension,
            minDimension: minScreenDimension,
            isSmallScreen,
            isTouchDevice,
            hasDevicePixelRatio,
            devicePixelRatio: window.devicePixelRatio,
            finalResult: isMobile
        });
        
        return isMobile;
    }

    preload() {
        // Initialize device detection early in preload
        this.updateDeviceDetection();
        
        // Add loading progress feedback for debugging deployment issues
        this.load.on('progress', (value) => {
            console.log('Loading progress:', Math.round(value * 100) + '%');
        });
        
        this.load.on('filecomplete', (key, type, data) => {
            console.log('Loaded asset:', key, type);
        });
        
        this.load.on('loaderror', (file) => {
            console.error('Failed to load asset:', file.key, file.src);
            console.error('Full file object:', file);
        });
        
        // Set proper base path for mobile deployment
        this.load.setBaseURL('./');
        
        // Load audio files using your actual sound files
        // Sound effects
        this.load.audio('jump', [
            'sounds/403369__corpocracy__2dcharacter_jump01.flac'
        ]);
        
        this.load.audio('gemCollect', [
            'sounds/135936__bradwesson__collectcoin.wav'
        ]);
        
        this.load.audio('keyCollect', [
            'sounds/135936__bradwesson__collectcoin.wav' // Reuse coin sound for key
        ]);
        
        this.load.audio('gateOpen', [
            'sounds/488534__ranner__ui-click.wav' // Use UI click for gate
        ]);
        
        this.load.audio('shieldActivate', [
            'sounds/249818__spookymodem__magic-shield.wav'
        ]);
        
        this.load.audio('shieldHit', [
            'sounds/459782__metzik__deflector-shield.wav'
        ]);
        
        this.load.audio('playerHit', [
            'sounds/506586__mrthenoronha__kill-enemy-3-8-bit.wav'
        ]);
        
        this.load.audio('playerDeath', [
            'sounds/364929__jofae__game-die.mp3'
        ]);
        
        this.load.audio('fireballSpawn', [
            'sounds/506586__mrthenoronha__kill-enemy-3-8-bit.wav' // Reuse for fireball spawn
        ]);
        
        this.load.audio('levelComplete', [
            'sounds/122255__jivatma07__level_complete.wav'
        ]);
        
        this.load.audio('gameOver', [
            'sounds/364929__jofae__game-die.mp3'
        ]);
        
        this.load.audio('buttonClick', [
            'sounds/488534__ranner__ui-click.wav'
        ]);
        
        // Load all assets from the public folder - using exact names (case-sensitive for deployment)
        // Note: In production, Vite will handle the asset paths automatically
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
        
        // Add a final check to see if all assets loaded
        this.load.on('complete', () => {
            console.log('All assets loaded successfully!');
            console.log('Textures available:', Object.keys(this.textures.list));
        });
    }
    
    create() {
        // Update device detection now that the scene is created
        this.updateDeviceDetection();
        
        // Set up side-scroller world bounds
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // Set up camera for side-scrolling with initial zoom
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // Set initial zoom level based on device - increased zoom for better visibility
        let initialZoom;
        if (this.isMobile) {
            initialZoom = this.isLandscape ? 1.8 : 1.6;
        } else {
            initialZoom = 1.6;
        }
        this.cameras.main.setZoom(initialZoom);
        
        // Initialize audio system
        this.initializeAudio();
        
        // Create background using 'BG full' - stretch to cover entire world with side-scrolling
        this.createSideScrollerBackground();
        
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
    
    initializeAudio() {
        // Initialize audio system with error handling for missing files
        console.log('Initializing audio system...');
        
        try {
            // Initialize sound objects with fallback for missing audio files
            const soundKeys = [
                'jump', 'gemCollect', 'keyCollect', 
                'gateOpen', 'shieldActivate', 'shieldHit', 'playerHit', 
                'playerDeath', 'fireballSpawn', 
                'levelComplete', 'gameOver', 'buttonClick'
            ];
            
            soundKeys.forEach(key => {
                try {
                    if (this.cache.audio.exists(key)) {
                        this.sounds[key] = this.sound.add(key, {
                            volume: this.sfxVolume
                        });
                        console.log(`Audio loaded: ${key}`);
                    } else {
                        console.warn(`Audio file not found: ${key}, creating silent placeholder`);
                        // Create a silent placeholder to prevent errors
                        this.sounds[key] = {
                            play: () => console.log(`Would play: ${key}`),
                            stop: () => console.log(`Would stop: ${key}`),
                            pause: () => console.log(`Would pause: ${key}`),
                            resume: () => console.log(`Would resume: ${key}`),
                            setVolume: () => {},
                            isPlaying: false
                        };
                    }
                } catch (error) {
                    console.error(`Error loading sound ${key}:`, error);
                    // Create a fallback silent sound
                    this.sounds[key] = {
                        play: () => {},
                        stop: () => {},
                        pause: () => {},
                        resume: () => {},
                        setVolume: () => {},
                        isPlaying: false
                    };
                }
            });
            
            // Note: No background music available
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.error('Error initializing audio system:', error);
            this.audioEnabled = false;
        }
    }
    
    playSound(soundKey, config = {}) {
        if (!this.audioEnabled || !this.sounds[soundKey]) {
            return;
        }
        
        try {
            // Stop previous instance if already playing (for certain sounds)
            if (config.stopPrevious && this.sounds[soundKey].isPlaying) {
                this.sounds[soundKey].stop();
            }
            
            // Set volume if specified
            if (config.volume !== undefined) {
                this.sounds[soundKey].setVolume(config.volume * this.sfxVolume);
            }
            
            // Play the sound
            this.sounds[soundKey].play(config);
        } catch (error) {
            console.error(`Error playing sound ${soundKey}:`, error);
        }
    }
    
    playBackgroundMusic() {
        // No background music available
        console.log('No background music to play');
    }
    
    stopBackgroundMusic() {
        // No background music available
        console.log('No background music to stop');
    }
    
    pauseBackgroundMusic() {
        // No background music available
        console.log('No background music to pause');
    }
    
    resumeBackgroundMusic() {
        // No background music available
        console.log('No background music to resume');
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        // No background music available
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
        // Update all SFX volumes
        Object.keys(this.sounds).forEach(key => {
            if (this.sounds[key].setVolume) {
                this.sounds[key].setVolume(this.sfxVolume);
            }
        });
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        console.log('Audio toggled:', this.audioEnabled ? 'ON' : 'OFF');
        return this.audioEnabled;
    }
    
    // Audio testing method for development
    testAllSounds() {
        if (!this.debugMode) return;
        
        console.log('Testing all game sounds...');
        const soundKeys = [
            'jump', 'gemCollect', 'keyCollect', 'gateOpen',
            'shieldActivate', 'shieldHit', 'playerHit', 'playerDeath',
            'fireballSpawn', 'levelComplete', 
            'gameOver', 'buttonClick'
        ];
        
        let index = 0;
        const playNext = () => {
            if (index < soundKeys.length) {
                const soundKey = soundKeys[index];
                console.log(`Testing sound: ${soundKey}`);
                this.playSound(soundKey, { volume: 0.3 });
                index++;
                setTimeout(playNext, 1000); // Play next sound after 1 second
            } else {
                console.log('All sounds tested!');
            }
        };
        
        playNext();
    }
    
    createResponsiveBackground() {
        // Create background that adapts to screen size and orientation
        // Add error handling for missing background asset
        try {
            console.log('Creating background, available textures:', Object.keys(this.textures.list));
            
            if (!this.textures.exists('bgFull')) {
                console.error('Background texture "bgFull" not found, using fallback');
                // Create a fallback colored background
                const fallbackBg = this.add.rectangle(960, 540, 1920, 1080, 0x87CEEB);
                this.backgroundImage = fallbackBg;
                return;
            }
            
            const bg = this.add.image(960, 540, 'bgFull');
            
            // Always scale to cover the viewport properly (mobile and desktop)
            const gameWidth = this.cameras.main.width;
            const gameHeight = this.cameras.main.height;
            
            // Get the actual texture dimensions
            const bgWidth = bg.texture.source[0].width;
            const bgHeight = bg.texture.source[0].height;
            
            // Calculate scale to cover the entire screen
            const scaleX = gameWidth / bgWidth;
            const scaleY = gameHeight / bgHeight;
            const scale = Math.max(scaleX, scaleY);
            
            bg.setScale(scale);
            bg.setPosition(gameWidth / 2, gameHeight / 2);
            
            // Store reference for potential updates
            this.backgroundImage = bg;
            console.log('Background created successfully:', { 
                gameWidth, 
                gameHeight, 
                bgWidth, 
                bgHeight, 
                scale,
                isMobile: this.isMobile 
            });
        } catch (error) {
            console.error('Error creating background:', error);
            // Create a fallback colored background
            const fallbackBg = this.add.rectangle(960, 540, 1920, 1080, 0x87CEEB);
            this.backgroundImage = fallbackBg;
        }
    }
    
    updateBackgroundScale() {
        // Update background scaling when orientation or window size changes
        if (this.backgroundImage) {
            const gameWidth = this.cameras.main.width;
            const gameHeight = this.cameras.main.height;
            
            // Get the original texture dimensions
            const bgWidth = this.backgroundImage.texture ? this.backgroundImage.texture.source[0].width : 1920;
            const bgHeight = this.backgroundImage.texture ? this.backgroundImage.texture.source[0].height : 1080;
            
            const scaleX = gameWidth / bgWidth;
            const scaleY = gameHeight / bgHeight;
            const scale = Math.max(scaleX, scaleY);
            
            this.backgroundImage.setScale(scale);
            this.backgroundImage.setPosition(gameWidth / 2, gameHeight / 2);
            
            console.log('Background scale updated:', { gameWidth, gameHeight, scale });
        }
    }
    
    createStartScreen() {
        // Create start screen with Game Info asset - fixed to camera
        const screenCenterX = this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.height / 2;
        
        this.startScreen = this.add.container(screenCenterX, screenCenterY);
        this.startScreen.setScrollFactor(0); // Fixed to camera
        
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
        // Create game over screen with Game Over asset - fixed to camera
        this.gameOverScreen = this.add.container(960, 540);
        this.gameOverScreen.setScrollFactor(0); // Fixed to camera
        
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
        // Create level complete screen with Level Completed asset - fixed to camera
        this.levelCompleteScreen = this.add.container(960, 540);
        this.levelCompleteScreen.setScrollFactor(0); // Fixed to camera
        
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
        
        // Create sun enemy repositioned for side-scrolling - follows player horizontally
        this.sun = this.add.image(500, 100, 'sun');
        this.sun.setScale(1.2 * this.scaleFactor); // Increased from 0.8 for full visibility
        this.sun.setVisible(false); // Hidden initially
        
        // Create player at starting position for side-scroller
        this.player = this.physics.add.sprite(150, 480, 'player'); // Positioned to land on first platform at Y=550
        
        // Apply mobile scaling to player - INCREASED SIZE FOR BETTER VISIBILITY
        const playerDisplayWidth = 80 * this.scaleFactor; // Increased from 64
        const playerDisplayHeight = 120 * this.scaleFactor; // Increased from 96
        const playerBodyWidth = 60 * this.scaleFactor; // Increased from 48
        const playerBodyHeight = 110 * this.scaleFactor; // Increased from 88
        
        this.player.setDisplaySize(playerDisplayWidth, playerDisplayHeight);
        this.player.body.setSize(playerBodyWidth, playerBodyHeight);
        this.player.setCollideWorldBounds(true); // Keep player within world bounds
        this.player.body.setGravityY(this.GRAVITY);
        this.player.body.setMaxVelocityY(this.TERMINAL_VELOCITY);
        this.player.isGrounded = false; // Start falling to land on platform
        this.player.setVisible(false); // Hidden initially
        
        // Create side-scroller platforms
        this.createClouds();
        
        // Create gems on specific platforms
        this.createSideScrollerGems();
        
        // Create key on one of the later platforms
        this.key = this.physics.add.sprite(1750, 230, 'key'); // Above sixth platform (Y=300, key at Y=230)
        
        // Apply mobile scaling to key - INCREASED SIZE FOR BETTER VISIBILITY
        const keySize = 50 * this.scaleFactor; // Increased from 40
        this.key.setDisplaySize(keySize, keySize);
        this.key.body.setImmovable(true);
        this.key.body.setGravityY(0);
        this.key.floatDirection = 1;
        this.key.originalY = 230;
        this.key.setVisible(false); // Hidden initially
        
        // Create gate at the end of the level
        this.gate = this.physics.add.sprite(2700, 300, 'gateClose'); // End of level
        this.gate.body.setImmovable(true);
        this.gate.body.setGravityY(0);
        
        // Apply mobile scaling to gate
        this.gate.setScale(this.scaleFactor);
        
        // Set collision box for gate platform
        const gateCollisionWidth = 200 * this.scaleFactor;
        const gateCollisionHeight = 20 * this.scaleFactor;
        const gateOffsetX = 0;
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
        
        // Play game over sound
        this.playSound('gameOver', { volume: 0.6 });
        
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
        
        // Play button click sound
        this.playSound('buttonClick');
        
        // Hide all screens
        this.startScreen.setVisible(false);
        if (this.gameOverScreen) this.gameOverScreen.setVisible(false);
        if (this.levelCompleteScreen) this.levelCompleteScreen.setVisible(false);
        
        // Show all game elements
        this.showGameElements();
        
        // Reset game state
        this.resetGameState();
        
        // Enable camera following for side-scrolling
        this.setupCameraFollow();
    }
    
    setupCameraFollow() {
        if (this.player) {
            // Set up camera to follow player with zoom for better visibility
            this.cameras.main.startFollow(this.player, true, 0.08, 0.04);
            
            // Apply zoom based on device type for better element visibility
            let zoomLevel;
            if (this.isMobile) {
                zoomLevel = this.isLandscape ? 1.8 : 1.6; // Increased zoom for mobile
            } else {
                zoomLevel = 1.6; // Increased zoom for desktop
            }
            this.cameras.main.setZoom(zoomLevel);
            
            // Adjust world bounds for the zoomed camera
            this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
            
            // Set smaller dead zone for tighter following with zoom
            this.cameras.main.setDeadzone(150, 80);
            
            // Center player better in the zoomed view and move camera higher above player
            this.cameras.main.setFollowOffset(-10, 50);
            
            this.cameraFollowEnabled = true;
            console.log('Camera following enabled with zoom:', zoomLevel);
        }
    }
    
    hideGameElements() {
        if (this.player) this.player.setVisible(false);
        if (this.sun) this.sun.setVisible(false);
        if (this.key) this.key.setVisible(false);
        if (this.gate) this.gate.setVisible(false);
        
        // Hide clouds
        this.clouds.forEach(cloud => cloud.setVisible(false));
        
        // Hide gems
        this.gems.forEach(gem => {
            gem.setVisible(false);
        });
        
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
        this.gems.forEach(gem => {
            gem.setVisible(true);
        });
        
        // Show UI
        if (this.joystickBase) this.joystickBase.setVisible(true);
        if (this.joystickKnob) this.joystickKnob.setVisible(true);
        if (this.shieldButton) this.shieldButton.setVisible(true);
        
        // Update health UI to show current state
        this.updateHealthUI();
    }
    
    resetGameState() {
        // Reset player position for side-scroller - start at beginning
        this.player.setPosition(150, 480); // Start above first platform at Y=550
        this.player.body.setVelocity(0, 0);
        this.player.isGrounded = false;
        this.playerHealth = 3;
        this.shieldHealth = this.maxShieldHealth;
        this.hasKey = false;
        this.gateOpen = false;
        this.levelComplete = false;
        this.invulnerable = false;
        this.isShielding = false;
        
        // Reset camera to follow player from start
        if (this.cameraFollowEnabled) {
            this.cameras.main.stopFollow();
            this.setupCameraFollow();
        }
        
        // Reset gate
        this.gate.setTexture('gateClose');
        
        // Reset clouds/platforms
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
            this.key = this.physics.add.sprite(1750, 230, 'key');
            const keySize = 50 * this.scaleFactor; // Updated to match increased size
            this.key.setDisplaySize(keySize, keySize);
            this.key.body.setImmovable(true);
            this.key.body.setGravityY(0);
            this.key.floatDirection = 1;
            this.key.originalY = 230;
        } else {
            // Reset key properties if it already exists
            this.key.setPosition(1750, 230);
            this.key.setVisible(true);
            this.key.setAlpha(1);
            const keySize = 50 * this.scaleFactor; // Updated to match increased size
            this.key.setDisplaySize(keySize, keySize);
        }
        
        // Reset sun visibility and properties
        if (this.sun) {
            this.sun.setVisible(true);
            this.sun.setAlpha(1);
            this.sun.setScale(1.2 * this.scaleFactor); // Updated to match increased size
        }
        
        // Recreate gems if they were collected
        this.createSideScrollerGems();
        
        // Update UI
        this.updateHealthUI();
    }
    
    createClouds() {
        // Side-scroller cloud layout - platforms arranged horizontally with gaps for jumping
        // Moved all platforms higher (reduced Y values by 150-200) to ensure sun visibility when zoomed
        const cloudData = [
            // Starting platform - left side
            { x: 200, y: 550, type: 'cloud1', size: { w: 200, h: 70 }, 
              collision: { width: 400, height: 15, offsetX: 105, offsetY: 277.5 } },
            
            // Second platform - small gap
            { x: 550, y: 500, type: 'cloud2', size: { w: 180, h: 65 },
              collision: { width: 350, height: 15, offsetX: 20, offsetY: 285 } },
            
            // Third platform - slightly elevated
            { x: 850, y: 450, type: 'cloud3', size: { w: 175, h: 60 },
              collision: { width: 350, height: 15, offsetX: 55, offsetY: 282.5 } },
            
            // Fourth platform - mid-level with gem
            { x: 1150, y: 400, type: 'cloud1', size: { w: 190, h: 70 },
              collision: { width: 380, height: 15, offsetX: 105, offsetY: 285 } },
            
            // Fifth platform - higher jump required
            { x: 1450, y: 350, type: 'cloud2', size: { w: 170, h: 60 },
              collision: { width: 340, height: 15, offsetX: 30, offsetY: 275 } },
            
            // Sixth platform - key location
            { x: 1750, y: 300, type: 'cloud3', size: { w: 175, h: 65 },
              collision: { width: 350, height: 15, offsetX: 55, offsetY: 327.5 } },
            
            // Seventh platform - approach to gate
            { x: 2050, y: 250, type: 'cloud1', size: { w: 180, h: 60 },
              collision: { width: 360, height: 15, offsetX: 130, offsetY: 315 } },
            
            // Final platform before gate
            { x: 2350, y: 200, type: 'cloud2', size: { w: 200, h: 70 },
              collision: { width: 400, height: 15, offsetX: 30, offsetY: 285 } }
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
                
                // Set visual size with mobile scaling - INCREASED SIZE FOR BETTER VISIBILITY
                const scaledWidth = data.size.w * this.scaleFactor * 1.5; // Increased to 50%
                const scaledHeight = data.size.h * this.scaleFactor * 1.5; // Increased to 50%
                cloud.setDisplaySize(scaledWidth, scaledHeight);
                
                // Use flatter collision boxes for side-scrolling platforms
                const scaledCollisionWidth = data.collision.width * this.scaleFactor;
                const scaledCollisionHeight = data.collision.height * this.scaleFactor;
                const scaledOffsetX = data.collision.offsetX * this.scaleFactor;
                const scaledOffsetY = data.collision.offsetY * this.scaleFactor;
                
                cloud.body.setSize(scaledCollisionWidth, scaledCollisionHeight);
                cloud.body.setOffset(scaledOffsetX, scaledOffsetY);
                
                cloud.disappearTimer = -1; // -1 means not activated
                cloud.originalAlpha = 1;
                cloud.isSolid = true;
                cloud.setVisible(false); // Hidden initially
                
                this.clouds.push(cloud);
                
                console.log(`Created side-scroller cloud ${index} at (${data.x}, ${data.y}) with type ${data.type}`);
            } catch (error) {
                console.error(`Error creating cloud ${index}:`, error);
            }
        });
        
        console.log(`Total clouds created: ${this.clouds.length}`);
    }
    
    createSideScrollerGems() {
        // Clear any existing gems first
        this.gems.forEach(gem => {
            if (gem) gem.destroy();
        });
        this.gems = [];
        
        // Side-scroller gem positions - placed prominently above platforms for maximum visibility
        const gemPositions = [
            { x: 550, y: 350 },  // On second platform (Y=500, gem much higher at Y=350)
            { x: 1150, y: 250 }, // On fourth platform (Y=400, gem much higher at Y=250)
            { x: 2050, y: 100 }, // On seventh platform (Y=250, gem much higher at Y=100)
        ];
        
        gemPositions.forEach((pos, index) => {
            try {
                const gem = this.physics.add.sprite(pos.x, pos.y, 'gem');
                
                if (!gem || !gem.texture || gem.texture.key === '__MISSING') {
                    console.error(`Gem ${index} asset failed to load, creating fallback`);
                    // Create a visible fallback gem if texture fails
                    gem.destroy();
                    const fallbackGem = this.add.circle(pos.x, pos.y, 40 * this.scaleFactor, 0x00FF00); // Bright green circle
                    fallbackGem.setStrokeStyle(4, 0xFFFFFF);
                    fallbackGem.setDepth(100);
                    this.gems.push(fallbackGem);
                    return;
                }
                
                console.log(`Gem ${index} texture loaded successfully:`, gem.texture.key);
                
                // Apply mobile scaling - MODERATE SIZE FOR VISIBILITY
                const gemSize = 50 * this.scaleFactor; // Reduced from 80 for better balance
                gem.setDisplaySize(gemSize, gemSize);
                gem.body.setImmovable(true);
                gem.body.setGravityY(0);
                
                // Add bright tint for better visibility
                gem.setTint(0xFFFFFF); // Pure white tint to make it brighter
                
                // Add floating animation with simple effects
                gem.floatDirection = 1;
                gem.originalY = pos.y;
                // Gems are immediately visible for testing
                
                // Set depth to ensure it's always on top
                gem.setDepth(100);
                
                this.gems.push(gem);
                console.log(`Created side-scroller gem ${index} at (${pos.x}, ${pos.y})`);
                console.log(`Gem ${index} properties:`, {
                    visible: gem.visible,
                    alpha: gem.alpha,
                    scale: gem.scale,
                    depth: gem.depth,
                    tint: gem.tint.toString(16),
                    x: gem.x,
                    y: gem.y,
                    displayWidth: gem.displayWidth,
                    displayHeight: gem.displayHeight
                });
            } catch (error) {
                console.error(`Error creating gem ${index}:`, error);
            }
        });
        
        console.log(`Total gems created: ${this.gems.length}`);
        
        // Debug: Log gem status after a short delay
        this.time.delayedCall(1000, () => {
            console.log('=== GEM STATUS AFTER 1 SECOND ===');
            this.gems.forEach((gem, index) => {
                console.log(`Gem ${index}:`, {
                    visible: gem.visible,
                    x: gem.x,
                    y: gem.y,
                    alpha: gem.alpha,
                    scale: gem.scale,
                    depth: gem.depth,
                    active: gem.active,
                    texture: gem.texture ? gem.texture.key : 'NO TEXTURE'
                });
            });
        });
    }
    
    createUI() {
        // Create individual shield displays (3 shields in a row) with camera-fixed positioning
        this.shieldDisplays = [];
        const shieldSpacing = this.isMobile ? 50 : 60; // Increased spacing for better visibility
        const shieldStartX = this.isMobile && this.isLandscape ? 30 : 40; // Increased margin for zoom
        const shieldY = this.isMobile && this.isLandscape ? 30 : 40; // Increased margin for zoom
        
        for (let i = 0; i < 3; i++) {
            const shield = this.add.image(shieldStartX + (i * shieldSpacing), shieldY, 'shield1');
            shield.setOrigin(0, 0);
            shield.setScale(1.2 * this.uiScaleFactor); // Increased from 0.8 for better visibility at zoom
            shield.setScrollFactor(0); // Fixed to camera
            this.shieldDisplays.push(shield);
        }
        
        // Create individual health displays (3 hearts in a row below shields) with camera-fixed positioning
        this.healthDisplays = [];
        const healthStartX = this.isMobile && this.isLandscape ? 30 : 40; // Increased margin for zoom
        const healthY = this.isMobile && this.isLandscape ? 85 : 110; // Increased spacing for zoom
        
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(healthStartX + (i * shieldSpacing), healthY, 'health1');
            heart.setOrigin(0, 0);
            heart.setScale(1.2 * this.uiScaleFactor); // Increased from 0.8 for better visibility at zoom
            heart.setScrollFactor(0); // Fixed to camera
            this.healthDisplays.push(heart);
        }
        
        // Create joystick using joystick assets with camera-fixed positioning
        let joystickX, joystickY;
        if (this.isMobile && this.isLandscape) {
            // Landscape mobile: position closer to bottom-left corner
            joystickX = 100; // Increased from 80
            joystickY = this.cameras.main.height - 100; // Increased from 80
        } else if (this.isMobile) {
            // Portrait mobile: standard mobile positioning
            joystickX = 120; // Increased from 100
            joystickY = this.cameras.main.height - 140; // Increased from 120
        } else {
            // Desktop: fixed position
            joystickX = 120; // Increased from 100
            joystickY = 980;
        }
        
        this.joystickBase = this.add.image(joystickX, joystickY, 'joystick1');
        this.joystickBase.setScale(1.0 * this.uiScaleFactor); // Increased from 0.8
        this.joystickBase.setAlpha(0.7);
        this.joystickBase.setScrollFactor(0); // Fixed to camera
        this.joystickBase.setVisible(false); // Hidden initially
        
        this.joystickKnob = this.add.circle(joystickX, joystickY, 25 * this.uiScaleFactor, 0xffffff, 0.8); // Increased from 20
        this.joystickKnob.setScrollFactor(0); // Fixed to camera
        this.joystickKnob.setVisible(false); // Hidden initially
        this.joystickCenter = { x: joystickX, y: joystickY };
        
        // Create shield button with camera-fixed positioning
        let shieldButtonX, shieldButtonY;
        if (this.isMobile && this.isLandscape) {
            // Landscape mobile: position closer to bottom-right corner
            shieldButtonX = this.cameras.main.width - 100; // Increased from 80
            shieldButtonY = this.cameras.main.height - 100; // Increased from 80
        } else if (this.isMobile) {
            // Portrait mobile: standard mobile positioning
            shieldButtonX = this.cameras.main.width - 140; // Increased from 120
            shieldButtonY = this.cameras.main.height - 140; // Increased from 120
        } else {
            // Desktop: fixed position
            shieldButtonX = 1800; // Adjusted from 1820
            shieldButtonY = 980;
        }
        
        this.shieldButton = this.add.image(shieldButtonX, shieldButtonY, 'shieldButton');
        this.shieldButton.setScale(1.0 * this.uiScaleFactor); // Increased from 0.8
        this.shieldButton.setInteractive();
        this.shieldButton.setAlpha(0.8);
        this.shieldButton.setScrollFactor(0); // Fixed to camera
        this.shieldButton.setVisible(false); // Hidden initially
        
        this.updateHealthUI();
    }

    updateUIPositions() {
        // Update UI positions when orientation changes
        if (!this.joystickBase || !this.shieldButton) return;
        
        // Update background scaling first
        this.updateBackgroundScale();
        
        // Get current screen dimensions
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Calculate responsive UI positions based on screen size
        let joystickX, joystickY;
        let shieldButtonX, shieldButtonY;
        
        if (this.isMobile) {
            // Mobile device positioning - responsive to screen size
            const margin = Math.max(60, Math.min(120, screenWidth * 0.06));
            const bottomMargin = Math.max(80, Math.min(140, screenHeight * 0.1));
            
            if (this.isLandscape) {
                // Landscape mobile: position closer to edges
                joystickX = margin;
                joystickY = screenHeight - bottomMargin;
                shieldButtonX = screenWidth - margin;
                shieldButtonY = screenHeight - bottomMargin;
            } else {
                // Portrait mobile: more centered positioning
                joystickX = margin + 20;
                joystickY = screenHeight - bottomMargin - 20;
                shieldButtonX = screenWidth - margin - 20;
                shieldButtonY = screenHeight - bottomMargin - 20;
            }
        } else {
            // Desktop: use fixed positions but scale appropriately
            const scale = Math.min(screenWidth / 1920, screenHeight / 1080);
            joystickX = 120 * scale;
            joystickY = screenHeight - (120 * scale);
            shieldButtonX = screenWidth - (120 * scale);
            shieldButtonY = screenHeight - (120 * scale);
        }
        
        this.joystickBase.setPosition(joystickX, joystickY);
        this.joystickKnob.setPosition(joystickX, joystickY);
        this.joystickCenter = { x: joystickX, y: joystickY };
        
        this.shieldButton.setPosition(shieldButtonX, shieldButtonY);
        
        // Update health and shield display positioning with responsive spacing
        const uiMargin = this.isMobile ? Math.max(30, screenWidth * 0.03) : 40; // Increased margins
        const shieldSpacing = this.isMobile ? Math.max(45, screenWidth * 0.035) : 60; // Increased spacing
        const topMargin = this.isMobile ? Math.max(30, screenHeight * 0.03) : 40; // Increased top margin
        
        // Update shield displays
        for (let i = 0; i < this.shieldDisplays.length; i++) {
            this.shieldDisplays[i].setPosition(uiMargin + (i * shieldSpacing), topMargin);
            this.shieldDisplays[i].setScale(1.2 * this.uiScaleFactor); // Increased scale for zoom visibility
        }
        
        // Update health displays (below shields)
        const healthY = topMargin + (this.isMobile ? 55 : 70); // Increased spacing
        for (let i = 0; i < this.healthDisplays.length; i++) {
            this.healthDisplays[i].setPosition(uiMargin + (i * shieldSpacing), healthY);
            this.healthDisplays[i].setScale(1.2 * this.uiScaleFactor); // Increased scale for zoom visibility
        }
        
        // Update joystick and button scales
        this.joystickBase.setScale(1.0 * this.uiScaleFactor);
        this.joystickKnob.setRadius(25 * this.uiScaleFactor);
        this.shieldButton.setScale(1.0 * this.uiScaleFactor);
        
        console.log('UI positions updated:', {
            joystick: { x: joystickX, y: joystickY },
            shieldButton: { x: shieldButtonX, y: shieldButtonY },
            screenSize: { width: screenWidth, height: screenHeight }
        });
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
            const joystickRange = 75 * this.uiScaleFactor; // Increased from 60
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
            if (shieldDistance <= 75) { // Increased from 60
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
        const joystickRange = 75 * this.uiScaleFactor; // Increased from 60
        
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
            
            // Play shield activation sound
            this.playSound('shieldActivate', { volume: 0.5 });
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
                
                // Play jump sound
                this.playSound('jump', { volume: 0.6 });
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
        
        // Enhanced collision detection for mobile devices
        this.clouds.forEach(cloud => {
            if (cloud.isSolid && this.physics.overlap(this.player, cloud)) {
                const playerBottom = this.player.y + this.player.body.height / 2;
                const playerCenterX = this.player.x;
                const playerLeft = this.player.x - this.player.body.width / 2;
                const playerRight = this.player.x + this.player.body.width / 2;
                
                // Get the actual collision body bounds
                const cloudLeft = cloud.body.x;
                const cloudRight = cloud.body.x + cloud.body.width;
                const cloudTop = cloud.body.y;
                const cloudBottom = cloud.body.y + cloud.body.height;
                
                // Enhanced mobile-friendly collision detection
                const baseTolerance = this.isMobile ? 20 : 10;
                const horizontalTolerance = baseTolerance * this.scaleFactor;
                const verticalTolerance = baseTolerance * this.scaleFactor;
                const verticalOffset = 5 * this.scaleFactor;
                
                // More generous overlap detection for mobile
                const horizontalOverlap = (playerRight >= cloudLeft - horizontalTolerance) && 
                                        (playerLeft <= cloudRight + horizontalTolerance);
                
                const landingCondition = this.player.body.velocity.y >= 0 && // Player falling down
                                       horizontalOverlap && // Horizontal overlap with tolerance
                                       playerBottom >= cloudTop - verticalOffset && // Close to cloud top
                                       playerBottom <= cloudBottom + verticalTolerance; // Not too far below
                
                console.log('Collision check:', {
                    cloudIndex: this.clouds.indexOf(cloud),
                    playerPos: { x: playerCenterX, y: this.player.y, bottom: playerBottom },
                    cloudBounds: { left: cloudLeft, right: cloudRight, top: cloudTop, bottom: cloudBottom },
                    horizontalOverlap,
                    landingCondition,
                    velocity: this.player.body.velocity.y
                });
                
                if (landingCondition) {
                    this.player.isGrounded = true;
                    this.player.y = cloudTop - this.player.body.height / 2;
                    this.player.body.setVelocityY(0);
                    
                    // Start cloud disappearing timer
                    if (cloud.disappearTimer === -1) {
                        cloud.disappearTimer = 5; // 5 seconds
                        this.lastCloudPosition = { x: cloud.x, y: cloud.y };
                    }
                    
                    console.log('Player landed on cloud', this.clouds.indexOf(cloud));
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
            
            // Enhanced gate collision for mobile
            const gateTolerance = this.isMobile ? 20 : 10;
            
            // Check if player is landing on top of the gate platform and within horizontal bounds
            if (this.player.body.velocity.y >= 0 &&
                playerCenterX >= gateLeft - gateTolerance && 
                playerCenterX <= gateRight + gateTolerance &&
                playerBottom >= gateTop - 5 &&
                playerBottom <= gateTop + 25 &&
                !this.player.isGrounded) { // Only land if not already grounded
                
                this.player.isGrounded = true;
                this.player.y = gateTop - this.player.body.height / 2;
                this.player.body.setVelocityY(0);
                
                // Update last position when standing on gate
                this.lastCloudPosition = { x: this.gate.x, y: this.gate.y };
                
                console.log('Player landed on gate');
            }
        }
        
        // Add ground collision for debugging on mobile
        if (this.player.y > 1000 && !this.player.isGrounded) {
            console.log('Player falling, position:', this.player.y, 'velocity:', this.player.body.velocity.y);
        }
        
        // Additional fall detection: if player is falling fast and far from any platform
        if (!this.player.isGrounded && this.player.body.velocity.y > 200) {
            let nearPlatform = false;
            const playerX = this.player.x;
            const platformCheckDistance = 150; // Check if player is within this distance of any platform
            
            this.clouds.forEach(cloud => {
                const distance = Math.abs(cloud.x - playerX);
                if (distance < platformCheckDistance) {
                    nearPlatform = true;
                }
            });
            
            // Also check gate platform
            if (this.gate && Math.abs(this.gate.x - playerX) < platformCheckDistance) {
                nearPlatform = true;
            }
            
            // If player is falling and not near any platform and below a certain Y threshold
            if (!nearPlatform && this.player.y > 900) {
                console.log('Player falling away from platforms - triggering death');
                this.checkDeath(); // This will handle the actual death logic
            }
        }
    }
    
    updateGems(deltaSeconds) {
        this.gems.forEach(gem => {
            // Skip if this is a fallback gem (circle)
            if (!gem.originalY) return;
            
            // Simple floating animation
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
                const previousTimer = cloud.disappearTimer;
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
            // Fireballs now use automatic gravity from the body
            // Limit terminal velocity
            if (fireball.body.velocity.y > this.FIREBALL_TERMINAL) {
                fireball.body.setVelocityY(this.FIREBALL_TERMINAL);
            }
            
            // Remove fireballs that fall off screen or go too far off camera
            const cameraX = this.cameras.main.scrollX;
            const cameraWidth = this.cameras.main.width;
            
            if (fireball.y > 1100 || 
                fireball.x < cameraX - 200 || 
                fireball.x > cameraX + cameraWidth + 200) {
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
        // Update sun position to follow player for side-scrolling
        if (this.player && this.cameraFollowEnabled) {
            // Position sun relative to camera/player position but offset
            const cameraX = this.cameras.main.scrollX;
            const sunX = cameraX + 600; // Keep sun ahead of player
            const sunY = 100;
            
            // Update sun position
            this.sun.setPosition(sunX, sunY);
            
            // Target player's current position plus some prediction
            const playerX = this.player.x;
            const playerY = this.player.y;
            
            // Add some prediction based on player velocity
            const playerVelX = this.player.body.velocity.x;
            const playerVelY = this.player.body.velocity.y;
            const predictionTime = 1.0; // 1 second prediction
            
            const targetX = playerX + playerVelX * predictionTime;
            const targetY = playerY + playerVelY * predictionTime * 0.5; // Less Y prediction
            
            // Calculate distance to target
            const deltaX = targetX - sunX;
            const deltaY = targetY - sunY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Calculate time to reach target
            const initialSpeed = 350; // Slightly slower for side-scrolling
            const timeToTarget = distance / initialSpeed;
            
            // Calculate initial velocity components
            const velocityX = deltaX / timeToTarget;
            const velocityY = (deltaY - 0.5 * this.FIREBALL_GRAVITY * timeToTarget * timeToTarget) / timeToTarget;
            
            // Add some randomness for variety
            const spreadFactor = 0.15;
            const finalVelocityX = velocityX + (Math.random() - 0.5) * Math.abs(velocityX) * spreadFactor;
            const finalVelocityY = velocityY + (Math.random() - 0.5) * Math.abs(velocityY) * spreadFactor;
            
            // Spawn at sun position
            const offsetX = Phaser.Math.Between(-15, 15);
            const offsetY = Phaser.Math.Between(-10, 10);
            const fireball = this.fireballs.create(sunX + offsetX, sunY + offsetY, 'fireball');
            
            // Play fireball spawn sound
            this.playSound('fireballSpawn', { volume: 0.3 });
            
            // Set calculated velocity
            fireball.body.setVelocity(finalVelocityX, finalVelocityY);
            fireball.body.setGravityY(this.FIREBALL_GRAVITY); // Use proper gravity instead of 0
            fireball.setScale(1.0 * this.scaleFactor); // Increased from 0.8 for better visibility
            
            // Apply mobile scaling to fireball size - INCREASED SIZE FOR BETTER VISIBILITY
            const fireballSize = 50 * this.scaleFactor; // Increased from 40
            fireball.setDisplaySize(fireballSize, fireballSize);
            
            // Rotate fireball to match trajectory
            const angle = Math.atan2(finalVelocityY, finalVelocityX);
            fireball.setRotation(angle);
        }
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
        // Play gem collection sound
        this.playSound('gemCollect', { volume: 0.6 });
        
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
        
        // Play key collection sound
        this.playSound('keyCollect', { volume: 0.7 });
        
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
        
        // Play gate opening sound
        this.playSound('gateOpen', { volume: 0.5 });
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
        // Play shield hit sound
        this.playSound('shieldHit', { volume: 0.6 });
        
        // Damage the shield when blocking a fireball
        this.shieldHealth--;
        this.updateHealthUI();
        
        // Stop shielding if shield is broken
        if (this.shieldHealth <= 0) {
            this.isShielding = false;
        }
    }
    
    damagePlayer() {
        // Play player hit sound
        this.playSound('playerHit', { volume: 0.7 });
        
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
            if (this.player.y > 1000) {
                this.player.setPosition(200, 480); // Reset to start position above first platform
                this.player.body.setVelocity(0, 0);
                this.player.isGrounded = false;
            }
            return;
        }
        
        // Check if player fell off screen - trigger game over at reasonable height
        // Also check if player falls too far below any platform
        const lowestPlatformY = Math.max(...this.clouds.map(cloud => cloud.y)) + 200;
        const fallThreshold = Math.min(1000, lowestPlatformY); // Use lower of the two values
        
        if (this.player.y > fallThreshold) {
            console.log('Player death triggered - fell off platforms at y:', this.player.y);
            this.playerDeath();
        }
    }
    
    playerDeath() {
        // Prevent multiple death triggers
        if (this.gameState !== 'PLAYING') return;
        
        // Play player death sound
        this.playSound('playerDeath', { volume: 0.8 });
        
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
        this.player.setPosition(200, 480); // Updated position to match new platform heights at Y=550
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
                this.key = this.physics.add.sprite(1750, 380, 'key');
                const keySize = 40 * this.scaleFactor; // Updated to match increased size
                this.key.setDisplaySize(keySize, keySize);
                this.key.body.setImmovable(true);
                this.key.body.setGravityY(0);
                this.key.floatDirection = 1;
                this.key.originalY = 380;
            }
            
            // Respawn the sun
            this.sun.setVisible(true);
            this.sun.setAlpha(1);
            this.sun.setScale(0.8 * this.scaleFactor); // Updated to match increased size
        }
        
        // Clear fireballs
        this.fireballs.clear(true, true);
        
        // Start invulnerability
        this.invulnerable = true;
        this.invulnerabilityTimer = 2;
    }
    
    completeLevel() {
        this.levelComplete = true;
        
        // Play level complete sound
        this.playSound('levelComplete', { volume: 0.8 });
        
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
        
        // Add T key for testing all sounds in debug mode
        this.input.keyboard.on('keydown-T', () => {
            if (this.debugMode && this.gameState === 'PLAYING') {
                this.testAllSounds();
            }
        });
        
        // Add M key for toggling audio in debug mode
        this.input.keyboard.on('keydown-M', () => {
            if (this.debugMode) {
                this.toggleAudio();
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

    resize(gameSize, baseSize, displaySize, resolution) {
        // Handle game resize events to maintain proper scaling and prevent stretching
        const width = gameSize.width;
        const height = gameSize.height;
        
        console.log('Game resize event:', { width, height, baseSize, displaySize });
        
        // Update device detection with new dimensions
        this.updateDeviceDetection();
        
        // For FIT mode, the camera size should match the base size to maintain aspect ratio
        this.cameras.main.setSize(1920, 1080); // Keep fixed aspect ratio
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // Update background scaling to cover the world properly
        if (this.backgroundImages) {
            this.backgroundImages.forEach(bg => {
                bg.setScale(this.worldHeight / bg.texture.source[0].height);
            });
        }
        
        // Update UI positions if they exist
        if (this.joystickBase) {
            this.updateUIPositions();
        }
        
        // Update any screen overlays to fit the display
        if (this.startScreen) {
            this.updateScreenOverlays();
        }
    }

    updateScreenOverlays() {
        // Update screen overlays (start screen, game over, etc.) to fit new dimensions
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Update start screen if it exists
        if (this.startScreen) {
            this.startScreen.setPosition(gameWidth / 2, gameHeight / 2);
            
            // Update the blurred background in the start screen
            const startBG = this.startScreen.list[0]; // First element should be the background
            if (startBG && startBG.texture) {
                const scaleX = gameWidth / startBG.texture.source[0].width;
                const scaleY = gameHeight / startBG.texture.source[0].height;
                const scale = Math.max(scaleX, scaleY);
                startBG.setScale(scale);
            }
        }
        
        // Update game over screen if it exists
        if (this.gameOverScreen) {
            this.gameOverScreen.setPosition(gameWidth / 2, gameHeight / 2);
            
            const gameOverBG = this.gameOverScreen.list[0];
            if (gameOverBG && gameOverBG.texture) {
                const scaleX = gameWidth / gameOverBG.texture.source[0].width;
                const scaleY = gameHeight / gameOverBG.texture.source[0].height;
                const scale = Math.max(scaleX, scaleY);
                gameOverBG.setScale(scale);
            }
        }
        
        // Update level complete screen if it exists
        if (this.levelCompleteScreen) {
            this.levelCompleteScreen.setPosition(gameWidth / 2, gameHeight / 2);
            
            const completeBG = this.levelCompleteScreen.list[0];
            if (completeBG && completeBG.texture) {
                const scaleX = gameWidth / completeBG.texture.source[0].width;
                const scaleY = gameHeight / completeBG.texture.source[0].height;
                const scale = Math.max(scaleX, scaleY);
                completeBG.setScale(scale);
            }
        }
    }
    
    createSideScrollerBackground() {
        // Create a repeating background for side-scrolling
        try {
            console.log('Creating side-scroller background, available textures:', Object.keys(this.textures.list));
            
            if (!this.textures.exists('bgFull')) {
                console.error('Background texture "bgFull" not found, using fallback');
                // Create a fallback colored background
                const fallbackBg = this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, this.worldWidth, this.worldHeight, 0x87CEEB);
                this.backgroundImage = fallbackBg;
                return;
            }
            
            // Create multiple background instances to cover the world width
            const bgTexture = this.textures.get('bgFull');
            const bgWidth = bgTexture.source[0].width;
            const bgHeight = bgTexture.source[0].height;
            
            // Calculate how many background images we need to cover the world width
            const scaleY = this.worldHeight / bgHeight;
            const scaledBgWidth = bgWidth * scaleY;
            const numBackgrounds = Math.ceil(this.worldWidth / scaledBgWidth);
            
            this.backgroundImages = [];
            
            for (let i = 0; i < numBackgrounds; i++) {
                const bg = this.add.image(i * scaledBgWidth + (scaledBgWidth / 2), this.worldHeight / 2, 'bgFull');
                bg.setScale(scaleY);
                bg.setDepth(-100); // Put background behind everything
                this.backgroundImages.push(bg);
            }
            
            console.log('Side-scroller background created:', { 
                worldWidth: this.worldWidth, 
                worldHeight: this.worldHeight, 
                numBackgrounds,
                scaledBgWidth,
                scaleY
            });
        } catch (error) {
            console.error('Error creating side-scroller background:', error);
            // Create a fallback colored background
            const fallbackBg = this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, this.worldWidth, this.worldHeight, 0x87CEEB);
            this.backgroundImage = fallbackBg;
        }
    }
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
            width: 360,
            height: 640
        },
        max: {
            width: 1920,
            height: 1080
        },
        // Enhanced mobile handling - prevent stretching
        fullscreenTarget: 'app',
        expandParent: false,
        // Allow both orientations but maintain aspect ratio
        forceOrientation: false,
        // Prevent zoom and maintain proper scaling
        zoom: 1
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
            
            console.log('Orientation change detected');
            
            // Update device detection with new dimensions
            scene.updateDeviceDetection();
            
            // Update UI positions and scaling
            if (scene.updateUIPositions) {
                scene.updateUIPositions();
            }
            
            // Update screen overlays
            if (scene.updateScreenOverlays) {
                scene.updateScreenOverlays();
            }
            
            // Force camera bounds update
            scene.cameras.main.setBounds(0, 0, 1920, 1080);
        }
    }, 200);
}

function handleResize() {
    // Immediate response for window resize
    if (game.scene.scenes[0]) {
        const scene = game.scene.scenes[0];
        
        console.log('Window resize detected');
        
        // Update device detection
        scene.updateDeviceDetection();
        
        // Update UI positions and scaling
        if (scene.updateUIPositions) {
            scene.updateUIPositions();
        }
        
        // Update screen overlays
        if (scene.updateScreenOverlays) {
            scene.updateScreenOverlays();
        }
    }
}

// Handle orientation changes for mobile devices
window.addEventListener('orientationchange', handleOrientationChange);

// Handle window resize for both desktop and mobile
window.addEventListener('resize', handleResize);

// Handle device orientation API if available (modern mobile browsers)
if (screen.orientation) {
    screen.orientation.addEventListener('change', handleOrientationChange);
}

// Handle visual viewport changes (important for mobile browsers with address bars)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
}