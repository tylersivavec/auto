// Game constants
const GOLD_INTERVAL = 1; // Seconds between gold increments
const BATTLE_INTERVAL = 45; // Seconds between battles
const BASE_GOLD_RATE = 3; // Base amount of gold earned per interval
const MINER_GOLD_RATES = [1, 2, 3]; // Gold rate for each miner (index 0 = first miner, etc.)
const BASE_WIN_BONUS = 75; // Base gold bonus for winning a battle
const WIN_BONUS_INCREMENT = 25; // Additional gold per consecutive win
const ISOMETRIC_FACTOR = 0.5; // How "flat" the isometric view appears
const MAX_GOLD = 500; // Maximum gold cap
const SPRITE_SIZE = 32; // Size of sprite assets
const ANIMATION_FPS = 8; // Animation frames per second
const SPRITE_FRAMES = {
    warrior: 1,  // Number of frames in warrior sprite
    archer: 1,   // Number of frames in archer sprite
    mage: 1      // Number of frames in mage sprite
};
const BASE_ATTACK_RANGE = 150; // Range at which units can attack the base
const BASE_ATTACK_DAMAGE = 100; // Increased from 20
const BASE_ATTACK_SPEED = 0.25; // Reduced from 0.5 (attacks every 4 seconds)
const BASE_ATTACK_COOLDOWN = 0.25 / BASE_ATTACK_SPEED; // Time between base attacks
const BASE_PROJECTILE_SPEED = 8; // Increased speed of base projectiles for better visibility

// Add damage type effectiveness constants
const DAMAGE_TYPE_EFFECTIVENESS = {
    Physical: {
        Heavy: 0.5,    // Physical attacks are weak against heavy armor
        Light: 1.5,    // Physical attacks are strong against light armor
        Cloth: 1.0     // Physical attacks are neutral against cloth
    },
    Piercing: {
        Heavy: 1.0,    // Piercing attacks are neutral against heavy armor
        Light: 1.0,    // Piercing attacks are neutral against light armor
        Cloth: 1.5     // Piercing attacks are strong against cloth
    },
    Magic: {
        Heavy: 1.5,    // Magic attacks are strong against heavy armor
        Light: 1.0,    // Magic attacks are neutral against light armor
        Cloth: 0.5     // Magic attacks are weak against cloth
    }
};

// Grid colors and pattern
const GRID_COLORS = {
    grass: Array(100).fill(null).map(() => {
        const baseHue = 120;  // Green
        const hueVariation = Math.random() * 20 - 10;  // ±10 variation
        const saturation = 30 + Math.random() * 20;    // 30-50%
        const lightness = 25 + Math.random() * 10;     // 25-35%
        return `hsl(${baseHue + hueVariation}, ${saturation}%, ${lightness}%)`;
    }),
    dirt: Array(20).fill(null).map(() => {
        const baseHue = 30;  // Brown
        const hueVariation = Math.random() * 20 - 10;  // ±10 variation
        const saturation = 30 + Math.random() * 20;    // 30-50%
        const lightness = 20 + Math.random() * 10;     // 20-30%
        return `hsl(${baseHue + hueVariation}, ${saturation}%, ${lightness}%)`;
    })
};

// Pre-calculate dirt path pattern
const DIRT_PATTERN = new Set();
// Create a 6x4 rectangle, horizontally oriented, shifted down 5 and right 6
for (let i = -3 + 4; i <= 2 + 6; i++) {      // 6 columns wide, shifted right by 5
    for (let j = -2 + 5; j <= 1 + 5; j++) {  // 4 rows tall, shifted down by 5
        DIRT_PATTERN.add(`${i},${j}`);
    }
}

// Export constants for other modules
export {
    GOLD_INTERVAL,
    BATTLE_INTERVAL,
    BASE_GOLD_RATE,
    MINER_GOLD_RATES,
    BASE_WIN_BONUS,
    WIN_BONUS_INCREMENT,
    ISOMETRIC_FACTOR,
    MAX_GOLD,
    SPRITE_SIZE,
    ANIMATION_FPS,
    SPRITE_FRAMES,
    BASE_ATTACK_RANGE,
    BASE_ATTACK_DAMAGE,
    BASE_ATTACK_SPEED,
    BASE_ATTACK_COOLDOWN,
    BASE_PROJECTILE_SPEED,
    DAMAGE_TYPE_EFFECTIVENESS,
    GRID_COLORS,
    DIRT_PATTERN
}; 