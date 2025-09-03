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
                'GEN': { name: 'Genesis', chapters: 50, filename: 'genesis' },
                'EXO': { name: 'Exodus', chapters: 40, filename: 'exodus' },
                'LEV': { name: 'Leviticus', chapters: 27, filename: 'leviticus' },
                'NUM': { name: 'Numbers', chapters: 36, filename: 'numbers' },
                'DEU': { name: 'Deuteronomy', chapters: 34, filename: 'deuteronomy' },
                'JOS': { name: 'Joshua', chapters: 24, filename: 'joshua' },
                'JDG': { name: 'Judges', chapters: 21, filename: 'judges' },
                'RUT': { name: 'Ruth', chapters: 4, filename: 'ruth' },
                '1SA': { name: '1 Samuel', chapters: 31, filename: '1-samuel' },
                '2SA': { name: '2 Samuel', chapters: 24, filename: '2-samuel' },
                '1KI': { name: '1 Kings', chapters: 22, filename: '1-kings' },
                '2KI': { name: '2 Kings', chapters: 25, filename: '2-kings' },
                '1CH': { name: '1 Chronicles', chapters: 29, filename: '1-chronicles' },
                '2CH': { name: '2 Chronicles', chapters: 36, filename: '2-chronicles' },
                'EZR': { name: 'Ezra', chapters: 10, filename: 'ezra' },
                'NEH': { name: 'Nehemiah', chapters: 13, filename: 'nehemiah' },
                'EST': { name: 'Esther', chapters: 10, filename: 'esther' },
                'JOB': { name: 'Job', chapters: 42, filename: 'job' },
                'PSA': { name: 'Psalms', chapters: 150, filename: 'psalms' },
                'PRO': { name: 'Proverbs', chapters: 31, filename: 'proverbs' },
                'ECC': { name: 'Ecclesiastes', chapters: 12, filename: 'ecclesiastes' },
                'SNG': { name: 'Song of Solomon', chapters: 8, filename: 'song-of-solomon' },
                'ISA': { name: 'Isaiah', chapters: 66, filename: 'isaiah' },
                'JER': { name: 'Jeremiah', chapters: 52, filename: 'jeremiah' },
                'LAM': { name: 'Lamentations', chapters: 5, filename: 'lamentations' },
                'EZK': { name: 'Ezekiel', chapters: 48, filename: 'ezekiel' },
                'DAN': { name: 'Daniel', chapters: 12, filename: 'daniel' },
                'HOS': { name: 'Hosea', chapters: 14, filename: 'hosea' },
                'JOL': { name: 'Joel', chapters: 3, filename: 'joel' },
                'AMO': { name: 'Amos', chapters: 9, filename: 'amos' },
                'OBA': { name: 'Obadiah', chapters: 1, filename: 'obadiah' },
                'JON': { name: 'Jonah', chapters: 4, filename: 'jonah' },
                'MIC': { name: 'Micah', chapters: 7, filename: 'micah' },
                'NAH': { name: 'Nahum', chapters: 3, filename: 'nahum' },
                'HAB': { name: 'Habakkuk', chapters: 3, filename: 'habakkuk' },
                'ZEP': { name: 'Zephaniah', chapters: 3, filename: 'zephaniah' },
                'HAG': { name: 'Haggai', chapters: 2, filename: 'haggai' },
                'ZEC': { name: 'Zechariah', chapters: 14, filename: 'zechariah' },
                'MAL': { name: 'Malachi', chapters: 4, filename: 'malachi' },
                'MAT': { name: 'Matthew', chapters: 28, filename: 'matthew' },
                'MRK': { name: 'Mark', chapters: 16, filename: 'mark' },
                'LUK': { name: 'Luke', chapters: 24, filename: 'luke' },
                'JHN': { name: 'John', chapters: 21, filename: 'john' },
                'ACT': { name: 'Acts', chapters: 28, filename: 'acts' },
                'ROM': { name: 'Romans', chapters: 16, filename: 'romans' },
                '1CO': { name: '1 Corinthians', chapters: 16, filename: '1-corinthians' },
                '2CO': { name: '2 Corinthians', chapters: 13, filename: '2-corinthians' },
                'GAL': { name: 'Galatians', chapters: 6, filename: 'galatians' },
                'EPH': { name: 'Ephesians', chapters: 6, filename: 'ephesians' },
                'PHP': { name: 'Philippians', chapters: 4, filename: 'philippians' },
                'COL': { name: 'Colossians', chapters: 4, filename: 'colossians' },
                '1TH': { name: '1 Thessalonians', chapters: 5, filename: '1-thessalonians' },
                '2TH': { name: '2 Thessalonians', chapters: 3, filename: '2-thessalonians' },
                '1TI': { name: '1 Timothy', chapters: 6, filename: '1-timothy' },
                '2TI': { name: '2 Timothy', chapters: 4, filename: '2-timothy' },
                'TIT': { name: 'Titus', chapters: 3, filename: 'titus' },
                'PHM': { name: 'Philemon', chapters: 1, filename: 'philemon' },
                'HEB': { name: 'Hebrews', chapters: 13, filename: 'hebrews' },
                'JAS': { name: 'James', chapters: 5, filename: 'james' },
                '1PE': { name: '1 Peter', chapters: 5, filename: '1-peter' },
                '2PE': { name: '2 Peter', chapters: 3, filename: '2-peter' },
                '1JN': { name: '1 John', chapters: 5, filename: '1-john' },
                '2JN': { name: '2 John', chapters: 1, filename: '2-john' },
                '3JN': { name: '3 John', chapters: 1, filename: '3-john' },
                'JUD': { name: 'Jude', chapters: 1, filename: 'jude' },
                'REV': { name: 'Revelation', chapters: 22, filename: 'revelation' }
            };

            return Object.entries(bookMapping).map(([id, book]) => ({
                id,
                name: book.name,
                chapters: book.chapters,
                filename: book.filename
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

            // Use the filename from the mapping (e.g., genesis-1.json, 1-samuel-1.json)
            const filename = `${bookData.filename}-${chapter}.json`;
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
