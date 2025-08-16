# Audibible Project Brief

## Project Overview
Audibible is a web application that automates the conversion of Bible chapters into high-quality audio using Fish.Audio's custom voice TTS API. The application fetches passages from BibleGateway's web content, processes the text to remove verse numbers, and creates seamless audio files for enhanced listening experience.

## Core Objectives
- **Automated Bible Audio Creation**: Convert any Bible chapter to audio without manual intervention
- **Clean Text Processing**: Remove verse numbers and formatting for natural speech flow  
- **Custom Voice Integration**: Use Fish.Audio's TTS with user's existing custom voice model
- **User-Friendly Interface**: Simple web UI for selecting books, chapters, and transcription parameters
- **Raspberry Pi Deployment**: Lightweight application suitable for self-hosting

## Key Requirements
- Fetch Bible text from BibleGateway via web scraping
- Strip verse numbers and formatting artifacts
- Chunk text appropriately for Fish.Audio API limits (~4,500 characters)
- Synthesize audio per chunk and merge into single MP3 per chapter
- Provide download access to final audio files
- Support multiple Bible versions (NIV, ESV, KJV, etc.)
- Configurable sentence limits per chapter
- Real-time progress tracking during transcription

## Technical Constraints
- Must run efficiently on Raspberry Pi hardware
- Single-user application (no authentication required)
- Local file storage only
- Web scraping with respectful rate limiting
- Default Fish.Audio audio quality settings

## Success Criteria
The application successfully creates seamless Bible chapter audio files that flow naturally without verse number interruptions, matching the quality and style of the user's existing YouTube content creation workflow.
