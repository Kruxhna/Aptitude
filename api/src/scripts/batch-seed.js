require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Question } = require('../models');

const args = require('util').parseArgs({
  options: {
    input: { type: 'string', required: true },
    clear: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false }
  }
}).values;

const inputDir = path.resolve(__dirname, '../../..', args.input);
const uri = process.env.LOCAL_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/aptitude';

async function seed() {
  try {
    if (!args['dry-run']) {
      await mongoose.connect(uri);
      console.log(`Connected to MongoDB at ${uri}`);
    } else {
      console.log('DRY RUN: Database will not be modified.');
    }

    if (args.clear && !args['dry-run']) {
      await Question.deleteMany({});
      console.log('Cleared existing questions from DB.');
    }

    const files = fs.readdirSync(inputDir).filter(f => 
      (f.startsWith('validated_') || f.startsWith('spatial_')) && f.endsWith('.json')
    );

    let totalRead = 0;
    let totalInserted = 0;
    let totalSkipped = 0;
    const stats = { verbal: 0, quantitative: 0, logical: 0, spatial: 0 };

    for (const file of files) {
      const filePath = path.join(inputDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const questions = JSON.parse(content);
      
      totalRead += questions.length;
      
      const toInsert = [];

      for (const q of questions) {
        // Hash for deduplication
        const hashStr = `${q.skill}_${q.type}_${q.text}`;
        const hash = crypto.createHash('md5').update(hashStr).digest('hex');
        q.contentHash = hash;

        if (!args['dry-run']) {
          const exists = await Question.findOne({ contentHash: hash });
          if (exists) {
            totalSkipped++;
            continue;
          }
        }
        toInsert.push(q);
      }

      if (!args['dry-run'] && toInsert.length > 0) {
        try {
          const result = await Question.insertMany(toInsert, { ordered: false });
          totalInserted += result.length;
        } catch (bulkErr) {
          // ordered:false — partial inserts are fine; count what got through
          if (bulkErr.insertedDocs) {
            totalInserted += bulkErr.insertedDocs.length;
            totalSkipped += toInsert.length - bulkErr.insertedDocs.length;
          }
        }
      } else if (args['dry-run']) {
        totalInserted += toInsert.length;
      }
      toInsert.forEach(q => {
        if (stats[q.skill] !== undefined) {
          stats[q.skill]++;
        }
      });
    }

    console.log(`\nBatch Seeding Complete!`);
    console.log(`Total questions read: ${totalRead}`);
    console.log(`Total skipped (duplicates): ${totalSkipped}`);
    console.log(`Total new questions inserted: ${totalInserted}`);
    console.log(`Breakdown:`);
    console.log(`  Verbal:       ${stats.verbal}`);
    console.log(`  Quantitative: ${stats.quantitative}`);
    console.log(`  Logical:      ${stats.logical}`);
    console.log(`  Spatial:      ${stats.spatial}`);

    if (!args['dry-run']) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error in batch seeding:', error);
    process.exit(1);
  }
}

seed();
