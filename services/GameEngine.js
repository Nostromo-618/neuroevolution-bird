/**
 * NeuroEvolution Bird - Game Engine
 *
 * This is the core simulation engine that:
 * 1. Manages the population of birds with neural networks
 * 2. Handles game physics and collision detection
 * 3. Implements the genetic algorithm for evolution
 * 4. Controls pipe generation and movement
 * 5. Tracks game state and statistics
 *
 * The GameEngine runs the main game loop and coordinates all
 * aspects of the neuroevolution simulation.
 */

import {
  GAME_HEIGHT, GAME_WIDTH, GRAVITY, LIFT, VELOCITY_LIMIT,
  PIPE_SPEED, PIPE_SPAWN_RATE, PIPE_GAP, PIPE_WIDTH,
  INPUT_NODES, HIDDEN_NODES, OUTPUT_NODES, POPULATION_SIZE,
  MAX_PIPE_VERTICAL_SPEED
} from '../constants.js';
import { NeuralNetwork } from './NeuralNetwork.js';

export class GameEngine {
  /**
   * Constructor - Initializes game state
   *
   * Sets up:
   * - Empty bird population
   * - Empty pipe collection
   * - Game counters (frame, score, generation)
   * - Challenge mode settings
   */
  constructor() {
    this.birds = []; // Array of {entity, net} objects
    this.pipes = []; // Array of pipe objects
    this.frameCount = 0; // Total frames elapsed
    this.score = 0; // Current game score (pipes passed)
    this.generation = 1; // Current generation number
    this.highScore = 0; // Best score achieved
    this.challengeModeEnabled = false; // Dynamic pipes enabled
    this.pipeVerticalSpeed = 1; // Vertical movement speed (1-10)

    // Initialize first population
    this.initPopulation();
  }

  /**
   * Initialize Population - Creates first generation of birds
   *
   * Each bird gets:
   * - Random position (middle of screen)
   * - Zero velocity
   * - Unique ID
   * - Random neural network brain
   * - Initial fitness score of 0
   */
  initPopulation() {
    this.birds = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      this.birds.push({
        entity: {
          id: Math.random().toString(36).substr(2, 9),
          y: GAME_HEIGHT / 2,
          velocity: 0,
          alive: true,
          fitness: 0,
          score: 0,
          brain: null // Will be filled during update
        },
        net: new NeuralNetwork(INPUT_NODES, HIDDEN_NODES, OUTPUT_NODES)
      });
    }
  }

  /**
   * Set Challenge Mode - Enables/disables dynamic pipes
   *
   * @param {boolean} enabled - Whether to enable challenge mode
   * @param {number} speed - Vertical movement speed (1-10)
   *
   * In challenge mode, pipes:
   * - Move vertically (up and down)
   * - Change gap sizes dynamically
   * - Create more complex environment for evolution
   */
  setChallengeMode(enabled, speed) {
    this.challengeModeEnabled = enabled;
    // Cap speed at MAX_PIPE_VERTICAL_SPEED (80% of bird max velocity) for fairness
    this.pipeVerticalSpeed = Math.max(1, Math.min(MAX_PIPE_VERTICAL_SPEED, speed));

    // If disabling challenge mode, reset all pipes to static behavior
    if (!enabled) {
      this.pipes.forEach(pipe => {
        pipe.verticalVelocity = undefined;
        pipe.gapSize = undefined;
        pipe.targetGapSize = undefined;
        pipe.directionChangeTimer = undefined;
        pipe.gapChangeTimer = undefined;
      });
    }
  }

  /**
   * Reset Game - Resets game state without creating new population
   *
   * Called when:
   * - Starting new generation
   * - Manual reset by user
   * - Changing game settings
   */
  resetGame() {
    this.pipes = []; // Clear all pipes
    this.frameCount = 0; // Reset frame counter
    this.score = 0; // Reset score

    // Reset all birds to initial state
    this.birds.forEach(b => {
      b.entity.y = GAME_HEIGHT / 2; // Middle of screen
      b.entity.velocity = 0; // No movement
      b.entity.alive = true; // Alive again
      b.entity.score = 0; // Reset pipe count
      b.entity.fitness = 0; // Reset fitness
    });
  }

  /**
   * Update - Main game loop method called every frame
   *
   * This method handles:
   * 1. Pipe management (spawning, movement, cleanup)
   * 2. Bird updates (physics, neural network decisions, collisions)
   * 3. Score tracking
   * 4. Generation transitions
   */
  update() {
    // ===== 1. MANAGE PIPES =====
    // Spawn new pipes at regular intervals
    if (this.frameCount % PIPE_SPAWN_RATE === 0) {
      const baseGap = PIPE_GAP;
      const topHeight = Math.random() * (GAME_HEIGHT - baseGap - 100) + 50;

      const newPipe = {
        x: GAME_WIDTH, // Start at right edge
        topHeight, // Random vertical position
        passed: false // No bird has passed this yet
      };

      // Initialize challenge mode properties if enabled
      if (this.challengeModeEnabled) {
        // Random initial vertical direction
        newPipe.verticalVelocity = Math.random() > 0.5 ? 1 : -1;

        // Gap size properties
        newPipe.gapSize = baseGap; // Start with standard gap
        newPipe.targetGapSize = baseGap; // No change initially

        // Timers for dynamic behavior
        newPipe.directionChangeTimer = 60 + Math.random() * 120; // 60-180 frames
        newPipe.gapChangeTimer = 30 + Math.random() * 60; // 30-90 frames
      }

      this.pipes.push(newPipe);
    }

    // Update existing pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];

      // Horizontal movement - pipes scroll left
      pipe.x -= PIPE_SPEED;

      // Challenge mode: dynamic pipe behavior
      if (this.challengeModeEnabled && pipe.verticalVelocity !== undefined) {
        // Direction change logic
        if (pipe.directionChangeTimer !== undefined) {
          pipe.directionChangeTimer--;
          if (pipe.directionChangeTimer <= 0) {
            // Reverse direction periodically
            pipe.verticalVelocity = pipe.verticalVelocity * -1;
            pipe.directionChangeTimer = 60 + Math.random() * 120; // Reset timer
          }
        }

        // Gradual gap size transitions for fairness
        const currentGap = pipe.gapSize || PIPE_GAP;
        const targetGap = pipe.targetGapSize !== undefined ? pipe.targetGapSize : currentGap;

        // Smooth transition to target gap size
        if (Math.abs(currentGap - targetGap) > 0.5) {
          const gapChangeRate = 1.5; // pixels per frame
          const gapDiff = targetGap - currentGap;
          const change = Math.sign(gapDiff) * Math.min(Math.abs(gapDiff), gapChangeRate);
          pipe.gapSize = Math.max(100, Math.min(250, currentGap + change));
        } else {
          // Snap to target when close enough
          pipe.gapSize = targetGap;
        }

        // Gap size change logic
        if (pipe.gapChangeTimer !== undefined) {
          pipe.gapChangeTimer--;
          if (pipe.gapChangeTimer <= 0) {
            // Change target gap size by ±10-30px
            const gapChange = (Math.random() * 20 + 10) * (Math.random() > 0.5 ? 1 : -1);
            const newTargetGap = Math.max(100, Math.min(250, currentGap + gapChange));
            pipe.targetGapSize = newTargetGap;
            pipe.gapChangeTimer = 30 + Math.random() * 60; // Reset timer
          }
        }

        // Vertical movement with speed capping
        const cappedSpeed = Math.min(this.pipeVerticalSpeed, MAX_PIPE_VERTICAL_SPEED);
        const verticalMove = pipe.verticalVelocity * cappedSpeed;
        pipe.topHeight += verticalMove;

        // Keep pipes within screen bounds
        const updatedGap = pipe.gapSize || PIPE_GAP;
        const minTopHeight = 50;
        const maxTopHeight = GAME_HEIGHT - updatedGap - 50;
        pipe.topHeight = Math.max(minTopHeight, Math.min(maxTopHeight, pipe.topHeight));
      }

      // Remove pipes that have scrolled off screen
      if (pipe.x + PIPE_WIDTH < 0) {
        this.pipes.splice(i, 1);
      }
    }

    // Find the closest pipe for neural network inputs
    let closestPipe = this.pipes.find(p => p.x + PIPE_WIDTH > 50); // 50 is roughly bird X

    // ===== 2. UPDATE BIRDS =====
    let anyAlive = false;

    this.birds.forEach(item => {
      if (!item.entity.alive) return;
      anyAlive = true;

      // Apply physics
      item.entity.velocity += GRAVITY; // Accelerate downward
      item.entity.velocity *= 0.9; // Air resistance (damping)
      item.entity.velocity = Math.max(Math.min(item.entity.velocity, VELOCITY_LIMIT), -VELOCITY_LIMIT); // Clamp
      item.entity.y += item.entity.velocity; // Update position

      // Increase fitness for surviving another frame
      item.entity.fitness += 1;

      // ===== NEURAL NETWORK DECISION MAKING =====
      // Prepare normalized inputs for neural network [0, 1] range
      const pipeX = closestPipe ? closestPipe.x : GAME_WIDTH;
      const currentGap = closestPipe?.gapSize || PIPE_GAP;
      const pipeGapY = closestPipe ? closestPipe.topHeight + currentGap / 2 : GAME_HEIGHT / 2;

      // 4 normalized inputs:
      // 1. Bird Y position (0 = top, 1 = bottom)
      // 2. Pipe X position (0 = left, 1 = right)
      // 3. Pipe gap center Y position (0 = top, 1 = bottom)
      // 4. Bird velocity (-1 = max upward, 1 = max downward)
      const neuralInputs = [
        item.entity.y / GAME_HEIGHT,
        pipeX / GAME_WIDTH,
        pipeGapY / GAME_HEIGHT,
        (item.entity.velocity + VELOCITY_LIMIT) / (VELOCITY_LIMIT * 2) // Normalize -VELOCITY_LIMIT to VELOCITY_LIMIT
      ];

      // Get neural network decision
      const outputs = item.net.predict(neuralInputs);

      // If output > 0.5, flap!
      if (outputs[0] > 0.5) {
        this.jump(item.entity);
      }

      // Update brain structure for visualization
      item.entity.brain = item.net.getStructure();

      // ===== COLLISION DETECTION =====
      const birdSize = 24; // Bird hitbox size
      const groundHeight = 10; // Ground height

      // Check for collisions with:
      // 1. Ground (bottom of screen)
      // 2. Ceiling (top of screen)
      // 3. Pipes
      if (
        item.entity.y + birdSize > GAME_HEIGHT - groundHeight || // Hit ground
        item.entity.y < 0 || // Hit ceiling
        this.checkPipeCollision(item.entity, closestPipe) // Hit pipe
      ) {
        item.entity.alive = false; // Bird dies
      }
    });

    // ===== SCORE TRACKING =====
    this.pipes.forEach(p => {
      // When pipe passes bird position (x=50)
      if (p.x + PIPE_WIDTH < 50 && !p.passed) {
        this.score++; // Increase game score
        p.passed = true; // Mark pipe as passed

        // Give score to all alive birds
        this.birds.forEach(b => {
          if (b.entity.alive) b.entity.score++;
        });
      }
    });

    // Update high score
    if (this.score > this.highScore) this.highScore = this.score;

    this.frameCount++; // Increment frame counter

    // ===== GENERATION TRANSITION =====
    // If all birds are dead, evolve to next generation
    if (!anyAlive) {
      this.nextGeneration();
    }
  }

  /**
   * Jump - Applies upward velocity to bird
   *
   * @param {Object} bird - Bird entity
   */
  jump(bird) {
    bird.velocity = LIFT; // Instant upward velocity
  }

  /**
   * Check Pipe Collision - Detects if bird hits pipe
   *
   * @param {Object} bird - Bird entity
   * @param {Object} pipe - Pipe object
   * @returns {boolean} - True if collision detected
   */
  checkPipeCollision(bird, pipe) {
    if (!pipe) return false;

    // Bird position and size
    const birdX = 50; // Fixed X position
    const birdSize = 24; // Hitbox size
    const currentGap = pipe.gapSize || PIPE_GAP;

    // Check if bird is within pipe's horizontal bounds
    if (birdX + birdSize > pipe.x && birdX < pipe.x + PIPE_WIDTH) {
      // Check if bird hits top pipe or bottom pipe
      if (bird.y < pipe.topHeight || bird.y + birdSize > pipe.topHeight + currentGap) {
        return true; // Collision!
      }
    }
    return false; // No collision
  }

  /**
   * Next Generation - Implements genetic algorithm
   *
   * This is where evolution happens:
   * 1. Calculate fitness scores
   * 2. Sort birds by fitness
   * 3. Apply elitism (preserve best bird)
   * 4. Create offspring through reproduction + mutation
   * 5. Start new generation
   */
  nextGeneration() {
    // ===== 1. CALCULATE FITNESS =====
    // Sum total fitness for probability calculations
    let sumFitness = 0;
    this.birds.forEach(b => sumFitness += b.entity.fitness);

    // Sort birds by fitness (descending)
    const sortedBirds = [...this.birds].sort((a, b) => b.entity.fitness - a.entity.fitness);

    const newBirds = [];

    // ===== 2. ELITISM =====
    // Preserve the champion unchanged
    // This ensures we never lose the best solution found so far
    const champion = sortedBirds[0];
    const bestNet = champion.net.copy(); // Deep copy

    newBirds.push({
      entity: { ...champion.entity, id: 'Champ', fitness: 0, score: 0, alive: true, y: GAME_HEIGHT/2, velocity: 0 },
      net: bestNet
    });

    // ===== 3. REPRODUCTION WITH MUTATION =====
    // Fill rest of population through fitness-proportional selection
    while (newBirds.length < POPULATION_SIZE) {
      // Select parent based on fitness probability
      const parent = this.pickOne(sortedBirds, sumFitness);

      // Create child by copying parent's network
      const childNet = parent.net.copy();

      // Apply mutation to introduce genetic diversity
      childNet.mutate();

      // Add new bird to population
      newBirds.push({
        entity: {
          id: Math.random().toString(36).substr(2, 9), // Random ID
          y: GAME_HEIGHT/2, // Start in middle
          velocity: 0, // No initial velocity
          alive: true, // Alive
          fitness: 0, // Start with 0 fitness
          score: 0, // No pipes passed yet
          brain: null // Will be filled during update
        },
        net: childNet
      });
    }

    // Replace old population with new generation
    this.birds = newBirds;
    this.generation++; // Increment generation counter
    this.resetGame(); // Reset game state
  }

  /**
   * Pick One - Fitness-proportional selection (roulette wheel)
   *
   * @param {Array} sortedList - Birds sorted by fitness
   * @param {number} sumFitness - Total fitness of population
   * @returns {Object} - Selected bird
   *
   * Higher fitness = higher probability of being selected
   * This implements "survival of the fittest" principle
   */
  pickOne(sortedList, sumFitness) {
    let index = 0;
    let r = Math.random() * sumFitness; // Random fitness threshold

    // Find bird whose cumulative fitness exceeds threshold
    while (r > 0 && index < sortedList.length) {
      r -= sortedList[index].entity.fitness;
      index++;
    }

    index--; // Adjust for loop exit condition
    if (index < 0) index = 0; // Safety check

    return sortedList[index];
  }

  /**
   * Get Best Bird - Returns the current best performing bird
   *
   * @returns {Object} - Best bird (alive if possible, otherwise any)
   */
  getBestBird() {
    // Return first alive bird, or just the first bird if all dead
    return this.birds.find(b => b.entity.alive) || this.birds[0];
  }
}

// =============================================
// GENETIC ALGORITHM THEORY
// =============================================

/**
 * GENETIC ALGORITHM OVERVIEW
 *
 * This implementation uses a simplified genetic algorithm:
 *
 * 1. POPULATION: 50 birds with random neural networks
 *
 * 2. FITNESS FUNCTION:
 *    - Fitness = survival time + pipes passed
 *    - Implicit: birds that survive longer get higher fitness
 *    - This is the "objective function" we're optimizing
 *
 * 3. SELECTION: Fitness-proportional selection (roulette wheel)
 *    - P(select) = fitness_i / total_fitness
 *    - Better birds have higher chance to reproduce
 *
 * 4. REPRODUCTION:
 *    - Offspring inherit parent's neural network weights
 *    - No crossover implemented (simplified approach)
 *
 * 5. MUTATION:
 *    - Each weight has 10% chance to mutate
 *    - Mutation amount follows Gaussian distribution
 *    - This introduces genetic diversity
 *
 * 6. ELITISM:
 *    - Best bird is preserved unchanged
 *    - Ensures monotonic improvement
 *
 * THE EVOLUTIONARY PROCESS:
 * Generation 1: Random networks → Most die quickly
 * Generation N: Networks that keep birds alive longer emerge
 * Generation ∞: Optimal flapping strategy evolves
 *
 * This demonstrates how complex behaviors can emerge from simple
 * evolutionary principles without explicit programming.
 */