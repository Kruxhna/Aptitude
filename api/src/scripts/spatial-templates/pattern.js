function generate(count, difficulty) {
  const questions = [];
  const mapElo = { 1: 800, 2: 900, 3: 1000, 4: 1100, 5: 1200 };
  const elo = mapElo[difficulty] || 1000;

  for (let i = 0; i < count; i++) {
    const svgMain = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="200" height="200" fill="none" stroke="black" stroke-width="2" />
      <line x1="100" y1="0" x2="100" y2="200" stroke="black" stroke-width="2" />
      <line x1="0" y1="100" x2="200" y2="100" stroke="black" stroke-width="2" />
      
      <circle cx="50" cy="50" r="20" fill="#3b82f6" />
      <circle cx="150" cy="50" r="30" fill="#3b82f6" />
      <circle cx="50" cy="150" r="40" fill="#3b82f6" />
      
      <text x="140" y="160" font-family="Arial" font-size="40">?</text>
    </svg>`;

    const svgCorrect = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#3b82f6" />
    </svg>`;

    const svgWrong1 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="10" fill="#3b82f6" />
    </svg>`;
    
    const svgWrong2 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="#3b82f6" />
    </svg>`;
    
    const svgWrong3 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#ef4444" />
    </svg>`;

    const options = [svgWrong1, svgWrong2, svgCorrect, svgWrong3];
    const correctIndex = 2;

    questions.push({
      text: "Which shape completes the grid pattern?",
      svgMain,
      svgOptions: options,
      correctIndex,
      difficulty: elo,
      explanation: "The radius of the circle increases by a fixed amount in each quadrant."
    });
  }
  return questions;
}

module.exports = { generate };
