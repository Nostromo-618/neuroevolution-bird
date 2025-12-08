/**
 * NeuroEvolution Bird - Main Application
 *
 * This is the entry point and main controller for the application.
 * It coordinates all components and handles user interaction.
 *
 * Responsibilities:
 * 1. Initialize all components (GameEngine, GameCanvas, NetworkVis)
 * 2. Set up user interface and event listeners
 * 3. Manage game state and settings
 * 4. Control simulation speed and modes
 * 5. Update UI with real-time statistics
 * 6. Handle user interactions (start, pause, reset, etc.)
 */

import { GameEngine } from './services/GameEngine.js';
import { GameCanvas } from './components/GameCanvas.js';
import { NetworkVis } from './components/NetworkVis.js';
import {
  GAME_WIDTH, GAME_HEIGHT, POPULATION_SIZE
} from './constants.js';

// =============================================
// MAIN APPLICATION CLASS
// =============================================

/**
 * App Class - Main application controller
 */
class App {
  /**
   * Constructor - Initializes the application
   */
  constructor() {
    // Core components
    this.engine = new GameEngine(); // Game logic and evolution
    this.stats = {
      generation: 1,
      alive: POPULATION_SIZE,
      score: 0,
      highScore: 0
    };

    // UI components
    this.bestBrain = null;
    this.gameCanvas = null;
    this.networkVis = null;

    // Game state
    this.gameSpeed = 1; // Simulation speed multiplier
    this.paused = true; // Start paused
    this.simulationStarted = false; // Not started yet
    this.challengeModeEnabled = false; // Challenge mode off
    this.pipeVerticalSpeed = 1; // Pipe movement speed
    this.headless = false; // Rendering enabled

    // Initialize application
    this.init();
  }

  /**
   * Initialize - Sets up the application
   */
  init() {
    this.setupUI(); // Create UI elements
    this.setupEventListeners(); // Set up event handlers
    this.startGameLoop(); // Begin game loop
    this.engine.setChallengeMode(this.challengeModeEnabled, this.pipeVerticalSpeed); // Initialize challenge mode
  }

  // =============================================
  // UI SETUP METHODS
  // =============================================

  /**
   * Setup UI - Creates all user interface elements
   */
  setupUI() {
    // Get button references from HTML
    this.startButton = document.getElementById('btn-start');
    this.pauseButton = document.getElementById('btn-pause');
    this.modalOverlay = document.getElementById('info-modal');

    // Create and add game canvas
    this.gameCanvas = new GameCanvas(this.engine);
    document.getElementById('game-canvas-container').appendChild(this.gameCanvas.element);

    // Create and add network visualization
    this.networkVis = new NetworkVis();
    document.getElementById('network-vis-container').appendChild(this.networkVis.element);

    // Create speed control buttons
    this.createSpeedButtons();

    // Create pipe speed control buttons
    this.createPipeSpeedButtons();
  }

  /**
   * Create Speed Buttons - Generates simulation speed controls
   */
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

  /**
   * Create Pipe Speed Buttons - Generates pipe movement speed controls
   */
  createPipeSpeedButtons() {
    const container = document.getElementById('pipe-speed-buttons');
    const pipeSpeeds = [1, 2, 3, 4, 5, 6, 7, 8];

    pipeSpeeds.forEach(speed => {
      const btn = document.createElement('button');
      btn.className = `w-10 h-8 rounded font-bold text-xs transition ${speed === this.pipeVerticalSpeed ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;
      btn.textContent = speed;
      btn.disabled = !this.challengeModeEnabled; // Disable if challenge mode off
      btn.addEventListener('click', () => this.handleVerticalSpeedChange(speed));
      container.appendChild(btn);
    });
  }

  // =============================================
  // EVENT LISTENER SETUP
  // =============================================

  /**
   * Setup Event Listeners - Configures all user interaction handlers
   */
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

  // =============================================
  // GAME LOOP
  // =============================================

  /**
   * Start Game Loop - Begins the main game simulation loop
   *
   * Uses requestAnimationFrame for smooth 60 FPS updates
   * Handles speed multiplication for faster evolution
   */
  startGameLoop() {
    let lastTime = performance.now();
    const fpsInterval = 1000 / 60; // Target 60 FPS update logic

    const loop = (time) => {
      const elapsed = time - lastTime;

      if (elapsed > fpsInterval) {
        lastTime = time - (elapsed % fpsInterval);

        // Only update game logic if not paused
        if (!this.paused) {
          // Run game updates multiple times for speed multiplier
          for (let i = 0; i < this.gameSpeed; i++) {
            this.engine.update();
          }
        }

        // Update UI statistics (always, even when paused)
        const activeBird = this.engine.getBestBird();
        const aliveCount = this.engine.birds.filter(b => b.entity.alive).length;

        // Update game stats
        this.stats = {
          generation: this.engine.generation,
          alive: aliveCount,
          score: this.engine.score,
          highScore: this.engine.highScore
        };

        // Update HTML elements with current stats
        document.getElementById('generation').textContent = this.stats.generation;
        document.getElementById('alive').innerHTML = `${this.stats.alive}<span class="text-sm text-slate-500">/${POPULATION_SIZE}</span>`;
        document.getElementById('score').textContent = this.stats.score;
        document.getElementById('highScore').textContent = this.stats.highScore;

        // Update neural network visualization if available
        if (activeBird && activeBird.entity.brain) {
          this.bestBrain = activeBird.entity.brain;
          this.networkVis.updateBrain(this.bestBrain);
        }
      }

      // Continue the animation loop
      requestAnimationFrame(loop);
    };

    // Start the game loop
    loop(performance.now());
  }

  // =============================================
  // UI CONTROL METHODS
  // =============================================

  /**
   * Toggle Info Modal - Shows/hides information modal
   */
  toggleInfoModal() {
    if (this.modalOverlay.classList.contains('hidden')) {
      this.modalOverlay.classList.remove('hidden');
    } else {
      this.modalOverlay.classList.add('hidden');
    }
  }

  /**
   * Start Simulation - Begins the neuroevolution process
   */
  startSimulation() {
    this.simulationStarted = true;
    this.paused = false;

    // Update button visibility
    this.startButton.classList.add('hidden');
    this.pauseButton.classList.remove('hidden');
    this.pauseButton.textContent = 'PAUSE';
  }

  /**
   * Toggle Pause - Pauses or resumes the simulation
   */
  togglePause() {
    if (!this.simulationStarted) return;

    this.paused = !this.paused;
    this.pauseButton.textContent = this.paused ? 'RESUME' : 'PAUSE';
  }

  /**
   * Reset - Resets the entire simulation
   */
  reset() {
    // Pause the game
    this.paused = true;

    // Reset speed to normal
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

    // Create new game engine (resets everything)
    this.engine = new GameEngine();
    this.engine.setChallengeMode(this.challengeModeEnabled, this.pipeVerticalSpeed);

    // Update GameCanvas engine reference
    this.gameCanvas.engine = this.engine;

    // Reset statistics
    this.stats = {
      generation: 1,
      alive: POPULATION_SIZE,
      score: 0,
      highScore: 0
    };

    // Reset best brain visualization
    this.bestBrain = null;
    this.networkVis.updateBrain(null);

    // Reset simulation state
    this.simulationStarted = false;
    this.startButton.classList.remove('hidden');
    this.pauseButton.classList.add('hidden');
    this.pauseButton.textContent = 'PAUSE';

    // Update UI display
    document.getElementById('generation').textContent = this.stats.generation;
    document.getElementById('alive').innerHTML = `${this.stats.alive}<span class="text-sm text-slate-500">/${POPULATION_SIZE}</span>`;
    document.getElementById('score').textContent = this.stats.score;
    document.getElementById('highScore').textContent = this.stats.highScore;
  }

  // =============================================
  // SPEED CONTROL METHODS
  // =============================================

  /**
   * Handle Speed Change - Updates simulation speed
   *
   * @param {number} speed - New speed multiplier
   */
  handleSpeedChange(speed) {
    this.gameSpeed = speed;

    // Update button styles to show active speed
    const speedButtons = document.querySelectorAll('#speed-buttons button');
    speedButtons.forEach(btn => {
      const btnSpeed = parseInt(btn.textContent);
      btn.className = `w-12 h-10 rounded font-bold text-xs transition ${btnSpeed === speed ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;
    });
  }

  // =============================================
  // MODE TOGGLE METHODS
  // =============================================

  /**
   * Toggle Headless Mode - Enables/disables rendering
   *
   * Headless mode improves performance by disabling visual rendering
   * while still running the evolution simulation.
   */
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

  /**
   * Toggle Challenge Mode - Enables/disables dynamic pipes
   */
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

  /**
   * Handle Vertical Speed Change - Updates pipe movement speed
   *
   * @param {number} speed - New vertical movement speed
   */
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

// =============================================
// APPLICATION INITIALIZATION
// =============================================

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  new App(); // Create and start the application
});

// =============================================
// APPLICATION ARCHITECTURE
// =============================================

/**
 * APPLICATION STRUCTURE
 *
 * 1. COMPONENT-BASED DESIGN
 * - GameEngine: Core simulation and evolution logic
 * - GameCanvas: Visual rendering of game world
 * - NetworkVis: Neural network visualization
 * - App: Main controller and UI manager
 *
 * 2. EVENT-DRIVEN ARCHITECTURE
 * - User interactions trigger state changes
 * - Game loop runs continuously at 60 FPS
 * - Speed multiplier allows faster evolution
 *
 * 3. STATE MANAGEMENT
 * - Game state stored in GameEngine
 * - UI state managed by App class
 * - Visual state handled by rendering components
 *
 * 4. PERFORMANCE OPTIMIZATIONS
 * - Headless mode for faster training
 * - Speed multipliers (up to 1000x)
 * - Efficient canvas rendering
 * - Minimal DOM manipulation
 *
 * 5. USER EXPERIENCE
 * - Intuitive controls and visual feedback
 * - Real-time statistics and visualization
 * - Multiple modes (normal, challenge, headless)
 * - Responsive design
 *
 * This architecture creates an educational, interactive
 * demonstration of neuroevolution that's both performant
 * and easy to understand.
 */