const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const args = require('util').parseArgs({
  options: {
    count: { type: 'string', default: '100' },
    output: { type: 'string', default: 'generated' },
    'images-dir': { type: 'string', default: 'public/spatial' }
  }
}).values;

const count = parseInt(args.count, 10);
const outputDir = path.resolve(__dirname, '../../..', args.output);
const imagesDir = path.resolve(__dirname, '../../..', args['images-dir']);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const templates = [
  require('./spatial-templates/rotation'),
  require('./spatial-templates/reflection'),
  require('./spatial-templates/pattern')
];

async function generateSpatial() {
  console.log(`Generating ${count} spatial questions...`);
  const finalQuestions = [];

  for (let i = 0; i < count; i++) {
    // Distribute 40% rotation, 30% reflection, 30% pattern
    let tplIndex = 0;
    const r = Math.random();
    if (r > 0.4 && r <= 0.7) tplIndex = 1;
    else if (r > 0.7) tplIndex = 2;

    const template = templates[tplIndex];
    // Random difficulty 1-5 (roughly bell curve)
    let difficulty = 3;
    const diffR = Math.random();
    if (diffR < 0.15) difficulty = 1;
    else if (diffR < 0.40) difficulty = 2;
    else if (diffR < 0.70) difficulty = 3;
    else if (diffR < 0.90) difficulty = 4;
    else difficulty = 5;

    const generated = template.generate(1, difficulty)[0];
    
    // Save images
    const mainImagePath = `spatial_q${i}_${Date.now()}.png`;
    const fullMainPath = path.join(imagesDir, mainImagePath);
    await sharp(Buffer.from(generated.svgMain)).png().toFile(fullMainPath);

    const optionPaths = [];
    for (let j = 0; j < generated.svgOptions.length; j++) {
      const optPath = `spatial_q${i}_opt${j}_${Date.now()}.png`;
      const fullOptPath = path.join(imagesDir, optPath);
      await sharp(Buffer.from(generated.svgOptions[j])).png().toFile(fullOptPath);
      optionPaths.push(`/assets/spatial/${optPath}`);
    }

    finalQuestions.push({
      text: generated.text,
      type: 'spatial',
      skill: 'spatial',
      difficulty: generated.difficulty,
      explanation: generated.explanation,
      active: true,
      imagePath: `/assets/spatial/${mainImagePath}`,
      imageOptions: optionPaths,
      correctImageIndex: generated.correctIndex
    });
  }

  const timestamp = Date.now();
  const jsonPath = path.join(outputDir, `spatial_bellcurve_${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(finalQuestions, null, 2));
  console.log(`Successfully generated ${count} spatial questions and saved images to ${imagesDir}`);
  console.log(`JSON written to ${jsonPath}`);
}

generateSpatial().catch(err => {
  console.error('Error generating spatial questions:', err);
});
