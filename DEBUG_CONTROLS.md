# Interactive Cloud Collision Box Debug Controls

## Overview
The game now includes interactive debug controls to manually adjust cloud collision boxes in real-time. This allows you to fine-tune the collision detection to perfectly match the visual cloud assets.

## How to Use

### Starting Debug Mode
- Debug mode is automatically enabled when you run the game
- Green debug information will appear in the top-left corner
- Red collision boxes will be visible around all physics objects

### Controls

#### Cloud Selection
- **TAB** - Cycle through clouds (selects the next cloud for editing)

#### Moving Collision Boxes
- **Arrow Keys** - Move the collision box of the selected cloud
  - ↑ - Move collision box up
  - ↓ - Move collision box down  
  - ← - Move collision box left
  - → - Move collision box right

#### Resizing Collision Boxes
- **SHIFT + Arrow Keys** - Resize the collision box of the selected cloud
  - SHIFT + ↑ - Make collision box shorter
  - SHIFT + ↓ - Make collision box taller
  - SHIFT + ← - Make collision box narrower
  - SHIFT + → - Make collision box wider

#### Fine Adjustment
- **CTRL + Arrow Keys** - Make smaller adjustments (1 pixel instead of 5 pixels)
- **CTRL + SHIFT + Arrow Keys** - Fine resize adjustments

#### Utility Commands
- **SPACE** - Reset the selected cloud's collision box to default settings
- **ENTER** - Export all collision box data to browser console

## Debug Information Display

The debug panel shows:
- Selected cloud number (e.g., "Cloud 1/8")
- Current cloud position
- Current collision box dimensions (width x height)
- Current collision box offset from the cloud's center
- Control instructions

## Exporting Collision Data

When you press **ENTER**, the game will:
1. Log detailed collision data for all clouds to the browser console
2. Show data in JSON format that can be copied and used in production code
3. Include both absolute values and ratios relative to original cloud size

### Console Data Format
```json
[
  {
    "index": 0,
    "texture": "cloud1",
    "originalSize": { "w": 200, "h": 100 },
    "collisionBox": {
      "width": 160,
      "height": 25,
      "offsetX": 20,
      "offsetY": -37.5
    },
    "relativeToOriginal": {
      "widthRatio": 0.8,
      "heightRatio": 0.25,
      "offsetXRatio": 0.1,
      "offsetYRatio": -0.375
    }
  }
]
```

## Tips for Collision Box Adjustment

1. **Start with the first cloud** - Use TAB to select cloud 1 and ensure the player lands properly
2. **Focus on the top edge** - The most important part is where the player's feet touch the cloud
3. **Use visual feedback** - The red collision box outline shows exactly where collisions occur
4. **Test with movement** - Move the player around to test how the collision feels during gameplay
5. **Consider cloud shape** - Different cloud textures may need different collision box sizes
6. **Save your work** - Use ENTER to export settings before closing the browser

## Disabling Debug Mode

To disable debug mode for production:
1. In `src/main.js`, find the line `this.debugMode = true;`
2. Change it to `this.debugMode = false;`
3. Set `debug: false` in the Phaser physics configuration

## Workflow

1. Load the game and observe cloud collision issues
2. Use TAB to select problematic clouds
3. Use arrow keys to move/resize collision boxes until they feel right
4. Test player movement and jumping
5. Export final collision data with ENTER
6. Copy the console output to preserve your settings
7. Disable debug mode for production
