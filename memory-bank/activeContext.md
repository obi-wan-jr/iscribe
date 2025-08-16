# Active Context

## Current Development Focus
**Enhanced Chapter Audio Workflow** - Implementing complete chapter transcription with introduction + multi-part processing + seamless stitching.

## Recent Progress
- ✅ Enhanced workflow: Chapter introduction + full chapter processing
- ✅ Added WEB (World English Bible) and 20 total Bible version support
- ✅ Implemented file manager interface for viewing/downloading/managing processed files
- ✅ Updated chunking logic to support sentence-based splitting while processing entire chapters
- ✅ Modified audio processing to include introduction + content merging

## Current Task
Complete chapter audio creation with the new enhanced workflow that creates seamless single MP3 files containing book/chapter introduction + full chapter content.

## Next Immediate Steps
1. ✅ Deploy and test the enhanced workflow on Raspberry Pi
2. ✅ Verify chapter introduction + content merging works seamlessly  
3. ✅ Test multiple Bible versions including WEB
4. ✅ Validate file manager functionality

## Active Decisions & Considerations

### Enhanced Audio Workflow
- **Chapter Introduction**: Each audio file starts with Fish.Audio saying book name + chapter number
- **Complete Chapter Processing**: Always processes entire chapter regardless of sentence limit
- **Multi-Part Generation**: Breaks chapter into manageable parts based on sentence limits
- **Seamless Stitching**: Combines introduction + all parts into single MP3 file
- **File Management**: Complete interface to view, play, download, and manage generated files

### New Features Implemented
- **20 Bible Versions**: Including WEB (World English Bible) prominently featured
- **Audio Preview**: Built-in players in file manager
- **Smart File Display**: Organized view with metadata and statistics  
- **Bulk Operations**: Individual and bulk file management options

### Technical Implementation
- **Sentence-Based Chunking**: Respects sentence limits while processing complete chapters
- **Introduction Generation**: Separate TTS call for chapter introduction
- **Audio Merging**: FFmpeg-based combining of introduction + content parts
- **Progress Tracking**: Enhanced progress reporting for multi-step workflow

## Technical Notes
- User has confirmed existing Fish.Audio account with custom voice model
- No authentication required - single-user application
- Default Fish.Audio quality settings to be used
- Verse numbers must be completely removed for natural audio flow

## User Requirements Confirmed
- Bible chapter transcription without verse numbers
- Support for multiple Bible versions
- Configurable sentence limits per chapter
- Single merged MP3 output per chapter
- Web interface for all controls and configuration
