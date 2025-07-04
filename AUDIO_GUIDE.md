# Audio Guide for Platformer Game

## Audio System Overview

The game includes a comprehensive audio system with the following features:
- Background music
- Sound effects for all game events
- Volume controls for music and SFX separately
- Error handling for missing audio files
- Mobile-friendly audio implementation

## Required Audio Files

Place all audio files in the `public/sounds/` directory. Each sound should be provided in multiple formats for browser compatibility:

### Background Music
- `background-music.mp3` / `background-music.ogg` - Looping background music for gameplay

### Player Actions
- `jump.mp3` / `jump.wav` - Player jumping sound
- `land.mp3` / `land.wav` - Player landing on platforms
- `player-hit.mp3` / `player-hit.wav` - Player taking damage
- `player-death.mp3` / `player-death.wav` - Player death sound

### Shield System
- `shield-activate.mp3` / `shield-activate.wav` - Shield activation
- `shield-hit.mp3` / `shield-hit.wav` - Shield blocking fireball

### Collectibles
- `gem-collect.mp3` / `gem-collect.wav` - Collecting gems (shield restoration)
- `key-collect.mp3` / `key-collect.wav` - Collecting the key

### Environment
- `cloud-disappear.mp3` / `cloud-disappear.wav` - Cloud warning sound when fading
- `fireball-spawn.mp3` / `fireball-spawn.wav` - Fireball creation from sun
- `gate-open.mp3` / `gate-open.wav` - Gate opening when key collected

### UI & Game States
- `button-click.mp3` / `button-click.wav` - Menu button interactions
- `level-complete.mp3` / `level-complete.wav` - Level completion fanfare
- `game-over.mp3` / `game-over.wav` - Game over sound

## Audio Configuration

### Volume Settings
- **Music Volume**: 0.5 (50%) - Configurable via `this.musicVolume`
- **SFX Volume**: 0.7 (70%) - Configurable via `this.sfxVolume`

### Audio System Features
- **Fallback System**: If audio files are missing, silent placeholders are created to prevent errors
- **Mobile Support**: Audio system is designed to work on mobile devices
- **Error Handling**: Comprehensive error handling for loading and playback issues

## Implementation Details

### Audio Initialization
The audio system is initialized in the `initializeAudio()` method during scene creation:
- Checks for audio file existence
- Creates sound objects with appropriate settings
- Sets up fallback placeholders for missing files
- Starts background music if enabled

### Sound Playback
Use the `playSound(soundKey, config)` method to play sounds:
```javascript
// Basic usage
this.playSound('jump');

// With volume control
this.playSound('gemCollect', { volume: 0.6 });

// Stop previous instance
this.playSound('fireballSpawn', { stopPrevious: true });
```

### Volume Controls
- `setMusicVolume(volume)` - Set background music volume (0-1)
- `setSFXVolume(volume)` - Set sound effects volume (0-1)
- `toggleAudio()` - Enable/disable all audio

### Background Music Controls
- `playBackgroundMusic()` - Start background music
- `stopBackgroundMusic()` - Stop background music
- `pauseBackgroundMusic()` - Pause background music
- `resumeBackgroundMusic()` - Resume paused music

## Sound Integration Points

### Player Actions
- **Jump**: Triggered when player jumps from a platform
- **Land**: Triggered when player lands on cloud or gate
- **Shield Activate**: Triggered when shield is activated

### Combat & Damage
- **Shield Hit**: When shield blocks a fireball
- **Player Hit**: When player takes damage
- **Player Death**: When player health reaches 0

### World Interactions
- **Fireball Spawn**: When sun creates new fireballs
- **Cloud Warning**: When clouds start to fade (2 seconds before disappearing)

### Collectibles & Progress
- **Gem Collect**: When player collects health gems
- **Key Collect**: When player collects the level key
- **Gate Open**: When gate opens after key collection
- **Level Complete**: When player reaches the open gate

### UI & Game Flow
- **Button Click**: All menu button interactions
- **Game Start**: Background music starts when game begins
- **Game Over**: Game over screen appears

## File Format Recommendations

### For Web Deployment
- **Primary**: MP3 files for broad compatibility
- **Fallback**: WAV or OGG files for older browsers

### File Size Considerations
- **Background Music**: Can be larger (2-5MB) for quality
- **Sound Effects**: Keep small (50-500KB) for quick loading
- **Sample Rate**: 44.1kHz recommended
- **Bit Rate**: 128-192kbps for MP3 files

## Testing Audio

To test the audio system:
1. Add audio files to `public/sounds/` directory
2. Check browser console for loading confirmation
3. Enable debug mode to see audio events
4. Test volume controls and audio toggle

## Troubleshooting

### Common Issues
1. **No Sound on Mobile**: Ensure user interaction before audio playback
2. **File Not Found**: Check file paths and case sensitivity
3. **Format Support**: Provide multiple formats for compatibility
4. **Volume Issues**: Check both system and game volume settings

### Debug Information
The audio system logs detailed information to the console:
- Audio file loading status
- Playback attempts and errors
- Volume changes and audio state

## Future Enhancements

Potential audio improvements:
- Dynamic music that changes based on game state
- Positional audio for fireballs and effects
- Audio settings menu for players
- Sound effect variations to prevent repetition
- Ambient environmental sounds
