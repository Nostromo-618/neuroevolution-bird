import { GameEngine } from './services/GameEngine.js';
import { GameCanvas } from './components/GameCanvas.js';
import { NetworkVis } from './components/NetworkVis.js';
import {
  GAME_WIDTH, GAME_HEIGHT, POPULATION_SIZE
} from './constants.js';

// Main application
class App {
  constructor() {
    this.engine = new GameEngine();
    this.stats = {
      generation: 1,
      alive: POPULATION_SIZE,
      score: 0,
      highScore: 0
    };
    this.bestBrain = null;
    this.gameSpeed = 1;
    this.paused = true;
    this.simulationStarted = false;
    this.challengeModeEnabled = false;
    this.pipeVerticalSpeed = 1;
    this.headless = false;

    this.init();
  }

  init() {
    // Initialize UI
    this.setupUI();
    this.setupEventListeners();

    // Start game loop
    this.startGameLoop();

    // Initialize challenge mode
    this.engine.setChallengeMode(this.challengeModeEnabled, this.pipeVerticalSpeed);
  }

  setupUI() {
    // Get button references
    this.startButton = document.getElementById('btn-start');
    this.pauseButton = document.getElementById('btn-pause');
    this.modalOverlay = document.getElementById('info-modal');

    // Create Game Canvas and append to container
    this.gameCanvas = new GameCanvas(this.engine);
    document.getElementById('game-canvas-container').appendChild(this.gameCanvas.element);

    // Create Network Visualization and append to container
    this.networkVis = new NetworkVis();
    document.getElementById('network-vis-container').appendChild(this.networkVis.element);

    // Create speed buttons
    this.createSpeedButtons();

    // Create pipe speed buttons
    this.createPipeSpeedButtons();
  }

  createSpeedButtons() {
    const container = document.getElementById('speed-buttons');
    const speeds = [1, 2, 5, 10, 50, 100, 200, 500, 1000];

    speeds.forEach(speed => {
      const btn = document.createElement('button');
      btn.className = `w-12 h-10 rounded font-bold text-xs transition ${speed === this.gameSpeed ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;
      btn.textContent = `${speed}x`;
      btn.addEventListener('click', () => this.handleSpeedChange(speed));
      container.appendChild(btn);
    });
  }

  createPipeSpeedButtons() {
    const container = document.getElementById('pipe-speed-buttons');
    const pipeSpeeds = [1, 2, 3, 4, 5, 6, 7, 8];

    pipeSpeeds.forEach(speed => {
      const btn = document.createElement('button');
      btn.className = `w-10 h-8 rounded font-bold text-xs transition ${speed === this.pipeVerticalSpeed ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;
      btn.textContent = speed;
      btn.disabled = !this.challengeModeEnabled;
      btn.addEventListener('click', () => this.handleVerticalSpeedChange(speed));
      container.appendChild(btn);
    });
  }

  setupEventListeners() {
    // Header buttons
    document.getElementById('btn-info').addEventListener('click', () => this.toggleInfoModal());
    this.startButton.addEventListener('click', () => this.startSimulation());
    this.pauseButton.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-reset').addEventListener('click', () => this.reset());

    // Control buttons
    document.getElementById('btn-headless').addEventListener('click', () => this.toggleHeadless());
    document.getElementById('btn-challenge').addEventListener('click', () => this.toggleChallengeMode());

    // Modal close on click outside
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.toggleInfoModal();
    });
  }

  startGameLoop() {
    let lastTime = performance.now();
    const fpsInterval = 1000 / 60; // Target 60 FPS update logic

    const loop = (time) => {
      const elapsed = time - lastTime;

      if (elapsed > fpsInterval) {
        lastTime = time - (elapsed % fpsInterval);

        if (!this.paused) {
          // Allow speeding up the game by running update multiple times per frame
          for (let i = 0; i < this.gameSpeed; i++) {
            this.engine.update();
          }
        }

        // Sync UI State for HUD
        const activeBird = this.engine.getBestBird();
        const aliveCount = this.engine.birds.filter(b => b.entity.alive).length;

        this.stats = {
          generation: this.engine.generation,
          alive: aliveCount,
          score: this.engine.score,
          highScore: this.engine.highScore
        };

        // Update stats display
        document.getElementById('generation').textContent = this.stats.generation;
        document.getElementById('alive').innerHTML = `${this.stats.alive}<span class="text-sm text-slate-500">/${POPULATION_SIZE}</span>`;
        document.getElementById('score').textContent = this.stats.score;
        document.getElementById('highScore').textContent = this.stats.highScore;

        // Pass the actual brain structure for visualization
        if (activeBird && activeBird.entity.brain) {
          this.bestBrain = activeBird.entity.brain;
          this.networkVis.updateBrain(this.bestBrain);
        }
      }

      requestAnimationFrame(loop);
    };

    loop(performance.now());
  }

  toggleInfoModal() {
    if (this.modalOverlay.classList.contains('hidden')) {
      this.modalOverlay.classList.remove('hidden');
    } else {
      this.modalOverlay.classList.add('hidden');
    }
  }

  startSimulation() {
    this.simulationStarted = true;
    this.paused = false;

    // Hide start button, show pause button
    this.startButton.classList.add('hidden');
    this.pauseButton.classList.remove('hidden');
    this.pauseButton.textContent = 'PAUSE';
  }

  togglePause() {
    if (!this.simulationStarted) return;

    this.paused = !this.paused;
    this.pauseButton.textContent = this.paused ? 'RESUME' : 'PAUSE';
  }

  reset() {
    // Pause the game
    this.paused = true;

    // Reset speed to 1x
    this.gameSpeed = 1;
    const speedButtons = document.querySelectorAll('#speed-buttons button');
    speedButtons.forEach(btn => {
      const btnSpeed = parseInt(btn.textContent);
      btn.className = `w-12 h-10 rounded font-bold text-xs transition ${btnSpeed === 1 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;
    });

    // Turn off headless mode if enabled
    if (this.headless) {
      this.headless = false;
      const headlessButton = document.getElementById('btn-headless');
      headlessButton.textContent = 'HEADLESS OFF';
      headlessButton.className = 'px-4 py-2 rounded font-bold text-sm transition bg-slate-700 text-slate-300 hover:bg-slate-600';

      // Show game canvas and remove headless message
      this.gameCanvas.element.style.display = 'block';
      const headlessMessage = this.gameCanvas.element.previousElementSibling;
      if (headlessMessage && headlessMessage.textContent.includes('Headless Mode')) {
        headlessMessage.remove();
      }
    }

    // Create new game engine
    this.engine = new GameEngine();
    this.engine.setChallengeMode(this.challengeModeEnabled, this.pipeVerticalSpeed);

    // Update GameCanvas engine reference
    this.gameCanvas.engine = this.engine;

    // Reset stats
    this.stats = {
      generation: 1,
      alive: POPULATION_SIZE,
      score: 0,
      highScore: 0
    };

    // Reset best brain
    this.bestBrain = null;
    this.networkVis.updateBrain(null);

    // Reset simulation state - show start button, hide pause button
    this.simulationStarted = false;
    this.startButton.classList.remove('hidden');
    this.pauseButton.classList.add('hidden');
    this.pauseButton.textContent = 'PAUSE';

    // Update UI
    document.getElementById('generation').textContent = this.stats.generation;
    document.getElementById('alive').innerHTML = `${this.stats.alive}<span class="text-sm text-slate-500">/${POPULATION_SIZE}</span>`;
    document.getElementById('score').textContent = this.stats.score;
    document.getElementById('highScore').textContent = this.stats.highScore;
  }

  handleSpeedChange(speed) {
    this.gameSpeed = speed;
    // Update button styles
    const speedButtons = document.querySelectorAll('#speed-buttons button');
    speedButtons.forEach(btn => {
      const btnSpeed = parseInt(btn.textContent);
      btn.className = `w-12 h-10 rounded font-bold text-xs transition ${btnSpeed === speed ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;
    });
  }

  toggleHeadless() {
    this.headless = !this.headless;
    const headlessButton = document.getElementById('btn-headless');
    headlessButton.textContent = this.headless ? 'HEADLESS ON' : 'HEADLESS OFF';
    headlessButton.className = `px-4 py-2 rounded font-bold text-sm transition ${this.headless ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;

    const container = document.getElementById('game-canvas-container');

    if (this.headless) {
      // Hide game canvas and show headless mode message
      this.gameCanvas.element.style.display = 'none';
      const headlessMessage = document.createElement('div');
      headlessMessage.className = 'w-full max-w-[800px] h-[450px] bg-slate-800 rounded-xl border-4 border-slate-700 flex items-center justify-center';
      headlessMessage.innerHTML = '<p class="text-slate-500 text-lg">Headless Mode - Rendering Disabled</p>';
      container.insertBefore(headlessMessage, this.gameCanvas.element);
    } else {
      // Show game canvas and remove headless message
      this.gameCanvas.element.style.display = 'block';
      const headlessMessage = this.gameCanvas.element.previousElementSibling;
      if (headlessMessage && headlessMessage.textContent.includes('Headless Mode')) {
        headlessMessage.remove();
      }
    }
  }

  toggleChallengeMode() {
    const newValue = !this.challengeModeEnabled;
    this.challengeModeEnabled = newValue;
    this.engine.setChallengeMode(newValue, this.pipeVerticalSpeed);

    const challengeButton = document.getElementById('btn-challenge');
    challengeButton.textContent = newValue ? 'ON' : 'OFF';
    challengeButton.className = `px-4 py-2 rounded font-bold text-sm transition ${newValue ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;

    // Enable/disable pipe speed buttons
    const pipeSpeedButtons = document.querySelectorAll('#pipe-speed-buttons button');
    pipeSpeedButtons.forEach(btn => {
      btn.disabled = !newValue;
      btn.className = btn.className.replace(/bg-slate-800 text-slate-600 cursor-not-allowed/, '')
        .replace(/bg-slate-700 text-slate-300 hover:bg-slate-600/, '');
      if (!newValue) {
        btn.className += ' bg-slate-800 text-slate-600 cursor-not-allowed';
      } else {
        btn.className += ' bg-slate-700 text-slate-300 hover:bg-slate-600';
      }
    });
  }

  handleVerticalSpeedChange(speed) {
    if (!this.challengeModeEnabled) return;

    this.pipeVerticalSpeed = speed;
    this.engine.setChallengeMode(this.challengeModeEnabled, speed);

    // Update button styles
    const pipeSpeedButtons = document.querySelectorAll('#pipe-speed-buttons button');
    pipeSpeedButtons.forEach(btn => {
      const btnSpeed = parseInt(btn.textContent);
      btn.className = `w-10 h-8 rounded font-bold text-xs transition ${btnSpeed === speed ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});