// Particle effects module for visual effects

// Collection of particles
let particles = [];

// Damage number particle class
class DamageParticle {
    constructor(x, y, damage, isPlayer, isBaseAttack = false, damageType = null) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.isPlayer = isPlayer;
        this.isBaseAttack = isBaseAttack;
        this.damageType = damageType;
        this.life = 1.0;  // 1 second lifetime
        this.emoji = '🔥';
        this.fontSize = isBaseAttack ? 24 : 16;  // Smaller font for regular combat
        this.dy = -60;  // Move upward
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.dy += 120 * deltaTime;  // Gravity effect
        this.y += this.dy * deltaTime;
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Only draw explosion/fire emoji for base attacks
        if (this.isBaseAttack) {
            ctx.font = `${this.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = Math.min(1, this.life * 2);
            ctx.fillText(this.emoji, this.x, this.y);
        }
        
        // Set color based on damage type
        let damageColor;
        if (this.damageType === 'Physical') {
            damageColor = '#FF4444';  // Red for physical damage
        } else if (this.damageType === 'Piercing') {
            damageColor = '#44FF44';  // Green for piercing damage
        } else if (this.damageType === 'Magic') {
            damageColor = '#4444FF';  // Blue for magic damage
        } else {
            damageColor = this.isPlayer ? '#FF4444' : '#FF0000';  // Default colors
        }
        
        // Draw damage number
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.fillStyle = damageColor;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;  // Reduced from 3 for smaller numbers
        const yOffset = this.isBaseAttack ? -20 : 0;
        ctx.strokeText(`-${this.damage}`, this.x, this.y + yOffset);
        ctx.fillText(`-${this.damage}`, this.x, this.y + yOffset);
        ctx.restore();
    }
}

// Healing effect particle class
class HealingParticle {
    constructor(x, y, amount, isShadowPriest = false) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.life = 1.0;  // 1 second lifetime
        this.dy = -30;  // Move upward
        this.fontSize = 16;
        this.particles = [];  // Store healing effect particles
        this.isShadowPriest = isShadowPriest;
        
        // Create healing effect particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.particles.push({
                x: 0,
                y: 0,
                angle: angle,
                speed: 1 + Math.random() * 2,
                life: 1.0
            });
        }
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.dy += 60 * deltaTime;  // Gravity effect
        this.y += this.dy * deltaTime;
        
        // Update healing effect particles
        this.particles.forEach(p => {
            p.life -= deltaTime;
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
        });
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw healing effect particles
        ctx.globalAlpha = Math.min(1, this.life * 2) * 0.5;
        // Use blue for shadow priestess, green for regular
        ctx.fillStyle = this.isShadowPriest ? '#9966FF' : '#00FF00';
        this.particles.forEach(p => {
            if (p.life > 0) {
                ctx.beginPath();
                ctx.arc(
                    this.x + p.x,
                    this.y + p.y,
                    2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        });
        
        // Draw healing number
        ctx.globalAlpha = Math.min(1, this.life * 2);
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Use blue for shadow priest, green for regular
        ctx.fillStyle = this.isShadowPriest ? '#9966FF' : '#00FF00';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(`+${this.amount}`, this.x, this.y);
        ctx.fillText(`+${this.amount}`, this.x, this.y);
        
        ctx.restore();
    }
}

// Gold coin particle class
class GoldParticle {
    constructor(x, y, amount, isPlayer) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.isPlayer = isPlayer;
        this.life = 1.5;  // 1.5 second lifetime (increased from 1.0)
        this.dy = -40;  // Move upward
        this.dx = isPlayer ? 10 : -10; // Slight horizontal movement based on player/enemy
        this.fontSize = 16;
        this.glitter = []; // Add glitter effect
        
        // Create glitter particles
        for (let i = 0; i < 8; i++) {
            this.glitter.push({
                x: Math.random() * 20 - 10,
                y: Math.random() * 20 - 10,
                size: 1 + Math.random() * 2,
                opacity: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        this.dy += 60 * deltaTime;  // Gravity effect
        this.y += this.dy * deltaTime;
        this.x += this.dx * deltaTime; // Horizontal movement
        
        // Update glitter particles
        this.glitter.forEach(g => {
            g.opacity -= deltaTime * 0.5;
        });
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw glitter particles
        this.glitter.forEach(g => {
            if (g.opacity > 0) {
                ctx.fillStyle = `rgba(255, 215, 0, ${g.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x + g.x, this.y + g.y, g.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Draw gold coin background for better visibility
        ctx.beginPath();
        ctx.arc(this.x, this.y - 10, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();
        
        // Draw gold amount with clear visibility
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFCC00';  // Gold color
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const text = this.isPlayer ? `+${this.amount}g` : `-${this.amount}g`;
        ctx.strokeText(text, this.x, this.y);
        ctx.fillText(text, this.x, this.y);
        
        // Draw gold coin emoji with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.font = '16px Arial';
        ctx.fillText('💰', this.x, this.y - 20);
        
        ctx.restore();
    }
}

// Poison cloud particle class
class PoisonEffectParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1.5;  // 1.5 seconds lifetime
        this.maxLife = 1.5;
        this.particles = [];
        
        // Create multiple poison particles in a cloud
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 15;
            this.particles.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: 2 + Math.random() * 3,
                speed: 0.3 + Math.random() * 0.3,
                angle: angle,
                alpha: 0.6 + Math.random() * 0.4
            });
        }
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        // Update individual particles
        this.particles.forEach(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.size -= deltaTime * 0.5;  // Shrink over time
        });
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw poison emoji
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(1, this.life);
        ctx.fillText('🧪', this.x, this.y - 20);
        
        // Draw poison cloud particles
        ctx.globalAlpha = Math.min(1, this.life * 0.8);
        this.particles.forEach(p => {
            if (p.size > 0) {
                ctx.beginPath();
                ctx.arc(this.x + p.x, this.y + p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 180, 0, ${p.alpha * (this.life / this.maxLife)})`;
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
}

// Lightning tracer particle class
class LightningTracerParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 0.3; // Short lifetime
        this.maxLife = 0.3;
        this.size = 3 + Math.random() * 3;
        this.color = `hsl(210, 100%, ${60 + Math.random() * 40}%)`;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Fade out as life decreases
        const opacity = (this.life / this.maxLife) * 0.6;
        
        // Draw a glowing circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        
        // Add a glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
    }
}

// Lightning flash effect particle class
class LightningFlashParticle {
    constructor(x, y, isCaster = false) {
        this.x = x;
        this.y = y;
        this.isCaster = isCaster;
        this.life = isCaster ? 0.6 : 0.4; // Longer flash for source
        this.maxLife = this.life;
        this.radius = isCaster ? 45 : 35;
        this.color = isCaster ? '#FFFFFF' : '#66CCFF';
        
        // Create branching lightning for visual effect
        this.branches = [];
        if (isCaster) {
            const numBranches = 4 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numBranches; i++) {
                this.branches.push({
                    angle: Math.random() * Math.PI * 2,
                    length: 30 + Math.random() * 20,
                    segments: 3 + Math.floor(Math.random() * 3)
                });
            }
        }
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Create a gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        
        // Adjust opacity based on remaining life
        const opacity = Math.min(1, this.life * 3);
        
        gradient.addColorStop(0, `${this.color}FF`);
        gradient.addColorStop(0.7, `${this.color}88`);
        gradient.addColorStop(1, `${this.color}00`);
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw lightning branches if this is a caster/source
        if (this.branches.length > 0) {
            ctx.strokeStyle = '#66FFFF';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 10;
            
            for (const branch of this.branches) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                
                let lastX = this.x;
                let lastY = this.y;
                
                // Create a jagged lightning branch
                for (let i = 0; i < branch.segments; i++) {
                    const segmentLength = branch.length / branch.segments;
                    const angle = branch.angle + (Math.random() * 0.8 - 0.4);
                    
                    lastX += Math.cos(angle) * segmentLength;
                    lastY += Math.sin(angle) * segmentLength;
                    
                    ctx.lineTo(lastX, lastY);
                }
                
                ctx.stroke();
            }
        }
        
        // Draw lightning bolt symbol
        ctx.font = this.isCaster ? '32px Arial' : '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('⚡', this.x, this.y);
        
        ctx.restore();
    }
}

// Particle system functions
function updateParticles(deltaTime) {
    particles = particles.filter(p => p.update(deltaTime));
}

function drawParticles(ctx) {
    particles.forEach(p => p.draw(ctx));
}

function addParticle(particle) {
    particles.push(particle);
}

function clearParticles() {
    particles = [];
}

function getParticles() {
    return particles;
}

// Export all particle classes and functions
export {
    DamageParticle,
    HealingParticle,
    GoldParticle,
    PoisonEffectParticle,
    LightningTracerParticle,
    LightningFlashParticle,
    updateParticles,
    drawParticles,
    addParticle,
    clearParticles,
    getParticles
}; 