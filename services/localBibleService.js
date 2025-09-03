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
