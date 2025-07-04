# Audio File List

This file documents all the audio files needed for the game. Place these files in the `public/sounds/` directory.

## Required Audio Files

### Background Music
- [ ] `background-music.mp3` - Main game background music (looping)
- [ ] `background-music.ogg` - Fallback format

### Player Sounds
- [ ] `jump.mp3` - Player jump sound
- [ ] `jump.wav` - Fallback format
- [ ] `player-hit.mp3` - Player damage sound
- [ ] `player-hit.wav` - Fallback format
- [ ] `player-death.mp3` - Player death sound
- [ ] `player-death.wav` - Fallback format

### Shield System
- [ ] `shield-activate.mp3` - Shield activation sound
- [ ] `shield-activate.wav` - Fallback format
- [ ] `shield-hit.mp3` - Shield blocking fireball
- [ ] `shield-hit.wav` - Fallback format

### Collectibles
- [ ] `gem-collect.mp3` - Gem collection sound
- [ ] `gem-collect.wav` - Fallback format
- [ ] `key-collect.mp3` - Key collection sound
- [ ] `key-collect.wav` - Fallback format

### Environment
- [ ] `fireball-spawn.mp3` - Fireball creation sound
- [ ] `fireball-spawn.wav` - Fallback format
- [ ] `gate-open.mp3` - Gate opening sound
- [ ] `gate-open.wav` - Fallback format

### UI & Game States
- [ ] `button-click.mp3` - Button interaction sound
- [ ] `button-click.wav` - Fallback format
- [ ] `level-complete.mp3` - Level completion sound
- [ ] `level-complete.wav` - Fallback format
- [ ] `game-over.mp3` - Game over sound
- [ ] `game-over.wav` - Fallback format

## Audio Specifications

### Recommended Settings
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit minimum
- **Format**: MP3 (primary), WAV/OGG (fallback)
- **Length**: 
  - Background music: 30-120 seconds (looping)
  - Sound effects: 0.5-3 seconds
- **File Size**: 
  - Background music: 2-5 MB
  - Sound effects: 50-500 KB

### Volume Guidelines
- All sounds should be normalized
- Background music should be mixed at -6dB to -12dB
- Sound effects should be punchy but not overwhelming
- Consistent volume levels across all files

## Sources for Audio

### Free Resources
- Freesound.org
- Zapsplat.com (free with registration)
- Mixkit.co
- OpenGameArt.org

### Tools for Audio Editing
- Audacity (free)
- GarageBand (Mac)
- Reaper (paid)
- Adobe Audition (paid)

## Notes
- Game will function without audio files (silent placeholders)
- Multiple formats ensure browser compatibility
- File names are case-sensitive on some servers
- Test on multiple devices and browsers
