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
            // Try API first, fallback to direct file access
            try {
                const response = await axios.get(`${this.baseUrl}/books`);
                if (response.data.success) {
                    return response.data.data || [];
                }
            } catch (error) {
                console.log('Bible API failed, using direct file access');
            }

            // Fallback: Read books directly from file system
            return this.getBibleBooksFromFiles();
        } catch (error) {
            console.error('Error fetching Bible books:', error.message);
            return [];
        }
    }

    /**
     * Get Bible books directly from file system
     */
    getBibleBooksFromFiles() {
        try {
            const bookMapping = {
                'GEN': { name: 'Genesis', chapters: 50 },
                'EXO': { name: 'Exodus', chapters: 40 },
                'LEV': { name: 'Leviticus', chapters: 27 },
                'NUM': { name: 'Numbers', chapters: 36 },
                'DEU': { name: 'Deuteronomy', chapters: 34 },
                'JOS': { name: 'Joshua', chapters: 24 },
                'JDG': { name: 'Judges', chapters: 21 },
                'RUT': { name: 'Ruth', chapters: 4 },
                '1SA': { name: '1 Samuel', chapters: 31 },
                '2SA': { name: '2 Samuel', chapters: 24 },
                '1KI': { name: '1 Kings', chapters: 22 },
                '2KI': { name: '2 Kings', chapters: 25 },
                '1CH': { name: '1 Chronicles', chapters: 29 },
                '2CH': { name: '2 Chronicles', chapters: 36 },
                'EZR': { name: 'Ezra', chapters: 10 },
                'NEH': { name: 'Nehemiah', chapters: 13 },
                'EST': { name: 'Esther', chapters: 10 },
                'JOB': { name: 'Job', chapters: 42 },
                'PSA': { name: 'Psalms', chapters: 150 },
                'PRO': { name: 'Proverbs', chapters: 31 },
                'ECC': { name: 'Ecclesiastes', chapters: 12 },
                'SNG': { name: 'Song of Solomon', chapters: 8 },
                'ISA': { name: 'Isaiah', chapters: 66 },
                'JER': { name: 'Jeremiah', chapters: 52 },
                'LAM': { name: 'Lamentations', chapters: 5 },
                'EZK': { name: 'Ezekiel', chapters: 48 },
                'DAN': { name: 'Daniel', chapters: 12 },
                'HOS': { name: 'Hosea', chapters: 14 },
                'JOL': { name: 'Joel', chapters: 3 },
                'AMO': { name: 'Amos', chapters: 9 },
                'OBA': { name: 'Obadiah', chapters: 1 },
                'JON': { name: 'Jonah', chapters: 4 },
                'MIC': { name: 'Micah', chapters: 7 },
                'NAH': { name: 'Nahum', chapters: 3 },
                'HAB': { name: 'Habakkuk', chapters: 3 },
                'ZEP': { name: 'Zephaniah', chapters: 3 },
                'HAG': { name: 'Haggai', chapters: 2 },
                'ZEC': { name: 'Zechariah', chapters: 14 },
                'MAL': { name: 'Malachi', chapters: 4 },
                'MAT': { name: 'Matthew', chapters: 28 },
                'MRK': { name: 'Mark', chapters: 16 },
                'LUK': { name: 'Luke', chapters: 24 },
                'JHN': { name: 'John', chapters: 21 },
                'ACT': { name: 'Acts', chapters: 28 },
                'ROM': { name: 'Romans', chapters: 16 },
                '1CO': { name: '1 Corinthians', chapters: 16 },
                '2CO': { name: '2 Corinthians', chapters: 13 },
                'GAL': { name: 'Galatians', chapters: 6 },
                'EPH': { name: 'Ephesians', chapters: 6 },
                'PHP': { name: 'Philippians', chapters: 4 },
                'COL': { name: 'Colossians', chapters: 4 },
                '1TH': { name: '1 Thessalonians', chapters: 5 },
                '2TH': { name: '2 Thessalonians', chapters: 3 },
                '1TI': { name: '1 Timothy', chapters: 6 },
                '2TI': { name: '2 Timothy', chapters: 4 },
                'TIT': { name: 'Titus', chapters: 3 },
                'PHM': { name: 'Philemon', chapters: 1 },
                'HEB': { name: 'Hebrews', chapters: 13 },
                'JAS': { name: 'James', chapters: 5 },
                '1PE': { name: '1 Peter', chapters: 5 },
                '2PE': { name: '2 Peter', chapters: 3 },
                '1JN': { name: '1 John', chapters: 5 },
                '2JN': { name: '2 John', chapters: 1 },
                '3JN': { name: '3 John', chapters: 1 },
                'JUD': { name: 'Jude', chapters: 1 },
                'REV': { name: 'Revelation', chapters: 22 }
            };

            return Object.entries(bookMapping).map(([id, book]) => ({
                id,
                name: book.name,
                chapters: book.chapters
            }));
        } catch (error) {
            console.error('Error reading Bible books from files:', error.message);
            return [];
        }
    }

    /**
     * Get supported Bible versions (this API only has one version - WEB)
     */
    getSupportedVersions() {
        return [
            { id: 'WEB', name: 'World English Bible', description: 'Public domain English translation' }
        ];
    }

    /**
     * Validate Bible reference
     */
    validateReference(book, chapter) {
        try {
            const books = this.getBibleBooksFromFiles();
            const bookData = books.find(b => b.id === book.toUpperCase());
            
            if (!bookData) {
                return false;
            }
            
            const chapterNum = parseInt(chapter);
            return chapterNum >= 1 && chapterNum <= bookData.chapters;
        } catch (error) {
            console.error('Error validating Bible reference:', error.message);
            return false;
        }
    }

    /**
     * Fetch chapter text directly from JSON file
     */
    async fetchChapter(book, chapter, version = 'WEB') {
        try {
            // Try API first, fallback to direct file access
            try {
                const response = await axios.get(`${this.baseUrl}/books/${book}/chapters/${chapter}`);
                if (response.data.success) {
                    return this.processApiResponse(response.data);
                }
            } catch (error) {
                console.log(`Bible API failed for ${book} ${chapter}, using direct file access`);
            }

            // Fallback: Read chapter directly from JSON file
            return await this.fetchChapterFromFile(book, chapter, version);
        } catch (error) {
            console.error(`Error fetching chapter ${book} ${chapter}:`, error.message);
            return {
                success: false,
                error: `Failed to fetch chapter: ${error.message}`
            };
        }
    }

    /**
     * Fetch chapter directly from JSON file
     */
    async fetchChapterFromFile(book, chapter, version) {
        try {
            // Get book name from mapping
            const books = this.getBibleBooksFromFiles();
            const bookData = books.find(b => b.id === book.toUpperCase());
            
            if (!bookData) {
                return {
                    success: false,
                    error: `Book not found: ${book}`
                };
            }

            // Construct filename (e.g., genesis-1.json)
            const bookName = bookData.name.toLowerCase().replace(/\s+/g, '-');
            const filename = `${bookName}-${chapter}.json`;
            const filePath = path.join(this.bibleDataDir, filename);

            // Check if file exists
            if (!(await fs.pathExists(filePath))) {
                return {
                    success: false,
                    error: `Chapter file not found: ${filename}`
                };
            }

            // Read and parse the JSON file
            const fileContent = await fs.readFile(filePath, 'utf8');
            const chapterData = JSON.parse(fileContent);

            // Extract text and metadata
            const text = this.extractChapterText(chapterData);
            const metadata = this.extractChapterMetadata(chapterData);

            return {
                success: true,
                text: text,
                metadata: metadata,
                source: 'direct_file',
                filePath: filePath
            };

        } catch (error) {
            console.error(`Error reading chapter file for ${book} ${chapter}:`, error.message);
            return {
                success: false,
                error: `Failed to read chapter file: ${error.message}`
            };
        }
    }

    /**
     * Extract chapter text from JSON data
     */
    extractChapterText(chapterData) {
        try {
            if (!chapterData.verses || !Array.isArray(chapterData.verses)) {
                throw new Error('Invalid chapter data format');
            }

            // Combine all verse texts into a single string
            const text = chapterData.verses
                .map(verse => verse.text)
                .join(' ');

            return text;
        } catch (error) {
            console.error('Error extracting chapter text:', error.message);
            throw new Error('Failed to extract chapter text');
        }
    }

    /**
     * Extract chapter metadata from JSON data
     */
    extractChapterMetadata(chapterData) {
        try {
            const verseCount = chapterData.verses ? chapterData.verses.length : 0;
            const text = this.extractChapterText(chapterData);
            
            // Count sentences (rough approximation)
            const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

            return {
                reference: chapterData.reference || 'Unknown',
                verseCount: verseCount,
                sentenceCount: sentenceCount,
                characterCount: text.length,
                wordCount: text.split(/\s+/).filter(w => w.trim().length > 0).length
            };
        } catch (error) {
            console.error('Error extracting chapter metadata:', error.message);
            return {
                reference: 'Unknown',
                verseCount: 0,
                sentenceCount: 0,
                characterCount: 0,
                wordCount: 0
            };
        }
    }

    /**
     * Process API response (if API works)
     */
    processApiResponse(apiData) {
        try {
            if (!apiData.data || !apiData.data.verses) {
                throw new Error('Invalid API response format');
            }

            const text = this.extractChapterText(apiData.data);
            const metadata = this.extractChapterMetadata(apiData.data);

            return {
                success: true,
                text: text,
                metadata: metadata,
                source: 'api',
                apiData: apiData.data
            };
        } catch (error) {
            console.error('Error processing API response:', error.message);
            throw new Error('Failed to process API response');
        }
    }

    /**
     * Search Bible text (not implemented for direct file access)
     */
    async searchBibleText(searchTerm, book = null, chapter = null) {
        // This would require scanning all files - not implemented for performance
        return {
            success: false,
            error: 'Search not implemented for direct file access'
        };
    }
}

module.exports = LocalBibleService;
