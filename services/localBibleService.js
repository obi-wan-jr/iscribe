const axios = require('axios');

class LocalBibleService {
    constructor() {
        this.baseUrl = 'http://localhost:3005/api';
    }

    /**
     * Get all Bible books with chapter counts
     */
    async getBibleBooks() {
        try {
            const response = await axios.get(`${this.baseUrl}/books`);
            if (response.data.success) {
                return response.data.data || [];
            }
            throw new Error('API returned unsuccessful response');
        } catch (error) {
            console.error('Error fetching Bible books from API:', error.message);
            throw new Error(`Failed to fetch Bible books: ${error.message}`);
        }
    }

    /**
     * Get supported Bible versions
     */
    getSupportedVersions() {
        return [
            { id: 'WEB', name: 'World English Bible', description: 'Public domain English translation' }
        ];
    }

    /**
     * Validate Bible reference
     */
    async validateReference(book, chapter) {
        try {
            const books = await this.getBibleBooks();
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
     * Fetch chapter text from the local Bible API
     */
    async fetchChapter(book, chapter, version = 'WEB') {
        try {
            const response = await axios.get(`${this.baseUrl}/books/${book}/chapters/${chapter}`);
            if (response.data.success) {
                return this.processApiResponse(response.data);
            }
            throw new Error('API returned unsuccessful response');
        } catch (error) {
            console.error(`Error fetching chapter ${book} ${chapter} from API:`, error.message);
            throw new Error(`Failed to fetch chapter: ${error.message}`);
        }
    }

    /**
     * Process API response
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
     * Extract chapter text from API data
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
     * Extract chapter metadata from API data
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
     * Convert book ID to full book name
     */
    getBookName(bookId) {
        const bookMapping = {
            'GEN': 'Genesis',
            'EXO': 'Exodus',
            'LEV': 'Leviticus',
            'NUM': 'Numbers',
            'DEU': 'Deuteronomy',
            'JOS': 'Joshua',
            'JDG': 'Judges',
            'RUT': 'Ruth',
            '1SA': 'First Samuel',
            '2SA': 'Second Samuel',
            '1KI': 'First Kings',
            '2KI': 'Second Kings',
            '1CH': 'First Chronicles',
            '2CH': 'Second Chronicles',
            'EZR': 'Ezra',
            'NEH': 'Nehemiah',
            'EST': 'Esther',
            'JOB': 'Job',
            'PSA': 'Psalms',
            'PRO': 'Proverbs',
            'ECC': 'Ecclesiastes',
            'SNG': 'Song of Solomon',
            'ISA': 'Isaiah',
            'JER': 'Jeremiah',
            'LAM': 'Lamentations',
            'EZK': 'Ezekiel',
            'DAN': 'Daniel',
            'HOS': 'Hosea',
            'JOL': 'Joel',
            'AMO': 'Amos',
            'OBA': 'Obadiah',
            'JON': 'Jonah',
            'MIC': 'Micah',
            'NAH': 'Nahum',
            'HAB': 'Habakkuk',
            'ZEP': 'Zephaniah',
            'HAG': 'Haggai',
            'ZEC': 'Zechariah',
            'MAL': 'Malachi',
            'MAT': 'Matthew',
            'MRK': 'Mark',
            'LUK': 'Luke',
            'JHN': 'John',
            'ACT': 'Acts',
            'ROM': 'Romans',
            '1CO': 'First Corinthians',
            '2CO': 'Second Corinthians',
            'GAL': 'Galatians',
            'EPH': 'Ephesians',
            'PHP': 'Philippians',
            'COL': 'Colossians',
            '1TH': 'First Thessalonians',
            '2TH': 'Second Thessalonians',
            '1TI': 'First Timothy',
            '2TI': 'Second Timothy',
            'TIT': 'Titus',
            'PHM': 'Philemon',
            'HEB': 'Hebrews',
            'JAS': 'James',
            '1PE': 'First Peter',
            '2PE': 'Second Peter',
            '1JN': 'First John',
            '2JN': 'Second John',
            '3JN': 'Third John',
            'JUD': 'Jude',
            'REV': 'Revelation'
        };
        
        return bookMapping[bookId.toUpperCase()] || bookId;
    }

    /**
     * Search Bible text (not implemented - would require API support)
     */
    async searchBibleText(searchTerm, book = null, chapter = null) {
        return {
            success: false,
            error: 'Search not implemented for this API'
        };
    }
}

module.exports = LocalBibleService;
