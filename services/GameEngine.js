import {
  GAME_HEIGHT, GAME_WIDTH, GRAVITY, LIFT, VELOCITY_LIMIT,
  PIPE_SPEED, PIPE_SPAWN_RATE, PIPE_GAP, PIPE_WIDTH,
  INPUT_NODES, HIDDEN_NODES, OUTPUT_NODES, POPULATION_SIZE,
  MAX_PIPE_VERTICAL_SPEED
} from '../constants.js';
import { NeuralNetwork } from './NeuralNetwork.js';

export class GameEngine {
  constructor() {
    this.birds = [];
    this.pipes = [];
    this.frameCount = 0;
    this.score = 0;
    this.generation = 1;
    this.highScore = 0;
    this.challengeModeEnabled = false;
    this.pipeVerticalSpeed = 1; // 1-10

    this.initPopulation();
  }

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
          brain: null // Will be filled on update
        },
        net: new NeuralNetwork(INPUT_NODES, HIDDEN_NODES, OUTPUT_NODES)
      });
    }
  }

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

  resetGame() {
    this.pipes = [];
    this.frameCount = 0;
    this.score = 0;
    // Reset birds
    this.birds.forEach(b => {
      b.entity.y = GAME_HEIGHT / 2;
      b.entity.velocity = 0;
      b.entity.alive = true;
      b.entity.score = 0;
      b.entity.fitness = 0;
    });
  }

  update() {
    // 1. Manage Pipes
    if (this.frameCount % PIPE_SPAWN_RATE === 0) {
      const baseGap = PIPE_GAP;
      const topHeight = Math.random() * (GAME_HEIGHT - baseGap - 100) + 50;
      const newPipe = {
        x: GAME_WIDTH,
        topHeight,
        passed: false
      };

      if (this.challengeModeEnabled) {
        // Initialize challenge mode properties
        newPipe.verticalVelocity = Math.random() > 0.5 ? 1 : -1; // Random initial direction
        newPipe.gapSize = baseGap;
        newPipe.targetGapSize = baseGap; // Start with no gap change in progress
        newPipe.directionChangeTimer = 60 + Math.random() * 120; // 60-180 frames
        newPipe.gapChangeTimer = 30 + Math.random() * 60; // 30-90 frames
      }

      this.pipes.push(newPipe);
    }

    // Move pipes horizontally and update challenge mode behavior
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];

      // Horizontal movement
      pipe.x -= PIPE_SPEED;

      // Challenge mode: vertical movement and gap changes
      if (this.challengeModeEnabled && pipe.verticalVelocity !== undefined) {
        // Update direction change timer
        if (pipe.directionChangeTimer !== undefined) {
          pipe.directionChangeTimer--;
          if (pipe.directionChangeTimer <= 0) {
            // Change direction
            pipe.verticalVelocity = pipe.verticalVelocity * -1;
            pipe.directionChangeTimer = 60 + Math.random() * 120; // Reset timer
          }
        }

        // Gradual gap size changes for fairness
        const currentGap = pipe.gapSize || PIPE_GAP;
        const targetGap = pipe.targetGapSize !== undefined ? pipe.targetGapSize : currentGap;

        // If gap is not at target, gradually move toward it (1-2px per frame)
        if (Math.abs(currentGap - targetGap) > 0.5) {
          const gapChangeRate = 1.5; // pixels per frame (gradual change)
          const gapDiff = targetGap - currentGap;
          const change = Math.sign(gapDiff) * Math.min(Math.abs(gapDiff), gapChangeRate);
          pipe.gapSize = Math.max(100, Math.min(250, currentGap + change));
        } else {
          // Gap reached target, set exactly to target
          pipe.gapSize = targetGap;
        }

        // Update gap change timer
        if (pipe.gapChangeTimer !== undefined) {
          pipe.gapChangeTimer--;
          if (pipe.gapChangeTimer <= 0) {
            // Set new target gap size (change by ±10-30px)
            const gapChange = (Math.random() * 20 + 10) * (Math.random() > 0.5 ? 1 : -1);
            const newTargetGap = Math.max(100, Math.min(250, currentGap + gapChange));
            pipe.targetGapSize = newTargetGap;
            pipe.gapChangeTimer = 30 + Math.random() * 60; // Reset timer
          }
        }

        // Move pipe vertically (capped at MAX_PIPE_VERTICAL_SPEED for fairness)
        const cappedSpeed = Math.min(this.pipeVerticalSpeed, MAX_PIPE_VERTICAL_SPEED);
        const verticalMove = pipe.verticalVelocity * cappedSpeed;
        pipe.topHeight += verticalMove;

        // Constrain pipe movement to keep gap within screen bounds
        // Use updated gapSize (may have changed from gradual transition)
        const updatedGap = pipe.gapSize || PIPE_GAP;
        const minTopHeight = 50;
        const maxTopHeight = GAME_HEIGHT - updatedGap - 50;
        pipe.topHeight = Math.max(minTopHeight, Math.min(maxTopHeight, pipe.topHeight));
      }

      // Remove pipes that are off screen
      if (pipe.x + PIPE_WIDTH < 0) {
        this.pipes.splice(i, 1);
      }
    }

    // Find closest pipe for inputs
    let closestPipe = this.pipes.find(p => p.x + PIPE_WIDTH > 50); // 50 is roughly bird X

    // 2. Update Birds
    let anyAlive = false;

    this.birds.forEach(item => {
      if (!item.entity.alive) return;
      anyAlive = true;

      // Physics
      item.entity.velocity += GRAVITY;
      item.entity.velocity *= 0.9; // Air resistance
      item.entity.velocity = Math.max(Math.min(item.entity.velocity, VELOCITY_LIMIT), -VELOCITY_LIMIT);
      item.entity.y += item.entity.velocity;

      item.entity.fitness += 1; // Survived another frame

      // Neural Network Inputs (4 inputs: Bird Y, Pipe X, Pipe Gap Y Center, Velocity)
      const pipeX = closestPipe ? closestPipe.x : GAME_WIDTH;
      const currentGap = closestPipe?.gapSize || PIPE_GAP;
      const pipeGapY = closestPipe ? closestPipe.topHeight + currentGap / 2 : GAME_HEIGHT / 2;

      const neuralInputs = [
        item.entity.y / GAME_HEIGHT,
        pipeX / GAME_WIDTH,
        pipeGapY / GAME_HEIGHT,
        (item.entity.velocity + VELOCITY_LIMIT) / (VELOCITY_LIMIT * 2) // Normalize -VELOCITY_LIMIT to VELOCITY_LIMIT
      ];

      const outputs = item.net.predict(neuralInputs);

      // Decision
      if (outputs[0] > 0.5) {
        this.jump(item.entity);
      }

      // Update brain structure for viz
      item.entity.brain = item.net.getStructure();

      // Collision Detection
      const birdSize = 24;
      const groundHeight = 10;
      if (
        item.entity.y + birdSize > GAME_HEIGHT - groundHeight ||
        item.entity.y < 0 ||
        this.checkPipeCollision(item.entity, closestPipe)
      ) {
        item.entity.alive = false;
      }
    });

    // Score counting
    this.pipes.forEach(p => {
      if (p.x + PIPE_WIDTH < 50 && !p.passed) { // 50 is bird X
        this.score++;
        p.passed = true;
        this.birds.forEach(b => {
          if (b.entity.alive) b.entity.score++;
        });
      }
    });

    if (this.score > this.highScore) this.highScore = this.score;

    this.frameCount++;

    // If all dead, next gen
    if (!anyAlive) {
      this.nextGeneration();
    }
  }

  jump(bird) {
    bird.velocity = LIFT;
  }

  checkPipeCollision(bird, pipe) {
    if (!pipe) return false;
    // Bird is essentially a circle or box at (50, bird.y) size ~20
    const birdX = 50;
    const birdSize = 24;
    const currentGap = pipe.gapSize || PIPE_GAP;

    // Inside pipe horizontal area
    if (birdX + birdSize > pipe.x && birdX < pipe.x + PIPE_WIDTH) {
      // Hit top pipe or hit bottom pipe
      if (bird.y < pipe.topHeight || bird.y + birdSize > pipe.topHeight + currentGap) {
        return true;
      }
    }
    return false;
  }

  nextGeneration() {
    // 1. Calculate Fitness
    // Normalize fitness to 0-1 range to select parents
    let sumFitness = 0;
    this.birds.forEach(b => sumFitness += b.entity.fitness);

    // Sort by fitness descending
    const sortedBirds = [...this.birds].sort((a, b) => b.entity.fitness - a.entity.fitness);

    const newBirds = [];

    // 2. Elitism - Keep the best one unchanged
    const champion = sortedBirds[0];
    const bestNet = champion.net.copy();
    newBirds.push({
      entity: { ...champion.entity, id: 'Champ', fitness: 0, score: 0, alive: true, y: GAME_HEIGHT/2, velocity: 0 },
      net: bestNet
    });

    // 3. Generate rest based on fitness probability
    while (newBirds.length < POPULATION_SIZE) {
      const parent = this.pickOne(sortedBirds, sumFitness);
      const childNet = parent.net.copy();
      childNet.mutate();
      newBirds.push({
        entity: {
          id: Math.random().toString(36).substr(2, 9),
          y: GAME_HEIGHT/2,
          velocity: 0,
          alive: true,
          fitness: 0,
          score: 0,
          brain: null
        },
        net: childNet
      });
    }

    this.birds = newBirds;
    this.generation++;
    this.resetGame();
  }

  pickOne(sortedList, sumFitness) {
    let index = 0;
    let r = Math.random() * sumFitness;
    while (r > 0 && index < sortedList.length) {
      r -= sortedList[index].entity.fitness;
      index++;
    }
    index--;
    if (index < 0) index = 0;
    return sortedList[index];
  }

  getBestBird() {
    // Return first alive bird, or just the first bird if all dead
    return this.birds.find(b => b.entity.alive) || this.birds[0];
  }
}