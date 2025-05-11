import { MAX_GOLD, GOLD_INTERVAL, BATTLE_INTERVAL, BASE_ATTACK_COOLDOWN } from './constants.js';

// Game state singleton
let gameState = {
    playerGold: 100,
    enemyGold: 100,
    playerBaseHealth: 1000,
    enemyBaseHealth: 1000,
    playerStagingArea: [],
    enemyStagingArea: [],
    activeUnits: [],
    playerMiners: 0,
    enemyMiners: 0,
    playerVaults: 0,
    enemyVaults: 0,
    goldTimer: 1, // GOLD_INTERVAL
    battleTimer: 45, // BATTLE_INTERVAL
    gameOver: false,
    draggingUnit: null,
    dragStartPos: null,
    playerBaseAttackCooldown: 0,
    enemyBaseAttackCooldown: 0,
    firstBattleOccurred: false,
    animationTimer: 0,
    currentFrame: 0,
    playerWinStreak: 0,
    enemyWinStreak: 0,
    prevPlayerWinStreak: 0,
    prevEnemyWinStreak: 0,
    nextBattleWinBonus: 75, // BASE_WIN_BONUS
    battleWon: false,
    upgrades: {
        shadowPriest: false,
        arcLightning: false,
        pillage: false,
        poisonArrow: false
    }
};

// Initialize game state with default values
function initializeGameState() {
    gameState = {
        playerGold: 100,
        enemyGold: 100,
        playerBaseHealth: 1000,
        enemyBaseHealth: 1000,
        playerStagingArea: [],
        enemyStagingArea: [],
        activeUnits: [],
        playerMiners: 0,
        enemyMiners: 0,
        playerVaults: 0,
        enemyVaults: 0,
        goldTimer: 1, // GOLD_INTERVAL
        battleTimer: 45, // BATTLE_INTERVAL
        gameOver: false,
        draggingUnit: null,
        dragStartPos: null,
        playerBaseAttackCooldown: 0,
        enemyBaseAttackCooldown: 0,
        firstBattleOccurred: false,
        animationTimer: 0,
        currentFrame: 0,
        playerWinStreak: 0,
        enemyWinStreak: 0,
        prevPlayerWinStreak: 0,
        prevEnemyWinStreak: 0,
        nextBattleWinBonus: 75, // BASE_WIN_BONUS
        battleWon: false,
        upgrades: {
            shadowPriest: false,
            arcLightning: false,
            pillage: false,
            poisonArrow: false
        }
    };
    return gameState;
}

export { gameState, initializeGameState }; 