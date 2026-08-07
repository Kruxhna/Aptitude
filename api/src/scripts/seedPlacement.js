/**
 * Seed script: Insert placement questions for the onboarding diagnostic test.
 * 
 * Run: node src/scripts/seedPlacement.js
 * Requires MongoDB to be running (uses MONGO_URI from .env or defaults to docker-compose URI).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PlacementQuestion = require('../models/PlacementQuestion');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/aptitude';

const PLACEMENT_QUESTIONS = [
  {
    skill: 'verbal',
    prompt: 'Choose the word that is most nearly OPPOSITE in meaning to "Ephemeral":',
    options: ['Transient', 'Permanent', 'Fleeting', 'Momentary'],
    correctIndex: 1,
    difficulty: 5,
  },
  {
    skill: 'quantitative',
    prompt: 'A shopkeeper sells an item at 20% profit. If he had bought it for 10% less and sold it for ₹18 less, he would have gained 25%. Find the original cost price.',
    options: ['₹180', '₹200', '₹150', '₹160'],
    correctIndex: 1,
    difficulty: 5,
  },
  {
    skill: 'logical',
    prompt: 'In a row of 40 students, Ramesh is 7th from the left and Suresh is 12th from the right. How many students are between them?',
    options: ['20', '21', '22', '19'],
    correctIndex: 1,
    difficulty: 5,
  },
  {
    skill: 'spatial',
    prompt: 'A cube is painted red on all faces and then cut into 27 equal smaller cubes. How many smaller cubes have exactly two faces painted?',
    options: ['8', '12', '6', '1'],
    correctIndex: 1,
    difficulty: 5,
  },
  {
    skill: 'mixed',
    prompt: 'If 6 people can complete a project in 12 days, how many days will it take 9 people to complete the same project (assuming equal efficiency)?',
    options: ['6', '8', '9', '10'],
    correctIndex: 1,
    difficulty: 5,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing placement questions
    const deleted = await PlacementQuestion.deleteMany({ isPlacement: true });
    console.log(`  Cleared ${deleted.deletedCount} existing placement questions`);

    // Insert fresh set
    const inserted = await PlacementQuestion.insertMany(
      PLACEMENT_QUESTIONS.map(q => ({ ...q, isPlacement: true }))
    );
    console.log(`  Inserted ${inserted.length} placement questions`);

    for (const q of inserted) {
      console.log(`    [${q.skill}] ${q.prompt.substring(0, 60)}...`);
    }

    console.log('\n✓ Placement seed complete');
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
