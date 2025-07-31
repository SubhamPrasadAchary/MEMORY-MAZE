    const API_BASE = "http://localhost:5000/api";  // 🔗 Backend API base URL
    let genieUsed = false;
    const sounds = {
        click: new Audio("../sounds/click.mp3"),
        win: new Audio("../sounds/win.mp3"),
        fail: new Audio("../sounds/fail.mp3")
    };
    class MemoryMazeGame {
        constructor() {
        console.log('Initializing game...');

        // 🧠 Game state variables
        this.path = [];
        this.playerPath = [];
        this.moves = 0;
        this.score = 0;
        this.gameTimer = 0;
        this.gameStarted = false;
        this.difficulty = 'easy';
        this.pathAnimationSpeed = 500;
        this.pathAnimationInterval = null;

        // 🧱 Set default values manually instead
        this.gridSize = 3;
        this.timeLimit = 60;

        this.currentLevel = parseInt(localStorage.getItem("memoryMazeLevel")) || 1;

        this.setupEventListeners();
        this.createMaze();
        this.updateUI(); // ✅ called AFTER currentLevel is defined
    }



        setupEventListeners() {
            // 📌 Attach event listeners to all buttons
            const getById = id => document.getElementById(id);

            getById('startButton')?.addEventListener('click', () => this.startNewGame());
            getById('showPathButton')?.addEventListener('click', () => this.showPath());
            getById('soundButton')?.addEventListener('click', () => this.toggleSound());
            getById('difficultySelect')?.addEventListener('change', () => this.updateDifficulty());
            getById('themeButton')?.addEventListener('click', () => this.toggleThemeModal());
            getById('tutorialButton')?.addEventListener('click', () => this.toggleTutorialModal());
            getById("genieButton")?.addEventListener("click", () => {
    if (!this.gameStarted || this.usedGenieHint) return;
    console.log("🧞 Genie button clicked");
    this.skipObstacleEnabled = true;
    this.usedGenieHint = true;
    getById("genieButton").classList.add("powerup-used");
});
            getById('timeBonusButton')?.addEventListener('click', () => this.useTimeBonus());
            getById('retryButton')?.addEventListener('click', () => this.retryLevel());
            getById('leaderboardButton')?.addEventListener('click', () => this.showLeaderboard());

            document.querySelectorAll('.theme-option')?.forEach(btn =>
                btn.addEventListener('click', () => {
                    this.setTheme(btn.dataset.theme);
                    this.closeThemeModal();
                })
            );
        }

        // 🔁 Retry current level
        retryLevel() {
            document.getElementById("statusMessage").textContent = '';
            if (!this.currentLevel) return;
            this.loadLevel(this.currentLevel);
        }

    // ⏭️ Load next level
    nextLevel() {
        document.getElementById("statusMessage").textContent = '';

        this.currentLevel++; // It's already a number
        this.loadLevel(this.currentLevel); // Keep using number

        // Show as "Level: 2", "Level: 3", etc.
        document.getElementById("level").innerText = `Level: ${this.currentLevel}`;

        localStorage.setItem("memoryMazeLevel", this.currentLevel);
    }


        // 📦 Load a specific level by ID
        async loadLevel(levelNumber) {
            console.log('Loading level:', levelNumber);

            // Reset state
            this.path = [];
            this.moves = 0;
            this.score = 0;
            this.playerPath = [];
            this.gameStarted = false;

            if (this.pathAnimationInterval) clearInterval(this.pathAnimationInterval);
            if (this.timerInterval) clearInterval(this.timerInterval);

            try {
                // ✅ Set grid size based on level
                let gridSize = 5;
                if (levelNumber >= 4 && levelNumber < 7) {
                    gridSize = 6;
                } else if (levelNumber >= 7 && levelNumber < 10) {
                    gridSize = 7;
                } else if (levelNumber >= 10) {
                    gridSize = 8;
                }

                // ✅ Time limit (starting at 40s, reducing to 25s)
                const timeLimit = Math.max(25, 40 - levelNumber * 1.5);

                // ✅ Obstacle count grows with level
                const obstacleCount = Math.min(3 + levelNumber, Math.floor(gridSize * gridSize * 0.3)); // cap ~30% of grid

                // ✅ Minimum path length grows with level
                const minPathLength = Math.min(Math.floor(5 + levelNumber * 1.2), gridSize * gridSize - obstacleCount - 1);

                // ✅ Fetch level from backend with custom params
                const res = await fetch(
                    `${API_BASE}/levels/${levelNumber}?gridSize=${gridSize}&obstacles=${obstacleCount}&time=${Math.round(timeLimit)}&minPathLength=${minPathLength}`
                );
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || "Failed to fetch level");

                // ✅ Apply level data
                this.gridSize = data.grid_size || gridSize;
                this.timeLimit = data.time_limit || Math.round(timeLimit);
                this.path = data.maze_positions;
                this.obstacles = data.obstacles;
                this.currentLevel = levelNumber;

                // ✅ Build game
                this.createMaze();
                this.renderPathAndObstacles();
                this.showPath();
                this.updateUI();
                this.skipObstacleEnabled = false;
                this.usedGenieHint = false;
                this.timeBonusUsed = false;

            } catch (err) {
                console.error("Error loading level:", err);
                document.getElementById("statusMessage").textContent = "Error loading level!";
            }
        }

        async startNewGame() {
            console.log('Starting new game...');

            // Reset game state
            this.path = [];
            this.moves = 0;
            this.score = 0;
            this.playerPath = [];
            this.gameStarted = false;

            // Clear animations and timers
            if (this.pathAnimationInterval) clearInterval(this.pathAnimationInterval);
            if (this.timerInterval) clearInterval(this.timerInterval);

            // 📌 Set level number from memory or default
            const levelNumber = this.currentLevel || 1;
            document.getElementById("level").innerText = `Level: ${levelNumber}`;
            localStorage.setItem("memoryMazeLevel", levelNumber);
            this.gridSize = Math.min(3 + this.currentLevel - 1, 8);  // Max grid size 8x8
            this.timeLimit = Math.max(60 - (this.currentLevel - 1) * 2, 20);  // Minimum 20s

            try {
                // 🧠 Let backend decide difficulty/grid size
                const res = await fetch(`${API_BASE}/levels`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ levelNumber })  // ❌ No gridSize/difficulty sent
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to fetch level");

                // 🧩 Apply level configuration
                this.gridSize = data.grid_size;
                this.timeLimit = data.time_limit;
                this.path = data.maze_positions;
                this.obstacles = data.obstacles;
                this.currentLevel = levelNumber;
                this.playerPosition = this.path[0]; // start from first cell
                this.skipObstacleEnabled = false;
                this.usedGenieHint = false;
                this.timeBonusUsed = false;

                // 🚀 Initialize game view
                this.createMaze();               // Build grid
                this.renderPathAndObstacles();   // Add path + obstacles
                this.showPath();                 // Animate path
                this.updateUI();                 // Score, timer, etc.

            } catch (err) {
                console.error("Error fetching level:", err);
                document.getElementById("statusMessage").textContent = "Error loading level!";
            }
        }

        getDifficultyFromLevel(level) {
            if (level <= 3) return "easy";
            if (level <= 6) return "medium";
            return "hard";
        }

        async showLeaderboard() {
            try {
                const res = await fetch(`${API_BASE}/scores/leaderboard`);
                const data = await res.json();
            
                console.log("Fetched leaderboard:", data);

                const tbody = document.getElementById("leaderboardTableBody");
                tbody.innerHTML = '';  // Clear previous

                if (!data.length) {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td colspan="3">No leaderboard data yet!</td>`;
                    tbody.appendChild(row);
                    document.getElementById("leaderboardModal").style.display = "block";
                    return;
                }


                data.forEach((entry, index) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>#${index + 1} - ${entry.playerName}</td>
                        <td>${entry.level}</td>
                        <td>${entry.timeTaken}</td>
                    `;
                    tbody.appendChild(row);
                });

                document.getElementById("leaderboardModal").style.display = "block";
            } catch (err) {
                console.error("Failed to load leaderboard", err);
            }
        }

        // 🧠 Convert difficulty + selection index to level number
        getLevelNumberFromDifficulty() {
            const index = parseInt(this.difficultySelect.options[this.difficultySelect.selectedIndex].dataset.selectionIndex) || 0;
            const base = this.difficulty === 'easy' ? 1 : this.difficulty === 'medium' ? 4 : 7;
            return base + index;
        }

        // 🔲 Add obstacles visually
        renderPathAndObstacles() {
            const maze = document.getElementById("maze");
            this.obstacles?.forEach(([x, y]) => {
                const cell = maze.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (cell) cell.classList.add("obstacle");
            });
        }

        // 🔧 Update grid size and timer if user changes difficulty dropdown
        updateDifficulty() {
            const select = document.getElementById('difficultySelect');
            this.difficulty = select.value;
            const settingsArray = this.difficultySettings[this.difficulty];
            const selectionIndex = parseInt(select.options[select.selectedIndex].dataset.selectionIndex) || 0;
            const setting = settingsArray[selectionIndex];
            this.gridSize = setting.gridSize;
            this.timeLimit = setting.timeLimit;

            this.createMaze();
            document.getElementById('gameTimer').textContent = `${Math.floor(this.timeLimit / 60)}:${this.timeLimit % 60 < 10 ? '0' : ''}${this.timeLimit % 60}`;
            document.getElementById('pathLength').textContent = setting.pathLength;
        }

        // 🧱 Dynamically create square grid based on gridSize
        createMaze() {
            const maze = document.getElementById('maze');
            if (!maze) return;

            maze.innerHTML = '';
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    cell.addEventListener('click', () => this.handleCellClick(cell));
                    maze.appendChild(cell);
                }
            }

            maze.style.display = 'grid';
            maze.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
            maze.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        }

        addEventListenersToCells() {
            const cells = document.querySelectorAll(".cell");
            cells.forEach(cell => {
                cell.addEventListener("click", () => this.handleCellClick(cell));
            });
        }

        // 🧠 Animate the path sequence to show the correct cells
        showPath() {
            if (!this.path.length) return;

            let currentCellIndex = 0;

            const animatePath = () => {
                if (currentCellIndex < this.path.length) {
                    const [x, y] = this.path[currentCellIndex];
                    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    if (cell) {
                        cell.classList.add('path');
                        cell.classList.add('current');
                        setTimeout(() => cell.classList.remove('current'), 200);
                    }
                    currentCellIndex++;
                } else {
                    clearInterval(this.pathAnimationInterval);

                    // ❗ REMOVE path highlight before player starts
                    setTimeout(() => {
                        document.querySelectorAll('.cell.path').forEach(cell => {
                            cell.classList.remove('path');
                        });

                        // ✅ Now allow player to interact
                        this.gameStarted = true;
                        this.startTimer();
                        console.log("✅ Player can now interact with maze.");
                    }, 500);
                }
            };

            if (this.pathAnimationInterval) clearInterval(this.pathAnimationInterval);
            this.pathAnimationInterval = setInterval(animatePath, this.pathAnimationSpeed);
        }


        // 🧩 Handle player's click on a grid cell
        handleCellClick(cell) {
            if (!this.gameStarted) {
                console.warn("⛔ Click ignored. Game not started.");
                return;
            }

            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            console.log("🟢 Cell clicked:", x, y);
            sounds.click.play();

            // ✅ Handle Genie Hint: allow removing one obstacle
            if (cell.classList.contains("obstacle")) {
    if (this.skipObstacleEnabled) {
        cell.classList.remove("obstacle");
        cell.classList.add("path"); // make walkable
        this.skipObstacleEnabled = false;

        const genieBtn = document.getElementById("genieButton");
        if (genieBtn) genieBtn.classList.add("powerup-used");

        genieBtn?.removeAttribute("title");
        setTimeout(() => genieBtn?.setAttribute("title", "Power-up used"), 10);
        document.body.style.cursor = "default";

        console.log("🧞 Genie used, obstacle removed.");
        return;
    } else {
        console.warn("🚫 Obstacle clicked!");
        cell.classList.add("shake");
        setTimeout(() => cell.classList.remove("shake"), 300);
        return;
    }
}

            const expected = this.path[this.playerPath.length];
            console.log("🔍 Expected cell:", expected);

            if (!expected || expected[0] !== x || expected[1] !== y) {
                console.error("❌ Wrong cell clicked");
                this.gameOver(false);
                return;
            }

            this.playerPath.push([x, y]);
            this.moves++;

            cell.classList.add('visited');
            cell.classList.add('current');
            setTimeout(() => cell.classList.remove('current'), 100);

            if (this.playerPath.length === this.path.length) {
                this.gameOver(true);
            }

            document.getElementById('moves').textContent = this.moves;
        }

        // 🔚 Trigger game end and display message
        gameOver(won = false) {
            this.gameStarted = false;
            clearInterval(this.timerInterval);
            this.timerInterval = null;

            const status = document.getElementById('statusMessage');
            status.textContent = won ? '🎉 You won!' : '💥 Game Over!';
            // Apply correct styles from CSS
            status.className = `status-message ${won ? 'success' : 'error'} visible`;
            // Enable/Disable buttons
            const nextBtn = document.getElementById('nextLevelButton');
            if (nextBtn) nextBtn.disabled = !won;
            const retryBtn = document.getElementById('retryButton');
            if (retryBtn) retryBtn.disabled = false;
            // Report win
            if (won) {
                this.reportLevelCompletion("user123", this.username || "Player1", this.currentLevel, this.timeLimit - this.gameTimer);
                sounds.win.play();
                this.currentLevel++;
                const mazeContainer = document.querySelector('.maze-container');
                mazeContainer.classList.add('win-animation');
                launchConfetti(); // 🎉 Trigger confetti
                console.log("WIN function triggered ✅");
                setTimeout(() => {
                    mazeContainer.classList.remove('win-animation');
                    this.goToNextLevel();  // or your next-level function
                }, 3000);
                const nextBtn = document.getElementById('nextLevelButton');
                if (nextBtn) nextBtn.disabled = false;
            }
            else {
                            sounds.fail.play();
                            const mazeContainer = document.querySelector('.maze-container');
                            mazeContainer.classList.add('lose-animation');
                            console.log("LOSE function triggered ✅");
                            setTimeout(() => {
                                mazeContainer.classList.remove('lose-animation');
                                this.restartLevel(); // or your reset function
                            }, 600);
            }
            // Hide status after 4 seconds
            setTimeout(() => {
                status.classList.remove('visible');
            }, 4000);
        }
        // 📤 Submit level completion details to backend
        async reportLevelCompletion(userId, username, level, completionTime) {
            try {
                const res = await fetch(`${API_BASE}/levels/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, username, level, completionTime })
                });
                const data = await res.json();
                console.log("Level completion submitted:", data);
            } catch (error) {
                console.error("Error reporting completion:", error);
            }
        }
        // 🔄 Refresh game stats
        updateUI() {
            document.getElementById('moves').textContent = this.moves;
            document.getElementById('score').textContent = this.score;
            document.getElementById('gameTimer').textContent = this.timeLimit;
            document.getElementById("genieButton").classList.remove("powerup-used");
            document.getElementById("timeBonusButton").classList.remove("powerup-used");
            document.getElementById("timeBonusButton").title = "Add +10 seconds";
            document.getElementById("level").innerText = `Level: ${this.currentLevel}`;
            const genieBtn = document.getElementById("genieButton");
            if (genieBtn) {
                genieBtn.classList.remove("powerup-used");
                genieBtn.title = "Skip obstacle";
                document.body.style.cursor = "default";
            }
            this.skipObstacleEnabled = false;
        }
        // ⏳ Start countdown timer
        startTimer() {
            this.gameTimer = this.timeLimit;
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                if (this.gameTimer > 0) {
                    this.gameTimer--;
                    document.getElementById('gameTimer').textContent = Math.floor(this.gameTimer);
                } else {
                    clearInterval(this.timerInterval); // Stop interval
                    document.getElementById('gameTimer').textContent = 0; // Ensure it shows 0
                    this.gameOver(false); // Trigger game over
                }
            }, 1000);
        }
        // 🔇 Toggle sound on/off
        toggleSound() {
            this.soundEnabled = !this.soundEnabled;
            const icon = document.getElementById('soundButton')?.querySelector('i');
            if (icon) icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
        // 🎨 Apply selected theme to UI
        setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('memoryMazeTheme', theme);
        }
        toggleThemeModal() {
            const modal = document.getElementById('themeModal');
            if (modal) modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        }
        toggleTutorialModal() {
            const modal = document.getElementById('tutorialModal');
            if (modal) modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        }
        closeThemeModal() {
            const modal = document.getElementById('themeModal');
            if (modal) modal.style.display = 'none';
        }
        // 🧑 Handle player login via modal and store in localStorage
        initializeLogin() {
            const savedUsername = localStorage.getItem("memoryMazeUsername");

            if (savedUsername) {
                this.username = savedUsername;
                this.hideLoginModal();
            } else {
                const modal = document.getElementById("loginModal");
                const submitBtn = document.getElementById("loginSubmitBtn");
                const input = document.getElementById("usernameInput");

                if (modal && submitBtn && input) {
                    modal.style.display = "block";

                    submitBtn.addEventListener("click", () => {
                        const name = input.value.trim();
                        if (name) {
                            localStorage.setItem("memoryMazeUsername", name);
                            this.username = name;
                            this.hideLoginModal();
                        } else {
                            alert("Please enter your name.");
                        }
                    });
                }
            }
        }
        hideLoginModal() {
            const modal = document.getElementById("loginModal");
            if (modal) modal.style.display = "none";
        }
        // ⏱️ Time Bonus Power-up: Add +10 seconds
        useTimeBonus() {
            if (!this.gameStarted || this.timeBonusUsed) return;
            console.log("⏱️ Time Bonus used: +10 seconds");
            this.gameTimer += 10;
            this.timeBonusUsed = true;
            // Update UI
            document.getElementById('gameTimer').textContent = Math.floor(this.gameTimer);
            const timeBonusBtn = document.getElementById('timeBonusButton');
            if (timeBonusBtn) {
            timeBonusBtn.classList.add('powerup-used');
            timeBonusBtn.title = "Power-up used";
            }
            const timerEl = document.getElementById('gameTimer');
            if (timerEl) {
                timerEl.classList.add("flash-green");
                setTimeout(() => timerEl.classList.remove("flash-green"), 500);
            }
        }
    }

        // 🌐 Close leaderboard modal when clicking outside the modal content
        window.addEventListener("click", function (event) {
            const modal = document.getElementById("leaderboardModal");
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });

    document.addEventListener('DOMContentLoaded', () => {
        const game = new MemoryMazeGame();
        game.initializeLogin();
    });

    document.getElementById("closeTutorial").addEventListener("click", function () {
        document.getElementById("tutorialModal").style.display = "none";
    });
    function logoutUser() {
        localStorage.removeItem("memoryMazeUsername");
        location.reload();
    }
    function showGameContent() {
        document.getElementById("gameTitle").style.display = "none";
        document.getElementById("gameContent").style.display = "block";
    }
    
function renderLeaderboard(data) {
  const topContainer = document.getElementById("topPlayers");
  const tableBody = document.getElementById("leaderboardTableBody");

  topContainer.innerHTML = "";
  tableBody.innerHTML = "";

  // Sort by level and then time
  data.sort((a, b) => b.level - a.level || a.time - b.time);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  top3.forEach((player, i) => {
    const div = document.createElement("div");
    div.classList.add("top-player");
    div.innerHTML = `
      <div class="circle">${i + 1}</div>
      <div class="name">${player.name}</div>
      <div class="score">${player.level} | ${player.time}s</div>
    `;
    topContainer.appendChild(div);
  });
  rest.forEach((player, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 4}</td>
      <td>${player.name}</td>
      <td>${player.level}</td>
      <td>${player.time}</td>
    `;
    tableBody.appendChild(row);
  });
}

// 🎉 Confetti animation function
function launchConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const totalPieces = 400; // Reduced for performance but more natural
    for (let i = 0; i < totalPieces; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');

        // 🎨 Random color
        piece.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;

        // 📍 Random start position
        piece.style.left = `${Math.random() * 100}vw`; 
        piece.style.top = `-${Math.random() * 30}vh`; // some higher, some lower

        // 📏 Random size
        piece.style.width = `${Math.random() * 8 + 4}px`;
        piece.style.height = `${Math.random() * 14 + 6}px`;

        // 🎭 Random opacity
        piece.style.opacity = Math.random() * 0.5 + 0.5;

        // 🎢 Random falling speed and spin
        piece.style.animationDuration = `${Math.random() * 2 + 2.5}s`;
        piece.style.animationDelay = `${Math.random() * 1}s`;

        // ↔️ Random direction (left or right drift)
        piece.style.setProperty('--direction', Math.random() > 0.5 ? 1 : -1);

        container.appendChild(piece);

        // Cleanup after animation
        setTimeout(() => piece.remove(), 4000);
    }
}
