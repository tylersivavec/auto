import { createProjectile, addProjectile } from './projectiles.js';
import { addParticle, LightningFlashParticle, LightningTracerParticle, GoldParticle } from './particles.js';
import { calculateDamage } from './combat.js';
import { gameState } from './gameState.js';

// Trigger Arc Lightning ability for a mage unit
function triggerArcLightning(mageUnit, targetUnit) {
    // Find all nearby enemies within range
    const chainRange = 150; // Lightning chain range
    const nearbyEnemies = gameState.activeUnits.filter(unit => 
        unit.isPlayer !== mageUnit.isPlayer && 
        unit.health > 0 && 
        unit !== targetUnit &&
        distance(targetUnit, unit) <= chainRange
    );
    
    if (nearbyEnemies.length === 0) return; // No additional targets
    
    // Calculate chain damage (50% of primary damage)
    const chainDamage = Math.round(calculateDamage(mageUnit, targetUnit) * 0.5);
    
    // Sort enemies by distance to create more natural chaining
    nearbyEnemies.sort((a, b) => {
        return distance(targetUnit, a) - distance(targetUnit, b);
    });
    
    // Visual effect for the primary target (arc source)
    addParticle(new LightningFlashParticle(targetUnit.x, targetUnit.y, true));
    
    // Create arc lightning effect to each nearby enemy with delay
    nearbyEnemies.forEach((enemy, index) => {
        // Use setTimeout to create a delay between each chain
        setTimeout(() => {
            // Only proceed if the game is still running and the enemy is still alive
            if (!gameState.gameOver && enemy && enemy.health > 0) {
                // Create a special arc lightning projectile
                const arcProjectile = {
                    x: targetUnit.x, // Start from the primary target
                    y: targetUnit.y,
                    targetX: enemy.x,
                    targetY: enemy.y,
                    target: enemy,
                    speed: 6 * (canvas.width / 800), // Slower speed for better visibility
                    damage: chainDamage,
                    fromPlayer: mageUnit.isPlayer,
                    damageType: mageUnit.damageType,
                    color: '#66CCFF', // Light blue for arc lightning
                    emoji: '⚡',
                    isArcLightning: true,
                    tracer: true // Enable tracer effect
                };
                
                addProjectile(arcProjectile);
                
                // Add a tracer particle for visual effect
                addParticle(new LightningTracerParticle(targetUnit.x, targetUnit.y));
            }
        }, 150 * index); // 150ms delay between each chain
    });
}

// Apply Shadow Priest upgrades to a priestess unit
function applyShadowPriestUpgrade(priestessUnit) {
    priestessUnit.isShadowPriest = true;
    priestessUnit.healAmount = 30;  // Upgraded heal amount
    priestessUnit.damage = 40;      // Upgraded damage
    priestessUnit.baseDamage = 10;  // Upgraded base damage
    
    return priestessUnit;
}

// Apply Pillage ability for warriors
function applyPillageEffect(targetBase, attackerIsPlayer) {
    const goldStolen = 2; // Reduced from 5 to 2
    
    // Reference the correct gold state
    const enemyGold = attackerIsPlayer ? gameState.enemyGold : gameState.playerGold;
    const playerGold = attackerIsPlayer ? gameState.playerGold : gameState.enemyGold;
    
    // Only steal gold if enemy has enough
    if (enemyGold >= goldStolen) {
        // Update gold values
        if (attackerIsPlayer) {
            gameState.enemyGold -= goldStolen;
            gameState.playerGold += goldStolen;
        } else {
            gameState.playerGold -= goldStolen;
            gameState.enemyGold += goldStolen;
        }
        
        // Show gold stolen particle
        addParticle(new GoldParticle(
            targetBase.x + (Math.random() * 40 - 20), 
            targetBase.y + (Math.random() * 30 - 15), 
            goldStolen,
            attackerIsPlayer
        ));
        
        return goldStolen;
    }
    
    return 0; // No gold stolen
}

// Helper function to calculate distance between two points
function distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export {
    triggerArcLightning,
    applyShadowPriestUpgrade,
    applyPillageEffect,
    distance
}; 