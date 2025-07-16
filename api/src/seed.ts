import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import pdf from 'pdf-parse';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting existing data...');
  await prisma.wrongWord.deleteMany();
  await prisma.word.deleteMany();
  await prisma.wordGroup.deleteMany();
  console.log('Existing data deleted.');

  const pdfPath = './gregmatlist32groups.pdf'; // Path to your PDF file
  const dataBuffer = fs.readFileSync(pdfPath);

  const data = await pdf(dataBuffer);
  const text = data.text;

  const lines = text.split('\n');

  let currentGroup: { name: string, words: { text: string, meaning: string }[] } | null = null;
  const allGroups: { name: string, words: { text: string, meaning: string }[] }[] = [];
  let lastWordMeaning = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for group header (e.g., "group 1")
    const groupMatch = trimmedLine.match(/^group\s+(\d+)$/);
    if (groupMatch) {
      if (currentGroup) {
        allGroups.push(currentGroup);
      }
      currentGroup = { name: `Group ${groupMatch[1]}`, words: [] };
      console.log(`Found group: ${currentGroup.name}`);
      continue;
    }

    // If we are in a group, try to parse word and meaning
    if (currentGroup) {
      const wordMeaningMatch = trimmedLine.match(/^\d+\.\s*([^\-]+?)\s*-\s*([\s\S]*)/);
      if (wordMeaningMatch && wordMeaningMatch[1] && wordMeaningMatch[2]) {
        const wordText = wordMeaningMatch[1].replace(/\s+/g, ' ').trim();
        const meaningText = wordMeaningMatch[2].replace(/\s+/g, ' ').trim();

        if (wordText.length > 0 && meaningText.length > 0) {
          currentGroup.words.push({
            text: wordText,
            meaning: meaningText,
          });
          lastWordMeaning = meaningText; // Store the last meaning
        }
      } else if (trimmedLine.length > 0 && currentGroup.words.length > 0) {
        // This line is likely a continuation of the previous meaning
        const lastWord = currentGroup.words[currentGroup.words.length - 1];
        lastWord.meaning += ` ${trimmedLine}`;
        lastWordMeaning = lastWord.meaning; // Update the last meaning
      }
    }
  }

  // Add the last group if it exists
  if (currentGroup) {
    allGroups.push(currentGroup);
  }

  console.log(`Found ${allGroups.length} groups in total.`);

  for (const group of allGroups) {
    console.log(`Seeding ${group.name} with ${group.words.length} words.`);
    if (group.words.length > 0) {
      const createdGroup = await prisma.wordGroup.create({
        data: {
          name: group.name,
        },
      });

      for (const word of group.words) {
        await prisma.word.create({
          data: {
            text: word.text,
            meaning: word.meaning,
            groupId: createdGroup.id,
          },
        });
      }
      console.log(`Successfully seeded ${createdGroup.name} with ${group.words.length} words.`);
    } else {
      console.warn(`Skipping ${group.name} as no words were extracted.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
