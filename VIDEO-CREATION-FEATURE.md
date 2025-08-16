# 🎬 Video Creation Feature

## Overview
The Audibible application now supports creating MP4 videos with static background images and the generated chapter audio. This is perfect for YouTube content creation!

## How It Works

### 1. **Audio Generation**
- First creates the chapter audio (introduction + full chapter)
- Same process as before: Fish.Audio TTS with custom voice

### 2. **Image Processing** 
- Upload background image (JPEG, PNG, WebP, max 10MB)
- Automatically resized to 1920x1080 (HD)
- Adds text overlay with book name, chapter, and version
- Black letterbox if image aspect ratio doesn't match 16:9

### 3. **Video Creation**
- Combines static image with chapter audio
- Creates MP4 video using H.264 codec
- Duration matches audio length exactly
- Optimized for YouTube and social media

## User Interface

### **Video Creation Section**
- ✅ Optional checkbox: "Create MP4 video with background image"
- 📁 File upload for background image
- 🖼️ Image preview with dimensions and size
- 📊 Upload progress indicator
- ❌ Remove image option

### **Enhanced Results**
- 🎵 Download MP3 (always available)
- 🎥 Download MP4 Video (if video was created)
- 📊 Video metadata (resolution, duration, file size)

## Technical Details

### **Supported Image Formats**
- JPEG/JPG
- PNG  
- WebP
- TIFF
- GIF (static)

### **Video Specifications**
- **Resolution**: 1920x1080 (Full HD)
- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC
- **Format**: MP4
- **Frame Rate**: 1 fps (static image)
- **Optimization**: Fast start for streaming

### **Text Overlay**
- **Main Title**: Book Chapter (e.g., "Genesis 1")
- **Subtitle**: Bible Version (e.g., "WEB")
- **Font**: Arial, bold
- **Color**: White with black shadow
- **Position**: Centered

## API Endpoints

### **Image Upload**
```
POST /api/upload-image
Content-Type: multipart/form-data

{
  "backgroundImage": <file>
}
```

### **Transcription with Video**
```
POST /api/transcribe
Content-Type: application/json

{
  "book": "Genesis",
  "chapter": 1,
  "version": "WEB",
  "maxSentences": 20,
  "createVideo": true,
  "backgroundImagePath": "/path/to/uploaded/image.jpg"
}
```

## Response Format

### **With Video Creation**
```json
{
  "success": true,
  "message": "Transcription and video creation completed successfully",
  "filename": "Genesis_1_WEB_2024-01-01T12-00-00-000Z.mp3",
  "downloadUrl": "/api/download/Genesis_1_WEB_2024-01-01T12-00-00-000Z.mp3",
  "video": {
    "filename": "Genesis_1_WEB_VIDEO_2024-01-01T12-00-00-000Z.mp4",
    "downloadUrl": "/api/download/Genesis_1_WEB_VIDEO_2024-01-01T12-00-00-000Z.mp4",
    "metadata": {
      "duration": 180,
      "fileSize": 5242880,
      "resolution": "1920x1080",
      "videoCodec": "h264",
      "audioCodec": "aac"
    }
  }
}
```

## Workflow Example

### **Creating YouTube-Ready Content**
1. **Upload Background Image**: Your channel artwork or biblical scene
2. **Configure Chapter**: Genesis 1, WEB version, 25 sentences per part
3. **Enable Video Creation**: Check the video creation option
4. **Start Transcription**: Creates both MP3 and MP4
5. **Download Results**: 
   - MP3 for podcast/audio use
   - MP4 ready to upload to YouTube

### **Generated Files**
- `Genesis_1_WEB_2024-01-01.mp3` - Audio file
- `Genesis_1_WEB_VIDEO_2024-01-01.mp4` - Video file

## File Management

### **File Browser Updates**
- Shows both audio and video files
- Displays file type icons (🎵 for audio, 🎥 for video)
- Individual download/delete for each file type
- Audio preview players for both MP3 and MP4 files

## Performance Considerations

### **Processing Time**
- Audio generation: Same as before
- Image processing: +5-10 seconds
- Video creation: +30-60 seconds (depends on audio length)
- Total: Typically 2-3x longer than audio-only

### **File Sizes**
- Audio MP3: ~1-3MB per minute
- Video MP4: ~5-15MB per minute (optimized for static image)

### **System Requirements**
- FFmpeg with H.264 and AAC support
- Sharp for image processing
- Sufficient disk space for temporary files

## Dependencies Added

```json
{
  "sharp": "^0.32.6"  // Image processing
}
```

Existing FFmpeg dependency handles video creation.

## Perfect for YouTube!

This feature creates YouTube-ready content with:
- ✅ HD video quality (1920x1080)
- ✅ Professional text overlay
- ✅ High-quality audio
- ✅ Optimized file format
- ✅ Proper aspect ratio
- ✅ Fast streaming start

Your Bible chapter videos will have consistent branding with chapter titles and can be uploaded directly to YouTube! 🎬📖
