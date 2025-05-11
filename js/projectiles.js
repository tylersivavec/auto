import { BASE_PROJECTILE_SPEED } from './constants.js';
import { addParticle, PoisonEffectParticle, DamageParticle, LightningFlashParticle } from './particles.js';
import { gameState } from './gameState.js';
import { distance } from './abilities.js';

// Arrays to store projectiles
let projectiles = [];
let baseProjectiles = [];

// Create a projectile from an attacker to a target
function createProjectile(from, to, damage, isBaseAttack = false) {
    let projectileEmoji = "✨";
    let isPoisonArrow = false;
    
    if (from.type === "archer") {
        if (from.isPlayer && (from.hasPoisonArrow || gameState.upgrades.poisonArrow)) {
            projectileEmoji = "🧪"; // Poison arrow projectile
            isPoisonArrow = true;
        } else {
            projectileEmoji = "➵"; // Regular arrow
        }
    }
    if (from.type === "mage") projectileEmoji = "⚡";
    if (from.type === "priestess") {
        if (from.isShadowPriest) {
            projectileEmoji = "💀"; // Shadow Priestess projectile - skull symbol
        } else {
            projectileEmoji = "💫"; // Regular Priestess projectile
        }
    }
    if (isBaseAttack) projectileEmoji = "💥"; // Base attack projectile
    
    return {
        x: from.x,
        y: from.y,
        targetX: to.x,
        targetY: to.y,
        target: to,
        speed: isBaseAttack ? 8 : 8 * (window.innerWidth / 800),
        damage: damage,
        fromPlayer: from.isPlayer,
        damageType: from.damageType,
        color: isBaseAttack ? "#FF0000" : (from.isPlayer ? "#00FFFF" : "#FF00FF"),
        emoji: projectileEmoji,
        isBaseAttack: isBaseAttack,
        hasPoisonEffect: isPoisonArrow, // Only set poison effect for poison arrows
        isPoisonArrow: isPoisonArrow // Flag to identify poison arrows for styling
    };
}

// Apply poison effect to a unit
function applyPoisonEffect(target) {
    // Don't poison already poisoned units
    if (target.isPoisoned) return;
    
    // Store the original attack speed
    if (!target.originalAttackSpeed) {
        target.originalAttackSpeed = target.attackSpeed;
    }
    
    // Store the original move speed
    if (!target.originalMoveSpeed) {
        target.originalMoveSpeed = target.moveSpeed;
    }
    
    // Apply poison effect
    target.isPoisoned = true;
    target.poisonDuration = 5; // 5 seconds duration
    
    // Slow attack speed by 50%
    target.attackSpeed = target.originalAttackSpeed * 0.5;
    
    // Slow movement speed by 50%
    target.moveSpeed = target.originalMoveSpeed * 0.5;
    
    // Add visual indicator for poisoned units
    target.poisonColor = '#22AA22'; // Green tint for poison effect
    
    console.log(`Applied poison to ${target.type}, slowing attack speed from ${target.originalAttackSpeed} to ${target.attackSpeed} and movement speed from ${target.originalMoveSpeed} to ${target.moveSpeed} for 5 seconds`);
}

// Update projectiles positions and handle impacts
function updateProjectiles(deltaTime, activeUnits) {
    // Update regular projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        // Check if target still exists and is alive
        const targetExists = activeUnits.includes(proj.target) && proj.target.health > 0;
        
        if (targetExists) {
            // Update target position if it's moving
            proj.targetX = proj.target.x;
            proj.targetY = proj.target.y;
        }
        
        // Move projectile towards target
        const angle = Math.atan2(proj.targetY - proj.y, proj.targetX - proj.x);
        proj.x += Math.cos(angle) * proj.speed;
        proj.y += Math.sin(angle) * proj.speed;
        
        // Add tracer particles for arc lightning
        if (proj.tracer && proj.isArcLightning) {
            const tracerParticle = new LightningTracerParticle(proj.x, proj.y);
            addParticle(tracerParticle);
        }
        
        // Check if projectile hit target
        const hitDistance = distance(proj, { x: proj.targetX, y: proj.targetY });
        if (hitDistance < 15) {
            // Deal damage if target still exists
            if (targetExists) {
                proj.target.health -= proj.damage;
                
                // Apply poison effect from poison arrows
                if (proj.hasPoisonEffect) {
                    applyPoisonEffect(proj.target);
                    
                    // Add green poison particle effect
                    addParticle(new PoisonEffectParticle(
                        proj.target.x,
                        proj.target.y
                    ));
                }
                
                // Create damage particle with the projectile's damage type
                addParticle(new DamageParticle(
                    proj.target.x,
                    proj.target.y,
                    proj.damage,
                    proj.fromPlayer,
                    false,
                    proj.damageType
                ));
                
                // Special visual effect for arc lightning hit
                if (proj.isArcLightning) {
                    addParticle(new LightningFlashParticle(proj.target.x, proj.target.y, false));
                }
                
                // Remove dead targets
                if (proj.target.health <= 0) {
                    const targetIndex = activeUnits.indexOf(proj.target);
                    if (targetIndex > -1) {
                        activeUnits.splice(targetIndex, 1);
                    }
                }
            }
            
            // Remove projectile
            projectiles.splice(i, 1);
        }
        
        // Remove projectiles that miss (go too far)
        if (distance(proj, { x: window.innerWidth/2, y: window.innerHeight/2 }) > window.innerWidth) {
            projectiles.splice(i, 1);
        }
    }

    // Update base projectiles
    for (let i = baseProjectiles.length - 1; i >= 0; i--) {
        const proj = baseProjectiles[i];
        
        // Move projectile towards target
        const angle = Math.atan2(proj.targetY - proj.y, proj.targetX - proj.x);
        proj.x += Math.cos(angle) * proj.speed;
        proj.y += Math.sin(angle) * proj.speed;
        
        // Check if projectile hit target
        const hitDistance = distance(proj, { x: proj.targetX, y: proj.targetY });
        if (hitDistance < 15) {
            // Deal damage to target
            proj.target.health -= proj.damage;
            // Create damage particle
            addParticle(new DamageParticle(
                proj.target.x,
                proj.target.y,
                proj.damage,
                !proj.fromPlayer, // Invert for base attacks
                false
            ));
            
            // Remove dead targets
            if (proj.target.health <= 0) {
                const targetIndex = activeUnits.indexOf(proj.target);
                if (targetIndex > -1) {
                    activeUnits.splice(targetIndex, 1);
                }
            }
            
            // Remove projectile
            baseProjectiles.splice(i, 1);
        }
        
        // Remove projectiles that miss
        if (distance(proj, { x: window.innerWidth/2, y: window.innerHeight/2 }) > window.innerWidth) {
            baseProjectiles.splice(i, 1);
        }
    }
}

// Draw all projectiles
function drawProjectiles(ctx) {
    // Draw regular projectiles
    for (const proj of projectiles) {
        const rotation = Math.atan2(proj.targetY - proj.y, proj.targetX - proj.x);
        
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(rotation);
        
        // Special drawing for arc lightning projectiles
        if (proj.isArcLightning) {
            // Draw a zigzag lightning bolt instead of just the emoji
            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            // Create a zigzag pattern
            const zigzagLength = 20;
            const zigzagHeight = 5;
            let xPos = 0;
            
            for (let i = 0; i < 3; i++) {
                xPos += zigzagLength / 2;
                ctx.lineTo(xPos, (i % 2 === 0) ? zigzagHeight : -zigzagHeight);
            }
            
            ctx.strokeStyle = '#66CCFF'; // Light blue color
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Add a glow effect
            ctx.shadowColor = '#66CCFF';
            ctx.shadowBlur = 10;
            ctx.stroke();
            
            // Also draw the emoji
            ctx.font = "20px Arial";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(proj.emoji, 0, 0);
        } else if (proj.isPoisonArrow) {
            // Special styling for poison arrows
            ctx.font = "20px Arial";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add a green glow effect for poison arrows
            ctx.shadowColor = '#33CC33';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#33CC33'; // Green color for poison
            ctx.fillText(proj.emoji, 0, 0);
            
            // Draw small poison particles
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#22AA22';
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 5 + Math.random() * 8;
                const particleX = Math.cos(angle) * distance;
                const particleY = Math.sin(angle) * distance;
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        } else if (proj.emoji === "➵") {
            // Special styling for regular arrows - using the original arrow emoji
            ctx.font = "22px Arial";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add a slight shadow for depth
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Add black outline for better visibility
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(proj.emoji, 0, 0);
            
            // Use a solid brown color for regular arrows
            ctx.fillStyle = '#8B4513'; // Solid brown color
            ctx.fillText(proj.emoji, 0, 0);
        } else {
            // Regular projectile drawing
            ctx.font = "20px Arial";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(proj.emoji, 0, 0);
        }
        
        ctx.restore();
    }
    
    // Draw base projectiles
    for (const proj of baseProjectiles) {
        const rotation = Math.atan2(proj.targetY - proj.y, proj.targetX - proj.x);
        
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(rotation);
        
        // Draw base projectile with larger size
        ctx.font = "32px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(proj.emoji, 0, 0);
        ctx.restore();
    }
}

// Add a projectile to the regular projectiles array
function addProjectile(projectile) {
    projectiles.push(projectile);
}

// Add a projectile to the base projectiles array
function addBaseProjectile(projectile) {
    baseProjectiles.push(projectile);
}

// Clear all projectiles
function clearProjectiles() {
    projectiles = [];
    baseProjectiles = [];
}

// Get projectiles arrays
function getProjectiles() {
    return projectiles;
}

function getBaseProjectiles() {
    return baseProjectiles;
}

// Export functions and data
export {
    createProjectile,
    updateProjectiles,
    drawProjectiles,
    addProjectile,
    addBaseProjectile,
    clearProjectiles,
    getProjectiles,
    getBaseProjectiles,
    applyPoisonEffect
}; 