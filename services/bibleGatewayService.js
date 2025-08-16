const axios = require('axios');
const cheerio = require('cheerio');

class BibleGatewayService {
    constructor() {
        this.baseUrl = 'https://www.biblegateway.com';
        this.delay = 1000; // 1 second delay between requests to be respectful
    }

    /**
     * Fetch Bible chapter text from BibleGateway
     * @param {string} book - Bible book name (e.g., "Genesis", "Matthew")
     * @param {number} chapter - Chapter number
     * @param {string} version - Bible version (e.g., "NIV", "ESV", "KJV")
     * @returns {Promise<Object>} - {success: boolean, text: string, error?: string}
     */
    async fetchChapter(book, chapter, version = 'NIV') {
        try {
            console.log(`Fetching ${book} ${chapter} (${version}) from BibleGateway...`);
            
            // Construct the URL for BibleGateway passage
            const passage = `${book} ${chapter}`;
            const url = `${this.baseUrl}/passage/?search=${encodeURIComponent(passage)}&version=${version}`;
            
            console.log(`URL: ${url}`);
            
            // Add delay to be respectful to BibleGateway
            await this.sleep(this.delay);
            
            // Fetch the page
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                }
            });

            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: Failed to fetch page`);
            }

            // Parse the HTML
            const $ = cheerio.load(response.data);
            
            // Extract the passage text - BibleGateway uses different selectors
            let passageText = '';
            
            // Try multiple selectors as BibleGateway's structure can vary
            const selectors = [
                '.passage-text .std-text',
                '.passage-text',
                '.result-text-style-normal',
                '.text',
                '#passage-text'
            ];
            
            for (const selector of selectors) {
                const element = $(selector);
                if (element.length > 0) {
                    passageText = element.text();
                    break;
                }
            }
            
            if (!passageText) {
                throw new Error('Could not find passage text on the page. BibleGateway structure may have changed.');
            }

            // Clean the text
            const cleanedText = this.cleanBibleText(passageText);
            
            console.log(`Successfully fetched ${cleanedText.split('.').filter(s => s.trim().length > 0).length} sentences from ${book} ${chapter}`);
            
            return {
                success: true,
                text: cleanedText,
                metadata: {
                    book,
                    chapter,
                    version,
                    sentenceCount: cleanedText.split('.').filter(s => s.trim().length > 0).length,
                    characterCount: cleanedText.length
                }
            };

        } catch (error) {
            console.error('BibleGateway fetch error:', error.message);
            return {
                success: false,
                error: error.message,
                text: ''
            };
        }
    }

    /**
     * Clean Bible text by removing verse numbers, footnotes, and other artifacts
     * @param {string} rawText - Raw text from BibleGateway
     * @returns {string} - Cleaned text
     */
    cleanBibleText(rawText) {
        let cleanText = rawText;
        
        // Remove verse numbers (e.g., "1 In the beginning", "23 For God so loved")
        cleanText = cleanText.replace(/^\d+\s+/gm, '');
        cleanText = cleanText.replace(/\s+\d+\s+/g, ' ');
        
        // Remove footnote markers (letters in brackets or superscript)
        cleanText = cleanText.replace(/\[[a-z]\]/gi, '');
        cleanText = cleanText.replace(/[a-z]\s*$/gmi, '');
        
        // Remove cross-reference markers
        cleanText = cleanText.replace(/\([A-Z][a-z]*\s+\d+:\d+[^)]*\)/g, '');
        
        // Remove extra whitespace and normalize
        cleanText = cleanText.replace(/\s+/g, ' ');
        cleanText = cleanText.replace(/\n+/g, ' ');
        cleanText = cleanText.trim();
        
        // Remove common artifacts
        cleanText = cleanText.replace(/^(Chapter \d+|Psalm \d+)\s*/i, '');
        cleanText = cleanText.replace(/\s*(Read full chapter|Full Chapter|Continue reading)/gi, '');
        
        // Ensure proper sentence endings
        cleanText = cleanText.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
        
        return cleanText;
    }

    /**
     * Limit text to a maximum number of sentences
     * @param {string} text - Full text
     * @param {number} maxSentences - Maximum number of sentences
     * @returns {string} - Limited text
     */
    limitSentences(text, maxSentences) {
        // Split by sentence endings
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (sentences.length <= maxSentences) {
            return text;
        }
        
        // Take only the first maxSentences and rejoin
        const limitedSentences = sentences.slice(0, maxSentences);
        return limitedSentences.join('. ').trim() + '.';
    }

    /**
     * Get supported Bible versions
     * @returns {Array} - Array of version objects
     */
    getSupportedVersions() {
        return [
            { code: 'NIV', name: 'New International Version' },
            { code: 'ESV', name: 'English Standard Version' },
            { code: 'KJV', name: 'King James Version' },
            { code: 'NASB', name: 'New American Standard Bible' },
            { code: 'NLT', name: 'New Living Translation' },
            { code: 'CSB', name: 'Christian Standard Bible' },
            { code: 'WEB', name: 'World English Bible' },
            { code: 'NKJV', name: 'New King James Version' },
            { code: 'MSG', name: 'The Message' },
            { code: 'AMP', name: 'Amplified Bible' },
            { code: 'CEV', name: 'Contemporary English Version' },
            { code: 'HCSB', name: 'Holman Christian Standard Bible' },
            { code: 'NASB1995', name: 'New American Standard Bible 1995' },
            { code: 'NET', name: 'New English Translation' },
            { code: 'RSV', name: 'Revised Standard Version' },
            { code: 'ASV', name: 'American Standard Version' },
            { code: 'YLT', name: 'Young\'s Literal Translation' },
            { code: 'DARBY', name: 'Darby Translation' },
            { code: 'GNT', name: 'Good News Translation' },
            { code: 'NCV', name: 'New Century Version' }
        ];
    }

    /**
     * Get list of Bible books
     * @returns {Array} - Array of book names
     */
    getBibleBooks() {
        return [
            // Old Testament
            'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
            'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
            '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
            'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
            'Ecclesiastes', 'Song of Songs', 'Isaiah', 'Jeremiah',
            'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
            'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
            'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
            
            // New Testament
            'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
            '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
            'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
            '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
            'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
            'Jude', 'Revelation'
        ];
    }

    /**
     * Sleep utility for rate limiting
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate book and chapter combination
     * @param {string} book - Bible book name
     * @param {number} chapter - Chapter number
     * @returns {boolean} - Whether the combination is valid
     */
    validateReference(book, chapter) {
        const validBooks = this.getBibleBooks();
        
        if (!validBooks.includes(book)) {
            return false;
        }
        
        if (chapter < 1) {
            return false;
        }
        
        // Basic chapter count validation (simplified)
        const chapterCounts = {
            'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
            'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
            '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
            'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
            'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Songs': 8, 'Isaiah': 66,
            'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
            'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4,
            'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2,
            'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16, 'Luke': 24,
            'John': 21, 'Acts': 28, 'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
            'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
            '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
            'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5,
            '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
        };
        
        const maxChapter = chapterCounts[book] || 150; // Default to 150 for safety
        return chapter <= maxChapter;
    }
}

module.exports = BibleGatewayService;
