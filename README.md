# Auto-Battler Game

A browser-based auto-battler game where you build armies to fight against the enemy.

## How to Run the Game (Multiple Options)

### Option 1: Simple Direct Method (Recommended)

1. Double-click the `standalone.html` file
2. The game should open directly in your browser

This is the simplest method and doesn't require any servers or additional setup.

### Option 2: Python Server (Easy Setup)

1. Make sure you have Python installed (Python 3.x)
2. Double-click the `start-python-server.bat` file
3. Open your browser and go to: http://localhost:8000

If the batch file doesn't work, you can run the following command in a terminal:
```
python python_server.py
```

### Option 3: PHP Server (Alternative)

If you have PHP installed, you can use:

1. Double-click the `start-php-server.bat` file
2. Open your browser and go to: http://localhost:8000

If the batch file doesn't work, you can run the following command in a terminal:
```
php -S localhost:8000 serve.php
```

### Option 4: Node.js Server (Advanced)

If you have Node.js installed:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```
   
   Or directly run:
   ```
   node server.js
   ```

3. Open your browser and go to: http://localhost:3000

## Game Instructions

- Buy units from the shop and place them in your staging area
- Every 45 seconds, battles will occur automatically
- Win by destroying all enemy units and reaching their base
- Use the gold you earn to buy more units and upgrades
- Build miners to increase your gold income and vaults to increase your gold capacity

## Unit Types

- **Warrior**: Strong melee fighter with high health
- **Archer**: Ranged unit that shoots arrows
- **Mage**: Powerful magic attacker with area damage
- **Priestess**: Heals nearby allies

## Upgrades

- **Shadow Priest**: Turns your priestesses into offensive healers
- **Arc Lightning**: Mage attacks chain to nearby enemies
- **Pillage**: Warriors steal gold when attacking the enemy base
- **Poison Arrow**: Archer attacks apply poison that slows enemies

## Troubleshooting

If you're having trouble running the game:

1. Try a different browser (Chrome or Firefox recommended)
2. Check your browser's console for any error messages (press F12 to open)
3. Make sure all the game files are in the same folder structure
4. Ensure you have the required software installed (Python, PHP, or Node.js depending on which method you're using)

## Technical Note

The modular version of this game uses ES modules for better code organization, which require a web server to function properly. Opening the HTML file directly from your file system won't work due to browser security restrictions with ES modules.

That's why we provide multiple options to run the game, including the standalone version that doesn't use ES modules. 