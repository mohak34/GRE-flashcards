"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Deleting existing data...');
        yield prisma.wrongWord.deleteMany();
        yield prisma.word.deleteMany();
        yield prisma.wordGroup.deleteMany();
        console.log('Existing data deleted.');
        const pdfPath = './gregmatlist32groups.pdf'; // Path to your PDF file
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = yield (0, pdf_parse_1.default)(dataBuffer);
        const text = data.text;
        const lines = text.split('\n');
        let currentGroup = null;
        const allGroups = [];
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
                }
                else if (trimmedLine.length > 0 && currentGroup.words.length > 0) {
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
                const createdGroup = yield prisma.wordGroup.create({
                    data: {
                        name: group.name,
                    },
                });
                for (const word of group.words) {
                    yield prisma.word.create({
                        data: {
                            text: word.text,
                            meaning: word.meaning,
                            groupId: createdGroup.id,
                        },
                    });
                }
                console.log(`Successfully seeded ${createdGroup.name} with ${group.words.length} words.`);
            }
            else {
                console.warn(`Skipping ${group.name} as no words were extracted.`);
            }
        }
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
