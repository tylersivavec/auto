import { SPRITE_SIZE, GRID_COLORS, DIRT_PATTERN, ISOMETRIC_FACTOR } from './constants.js';
import { drawParticles } from './particles.js';
import { drawProjectiles } from './projectiles.js';

// Global asset references
let warriorSprite, archerSprite, mageSprite, priestessSprite, playerBaseSprite, enemyBaseSprite, backgroundImage;

// Initialize and load sprites
export function loadSprites() {
    // Load warrior sprite
    warriorSprite = new Image();
    warriorSprite.src = 'assets/sprites/king.png';

    // Load archer sprite
    archerSprite = new Image();
    archerSprite.src = 'assets/sprites/leaf_ranger.png';

    // Load mage sprite
    mageSprite = new Image();
    mageSprite.src = 'assets/sprites/gypsy.png';

    // Load priestess sprite
    priestessSprite = new Image();
    priestessSprite.src = 'assets/sprites/priestess.png';

    // Load base sprites
    playerBaseSprite = new Image();
    playerBaseSprite.src = 'assets/sprites/player_base.png';
    
    enemyBaseSprite = new Image();
    enemyBaseSprite.src = 'assets/sprites/enemy_base.png';
    
    // Load background image
    backgroundImage = new Image();
    backgroundImage.src = 'assets/background1.png';
    
    // Return a promise that resolves when all images are loaded
    return Promise.all([
        loadImage(warriorSprite),
        loadImage(archerSprite),
        loadImage(mageSprite),
        loadImage(priestessSprite),
        loadImage(playerBaseSprite),
        loadImage(enemyBaseSprite),
        loadImage(backgroundImage)
    ]);
}

// Helper function to load an image
function loadImage(img) {
    return new Promise((resolve, reject) => {
        if (img.complete) {
            resolve(img);
        } else {
            img.onload = () => resolve(img);
            img.onerror = reject;
        }
    });
}

// Convert cartesian to isometric coordinates
function toIso(x, y) {
    return {
        x: x - y,
        y: (x + y) * ISOMETRIC_FACTOR
    };
}

// Draw the isometric grid
function drawIsometricGrid(ctx, canvas) {
    const gridSize = 25 * (canvas.width / 800); // Halved for smaller grid tiles
    const gridWidth = Math.ceil(canvas.width / gridSize) + 2;
    const gridHeight = Math.ceil(canvas.height / gridSize) + 4;
    
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2 - gridHeight * gridSize * ISOMETRIC_FACTOR / 2;

    // Draw background image first if loaded
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        // Draw the background image to fill the entire canvas
        ctx.drawImage(
            backgroundImage,
            0, 
            0,
            canvas.width,
            canvas.height
        );
    } else {
        // Fallback to colored grid if image isn't loaded
        // Function to determine if a grid cell should be dirt
        function isDirtCell(i, j) {
            return DIRT_PATTERN.has(`${i},${j}`);
        }

        // Draw grid cells with colors
        for (let i = -gridWidth; i <= gridWidth; i++) {
            for (let j = -gridHeight; j <= gridHeight; j++) {
                const start = toIso(i * gridSize, j * gridSize);
                const end = toIso((i+1) * gridSize, j * gridSize);
                const nextRow = toIso(i * gridSize, (j+1) * gridSize);

                // Fill cell with grass or dirt color
                ctx.beginPath();
                ctx.moveTo(offsetX + start.x, offsetY + start.y);
                ctx.lineTo(offsetX + end.x, offsetY + end.y);
                ctx.lineTo(offsetX + end.x + (nextRow.x - start.x), offsetY + end.y + (nextRow.y - start.y));
                ctx.lineTo(offsetX + nextRow.x, offsetY + nextRow.y);
                ctx.closePath();

                // Get consistent color based on position
                const colorIndex = Math.abs((i * 7 + j * 13) % (isDirtCell(i, j) ? GRID_COLORS.dirt.length : GRID_COLORS.grass.length));
                ctx.fillStyle = isDirtCell(i, j) ? 
                    GRID_COLORS.dirt[colorIndex] : 
                    GRID_COLORS.grass[colorIndex];
                ctx.fill();
            }
        }
    }
    
    // Draw grid lines with slight transparency
    for (let i = -gridWidth; i <= gridWidth; i++) {
        for (let j = -gridHeight; j <= gridHeight; j++) {
            const start = toIso(i * gridSize, j * gridSize);
            const end = toIso((i+1) * gridSize, j * gridSize);
            const nextRow = toIso(i * gridSize, (j+1) * gridSize);

            // Draw only the grid lines
            ctx.beginPath();
            ctx.moveTo(offsetX + start.x, offsetY + start.y);
            ctx.lineTo(offsetX + end.x, offsetY + end.y);
            ctx.lineTo(offsetX + end.x + (nextRow.x - start.x), offsetY + end.y + (nextRow.y - start.y));
            ctx.lineTo(offsetX + nextRow.x, offsetY + nextRow.y);
            ctx.closePath();
            
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"; // Slightly more visible grid lines
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

// Draw game bases (player and enemy)
function drawBases(ctx, gameAreas) {
    const playerBaseRect = gameAreas.playerBase;
    const enemyBaseRect = gameAreas.enemyBase;

    // Scale factor
    const scale = 1.5;

    // Player base
    ctx.save();
    if (playerBaseSprite.complete && playerBaseSprite.naturalWidth > 0) {
        const newWidth = playerBaseRect.width * scale;
        const newHeight = playerBaseRect.height * scale;
        ctx.drawImage(
            playerBaseSprite,
            playerBaseRect.x + (playerBaseRect.width - newWidth) / 2,
            playerBaseRect.y + (playerBaseRect.height - newHeight) / 2,
            newWidth,
            newHeight
        );
    }
    ctx.restore();

    // Enemy base
    ctx.save();
    if (enemyBaseSprite.complete && enemyBaseSprite.naturalWidth > 0) {
        const newWidth = enemyBaseRect.width * scale;
        const newHeight = enemyBaseRect.height * scale;
        ctx.drawImage(
            enemyBaseSprite,
            enemyBaseRect.x + (enemyBaseRect.width - newWidth) / 2,
            enemyBaseRect.y + (enemyBaseRect.height - newHeight) / 2,
            newWidth,
            newHeight
        );
    }
    ctx.restore();
}

// Draw units in the staging area
function drawStagingAreas(ctx, gameAreas, playerStagingArea, enemyStagingArea, battleTimer, gameState, fromIsoCoords) {
    const playerStagingRect = gameAreas.playerStaging;
    const enemyStagingRect = gameAreas.enemyStaging;

    function drawIsometricStagingArea(rect, isPlayer, units) {
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        
        // Draw staging area border in isometric view
        const points = [
            { x: -rect.width/2, y: -rect.height/2 },
            { x: rect.width/2, y: -rect.height/2 },
            { x: rect.width/2, y: rect.height/2 },
            { x: -rect.width/2, y: rect.height/2 }
        ].map(p => {
            const iso = toIso(p.x, p.y);
            return {
                x: centerX + iso.x,
                y: centerY + iso.y
            };
        });

        // Draw staging area border
        ctx.strokeStyle = isPlayer ? "#0099FF" : "#FF0000";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Check if we should show fog of war
        const showFog = !isPlayer && battleTimer > 1 && gameState.activeUnits.length === 0;

        if (showFog) {
            // Draw fog of war effect
            ctx.save();
            
            // Fill the entire staging area with completely opaque dark color
            ctx.fillStyle = '#000000';  // Solid black
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();

            // Add subtle pattern to the fog
            ctx.fillStyle = 'rgba(50, 50, 50, 0.2)';
            const patternSize = 20;
            const patternOffset = Date.now() / 5000; // Slow movement

            // Calculate center of the staging area
            const centerX = rect.x + rect.width / 2;
            const centerY = rect.y + rect.height / 2;

            // Adjust pattern to match isometric perspective
            for (let x = -rect.width/2; x < rect.width/2; x += patternSize) {
                for (let y = -rect.height/2; y < rect.height/2; y += patternSize) {
                    // Convert to isometric coordinates
                    const isoPoint = toIso(x, y);
                    const screenX = centerX + isoPoint.x;
                    const screenY = centerY + isoPoint.y;
                    
                    // Convert point to relative isometric coordinates
                    const relX = x / (rect.width/2);
                    const relY = y / (rect.height/2);
                    
                    // For isometric diamond, rotate coordinates 45 degrees
                    const rotX = (relX + relY) / Math.sqrt(2);
                    const rotY = (relY - relX) / Math.sqrt(2);
                    
                    // Only draw if inside isometric diamond
                    if (Math.abs(rotX) <= 0.8 && Math.abs(rotY) <= 0.8) {
                        const noiseValue = Math.sin(x * 0.1 + y * 0.1 + patternOffset) * 0.5 + 0.5;
                        if (noiseValue > 0.5) {
                            ctx.fillRect(screenX - patternSize/4, screenY - patternSize/4, patternSize/2, patternSize/2);
                        }
                    }
                }
            }

            // Draw a border around the fog
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw question marks for each enemy unit
            if (units && units.length > 0) {
                ctx.font = 'bold 32px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 3;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const currentTime = Date.now();
                const gridSize = Math.min(rect.width, rect.height) / 4;
                
                units.forEach((_, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    
                    const baseX = (col - 1) * gridSize;
                    const baseY = (row - 0.5) * gridSize;
                    
                    const isoPoint = toIso(baseX, baseY);
                    const x = centerX + isoPoint.x;
                    const y = centerY + isoPoint.y;
                    
                    const floatOffset = Math.sin((currentTime + index * 500) / 1000) * 5;
                    
                    // Draw question mark with outline for better visibility
                    ctx.strokeText('?', x, y + floatOffset);
                    ctx.fillText('?', x, y + floatOffset);
                });
            }

            ctx.restore();
        } else {
            // Draw actual units
            if (units && Array.isArray(units)) {
                units.forEach(unit => {
                    if (!unit || !unit.position || !unit.type) return;

                    const pos = fromIsoCoords(unit.position.x, unit.position.y, isPlayer);
                    
                    ctx.save();
                    // Apply Shadow Priestess tint if needed - double check here
                    if (isPlayer && unit.type === 'priestess' && (unit.isShadowPriest === true || gameState.upgrades?.shadowPriest === true)) {
                        // Apply dark blue tint for Shadow Priestesses
                        ctx.filter = 'hue-rotate(210deg) saturate(1.2) brightness(0.8)';
                    } else if (isPlayer && unit.type === 'archer' && (unit.hasPoisonArrow === true || gameState.upgrades?.poisonArrow === true)) {
                        // Apply green tint for Poison Arrow archers
                        ctx.filter = 'hue-rotate(70deg) saturate(1.5) brightness(0.9)';
                        
                        // Draw poison particles around the archer
                        ctx.globalAlpha = 0.6;
                        ctx.fillStyle = '#22AA22';
                        for (let i = 0; i < 5; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const distance = 5 + Math.random() * 10;
                            const particleX = pos.x + Math.cos(angle) * distance;
                            const particleY = pos.y + Math.sin(angle) * distance;
                            ctx.beginPath();
                            ctx.arc(particleX, particleY, 2 + Math.random() * 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.globalAlpha = 1.0;
                    } else if (!isPlayer) {
                        ctx.filter = 'brightness(1.1) sepia(0.2) saturate(1.2) hue-rotate(-30deg)';
                    }
                    
                    if (gameState.draggingUnit === unit) {
                        ctx.globalAlpha = 0.7;
                    }

                    // Draw unit based on type
                    if (unit.type === 'warrior' && warriorSprite.complete) {
                        ctx.drawImage(
                            warriorSprite,
                            0, 0,
                            SPRITE_SIZE, SPRITE_SIZE,
                            pos.x - SPRITE_SIZE/2,
                            pos.y - SPRITE_SIZE/2,
                            SPRITE_SIZE, SPRITE_SIZE
                        );
                    } else if (unit.type === 'archer' && archerSprite.complete) {
                        ctx.drawImage(
                            archerSprite,
                            0, 0,
                            SPRITE_SIZE, SPRITE_SIZE,
                            pos.x - SPRITE_SIZE/2,
                            pos.y - SPRITE_SIZE/2,
                            SPRITE_SIZE, SPRITE_SIZE
                        );
                    } else if (unit.type === 'mage' && mageSprite.complete) {
                        ctx.drawImage(
                            mageSprite,
                            0, 0,
                            SPRITE_SIZE, SPRITE_SIZE,
                            pos.x - SPRITE_SIZE/2,
                            pos.y - SPRITE_SIZE/2,
                            SPRITE_SIZE, SPRITE_SIZE
                        );
                    } else if (unit.type === 'priestess' && priestessSprite.complete) {
                        ctx.drawImage(
                            priestessSprite,
                            0, 0,
                            SPRITE_SIZE, SPRITE_SIZE,
                            pos.x - SPRITE_SIZE/2,
                            pos.y - SPRITE_SIZE/2,
                            SPRITE_SIZE, SPRITE_SIZE
                        );
                    } else {
                        ctx.font = '32px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(unit.emoji || '', pos.x, pos.y);
                    }
                    
                    if (gameState.draggingUnit === unit) {
                        ctx.strokeStyle = '#FFFF00';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                    
                    ctx.restore();
                });
            }
        }
    }

    // Draw player staging area first (bottom layer)
    drawIsometricStagingArea(playerStagingRect, true, playerStagingArea);
    // Draw enemy staging area last (top layer)
    drawIsometricStagingArea(enemyStagingRect, false, enemyStagingArea);
}

// Draw active units
function drawUnits(ctx, activeUnits, upgradesState) {
    activeUnits.forEach(unit => {
        if (!unit || !unit.type) return;
        
        ctx.save();
        
        // Draw red aura/outline for enemy units
        if (!unit.isPlayer) {
            // Add a red glow around enemy units
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
        } else {
            // Add a blue glow around player units
            ctx.shadowColor = 'rgba(0, 100, 255, 0.8)';
            ctx.shadowBlur = 10;
            
            // Apply upgrade-specific tints after setting the glow
            if (unit.type === 'priestess' && (unit.isShadowPriest || upgradesState.shadowPriest)) {
                // Apply dark blue tint for Shadow Priestesses
                ctx.filter = 'hue-rotate(210deg) saturate(1.2) brightness(0.8)';
            } else if (unit.type === 'archer' && (unit.hasPoisonArrow || upgradesState.poisonArrow)) {
                // Apply green tint for Poison Arrow archers
                ctx.filter = 'hue-rotate(70deg) saturate(1.5) brightness(0.9)';
            }
        }
        
        // Apply poison effect visual (green tint)
        if (unit.isPoisoned) {
            // Apply a green tint for poisoned units
            ctx.filter = 'hue-rotate(90deg) saturate(1.5) brightness(0.9)';
        }
        
        // Calculate scale based on attack animation
        let scale = 1.0;
        if (unit.attackAnimation > 0) {
            const animationProgress = unit.attackAnimation / 0.3;
            if (animationProgress > 0.5) {
                scale = 1 + (0.3 * (1 - animationProgress));
            } else {
                scale = 1 + (0.3 * animationProgress * 2);
            }
        }
        
        // Apply scale transformation
        ctx.translate(unit.x, unit.y);
        ctx.scale(scale, scale);
        ctx.translate(-unit.x, -unit.y);
        
        // Draw appropriate sprite based on unit type
        let spriteDrawn = false;
        if (unit.type === 'warrior' && warriorSprite.complete) {
            ctx.drawImage(
                warriorSprite,
                0, 0,
                SPRITE_SIZE, SPRITE_SIZE,
                unit.x - SPRITE_SIZE/2,
                unit.y - SPRITE_SIZE/2,
                SPRITE_SIZE, SPRITE_SIZE
            );
            spriteDrawn = true;
        } else if (unit.type === 'archer' && archerSprite.complete) {
            ctx.drawImage(
                archerSprite,
                0, 0,
                SPRITE_SIZE, SPRITE_SIZE,
                unit.x - SPRITE_SIZE/2,
                unit.y - SPRITE_SIZE/2,
                SPRITE_SIZE, SPRITE_SIZE
            );
            spriteDrawn = true;
            
            // Draw poison effect for archers with the upgrade
            if (unit.isPlayer && (unit.hasPoisonArrow || upgradesState.poisonArrow)) {
                // Draw small poison particles around the archer
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#22AA22';
                for (let i = 0; i < 5; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 10 + Math.random() * 10;
                    const particleX = Math.cos(angle) * distance;
                    const particleY = Math.sin(angle) * distance;
                    ctx.beginPath();
                    ctx.arc(unit.x + particleX, unit.y + particleY, 2 + Math.random() * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1.0;
                
                // Draw poison flask emoji
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🧪', unit.x + 15, unit.y - 15);
            }
        } else if (unit.type === 'mage' && mageSprite.complete) {
            ctx.drawImage(
                mageSprite,
                0, 0,
                SPRITE_SIZE, SPRITE_SIZE,
                unit.x - SPRITE_SIZE/2,
                unit.y - SPRITE_SIZE/2,
                SPRITE_SIZE, SPRITE_SIZE
            );
            spriteDrawn = true;
        } else if (unit.type === 'priestess' && priestessSprite.complete) {
            ctx.drawImage(
                priestessSprite,
                0, 0,
                SPRITE_SIZE, SPRITE_SIZE,
                unit.x - SPRITE_SIZE/2,
                unit.y - SPRITE_SIZE/2,
                SPRITE_SIZE, SPRITE_SIZE
            );
            spriteDrawn = true;
        } else {
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(unit.emoji || '', unit.x, unit.y);
        }
        
        // If sprite wasn't drawn, show a colored circle as fallback
        if (!spriteDrawn && unit.type !== 'miner') {
            ctx.beginPath();
            ctx.arc(unit.x, unit.y, SPRITE_SIZE/2, 0, Math.PI * 2);
            ctx.fillStyle = unit.color || '#FF0000';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw unit type text or emoji
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(unit.type.charAt(0).toUpperCase(), unit.x, unit.y);
        } else if (unit.type === 'miner') {
            // Draw miner emoji
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⛏️', unit.x, unit.y);
        }
        
        ctx.restore();
        
        // Draw health bar
        const healthPercent = unit.health / unit.maxHealth || unit.health / unitTypes[unit.type]?.health || 1;
        ctx.fillStyle = healthPercent > 0.5 ? '#33CC33' : '#FF3333';
        ctx.fillRect(unit.x - 15, unit.y - 25, 30 * healthPercent, 5);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(unit.x - 15, unit.y - 25, 30, 5);
    });
}

// Main draw function
function draw(ctx, canvas, gameState, gameAreas, fromIsoCoords, getProjectiles, getBaseProjectiles) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawIsometricGrid(ctx, canvas);
    
    // Draw units
    drawUnits(ctx, gameState.activeUnits, gameState.upgrades);
    
    // Draw projectiles
    drawProjectiles(ctx);
    
    // Draw staging areas
    drawStagingAreas(
        ctx, 
        gameAreas, 
        gameState.playerStagingArea, 
        gameState.enemyStagingArea, 
        gameState.battleTimer, 
        gameState,
        fromIsoCoords
    );
    
    // Draw bases in front of staging areas
    drawBases(ctx, gameAreas);
    
    // Draw particles
    drawParticles(ctx);
}

export { 
    draw, 
    drawIsometricGrid, 
    drawBases, 
    drawStagingAreas, 
    drawUnits, 
    toIso 
}; 