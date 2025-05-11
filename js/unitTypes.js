// Unit definitions with emojis
const unitTypes = {
    miner: {
        name: "Miner",
        cost: [200, 250, 300],  // Progressive costs for each miner
        emoji: "⛏️",
        isMiner: true,
        goldRates: [1, 2, 3]  // Gold rate for each miner (index 0 = first miner, etc.)
    },
    vault: {
        name: "Vault",
        cost: [200, 250, 300],  // Updated costs to match miner
        emoji: "💎",
        isVault: true,
        maxGoldIncrease: [250, 500, 750]  // Cumulative increases: +250, +500, +750
    },
    warrior: {
        name: "Warrior",
        cost: 75,
        health: 450,
        damage: 20,
        baseDamage: 10,
        attackRange: 60,
        attackSpeed: 1.5,
        moveSpeed: 1.2,
        color: "#8B0000",
        size: 32,
        damageType: "Physical",
        armorType: "Heavy",
        bonusDamage: {
            Light: 1.5,    // 50% bonus vs Archers
            Medium: 1.0,
            Heavy: 1.0,
            Cloth: 1.0
        }
    },
    archer: {
        name: "Archer",
        cost: 85,
        health: 375,
        damage: 30,
        baseDamage: 10,
        attackRange: 250,
        attackSpeed: 1.0,
        moveSpeed: 1.4,
        color: "#006400",
        size: 28,
        ranged: true,
        damageType: "Piercing",
        armorType: "Light",
        bonusDamage: {
            Light: 1.0,
            Medium: 1.0,
            Heavy: 1.0,
            Cloth: 1.5     // 50% bonus vs Mages
        }
    },
    mage: {
        name: "Mage",
        cost: 100,
        health: 300,
        damage: 50,
        baseDamage: 10,
        attackRange: 150,
        attackSpeed: 0.8,
        moveSpeed: 1.0,
        color: "#00008B",
        size: 28,
        ranged: true,
        damageType: "Magic",
        armorType: "Cloth",
        bonusDamage: {
            Light: 1.0,
            Medium: 1.0,
            Heavy: 1.5,    // 50% bonus vs Warriors
            Cloth: 1.0
        }
    },
    priestess: {
        name: "Priestess",
        cost: 65,
        health: 250,
        damage: 5,
        baseDamage: 5,
        healAmount: 15,
        healRange: 100,
        healSpeed: 0.5,    // Heals every 2 seconds
        moveSpeed: 1.1,
        color: "#FF69B4",
        size: 28,
        ranged: true,      // Make priestess ranged
        attackRange: 150,  // Add attack range
        attackSpeed: 0.8,  // Add attack speed
        damageType: "Magic",
        armorType: "Cloth",
        bonusDamage: {
            Light: 1.0,
            Medium: 1.0,
            Heavy: 1.0,
            Cloth: 1.0
        }
    }
};

export default unitTypes; 