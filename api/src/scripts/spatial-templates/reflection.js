function generate(count, difficulty) {
  const questions = [];
  const mapElo = { 1: 800, 2: 900, 3: 1000, 4: 1100, 5: 1200 };
  const elo = mapElo[difficulty] || 1000;

  for (let i = 0; i < count; i++) {
    const svgMain = `<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 80 L 80 80 L 50 20 Z" fill="#f59e0b" />
      <line x1="100" y1="10" x2="100" y2="90" stroke="black" stroke-width="2" stroke-dasharray="5,5" />
      <text x="110" y="50" font-family="Arial" font-size="20">?</text>
    </svg>`;

    const svgCorrect = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 80 L 80 80 L 50 20 Z" fill="#f59e0b" transform="scale(-1, 1) translate(-100, 0)" />
    </svg>`;

    const svgWrong1 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 80 L 80 80 L 50 20 Z" fill="#f59e0b" transform="rotate(180, 50, 50)" />
    </svg>`;
    
    const svgWrong2 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 80 L 80 80 L 50 20 Z" fill="#ef4444" />
    </svg>`;
    
    const svgWrong3 = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 80 L 80 80 L 50 20 Z" fill="#f59e0b" transform="scale(1, -1) translate(0, -100)" />
    </svg>`;

    const options = [svgCorrect, svgWrong1, svgWrong2, svgWrong3];
    const correctIndex = 0;

    questions.push({
      text: "Which of the following is the correct mirror reflection across the dotted line?",
      svgMain,
      svgOptions: options,
      correctIndex,
      difficulty: elo,
      explanation: "A mirror reflection across a vertical line flips the image horizontally."
    });
  }
  return questions;
}

module.exports = { generate };
