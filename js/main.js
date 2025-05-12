// Import necessary modules
import { 
    GOLD_INTERVAL, BATTLE_INTERVAL, BASE_GOLD_RATE, MAX_GOLD, 
    SPRITE_SIZE, ANIMATION_FPS, SPRITE_FRAMES, BASE_ATTACK_RANGE,
    BASE_ATTACK_DAMAGE, BASE_ATTACK_SPEED, BASE_ATTACK_COOLDOWN,
    BASE_PROJECTILE_SPEED, MINER_GOLD_RATES
} from './constants.js';
import unitTypes from './unitTypes.js';
import { gameState, initializeGameState } from './gameState.js';
import { updateParticles, drawParticles, addParticle } from './particles.js';
import { 
    updateProjectiles, drawProjectiles, createProjectile, 
    addProjectile, addBaseProjectile, clearProjectiles, applyPoisonEffect 
} from './projectiles.js';
import { 
    triggerArcLightning, applyShadowPriestUpgrade, 
    applyPillageEffect, distance 
} from './abilities.js';
import { 
    calculateDamage, findTarget, moveTowards, 
    avoidCollisions, createUnit
} from './combat.js';
import { 
    loadSprites, toIso, drawIsometricGrid, 
    drawBases, drawStagingAreas, drawUnits, draw 
} from './renderer.js';

// Sprite loading
const warriorSprite = new Image();
warriorSprite.onload = () => {
    console.log('Warrior sprite loaded successfully:', warriorSprite.src);
    console.log('Sprite dimensions:', warriorSprite.width, 'x', warriorSprite.height);
};
warriorSprite.onerror = (e) => {
    console.error('Error loading warrior sprite:', e);
    console.error('Attempted path:', warriorSprite.src);
};
warriorSprite.src = 'assets/sprites/king.png';

// Load player base sprite
const playerBaseSprite = new Image();
playerBaseSprite.src = 'assets/sprites/player_base.png';

// Load enemy base sprite
const enemyBaseSprite = new Image();
enemyBaseSprite.src = 'assets/sprites/enemy_base.png';

// Load background image
const backgroundImage = new Image();
backgroundImage.onload = () => {
    console.log('Background image loaded successfully:', backgroundImage.src);
};
backgroundImage.onerror = (e) => {
    console.error('Error loading background image:', e);
    console.error('Attempted path:', backgroundImage.src);
};
backgroundImage.src = 'assets/background1.png';

// Load archer sprite
const archerSprite = new Image();
archerSprite.onload = () => {
    console.log('Archer sprite loaded successfully:', archerSprite.src);
    console.log('Sprite dimensions:', archerSprite.width, 'x', archerSprite.height);
};
archerSprite.onerror = (e) => {
    console.error('Error loading archer sprite:', e);
    console.error('Attempted path:', archerSprite.src);
};
archerSprite.src = 'assets/sprites/leaf_ranger.png';

// Load mage sprite
const mageSprite = new Image();
mageSprite.onload = () => {
    console.log('Mage sprite loaded successfully:', mageSprite.src);
    console.log('Sprite dimensions:', mageSprite.width, 'x', mageSprite.height);
};
mageSprite.onerror = (e) => {
    console.error('Error loading mage sprite:', e);
    console.error('Attempted path:', mageSprite.src);
};
mageSprite.src = 'assets/sprites/gypsy.png';

// Load priestess sprite
const priestessSprite = new Image();
priestessSprite.onload = () => {
    console.log('Priestess sprite loaded successfully:', priestessSprite.src);
    console.log('Sprite dimensions:', priestessSprite.width, 'x', priestessSprite.height);
};
priestessSprite.onerror = (e) => {
    console.error('Error loading priestess sprite:', e);
    console.error('Attempted path:', priestessSprite.src);
};
priestessSprite.src = 'assets/sprites/priestess.png';

// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const playerGoldElem = document.getElementById('playerGold');
const enemyGoldElem = document.getElementById('enemyGold');
const goldRateElem = document.getElementById('goldRate');
const enemyGoldRateElem = document.getElementById('enemyGoldRate');
const nextBattleTimerElem = document.getElementById('nextBattleTimer');
const playerBaseHealthElem = document.getElementById('playerBaseHealth');
const enemyBaseHealthElem = document.getElementById('enemyBaseHealth');
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');

// Projectiles array
let projectiles = [];
// Base projectiles array
let baseProjectiles = [];
// Particles
let particles = [];
// Game areas - will be set based on canvas size
let gameAreas = {};
// Animation timing
let lastTime = 0;

// Handle responsive canvas sizing
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Store the previous canvas dimensions
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    
    // Set canvas dimensions based on container
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Calculate scale factors
    const scaleX = canvas.width / prevWidth;
    const scaleY = canvas.height / prevHeight;
    
    // Update game areas based on new dimensions
    updateGameAreas();
    
    // Scale active units' positions
    if (gameState.activeUnits.length > 0) {
        gameState.activeUnits.forEach(unit => {
            if (unit) {
                unit.x *= scaleX;
                unit.y *= scaleY;
            }
        });
    }
    
    // Scale projectiles' positions
    projectiles.forEach(proj => {
        if (proj) {
            proj.x *= scaleX;
            proj.y *= scaleY;
            proj.targetX *= scaleX;
            proj.targetY *= scaleY;
        }
    });
    
    // Scale base projectiles' positions
    baseProjectiles.forEach(proj => {
        if (proj) {
            proj.x *= scaleX;
            proj.y *= scaleY;
            proj.targetX *= scaleX;
            proj.targetY *= scaleY;
        }
    });
    
    // Scale particles' positions
    particles.forEach(particle => {
        if (particle) {
            particle.x *= scaleX;
            particle.y *= scaleY;
        }
    });
    
    // Redraw immediately if game is initialized
    if (!gameState.gameOver && gameState.gameInitialized) {
        draw(ctx, canvas, gameState, gameAreas);
    }
}

function updateGameAreas() {
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate base positions along the isometric diagonal
    const baseSize = { 
        width: width * 0.08,
        height: height * 0.16
    };

    // Define the main isometric grid line (bottom-left to top-right)
    const gridStartY = height * 0.85;  // Bottom point
    const gridEndY = height * 0.15;    // Top point
    const gridStartX = width * 0.15;   // Left point
    const gridEndX = width * 0.85;     // Right point
    
    // Calculate the total diagonal distance
    const diagonalLength = Math.sqrt(
        Math.pow(gridEndX - gridStartX, 2) + 
        Math.pow(gridEndY - gridStartY, 2)
    );
    
    // Position bases closer to the edges (5% and 95%)
    const basePosition1 = 0.06;
    const basePosition2 = 0.98; // enemy base farther away
    // Position staging areas farther apart (22% and 78%)
    const stagingPosition1 = 0.18;
    const stagingPosition2 = 0.82;
    
    // Function to get point along diagonal with optional offset
    function getPointAlongDiagonal(percentage, xOffset = 0, yOffset = 0) {
        return {
            x: gridStartX + (gridEndX - gridStartX) * percentage + xOffset,
            y: gridStartY + (gridEndY - gridStartY) * percentage + yOffset
        };
    }
    
    // Calculate all positions with offsets for bases
    const baseOffsetX = -width * 0.03;
    const baseOffsetY = -height * 0.04; // move both bases up, but not too high
    const playerBasePos = getPointAlongDiagonal(basePosition1, baseOffsetX, baseOffsetY);
    const enemyBasePos = getPointAlongDiagonal(basePosition2, baseOffsetX, baseOffsetY);
    const playerStagingPos = getPointAlongDiagonal(stagingPosition1);
    const enemyStagingPos = getPointAlongDiagonal(stagingPosition2);
    
    // Make staging areas much larger
    const stagingSize = {
        width: width * 0.28,  // Much wider
        height: height * 0.36 // Much taller
    };
    
    gameAreas = {
        playerBase: { 
            x: playerBasePos.x - baseSize.width/2,
            y: playerBasePos.y - baseSize.height/2,
            width: baseSize.width, 
            height: baseSize.height 
        },
        enemyBase: { 
            x: enemyBasePos.x - baseSize.width/2,
            y: enemyBasePos.y - baseSize.height/2,
            width: baseSize.width, 
            height: baseSize.height 
        },
        playerStaging: { 
            x: playerStagingPos.x - stagingSize.width/2,
            y: playerStagingPos.y - stagingSize.height/2,
            width: stagingSize.width, 
            height: stagingSize.height
        },
        enemyStaging: { 
            x: enemyStagingPos.x - stagingSize.width/2,
            y: enemyStagingPos.y - stagingSize.height/2,
            width: stagingSize.width, 
            height: stagingSize.height
        }
    };
}

// Convert coordinate conversion functions for isometric space
function toIsoCoords(canvasX, canvasY) {
    const rect = gameAreas.playerStaging;
    const centerX = rect.x + rect.width/2;
    const centerY = rect.y + rect.height/2;
    
    // Convert to relative coordinates (-1 to 1)
    const relX = (canvasX - centerX) / (rect.width/2);
    const relY = (canvasY - centerY) / (rect.height/2);
    
    // Convert to isometric coordinates
    const isoX = (relX + relY) / 2;
    const isoY = (relY - relX) / 2;
    
    // Convert to 0-1 range
    return {
        x: Math.max(0, Math.min(1, (isoX + 1) / 2)),
        y: Math.max(0, Math.min(1, (isoY + 1) / 2))
    };
}

function fromIsoCoords(isoX, isoY, isPlayer) {
    const rect = isPlayer ? gameAreas.playerStaging : gameAreas.enemyStaging;
    const centerX = rect.x + rect.width/2;
    const centerY = rect.y + rect.height/2;
    
    // Convert from 0-1 to -1 to 1 range
    const normX = isoX * 2 - 1;
    const normY = isoY * 2 - 1;
    
    // Convert from isometric to screen coordinates
    const isoPoint = toIso(
        normX * (rect.width/2),
        normY * (rect.height/2)
    );
    
    return {
        x: centerX + isoPoint.x,
        y: centerY + isoPoint.y
    };
}

function isInStagingArea(x, y, rect) {
    // Convert to relative coordinates from center
    const centerX = rect.x + rect.width/2;
    const centerY = rect.y + rect.height/2;
    const relX = (x - centerX) / (rect.width/2);  // Divide by half-width for -1 to 1 range
    const relY = (y - centerY) / (rect.height/2); // Divide by half-height for -1 to 1 range
    
    // For isometric diamond, rotate coordinates 45 degrees
    const rotX = (relX + relY) / Math.sqrt(2);
    const rotY = (relY - relX) / Math.sqrt(2);
    
    // Check if point is inside diamond
    return Math.abs(rotX) <= 1 && Math.abs(rotY) <= 1;
}

// Initialize the game
function initGame() {
    loadingProgress.style.width = '0%';
    console.log("Initializing game...");
    // Set up responsive canvas
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    updateMines(); // Always show miner boxes from the start
    // Make sure we have a context
    if (!ctx) {
        console.error("Could not get canvas context!");
        alert("Failed to initialize the game - canvas context not available");
        return;
    }
    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 10;
        loadingProgress.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(loadingInterval);
            startGame();
        }
    }, 100);
}

// Start the game
function startGame() {
    console.log("Starting game...");
    loadingScreen.style.display = 'none';
    gameState.gameInitialized = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
    lastTime = timestamp;
    
    if (!gameState.gameOver) {
        update(deltaTime);
        draw(ctx, canvas, gameState, gameAreas);
        requestAnimationFrame(gameLoop);
    }
}

// Update game state
function update(deltaTime) {
    // Update timers
    gameState.goldTimer -= deltaTime;
    gameState.battleTimer -= deltaTime;
    
    // Give gold when timer expires
    if (gameState.goldTimer <= 0) {
        const playerMaxGold = MAX_GOLD + (gameState.playerVaults > 0 ? unitTypes.vault.maxGoldIncrease[gameState.playerVaults - 1] : 0);
        const enemyMaxGold = MAX_GOLD + (gameState.enemyVaults > 0 ? unitTypes.vault.maxGoldIncrease[gameState.enemyVaults - 1] : 0);
        
        // Calculate gold from miners using incremental rates
        let playerMinerGold = 0;
        for (let i = 0; i < gameState.playerMiners; i++) {
            playerMinerGold += MINER_GOLD_RATES[i];
        }
        
        let enemyMinerGold = 0;
        for (let i = 0; i < gameState.enemyMiners; i++) {
            enemyMinerGold += MINER_GOLD_RATES[i];
        }
        
        gameState.playerGold = Math.min(playerMaxGold, gameState.playerGold + BASE_GOLD_RATE + playerMinerGold);
        gameState.enemyGold = Math.min(enemyMaxGold, gameState.enemyGold + BASE_GOLD_RATE + enemyMinerGold);
        gameState.goldTimer = GOLD_INTERVAL;
        enemyAI(); // Enemy attempts to buy units
    }
    
    // Start battle when timer expires
    if (gameState.battleTimer <= 0) {
        startBattle();
        gameState.battleTimer = BATTLE_INTERVAL;
        gameState.battleWon = false;  // Reset battle won flag
        console.log("New battle starting, timer reset to:", gameState.battleTimer);
    }
    
    // Update base attack cooldowns
    if (gameState.playerBaseAttackCooldown > 0) {
        gameState.playerBaseAttackCooldown -= deltaTime;
    }
    if (gameState.enemyBaseAttackCooldown > 0) {
        gameState.enemyBaseAttackCooldown -= deltaTime;
    }

    // Update active units
    updateUnits(deltaTime);
    
    // Update projectiles
    updateProjectiles(deltaTime);
    
    // Check for battle win conditions when base is attacked
    if (gameState.activeUnits.length > 0 && !gameState.battleWon) {
        const playerUnitsAlive = gameState.activeUnits.some(unit => unit.isPlayer && unit.health > 0);
        const enemyUnitsAlive = gameState.activeUnits.some(unit => !unit.isPlayer && unit.health > 0);
        
        // Check if any unit is attacking a base
        const playerAttackingBase = gameState.activeUnits.some(unit => 
            unit.isPlayer && 
            unit.health > 0 && 
            distance(unit, { x: gameAreas.enemyBase.x + gameAreas.enemyBase.width/2, y: gameAreas.enemyBase.y + gameAreas.enemyBase.height/2 }) < BASE_ATTACK_RANGE
        );
        
        const enemyAttackingBase = gameState.activeUnits.some(unit => 
            !unit.isPlayer && 
            unit.health > 0 && 
            distance(unit, { x: gameAreas.playerBase.x + gameAreas.playerBase.width/2, y: gameAreas.playerBase.y + gameAreas.playerBase.height/2 }) < BASE_ATTACK_RANGE
        );
        
        // Only check for battle win if we have active units and battle hasn't been won yet
        if (!gameState.battleWon) {
            if (enemyAttackingBase && !playerUnitsAlive) {
                // Enemy won the battle
                let currentWinBonus;
                if (gameState.playerWinStreak > 0) {
                    // Breaking player's streak - use player's streak for bonus
                    currentWinBonus = BASE_WIN_BONUS + (gameState.playerWinStreak * WIN_BONUS_INCREMENT);
                } else {
                    // Regular win - use enemy's streak
                    currentWinBonus = BASE_WIN_BONUS + (gameState.enemyWinStreak * WIN_BONUS_INCREMENT);
                }
                
                // Store previous streak before updating
                gameState.prevEnemyWinStreak = gameState.enemyWinStreak;
                
                // Update streaks and next battle bonus
                if (gameState.playerWinStreak > 0) {
                    gameState.nextBattleWinBonus = BASE_WIN_BONUS; // Reset to base for next battle
                } else {
                    gameState.nextBattleWinBonus = BASE_WIN_BONUS + ((gameState.enemyWinStreak + 1) * WIN_BONUS_INCREMENT);
                }
                gameState.enemyWinStreak++;
                gameState.playerWinStreak = 0;  // Reset player streak
                
                // Award gold and show popup
                const newGold = gameState.enemyGold + currentWinBonus;
                const maxGold = MAX_GOLD + (gameState.enemyVaults > 0 ? unitTypes.vault.maxGoldIncrease[gameState.enemyVaults - 1] : 0);
                gameState.enemyGold = Math.min(maxGold, newGold);
                gameState.battleWon = true;
                
                showVictoryPopup(false, currentWinBonus, gameState.enemyWinStreak, gameState.prevEnemyWinStreak);
                console.log("Enemy won battle by attacking base, awarded", currentWinBonus, "gold. New gold:", gameState.enemyGold, "Enemy streak:", gameState.enemyWinStreak);
            } else if (playerAttackingBase && !enemyUnitsAlive) {
                // Player won the battle
                let currentWinBonus;
                if (gameState.enemyWinStreak > 0) {
                    // Breaking enemy's streak - use enemy's streak for bonus
                    currentWinBonus = BASE_WIN_BONUS + (gameState.enemyWinStreak * WIN_BONUS_INCREMENT);
                } else {
                    // Regular win - use player's streak
                    currentWinBonus = BASE_WIN_BONUS + (gameState.playerWinStreak * WIN_BONUS_INCREMENT);
                }
                
                // Store previous streak before updating
                gameState.prevPlayerWinStreak = gameState.playerWinStreak;
                
                // Update streaks and next battle bonus
                if (gameState.enemyWinStreak > 0) {
                    gameState.nextBattleWinBonus = BASE_WIN_BONUS; // Reset to base for next battle
                } else {
                    gameState.nextBattleWinBonus = BASE_WIN_BONUS + ((gameState.playerWinStreak + 1) * WIN_BONUS_INCREMENT);
                }
                gameState.playerWinStreak++;
                gameState.enemyWinStreak = 0;  // Reset enemy streak
                
                // Award gold and show popup
                const newGold = gameState.playerGold + currentWinBonus;
                const maxGold = MAX_GOLD + (gameState.playerVaults > 0 ? unitTypes.vault.maxGoldIncrease[gameState.playerVaults - 1] : 0);
                gameState.playerGold = Math.min(maxGold, newGold);
                gameState.battleWon = true;
                
                showVictoryPopup(true, currentWinBonus, gameState.playerWinStreak, gameState.prevPlayerWinStreak);
                console.log("Player won battle by attacking base, awarded", currentWinBonus, "gold. New gold:", gameState.playerGold, "Player streak:", gameState.playerWinStreak);
            } else if (!playerUnitsAlive && !enemyUnitsAlive) {
                // Draw - no bonus awarded, reset both streaks
                gameState.prevPlayerWinStreak = gameState.playerWinStreak;  // Store previous streaks
                gameState.prevEnemyWinStreak = gameState.enemyWinStreak;
                gameState.playerWinStreak = 0;
                gameState.enemyWinStreak = 0;
                gameState.nextBattleWinBonus = BASE_WIN_BONUS;
                gameState.battleWon = true;
                console.log("Battle ended in draw, streaks reset");
            }
        }
    }
    
    // Check for game over (base destroyed)
    if (gameState.playerBaseHealth <= 0 || gameState.enemyBaseHealth <= 0) {
        gameState.gameOver = true;
        setTimeout(() => {
            alert(gameState.playerBaseHealth <= 0 ? "You lost!" : "You won!");
            resetGame();
        }, 100);
    }
    
    updateUI();
    updateAnimations(deltaTime);
}

// Buying, upgrading and economy functions
function buyUnit(unitType) {
    // Don't allow enemy to buy units during battle
    if (gameState.activeUnits.length > 0 && !gameState.playerStagingArea) {
        return;
    }
    
    let cost;
    if (unitType === 'miner') {
        const minerIndex = gameState.playerMiners;
        if (minerIndex >= 3) return;
        cost = unitTypes[unitType].cost[minerIndex];
    } else if (unitType === 'vault') {
        const vaultIndex = gameState.playerVaults;
        if (vaultIndex >= 3) return;
        cost = unitTypes[unitType].cost[vaultIndex];
    } else {
        cost = unitTypes[unitType].cost;
    }
    
    if (gameState.playerGold >= cost) {
        // Check if there's space in the staging area
        const MAX_UNITS = 12; // Maximum units allowed in staging
        if (!unitTypes[unitType].isMiner && !unitTypes[unitType].isVault && gameState.playerStagingArea.length >= MAX_UNITS) {
            return; // Don't allow more units if at max capacity
        }

        gameState.playerGold -= cost;
        
        if (unitTypes[unitType].isMiner) {
            gameState.playerMiners++;
            updateMines();
            updateMinerShopItem();
        } else if (unitTypes[unitType].isVault) {
            gameState.playerVaults++;
            updateMines();
            updateVaultShopItem();
        } else {
            // Calculate position for the new unit
            let validPosition = false;
            let newPosition;
            let attempts = 0;
            const MAX_ATTEMPTS = 20;
            
            while (!validPosition && attempts < MAX_ATTEMPTS) {
                // Calculate base position in a circular pattern
                const currentUnits = gameState.playerStagingArea.length;
                const angle = (currentUnits * 2.4 + attempts * 0.5) % (Math.PI * 2); // Spread units around circle
                const radius = 0.2 + (Math.random() * 0.1); // Random radius between 0.2 and 0.3
                const centerX = 0.5;
                const centerY = 0.5;
                
                newPosition = {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                };
                
                // Add small random offset
                newPosition.x += (Math.random() - 0.5) * 0.05;
                newPosition.y += (Math.random() - 0.5) * 0.05;
                
                // Ensure position is within bounds
                const padding = 0.15;
                newPosition.x = Math.min(1 - padding, Math.max(padding, newPosition.x));
                newPosition.y = Math.min(1 - padding, Math.max(padding, newPosition.y));
                
                // Check distance from other units
                validPosition = true;
                const MIN_DISTANCE = 0.1; // Minimum distance between units
                
                for (const existingUnit of gameState.playerStagingArea) {
                    const dx = existingUnit.position.x - newPosition.x;
                    const dy = existingUnit.position.y - newPosition.y;
                    const dist = distance({ x: dx, y: dy }, { x: 0, y: 0 });
                    
                    if (dist < MIN_DISTANCE) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            // If we couldn't find a valid position after max attempts, use the last calculated position
            const newUnit = {
                type: unitType,
                position: newPosition
            };
            
            // Apply Shadow Priest upgrade if applicable
            if (unitType === 'priestess' && gameState.upgrades.shadowPriest) {
                newUnit.isShadowPriest = true;
            }
            
            // Apply Poison Arrow upgrade if applicable
            if (unitType === 'archer' && gameState.upgrades.poisonArrow) {
                newUnit.hasPoisonArrow = true;
                console.log("Created new archer with Poison Arrow ability");
            }
            
            gameState.playerStagingArea.push(newUnit);
        }
        
        updateUI();
    }
}

function buyUpgrade(upgradeType) {
    let cost;
    
    // Set cost based on upgrade type
    switch (upgradeType) {
        case 'shadowPriest':
            cost = 150;
            break;
        case 'arcLightning':
            cost = 200;
            break;
        case 'pillage':
            cost = 175;
            break;
        case 'poisonArrow':
            cost = 150;
            break;
        default:
            return; // Unknown upgrade
    }
    
    // Check if player can afford the upgrade
    if (gameState.playerGold >= cost) {
        // Check if upgrade is already purchased
        if (gameState.upgrades[upgradeType]) {
            return; // Already purchased
        }
        
        // Purchase the upgrade
        gameState.playerGold -= cost;
        gameState.upgrades[upgradeType] = true;
        
        // Apply upgrade effects
        applyUpgradeEffects(upgradeType);
        
        // Update UI
        updateUI();
        
        // Update shop item to show purchased
        updateUpgradeShopItems();
        
        // Force a redraw to refresh all units with new appearance
        draw();
    }
}

// Update mines visualization
function updateMines() {
    // Update player mines and vaults
    const playerDisplay = document.querySelector('.player-base-health .miners-display');
    if (playerDisplay) {
        // Update miners
        const playerMinerSlots = playerDisplay.querySelectorAll('.miner-slot');
        playerMinerSlots.forEach((slot, index) => {
            const icon = slot.querySelector('.miner-icon');
            if (icon) {
                icon.textContent = index < gameState.playerMiners ? '⛏️' : '';
            }
            
            // Update miner rate display
            const rateElem = slot.querySelector('.miner-rate');
            if (rateElem) {
                // Show rate if the miner is active, hide otherwise
                if (index < gameState.playerMiners) {
                    rateElem.textContent = `+${MINER_GOLD_RATES[index]}`;
                    rateElem.style.display = 'block';
                } else {
                    rateElem.style.display = 'none';
                }
            }
        });

        // Update vaults
        const playerVaultSlots = playerDisplay.querySelectorAll('.vault-slot');
        playerVaultSlots.forEach((slot, index) => {
            const icon = slot.querySelector('.vault-icon');
            if (icon) {
                icon.textContent = index < gameState.playerVaults ? '💎' : '';
            }
        });
    }

    // Update enemy mines and vaults
    const enemyDisplay = document.querySelector('.enemy-base-health .miners-display');
    if (enemyDisplay) {
        // Update miners
        const enemyMinerSlots = enemyDisplay.querySelectorAll('.miner-slot');
        enemyMinerSlots.forEach((slot, index) => {
            const icon = slot.querySelector('.miner-icon');
            if (icon) {
                icon.textContent = index < gameState.enemyMiners ? '⛏️' : '';
            }
            
            // Update miner rate display
            const rateElem = slot.querySelector('.miner-rate');
            if (rateElem) {
                // Show rate if the miner is active, hide otherwise
                if (index < gameState.enemyMiners) {
                    rateElem.textContent = `+${MINER_GOLD_RATES[index]}`;
                    rateElem.style.display = 'block';
                } else {
                    rateElem.style.display = 'none';
                }
            }
        });

        // Update vaults
        const enemyVaultSlots = enemyDisplay.querySelectorAll('.vault-slot');
        enemyVaultSlots.forEach((slot, index) => {
            const icon = slot.querySelector('.vault-icon');
            if (icon) {
                icon.textContent = index < gameState.enemyVaults ? '💎' : '';
            }
        });
    }
}

// Update miner shop item state
function updateMinerShopItem() {
    const minerShopItem = document.querySelector('.shop-item[onclick*="miner"]');
    if (gameState.playerMiners >= 3) {
        minerShopItem.classList.add('disabled');
    } else {
        minerShopItem.classList.remove('disabled');
        // Update the displayed cost to show next miner's cost
        const nextCost = unitTypes.miner.cost[gameState.playerMiners];
        const costText = minerShopItem.innerHTML.replace(/\d+g/, nextCost + 'g');
        minerShopItem.innerHTML = costText;
    }
    // Update miner count display
    let minerCount = minerShopItem.querySelector('.miner-count');
    if (!minerCount) {
        minerCount = document.createElement('div');
        minerCount.className = 'miner-count';
        minerShopItem.appendChild(minerCount);
    }
    minerCount.textContent = `${gameState.playerMiners}/3`;
}

// Update vault shop item state
function updateVaultShopItem() {
    const vaultShopItem = document.querySelector('.shop-item[onclick*="vault"]');
    if (gameState.playerVaults >= 3) {
        vaultShopItem.classList.add('disabled');
    } else {
        vaultShopItem.classList.remove('disabled');
        // Update the displayed cost to show next vault's cost
        const nextCost = unitTypes.vault.cost[gameState.playerVaults];
        const costText = vaultShopItem.innerHTML.replace(/\d+g/, nextCost + 'g');
        vaultShopItem.innerHTML = costText;
    }
    // Update vault count display
    let vaultCount = vaultShopItem.querySelector('.miner-count');
    if (!vaultCount) {
        vaultCount = document.createElement('div');
        vaultCount.className = 'miner-count';
        vaultShopItem.appendChild(vaultCount);
    }
    vaultCount.textContent = `${gameState.playerVaults}/3`;
}

// Update enemy AI to use similar placement logic
function enemyAI() {
    // Only allow enemy to purchase units when fog of war is active (between battles)
    if (gameState.activeUnits.length > 0) {
        return; // Don't buy units during battle when fog of war is not active
    }
    
    // Calculate current gold income
    const currentGoldRate = BASE_GOLD_RATE + (gameState.enemyMiners * MINER_GOLD_RATES[gameState.enemyMiners - 1]);
    
    // If we have less than 3 miners and can afford one, prioritize getting miners
    if (gameState.enemyMiners < 3) {
        const nextMinerCost = unitTypes.miner.cost[gameState.enemyMiners];
        if (gameState.enemyGold >= nextMinerCost) {
            gameState.enemyGold -= nextMinerCost;
            gameState.enemyMiners++;
            updateMines();
            return; // Exit after buying miner
        }
    }
    
    // If we have less than 3 vaults and can afford one, prioritize getting vaults
    if (gameState.enemyVaults < 3) {
        const nextVaultCost = unitTypes.vault.cost[gameState.enemyVaults];
        if (gameState.enemyGold >= nextVaultCost) {
            gameState.enemyGold -= nextVaultCost;
            gameState.enemyVaults++;
            updateMines();
            return; // Exit after buying vault
        }
    }
    
    // If we have enough gold for a unit and less than max units
    if (gameState.enemyStagingArea.length < 12) {
        // Calculate probabilities based on current situation
        const probabilities = {
            warrior: 0.3,
            archer: 0.3,
            mage: 0.3
        };
        
        // Adjust probabilities based on current army composition
        const unitCounts = {
            warrior: gameState.enemyStagingArea.filter(u => u.type === 'warrior').length,
            archer: gameState.enemyStagingArea.filter(u => u.type === 'archer').length,
            mage: gameState.enemyStagingArea.filter(u => u.type === 'mage').length
        };
        
        // Favor units that are underrepresented in the current army
        const totalUnits = gameState.enemyStagingArea.length || 1;
        probabilities.warrior *= (1 - unitCounts.warrior / totalUnits);
        probabilities.archer *= (1 - unitCounts.archer / totalUnits);
        probabilities.mage *= (1 - unitCounts.mage / totalUnits);
        
        // Normalize probabilities
        const totalProb = probabilities.warrior + probabilities.archer + probabilities.mage;
        probabilities.warrior /= totalProb;
        probabilities.archer /= totalProb;
        probabilities.mage /= totalProb;
        
        // Choose unit type based on probabilities
        const random = Math.random();
        let chosenType;
        if (random < probabilities.warrior) {
            chosenType = 'warrior';
        } else if (random < probabilities.warrior + probabilities.archer) {
            chosenType = 'archer';
        } else {
            chosenType = 'mage';
        }
        
        // Buy the chosen unit if we can afford it
        const cost = unitTypes[chosenType].cost;
        if (gameState.enemyGold >= cost) {
            gameState.enemyGold -= cost;
            
            // Use similar placement logic as player units
            let newPosition;
            const currentUnits = gameState.enemyStagingArea.length;
            const angle = (currentUnits * 2.4 + Math.random()) % (Math.PI * 2);
            const radius = 0.2 + (Math.random() * 0.1);
            const centerX = 0.5;
            const centerY = 0.5;
            
            newPosition = {
                x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.05,
                y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.05
            };
            
            // Ensure position is within bounds
            const padding = 0.15;
            newPosition.x = Math.min(1 - padding, Math.max(padding, newPosition.x));
            newPosition.y = Math.min(1 - padding, Math.max(padding, newPosition.y));
            
            const newUnit = {
                type: chosenType,
                position: newPosition
            };
            gameState.enemyStagingArea.push(newUnit);
        }
    }
    
    updateUI();
}

// Update startBattle to properly handle enemy units
function startBattle() {
    console.log("Starting battle!");
    
    // Set first battle flag
    gameState.firstBattleOccurred = true;
    
    // Clear any existing active units
    gameState.activeUnits = [];
    
    // Move units from staging areas to active units
    gameState.playerStagingArea.forEach(unit => {
        if (unit && unit.type && unit.position) {
            const activeUnit = createUnit(unit.type, true);
            // Convert staging area position to actual screen position
            const pos = fromIsoCoords(unit.position.x, unit.position.y, true);
            activeUnit.x = pos.x;
            activeUnit.y = pos.y;
            
            // Transfer Shadow Priest property if it exists
            if (unit.type === 'priestess' && (unit.isShadowPriest || gameState.upgrades.shadowPriest)) {
                activeUnit.isShadowPriest = true;
                activeUnit.healAmount = 30;  // Upgraded heal amount
                activeUnit.damage = 40;      // Upgraded damage
                activeUnit.baseDamage = 10;  // Upgraded base damage
            }
            
            // Transfer Poison Arrow property if it exists
            if (unit.type === 'archer' && (unit.hasPoisonArrow || gameState.upgrades.poisonArrow)) {
                activeUnit.hasPoisonArrow = true;
            }
            
            // Transfer Pillage property if it exists
            if (unit.type === 'warrior' && (unit.hasPillage || gameState.upgrades.pillage)) {
                activeUnit.hasPillage = true;
            }
            
            gameState.activeUnits.push(activeUnit);
            console.log("Spawned player unit:", activeUnit);
        }
    });
    
    gameState.enemyStagingArea.forEach(unit => {
        if (unit && unit.type && unit.position) {
            const activeUnit = createUnit(unit.type, false);
            // Convert staging area position to actual screen position
            const pos = fromIsoCoords(unit.position.x, unit.position.y, false);
            activeUnit.x = pos.x;
            activeUnit.y = pos.y;
            gameState.activeUnits.push(activeUnit);
        }
    });
    
    // Clear staging areas
    gameState.playerStagingArea = [];
    gameState.enemyStagingArea = [];
    
    // Reset battle won flag
    gameState.battleWon = false;
    
    console.log("Battle started with units:", gameState.activeUnits);
}

// Update UI elements
function updateUI() {
    playerGoldElem.textContent = gameState.playerGold;
    enemyGoldElem.textContent = gameState.enemyGold;
    document.getElementById('maxGold').textContent = MAX_GOLD + (gameState.playerVaults > 0 ? unitTypes.vault.maxGoldIncrease[gameState.playerVaults - 1] : 0);
    document.getElementById('enemyMaxGold').textContent = MAX_GOLD + (gameState.enemyVaults > 0 ? unitTypes.vault.maxGoldIncrease[gameState.enemyVaults - 1] : 0);
    
    // Calculate total gold rates from miners
    let playerMinerGold = 0;
    for (let i = 0; i < gameState.playerMiners; i++) {
        playerMinerGold += MINER_GOLD_RATES[i];
    }
    let enemyMinerGold = 0;
    for (let i = 0; i < gameState.enemyMiners; i++) {
        enemyMinerGold += MINER_GOLD_RATES[i];
    }
    goldRateElem.textContent = `+${BASE_GOLD_RATE + playerMinerGold} gold/sec`;
    enemyGoldRateElem.textContent = `+${BASE_GOLD_RATE + enemyMinerGold} gold/sec`;
    // Update battle timer with urgent styling and win bonus
    const battleTime = Math.ceil(gameState.battleTimer);
    const prefixText = gameState.firstBattleOccurred ? "Next Battle" : "First Battle";
    nextBattleTimerElem.innerHTML = `
        <div class="timer-line">
            ${prefixText}: ${battleTime}s
        </div>
        <span class="win-bonus">${gameState.nextBattleWinBonus}g win bonus</span>
    `;
    if (battleTime <= 5) {
        nextBattleTimerElem.classList.add('urgent');
    } else {
        nextBattleTimerElem.classList.remove('urgent');
    }
    playerBaseHealthElem.textContent = Math.max(0, Math.round(gameState.playerBaseHealth));
    enemyBaseHealthElem.textContent = Math.max(0, Math.round(gameState.enemyBaseHealth));
    const playerHealthPercent = (gameState.playerBaseHealth / 1000) * 100;
    const enemyHealthPercent = (gameState.enemyBaseHealth / 1000) * 100;
    document.getElementById('playerHealthFill').style.width = `${Math.max(0, Math.min(100, playerHealthPercent))}%`;
    document.getElementById('enemyHealthFill').style.width = `${Math.max(0, Math.min(100, enemyHealthPercent))}%`;
    document.getElementById('playerHealthFill').style.backgroundColor = 
        playerHealthPercent > 60 ? '#33CC33' : 
        playerHealthPercent > 30 ? '#FFCC00' : '#CC3333';
    document.getElementById('enemyHealthFill').style.backgroundColor = 
        enemyHealthPercent > 60 ? '#33CC33' : 
        enemyHealthPercent > 30 ? '#FFCC00' : '#CC3333';
    // Update win streaks in the stats panel with dynamic colors
    const playerStreakElem = document.querySelector('.player-header');
    const enemyStreakElem = document.querySelector('.enemy-header');
    function getStreakColor(streak) {
        if (streak === 0) return '#FFFFFF';
        if (streak === 1) return '#FFCC00';
        if (streak === 2) return '#FF9900';
        if (streak === 3) return '#FF6600';
        if (streak === 4) return '#FF3300';
        return '#FF0000';
    }
    if (playerStreakElem) {
        const streakColor = getStreakColor(gameState.playerWinStreak);
        playerStreakElem.innerHTML = `Player Stats<span style="color: ${streakColor}; font-size: 0.9em; font-weight: normal;"><br>Win Streak: ${gameState.playerWinStreak}</span>`;
    }
    if (enemyStreakElem) {
        const streakColor = getStreakColor(gameState.enemyWinStreak);
        enemyStreakElem.innerHTML = `Enemy Stats<span style="color: ${streakColor}; font-size: 0.9em; font-weight: normal;"><br>Win Streak: ${gameState.enemyWinStreak}</span>`;
    }
    // Update miners/vaults display (only update content, not structure)
    document.querySelectorAll('.player-base-health .miners-display .miner-slot').forEach((slot, idx) => {
        const icon = slot.querySelector('.miner-icon');
        const rate = slot.querySelector('.miner-rate');
        if (icon) icon.textContent = idx < gameState.playerMiners ? '⛏️' : '';
        if (rate) rate.textContent = idx < gameState.playerMiners ? `+${MINER_GOLD_RATES[idx]}` : '';
    });
    document.querySelectorAll('.player-base-health .miners-display .vault-slot').forEach((slot, idx) => {
        const icon = slot.querySelector('.vault-icon');
        if (icon) icon.textContent = idx < gameState.playerVaults ? '💎' : '';
    });
    document.querySelectorAll('.enemy-base-health .miners-display .miner-slot').forEach((slot, idx) => {
        const icon = slot.querySelector('.miner-icon');
        const rate = slot.querySelector('.miner-rate');
        if (icon) icon.textContent = idx < gameState.enemyMiners ? '⛏️' : '';
        if (rate) rate.textContent = idx < gameState.enemyMiners ? `+${MINER_GOLD_RATES[idx]}` : '';
    });
    document.querySelectorAll('.enemy-base-health .miners-display .vault-slot').forEach((slot, idx) => {
        const icon = slot.querySelector('.vault-icon');
        if (icon) icon.textContent = idx < gameState.enemyVaults ? '��' : '';
    });
}

// Add animation update function
function updateAnimations(deltaTime) {
    gameState.animationTimer += deltaTime;
    const frameDuration = 1 / ANIMATION_FPS;
    
    if (gameState.animationTimer >= frameDuration) {
        // Update frame counters for each unit type
        ['warrior', 'archer', 'mage'].forEach(type => {
            if (SPRITE_FRAMES[type] > 1) {
                gameState.currentFrame = (gameState.currentFrame + 1) % SPRITE_FRAMES[type];
            }
        });
        
        gameState.animationTimer = gameState.animationTimer % frameDuration;
    }
}

// Mouse event handlers
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if click is in player staging area
    const stagingArea = gameAreas.playerStaging;
    if (isInStagingArea(x, y, stagingArea)) {
        // Find clicked unit
        const clickedUnit = gameState.playerStagingArea.find(unit => {
            if (!unit || !unit.position) return false;
            const pos = fromIsoCoords(unit.position.x, unit.position.y, true);
            const dist = distance({ x: x - pos.x, y: y - pos.y }, { x: 0, y: 0 });
            return dist < 30; // Increased hit radius for better detection
        });

        if (clickedUnit) {
            gameState.draggingUnit = clickedUnit;
            gameState.dragOriginalPos = { ...clickedUnit.position };
        }
    }
}

function handleMouseMove(e) {
    if (!gameState.draggingUnit) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const stagingArea = gameAreas.playerStaging;
    const isoPos = toIsoCoords(x, y);
    
    // No padding, clamp only to [0, 1] to keep inside area
    isoPos.x = Math.max(0, Math.min(1, isoPos.x));
    isoPos.y = Math.max(0, Math.min(1, isoPos.y));
    gameState.draggingUnit.position = isoPos;
}

function handleMouseUp(e) {
    if (!gameState.draggingUnit) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const stagingArea = gameAreas.playerStaging;
    
    if (!isInStagingArea(x, y, stagingArea)) {
        // Return to original position if dropped outside
        gameState.draggingUnit.position = gameState.dragOriginalPos || { x: 0.5, y: 0.5 };
    } else {
        // Convert screen position to isometric position
        const isoPos = toIsoCoords(x, y);
        
        // Keep within bounds with padding
        const padding = 0.1;
        gameState.draggingUnit.position = {
            x: Math.min(1 - padding, Math.max(padding, isoPos.x)),
            y: Math.min(1 - padding, Math.max(padding, isoPos.y))
        };
    }

    // Clear dragging state
    gameState.draggingUnit = null;
    gameState.dragOriginalPos = null;
}

// Victory popup
function showVictoryPopup(isPlayerWin, goldAwarded, streak, prevStreak) {
    const popup = document.querySelector('.victory-popup');
    const goldSpan = document.getElementById('victoryGold');
    const streakSpan = document.getElementById('victoryStreak');
    const streakLabel = document.getElementById('streakLabel');
    const goldPrefix = document.getElementById('goldPrefix');
    const goldSuffix = document.getElementById('goldSuffix');
    
    // Check if this is a broken streak (previous streak was > 0 and now is 1)
    const isBrokenStreak = isPlayerWin ? 
        (gameState.prevEnemyWinStreak > 0 && streak === 1) : 
        (gameState.prevPlayerWinStreak > 0 && streak === 1);
    
    // Always use the actual awarded gold amount
    const displayGold = goldAwarded;
    
    // Update popup content
    if (isBrokenStreak) {
        popup.querySelector('h2').textContent = 'Broken Streak!';
        goldSpan.textContent = displayGold;
        // Hide streak display for broken streaks
        const streakDiv = popup.querySelector('.streak');
        if (streakDiv) {
            streakDiv.style.display = 'none';
        }
        
        // Update gold display for broken streak
        if (isPlayerWin) {
            goldPrefix.textContent = 'Awarded ';
            goldSuffix.textContent = ' gold';
        } else {
            goldPrefix.textContent = 'Enemy awarded ';
            goldSuffix.textContent = ' gold';
        }
    } else {
        popup.querySelector('h2').textContent = isPlayerWin ? 'Victory!' : 'Defeat!';
        goldSpan.textContent = displayGold;
        // Show streak display for regular victories
        const streakDiv = popup.querySelector('.streak');
        if (streakDiv) {
            streakDiv.style.display = '';
        }
        streakSpan.textContent = streak;
        streakLabel.textContent = isPlayerWin ? 'Player Win Streak' : 'Enemy Win Streak';
        
        // Update gold display based on who won
        if (isPlayerWin) {
            goldPrefix.textContent = '+';
            goldSuffix.textContent = ' gold';
        } else {
            goldPrefix.textContent = 'Enemy gained ';
            goldSuffix.textContent = ' gold';
        }
    }
    
    // Set appropriate class
    popup.className = 'victory-popup';
    popup.classList.add(isPlayerWin ? 'player-win' : 'enemy-win');
    popup.classList.add('show');
    
    // Log the values for debugging
    console.log('Popup values:', {
        isPlayerWin,
        goldAwarded,
        displayGold,
        streak,
        prevStreak,
        isBrokenStreak,
        goldSpanText: goldSpan.textContent
    });
    
    // Hide popup after 3 seconds
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// Initialize event listeners
function initEventListeners() {
    // Add mouse event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Add shop tooltip positioning
    document.querySelectorAll('.shop-item').forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const tooltip = item.querySelector('.tooltip');
            if (tooltip) {
                const rect = item.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top;
                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y}px`;
            }
        });
    });

    // Add section toggle functionality
    document.querySelectorAll('.shop-section-title').forEach(title => {
        title.addEventListener('click', function() {
            const section = this.parentElement;
            section.classList.toggle('collapsed');
        });
    });
    
    // Initialize start screen & tutorial logic
    const startScreen = document.getElementById('startScreen');
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const startGameBtn = document.getElementById('startGameBtn');
    const howToPlayBtn = document.getElementById('howToPlayBtn');
    const closeTutorialBtn = document.getElementById('closeTutorialBtn');
    
    // Hide loading screen and game UI until game starts
    document.querySelector('.ui-container').style.display = 'none';
    document.querySelector('.stats-panel').style.display = 'none';
    document.querySelector('.shop-container').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'none';
    
    // Show tutorial overlay
    howToPlayBtn.addEventListener('click', () => {
        tutorialOverlay.style.display = 'flex';
    });
    closeTutorialBtn.addEventListener('click', () => {
        tutorialOverlay.style.display = 'none';
    });
    // Start game button logic
    startGameBtn.addEventListener('click', () => {
        startScreen.style.display = 'none';
        document.querySelector('.ui-container').style.display = '';
        document.querySelector('.stats-panel').style.display = '';
        document.querySelector('.shop-container').style.display = '';
        document.getElementById('loadingScreen').style.display = '';
        // Actually start the game loading process
        initGame();
    });
    // Prevent game from auto-initializing before start
    // Do not call initGame() here; wait for Start Game button
    // Do not add mouse event listeners here
}

// Call this when the DOM is loaded
document.addEventListener('DOMContentLoaded', initEventListeners);

// Export functions that need to be accessed from other modules
export {
    initGame,
    startGame,
    updateUI,
    updateMines,
    buyUnit,
    buyUpgrade
}; 