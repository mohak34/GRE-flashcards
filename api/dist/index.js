"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Flashcards API is running!');
});
// Get all word groups
app.get('/groups', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const groups = yield prisma.wordGroup.findMany({
        include: {
            _count: {
                select: { words: true },
            },
        },
    });
    res.json(groups);
}));
// Get all words for a specific group
app.get('/groups/:id/words', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const words = yield prisma.word.findMany({
        where: { groupId: parseInt(id) },
    });
    res.json(words);
}));
// Add a word to the wrong words list
app.post('/words/:id/mark-wrong', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const wordId = parseInt(id);
    try {
        const existingWrongWord = yield prisma.wrongWord.findUnique({
            where: { wordId },
        });
        if (existingWrongWord) {
            return res.status(409).json({ message: 'Word is already in the wrong list.' });
        }
        const wrongWord = yield prisma.wrongWord.create({
            data: {
                wordId,
            },
        });
        res.json(wrongWord);
    }
    catch (error) {
        console.error('Error marking word as wrong:', error);
        // Handle race condition where word was added between check and create
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002') {
            return res.status(409).json({ message: 'Word is already in the wrong list.' });
        }
        res.status(500).json({ message: 'Failed to mark word as wrong' });
    }
}));
// Get all wrong words
app.get('/wrong-words', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const wrongWords = yield prisma.wrongWord.findMany({
        include: {
            word: {
                include: {
                    group: true,
                },
            },
        },
    });
    res.json(wrongWords.map(ww => ww.word));
}));
// Remove a word from the wrong words list
app.delete('/wrong-words/:wordId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { wordId } = req.params;
    try {
        yield prisma.wrongWord.delete({
            where: { wordId: parseInt(wordId) },
        });
        res.json({ message: 'Word removed from wrong list successfully' });
    }
    catch (error) {
        res.status(404).json({ message: 'Word not found in wrong list' });
    }
}));
// Remove all words from the wrong words list
app.delete('/wrong-words', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.wrongWord.deleteMany({});
        res.json({ message: 'All words removed from wrong list successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to clear wrong words list' });
    }
}));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
