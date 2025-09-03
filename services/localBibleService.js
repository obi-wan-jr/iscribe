const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

class LocalBibleService {
    constructor() {
        this.baseUrl = 'http://localhost:3005/api';
        this.bibleDataDir = '/home/inggo/dscribe/data/bible/web';
    }

    /**
     * Get all Bible books with chapter counts
     */
    async getBibleBooks() {
        try {
            const response = await axios.get(`${this.baseUrl}/books`);
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching Bible books:', error.message);
            return [];
        }
    }

    /**
     * Get supported Bible versions (this API only has one version - WEB)
     */
    getSupportedVersions() {
        return [
            { id: 'WEB', name: 'World English Bible', description: 'Complete Bible text' }
        ];
    }

    /**
     * Validate Bible reference
     */
    async validateReference(book, chapter) {
        try {
            const books = await this.getBibleBooks();
            const bookInfo = books.find(b => b.id === book.toUpperCase());
            
            if (!bookInfo) {
                return false;
            }
            
            return chapter >= 1 && chapter <= bookInfo.chapters;
        } catch (error) {
            console.error('Error validating reference:', error.message);
            return false;
        }
    }

    /**
     * Fetch complete chapter text from local Bible API
     */
    async fetchChapter(book, chapter, version = 'WEB') {
        try {
            console.log(`Fetching ${book} ${chapter} from local Bible API...`);
            
            // Use the local Bible API endpoint
            const response = await axios.get(`${this.baseUrl}/books/${book.toUpperCase()}/chapters/${chapter}`);
            
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch chapter');
            }

            const chapterData = response.data.data;
            const verses = chapterData.verses || [];
            
            // Combine all verse text into a single chapter text
            const chapterText = verses.map(verse => verse.text).join(' ');
            
            // Calculate metadata
            const metadata = {
                book: book,
                chapter: chapter,
                version: version,
                verseCount: verses.length,
                sentenceCount: this.countSentences(chapterText),
                characterCount: chapterText.length,
                reference: chapterData.reference
            };

            console.log(`Successfully fetched ${book} ${chapter}: ${verses.length} verses, ${metadata.sentenceCount} sentences`);

            return {
                success: true,
                text: chapterText,
                metadata: metadata,
                verses: verses
            };

        } catch (error) {
            console.error(`Error fetching ${book} ${chapter}:`, error.message);
            
            // Fallback: try direct file access if API fails
            try {
                return await this.fetchChapterFromFile(book, chapter, version);
            } catch (fallbackError) {
                console.error('Fallback file access also failed:', fallbackError.message);
                return {
                    success: false,
                    error: `Failed to fetch chapter: ${error.message}`,
                    metadata: { book, chapter, version }
                };
            }
        }
    }

    /**
     * Fallback method: fetch chapter directly from JSON file
     */
    async fetchChapterFromFile(book, chapter, version = 'WEB') {
        try {
            // Convert book ID to filename format (e.g., GEN -> genesis, 1CO -> 1-corinthians)
            const bookFilename = this.convertBookIdToFilename(book);
            const filename = `${bookFilename}-${chapter}.json`;
            const filePath = path.join(this.bibleDataDir, filename);
            
            console.log(`Attempting direct file access: ${filePath}`);
            
            if (!(await fs.pathExists(filePath))) {
                throw new Error(`Chapter file not found: ${filename}`);
            }
            
            const fileContent = await fs.readFile(filePath, 'utf8');
            const chapterData = JSON.parse(fileContent);
            
            const verses = chapterData.verses || [];
            const chapterText = verses.map(verse => verse.text).join(' ');
            
            const metadata = {
                book: book,
                chapter: chapter,
                version: version,
                verseCount: verses.length,
                sentenceCount: this.countSentences(chapterText),
                characterCount: chapterText.length,
                reference: chapterData.reference
            };

            console.log(`Successfully fetched ${book} ${chapter} from file: ${verses.length} verses`);

            return {
                success: true,
                text: chapterText,
                metadata: metadata,
                verses: verses
            };

        } catch (error) {
            throw new Error(`File access failed: ${error.message}`);
        }
    }

    /**
     * Convert book ID to filename format
     */
    convertBookIdToFilename(bookId) {
        const bookMap = {
            'GEN': 'genesis', 'EXO': 'exodus', 'LEV': 'leviticus', 'NUM': 'numbers', 'DEU': 'deuteronomy',
            'JOS': 'joshua', 'JDG': 'judges', 'RUT': 'ruth', '1SA': '1-samuel', '2SA': '2-samuel',
            '1KI': '1-kings', '2KI': '2-kings', '1CH': '1-chronicles', '2CH': '2-chronicles',
            'EZR': 'ezra', 'NEH': 'nehemiah', 'EST': 'esther', 'JOB': 'job', 'PSA': 'psalms',
            'PRO': 'proverbs', 'ECC': 'ecclesiastes', 'SNG': 'song-of-solomon', 'ISA': 'isaiah',
            'JER': 'jeremiah', 'LAM': 'lamentations', 'EZK': 'ezekiel', 'DAN': 'daniel',
            'HOS': 'hosea', 'JOL': 'joel', 'AMO': 'amos', 'OBA': 'obadiah', 'JON': 'jonah',
            'MIC': 'micah', 'NAH': 'nahum', 'HAB': 'habakkuk', 'ZEP': 'zephaniah',
            'HAG': 'haggai', 'ZEC': 'zechariah', 'MAL': 'malachi', 'MAT': 'matthew',
            'MRK': 'mark', 'LUK': 'luke', 'JHN': 'john', 'ACT': 'acts', 'ROM': 'romans',
            '1CO': '1-corinthians', '2CO': '2-corinthians', 'GAL': 'galatians', 'EPH': 'ephesians',
            'PHP': 'philippians', 'COL': 'colossians', '1TH': '1-thessalonians', '2TH': '2-thessalonians',
            '1TI': '1-timothy', '2TI': '2-timothy', 'TIT': 'titus', 'PHM': 'philemon',
            'HEB': 'hebrews', 'JAS': 'james', '1PE': '1-peter', '2PE': '2-peter',
            '1JN': '1-john', '2JN': '2-john', '3JN': '3-john', 'JUD': 'jude', 'REV': 'revelation'
        };
        
        return bookMap[bookId.toUpperCase()] || bookId.toLowerCase();
    }

    /**
     * Count sentences in text (simple period-based counting)
     */
    countSentences(text) {
        if (!text) return 0;
        // Split by periods, exclamation marks, and question marks
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.length;
    }

    /**
     * Get chapter count for a book
     */
    async getChapterCount(book) {
        try {
            const books = await this.getBibleBooks();
            const bookInfo = books.find(b => b.id === book.toUpperCase());
            return bookInfo ? bookInfo.chapters : 0;
        } catch (error) {
            console.error('Error getting chapter count:', error.message);
            return 0;
        }
    }

    /**
     * Test API connectivity
     */
    async testConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            return {
                success: true,
                status: response.data.status,
                message: 'Local Bible API is accessible'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Local Bible API is not accessible'
            };
        }
    }
}

module.exports = LocalBibleService;
