import { DAMAGE_TYPE_EFFECTIVENESS } from './constants.js';
import { distance } from './abilities.js';
import unitTypes from './unitTypes.js';

// Calculate damage based on attacker and defender attributes
function calculateDamage(attacker, defender) {
    if (!attacker.damageType || !defender.armorType) return attacker.damage;
    
    // Get the effectiveness multiplier based on attack type vs armor type
    const effectiveness = DAMAGE_TYPE_EFFECTIVENESS[attacker.damageType][defender.armorType] || 1.0;
    
    // Calculate final damage
    return Math.round(attacker.damage * effectiveness);
}

// Find nearest enemy for a unit
function findTarget(unit, activeUnits) {
    let bestTarget = null;
    let bestScore = -Infinity;
    
    for (const potentialTarget of activeUnits) {
        // Skip allies
        if (potentialTarget.isPlayer === unit.isPlayer) continue;
        
        const dist = distance(unit, potentialTarget);
        
        // Calculate how many other units are targeting this one
        const targetingCount = activeUnits.filter(u => 
            u !== unit && u.target === potentialTarget
        ).length;
        
        // Score based on distance and how many others are targeting
        // Prefer closer targets and ones that aren't being targeted as much
        const score = -dist - (targetingCount * 100);
        
        if (score > bestScore) {
            bestScore = score;
            bestTarget = potentialTarget;
        }
    }
    
    return bestTarget;
}

// Move unit towards target with collision avoidance
function moveTowards(unit, targetX, targetY, deltaTime, activeUnits) {
    // Add slight randomization to prevent perfect stacking
    const randomness = 0.1;
    const randomX = targetX + (Math.random() * randomness - randomness/2) * 50;
    const randomY = targetY + (Math.random() * randomness - randomness/2) * 50;
    
    // Use collision avoidance for movement
    avoidCollisions(unit, randomX, randomY, deltaTime, activeUnits);
}

// Add collision avoidance function
function avoidCollisions(unit, targetX, targetY, deltaTime, activeUnits) {
    const MINIMUM_SPACING = 50;  // Minimum distance between units
    let avoidanceX = 0;
    let avoidanceY = 0;
    
    // Check distance to other units
    for (const otherUnit of activeUnits) {
        if (otherUnit === unit) continue;
        
        const dist = distance(unit, otherUnit);
        
        if (dist < MINIMUM_SPACING) {
            // Calculate repulsion force
            const force = (MINIMUM_SPACING - dist) / MINIMUM_SPACING;
            const dx = unit.x - otherUnit.x;
            const dy = unit.y - otherUnit.y;
            avoidanceX += (dx / dist) * force;
            avoidanceY += (dy / dist) * force;
        }
    }
    
    // Calculate movement towards target
    const dist = distance(unit, { x: targetX, y: targetY });
    
    if (dist > 0) {
        const speed = (unit.moveSpeed * 100) * (canvas.width / 800) * deltaTime;
        const dx = targetX - unit.x;
        const dy = targetY - unit.y;
        const moveX = (dx / dist) * speed;
        const moveY = (dy / dist) * speed;
        
        // Combine target movement with collision avoidance
        const finalX = moveX + avoidanceX * speed;
        const finalY = moveY + avoidanceY * speed;
        
        // Normalize the combined movement
        const totalMovement = Math.sqrt(finalX * finalX + finalY * finalY);
        if (totalMovement > 0) {
            unit.x += (finalX / totalMovement) * speed;
            unit.y += (finalY / totalMovement) * speed;
            // Clamp unit position to stay within canvas
            unit.x = Math.max(0, Math.min(canvas.width, unit.x));
            unit.y = Math.max(0, Math.min(canvas.height, unit.y));
        }
    }
}

// Create a unit with the specified type
function createUnit(type, isPlayer, position = null) {
    const unitTemplate = unitTypes[type];
    const unit = {
        type: type,
        isPlayer: isPlayer,
        health: unitTemplate.health,
        damage: unitTemplate.damage,
        baseDamage: unitTemplate.baseDamage,
        attackRange: unitTemplate.attackRange,
        attackSpeed: unitTemplate.attackSpeed,
        moveSpeed: unitTemplate.moveSpeed,
        ranged: unitTemplate.ranged,
        isMiner: unitTemplate.isMiner,
        damageType: unitTemplate.damageType,
        armorType: unitTemplate.armorType,
        bonusDamage: unitTemplate.bonusDamage,
        attackCooldown: 0,
        attackAnimation: 0,
        position: position || {
            x: isPlayer ? 0.1 : 0.9,
            y: 0.5
        }
    };

    // Add healing properties for priestess
    if (type === 'priestess') {
        unit.healAmount = unitTemplate.healAmount;
        unit.healRange = unitTemplate.healRange;
        unit.healSpeed = unitTemplate.healSpeed;
        unit.healCooldown = 0;
        
        // Apply Shadow Priest upgrade if purchased
        if (isPlayer && gameState.upgrades.shadowPriest) {
            unit.isShadowPriest = true;
            unit.healAmount = 30;  // Upgraded heal amount
            unit.damage = 40;      // Upgraded damage
            unit.baseDamage = 10;  // Upgraded base damage
        }
    }
    
    // Add Arc Lightning properties for mage
    if (type === 'mage') {
        unit.arcLightningCooldown = 0;
        
        // Apply Arc Lightning upgrade if purchased
        if (isPlayer && gameState.upgrades.arcLightning) {
            unit.hasArcLightning = true;
            unit.arcLightningInterval = 3; // Trigger every 3 seconds
        }
    }
    
    // Add Pillage properties for warrior
    if (type === 'warrior') {
        unit.pillageCooldown = 0;
        
        // Apply Pillage upgrade if purchased
        if (isPlayer && gameState.upgrades.pillage) {
            unit.hasPillage = true;
        }
    }
    
    // Add Poison Arrow properties for archer
    if (type === 'archer') {
        unit.poisonArrowCooldown = 0;
        
        // Apply Poison Arrow upgrade if purchased
        if (isPlayer && gameState.upgrades.poisonArrow) {
            unit.hasPoisonArrow = true;
        }
    }

    return unit;
}

// Export functions
export {
    calculateDamage,
    findTarget,
    moveTowards,
    avoidCollisions,
    createUnit
}; 