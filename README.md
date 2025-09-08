# 🎵 iScribe

A web application that converts Bible chapters into high-quality audio using Fish.Audio's custom voice TTS API. Fetches passages from local Bible data, processes text to remove verse numbers, and creates seamless audio files for enhanced listening experience.

## Features

- **Automated Bible Audio Creation**: Convert any Bible chapter to audio without manual intervention
- **Clean Text Processing**: Removes verse numbers and formatting for natural speech flow  
- **Custom Voice Integration**: Uses Fish.Audio's TTS with your existing custom voice model
- **User-Friendly Interface**: Simple web UI for selecting books, chapters, and transcription parameters
- **Multiple Bible Versions**: Support for NIV, ESV, KJV, NASB, NLT, CSB, and more
- **Configurable Limits**: Set maximum sentences per chapter
- **Audio Processing**: Chunks text appropriately and merges into single MP3 files
- **Raspberry Pi Ready**: Lightweight application suitable for self-hosting

## Prerequisites

### System Requirements
- **Node.js** (version 16 or higher)
- **FFmpeg** (for audio processing)
- **Fish.Audio Account** with API access and custom voice model

### Installing FFmpeg

#### Windows
1. Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extract and add to PATH
3. Or use Chocolatey: `choco install ffmpeg`

#### macOS
```bash
brew install ffmpeg
```

#### Linux/Raspberry Pi
```bash
sudo apt update
sudo apt install ffmpeg
```

## Installation

1. **Clone or download this repository**
```bash
git clone <repository-url>
cd iScribe
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file** (optional)
```bash
cp env.example .env
```

4. **Configure environment variables** (in `.env` file or via UI)
```env
FISH_AUDIO_API_KEY=your_fish_audio_api_key_here
FISH_AUDIO_VOICE_MODEL_ID=your_custom_voice_model_id_here
PORT=3005
AUDIO_OUTPUT_DIR=./output
TEMP_AUDIO_DIR=./uploads
```

## Usage

### Starting the Application

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The application will be available at `http://localhost:3005`

### Configuration

1. **Open the web interface** at `http://localhost:3005`
2. **Configure Fish.Audio API**:
   - Enter your Fish.Audio API key
   - Enter your custom voice model ID
   - Click "Save Configuration"

### Creating Bible Audio

1. **Select Bible Reference**:
   - Choose a Bible book from the dropdown
   - Enter chapter number
   - Select Bible version (NIV, ESV, KJV, etc.)

2. **Set Parameters**:
   - Maximum sentences (optional - leave empty for full chapter)
   - Verse numbers are automatically excluded

3. **Start Transcription**:
   - Click "Start Transcription"
   - Monitor progress in real-time
   - Download the generated MP3 when complete

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/config` - Configuration status
- `GET /api/bible/books` - List of Bible books
- `GET /api/bible/versions` - Supported Bible versions
- `POST /api/transcribe` - Main transcription endpoint
- `GET /api/download/:filename` - Download audio files
- `GET /api/files` - List generated files
- `DELETE /api/files/:filename` - Delete audio files

## File Structure

```
iScribe/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── README.md              # This file
├── env.example            # Environment variables template
├── memory-bank/           # Project documentation
├── routes/                # API routes
│   └── api.js
├── services/              # Business logic services
│   ├── localBibleService.js      # Local Bible data access
│   ├── fishAudioService.js       # Fish.Audio TTS integration
│   └── audioProcessingService.js # FFmpeg audio processing
├── public/                # Frontend files
│   ├── index.html         # Main web interface
│   ├── styles.css         # Styling
│   └── script.js          # Frontend JavaScript
├── uploads/               # Temporary audio chunks (auto-created)
└── output/                # Final merged audio files (auto-created)
```

## Troubleshooting

### Common Issues

**"FFmpeg not found"**
- Ensure FFmpeg is installed and in your system PATH
- Test with `ffmpeg -version` in terminal

**"Invalid Fish.Audio API key"**
- Verify your API key is correct
- Check that your Fish.Audio account has API access

**"Could not find passage text"**
- Local Bible data structure may have changed
- Try a different Bible version
- Check internet connection

**"Audio generation failed"**
- Verify Fish.Audio voice model ID
- Check API rate limits
- Ensure sufficient disk space

### Logs

Check the server console for detailed error messages and processing logs.

## Development

### Adding New Bible Sources
Extend `localBibleService.js` to support additional Bible versions or modify data access logic.

### Custom Audio Processing
Modify `audioProcessingService.js` to change audio quality, format, or processing options.

### Frontend Customization
Edit files in the `public/` directory to customize the user interface.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Open an issue on the repository

---

**Built for creating seamless Bible audio with Fish.Audio TTS** 🎵📖
