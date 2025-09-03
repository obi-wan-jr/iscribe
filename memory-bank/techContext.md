# Technical Context

## Technology Stack

### Backend
- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js for REST API
- **Web Scraping**: Cheerio for HTML parsing, Axios for HTTP requests
- **Audio Processing**: FFmpeg via fluent-ffmpeg for audio merging
- **File System**: fs-extra for enhanced file operations

### Frontend  
- **Base**: HTML5/CSS3/JavaScript (vanilla or lightweight framework)
- **AJAX**: Fetch API for backend communication
- **UI Framework**: Simple responsive design for Raspberry Pi browser access

### External APIs
- **Fish.Audio TTS API**: Custom voice text-to-speech synthesis
- **BibleGateway**: Web scraping for Bible text retrieval

## Architecture Patterns

### Service-Oriented Backend
```
Express Server
├── Routes (API endpoints)
├── Services
│   ├── BibleGatewayService (text fetching & cleaning)
│   ├── FishAudioService (TTS integration)
│   ├── AudioProcessingService (FFmpeg operations)
│   └── FileManagerService (storage & cleanup)
└── Utilities (logging, validation, etc.)
```

### Data Flow
1. User selects Bible reference via web UI
2. BibleGateway scraper fetches and cleans chapter text
3. Text chunker splits content for TTS API limits
4. Fish.Audio synthesizes audio for each chunk
5. FFmpeg merges chunks into single MP3
6. Download link provided to user

## Development Environment

### Dependencies
- **Production**: express, cheerio, axios, cors, dotenv, fluent-ffmpeg, fs-extra
- **Development**: nodemon for hot reloading

### Environment Variables
- `FISH_AUDIO_API_KEY`: Fish.Audio API authentication
- `FISH_AUDIO_VOICE_MODEL_ID`: Custom voice model identifier
- `PORT`: Server port (default: 3005)
- `AUDIO_OUTPUT_DIR`: Directory for storing generated audio files

### File Structure
```
tScribe/
├── server.js (main entry point)
├── routes/ (API endpoints)
├── services/ (business logic)
├── public/ (static frontend files)
├── uploads/ (temporary audio chunks)
├── output/ (final merged audio files)
└── memory-bank/ (project documentation)
```

## Deployment Considerations

### Raspberry Pi Requirements
- **OS**: Raspberry Pi OS (Debian-based)
- **Memory**: Minimum 2GB RAM recommended
- **Storage**: SD card with sufficient space for audio files
- **Network**: Stable internet connection for API calls
- **Dependencies**: Node.js, FFmpeg system packages

### Performance Optimizations
- Implement request queuing to prevent API rate limiting
- Cleanup temporary files after processing
- Compress audio files appropriately for storage
- Cache frequently requested Bible versions/books
- Graceful error handling for network interruptions
