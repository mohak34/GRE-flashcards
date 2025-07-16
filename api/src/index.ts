import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Flashcards API is running!');
});

// Get all word groups
app.get('/groups', async (req, res) => {
  const groups = await prisma.wordGroup.findMany({
    include: {
      _count: {
        select: { words: true },
      },
    },
  });
  res.json(groups);
});

// Get all words for a specific group
app.get('/groups/:id/words', async (req, res) => {
  const { id } = req.params;
  const words = await prisma.word.findMany({
    where: { groupId: parseInt(id) },
  });
  res.json(words);
});

// Add a word to the wrong words list
app.post('/words/:id/mark-wrong', async (req, res) => {
  const { id } = req.params;
  const wordId = parseInt(id);

  const existingWrongWord = await prisma.wrongWord.findUnique({
    where: { wordId },
  });

  if (existingWrongWord) {
    return res.status(409).json({ message: 'Word is already in the wrong list.' });
  }

  const wrongWord = await prisma.wrongWord.create({
    data: {
      wordId,
    },
  });
  res.json(wrongWord);
});

// Get all wrong words
app.get('/wrong-words', async (req, res) => {
  const wrongWords = await prisma.wrongWord.findMany({
    include: {
      word: {
        include: {
          group: true,
        },
      },
    },
  });
  res.json(wrongWords.map(ww => ww.word));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
