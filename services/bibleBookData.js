/**
 * Bible Book Data Service
 * Contains chapter counts for all 66 books of the Bible
 */

const BIBLE_BOOKS = {
    // Old Testament
    'Genesis': 50,
    'Exodus': 40,
    'Leviticus': 27,
    'Numbers': 36,
    'Deuteronomy': 34,
    'Joshua': 24,
    'Judges': 21,
    'Ruth': 4,
    '1 Samuel': 31,
    '2 Samuel': 24,
    '1 Kings': 22,
    '2 Kings': 25,
    '1 Chronicles': 29,
    '2 Chronicles': 36,
    'Ezra': 10,
    'Nehemiah': 13,
    'Esther': 10,
    'Job': 42,
    'Psalms': 150,
    'Proverbs': 31,
    'Ecclesiastes': 12,
    'Song of Solomon': 8,
    'Isaiah': 66,
    'Jeremiah': 52,
    'Lamentations': 5,
    'Ezekiel': 48,
    'Daniel': 12,
    'Hosea': 14,
    'Joel': 3,
    'Amos': 9,
    'Obadiah': 1,
    'Jonah': 4,
    'Micah': 7,
    'Nahum': 3,
    'Habakkuk': 3,
    'Zephaniah': 3,
    'Haggai': 2,
    'Zechariah': 14,
    'Malachi': 4,

    // New Testament
    'Matthew': 28,
    'Mark': 16,
    'Luke': 24,
    'John': 21,
    'Acts': 28,
    'Romans': 16,
    '1 Corinthians': 16,
    '2 Corinthians': 13,
    'Galatians': 6,
    'Ephesians': 6,
    'Philippians': 4,
    'Colossians': 4,
    '1 Thessalonians': 5,
    '2 Thessalonians': 3,
    '1 Timothy': 6,
    '2 Timothy': 4,
    'Titus': 3,
    'Philemon': 1,
    'Hebrews': 13,
    'James': 5,
    '1 Peter': 5,
    '2 Peter': 3,
    '1 John': 5,
    '2 John': 1,
    '3 John': 1,
    'Jude': 1,
    'Revelation': 22
};

class BibleBookDataService {
    /**
     * Get all Bible books with chapter counts
     * @returns {Object} Books with their chapter counts
     */
    getAllBooks() {
        return BIBLE_BOOKS;
    }

    /**
     * Get chapter count for a specific book
     * @param {string} bookName - Name of the Bible book
     * @returns {number|null} Number of chapters or null if book not found
     */
    getChapterCount(bookName) {
        return BIBLE_BOOKS[bookName] || null;
    }

    /**
     * Check if a chapter exists for a book
     * @param {string} bookName - Name of the Bible book
     * @param {number} chapterNumber - Chapter number to validate
     * @returns {boolean} True if chapter exists
     */
    isValidChapter(bookName, chapterNumber) {
        const maxChapters = this.getChapterCount(bookName);
        if (!maxChapters) return false;
        
        return chapterNumber >= 1 && chapterNumber <= maxChapters;
    }

    /**
     * Get validation result for a book/chapter combination
     * @param {string} bookName - Name of the Bible book
     * @param {number} chapterNumber - Chapter number to validate
     * @returns {Object} Validation result with status and message
     */
    validateChapter(bookName, chapterNumber) {
        if (!bookName) {
            return {
                valid: false,
                error: 'Please select a Bible book first'
            };
        }

        const maxChapters = this.getChapterCount(bookName);
        if (!maxChapters) {
            return {
                valid: false,
                error: `Unknown book: ${bookName}`
            };
        }

        if (!chapterNumber || chapterNumber < 1) {
            return {
                valid: false,
                error: 'Chapter number must be at least 1'
            };
        }

        if (chapterNumber > maxChapters) {
            return {
                valid: false,
                error: `${bookName} only has ${maxChapters} chapter${maxChapters === 1 ? '' : 's'}`
            };
        }

        return {
            valid: true,
            message: `${bookName} ${chapterNumber} is valid`
        };
    }

    /**
     * Get list of book names
     * @returns {Array<string>} Array of book names
     */
    getBookNames() {
        return Object.keys(BIBLE_BOOKS);
    }

    /**
     * Search for books by partial name
     * @param {string} query - Search query
     * @returns {Array<string>} Array of matching book names
     */
    searchBooks(query) {
        if (!query) return this.getBookNames();
        
        const searchTerm = query.toLowerCase();
        return this.getBookNames().filter(book => 
            book.toLowerCase().includes(searchTerm)
        );
    }
}

module.exports = new BibleBookDataService();
