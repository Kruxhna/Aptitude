function generate(count, difficulty) {
  const questions = [];
  const mapElo = { 1: 800, 2: 900, 3: 1000, 4: 1100, 5: 1200 };
  const elo = mapElo[difficulty] || 1000;

  for (let i = 0; i < count; i++) {
    const angle = 90; // Fixed 90 degree rotation for simplicity
    
    // Main image: sequence of 3 rotations
    const svgMain = `<svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="60" height="60" fill="#3b82f6" />
      <rect x="120" y="20" width="60" height="60" fill="#3b82f6" transform="rotate(90, 150, 50)" />
      <rect x="220" y="20" width="60" height="60" fill="#3b82f6" transform="rotate(180, 250, 50)" />
    </svg>`;

    // Correct option: rotated 270 degrees
    const svgCorrect = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="60" height="60" fill="#3b82f6" transform="rotate(270, 50, 50)" />
    </svg>`;

    // Wrong options
    const svgWrong1 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="60" height="60" fill="#ef4444" transform="rotate(45, 50, 50)" />
    </svg>`;
    const svgWrong2 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="30" fill="#3b82f6" />
    </svg>`;
    const svgWrong3 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="60" height="60" fill="#10b981" />
    </svg>`;

    const options = [svgWrong1, svgCorrect, svgWrong2, svgWrong3];
    const correctIndex = 1; // Keeping static for MVP generation; in real logic, we'd shuffle.

    questions.push({
      text: "Which shape completes the rotation series?",
      svgMain,
      svgOptions: options,
      correctIndex,
      difficulty: elo,
      explanation: "The shape rotates 90 degrees clockwise in each step."
    });
  }
  return questions;
}

module.exports = { generate };
