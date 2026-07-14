require('dotenv').config();
const mongoose = require('mongoose');
const { Question, User } = require('../models');
const { MOCK_USER_ID } = require('../middleware/mockUser');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/aptitude';

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB at ${uri}`);

    // Clear existing data
    await User.deleteMany({});
    await Question.deleteMany({});
    console.log('Cleared existing data.');

    // Seed User
    const user = new User({
      _id: new mongoose.Types.ObjectId(MOCK_USER_ID),
      name: 'Test User',
      email: 'test@example.com',
      ratings: {
        verbal: 1000,
        quantitative: 1000,
        logical: 1000,
        spatial: 1000,
      }
    });
    await user.save();
    console.log(`Created mock user with ID: ${MOCK_USER_ID}`);

    // Seed Questions (5 of each skill)
    const questions = [];

    // Verbal (MCQ)
    for (let i = 1; i <= 5; i++) {
      questions.push({
        text: `Verbal Question ${i}: What is the synonym of 'Aptitude'?`,
        type: 'mcq',
        skill: 'verbal',
        difficulty: 1000,
        explanation: 'Aptitude means a natural ability to do something, similar to talent.',
        active: true,
        options: ['Inability', 'Talent', 'Clumsiness', 'Apathy'],
        correctOptionIndex: 1,
      });
    }

    // Quantitative (Numerical)
    for (let i = 1; i <= 5; i++) {
      questions.push({
        text: `Quantitative Question ${i}: If 2x + 5 = 15, what is x?`,
        type: 'numerical',
        skill: 'quantitative',
        difficulty: 1000,
        explanation: '2x = 10 -> x = 5.',
        active: true,
        correctAnswer: 5,
        tolerance: 0,
      });
    }

    // Logical (MCQ)
    for (let i = 1; i <= 5; i++) {
      questions.push({
        text: `Logical Question ${i}: If all bloops are razzies and all razzies are lazzies, are all bloops lazzies?`,
        type: 'mcq',
        skill: 'logical',
        difficulty: 1000,
        explanation: 'By transitive property, yes.',
        active: true,
        options: ['Yes', 'No', 'Cannot be determined', 'Sometimes'],
        correctOptionIndex: 0,
      });
    }

    // Spatial (Spatial / Image)
    for (let i = 1; i <= 5; i++) {
      questions.push({
        text: `Spatial Question ${i}: Which figure completes the series? (Placeholder)`,
        type: 'spatial',
        skill: 'spatial',
        difficulty: 1000,
        explanation: 'Follow the pattern of rotation.',
        active: true,
        imagePath: `/assets/spatial/q${i}.png`,
        imageOptions: [
          `/assets/spatial/q${i}_opt1.png`,
          `/assets/spatial/q${i}_opt2.png`,
          `/assets/spatial/q${i}_opt3.png`,
          `/assets/spatial/q${i}_opt4.png`,
        ],
        correctImageIndex: 0,
      });
    }

    await Question.insertMany(questions);
    console.log(`Inserted ${questions.length} questions.`);

    console.log('Seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
