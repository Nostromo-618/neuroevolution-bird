# NeuroEvolution Bird

An educational project demonstrating how a **Neural Network** combined with a **Genetic Algorithm** can learn to play Flappy Bird from scratch. 

Built with pure **JavaScript**, **HTML**, and **CSS**. No external libraries or frameworks.

## 🧠 How it Works

### The Brain (Neural Network)
Each bird has a tiny brain (Neural Network) consisting of:
- **Input Layer (4 nodes)**: 
  - Y Position
  - Velocity
  - Distance to next pipe
  - Height of the pipe gap
- **Hidden Layer (6 nodes)**: Processes the inputs using Tanh activation.
- **Output Layer (1 node)**: Decides whether to jump (> 0.5) or not.

### The Evolution (Genetic Algorithm)
1. **Population**: We start with 50 birds with random brains (random weights).
2. **Selection**: Birds that survive longer get a higher "fitness" score.
3. **Reproduction**: The best performing birds are selected to be parents.
4. **Mutation**: The offspring inherit the parents' brains but with slight random "mutations" to their weights. This introduces variation.
5. **Loop**: This process repeats endlessly, creating smarter birds over time.

## 🚀 Features
- **Visualized Neural Network**: See the active brain of the best bird in real-time.
- **Speed Control**: Speed up the simulation (up to 1000x) to train faster.
- **Headless Mode**: Disable rendering to train even faster.
- **Save/Load**: The best brain is automatically saved to local storage (feature in progress).

## 🛠️ Installation & Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neuroevolution-bird.git
   cd neuroevolution-bird
   ```

2. **Run locally**
   Since this is a static site, you can open `index.html` directly in your browser, or serve it with a local server for better module support:

   ```bash
   # Using Python
   python3 -m http.server

   # Using Node.js (npx)
   npx serve .
   ```

3. **Open in Browser**
   Go to `http://localhost:8000` (or whatever port your server uses).

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
