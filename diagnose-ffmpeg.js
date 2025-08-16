#!/usr/bin/env node

// FFmpeg Diagnostic Tool for Audibible
// Run with: node diagnose-ffmpeg.js

const ffmpeg = require('fluent-ffmpeg');

console.log('🔍 Audibible FFmpeg Diagnostic Tool\n');

async function checkFFmpeg() {
    console.log('1. Checking FFmpeg installation...');
    
    try {
        // Check if FFmpeg is available
        await new Promise((resolve, reject) => {
            ffmpeg.getAvailableFormats((err, formats) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ FFmpeg is installed');
                    console.log(`   Supported formats: ${Object.keys(formats).length}`);
                    resolve();
                }
            });
        });

        // Check codec support
        console.log('\n2. Checking codec support...');
        await new Promise((resolve, reject) => {
            ffmpeg.getAvailableCodecs((err, codecs) => {
                if (err) {
                    console.log('⚠️  Could not check codecs:', err.message);
                    resolve();
                } else {
                    const codecSupport = {
                        mp3: !!codecs.mp3,
                        libmp3lame: !!codecs.libmp3lame,
                        aac: !!codecs.aac,
                        pcm_s16le: !!codecs.pcm_s16le
                    };

                    console.log('   Codec Support:');
                    console.log(`   - mp3: ${codecSupport.mp3 ? '✅' : '❌'}`);
                    console.log(`   - libmp3lame: ${codecSupport.libmp3lame ? '✅' : '❌'}`);
                    console.log(`   - aac: ${codecSupport.aac ? '✅' : '❌'}`);
                    console.log(`   - pcm_s16le: ${codecSupport.pcm_s16le ? '✅' : '❌'}`);

                    if (!codecSupport.libmp3lame && !codecSupport.mp3) {
                        console.log('\n❌ MP3 encoding not available!');
                        console.log('   You need to install FFmpeg with MP3 support.');
                        console.log('   Try: sudo apt install ffmpeg');
                    } else {
                        console.log('\n✅ MP3 encoding is available');
                    }
                    resolve();
                }
            });
        });

        // Test simple audio conversion
        console.log('\n3. Testing audio conversion capabilities...');
        
        // Create a simple test audio file (silence)
        const testOutput = './ffmpeg-test.mp3';
        
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input('anullsrc=channel_layout=mono:sample_rate=22050')
                .inputOptions(['-f', 'lavfi', '-t', '1'])
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .output(testOutput)
                .on('start', (cmd) => {
                    console.log('   Running test conversion...');
                })
                .on('end', () => {
                    console.log('✅ Audio conversion test successful');
                    // Clean up test file
                    const fs = require('fs');
                    try {
                        fs.unlinkSync(testOutput);
                    } catch (e) {}
                    resolve();
                })
                .on('error', (err) => {
                    console.log('❌ Audio conversion test failed:', err.message);
                    resolve(); // Don't reject, just continue
                })
                .run();
        });

        console.log('\n🎉 FFmpeg diagnostic complete!');
        console.log('\n📋 Recommendations:');
        
    } catch (error) {
        console.log('❌ FFmpeg not found or not working properly');
        console.log('   Error:', error.message);
        console.log('\n📋 To fix this:');
        console.log('   1. Install FFmpeg: sudo apt install ffmpeg');
        console.log('   2. Or try: sudo apt install ffmpeg-full');
        console.log('   3. Restart your terminal/server after installation');
        console.log('   4. Run this diagnostic again');
    }
}

// Alternative FFmpeg installation commands for different systems
function showInstallationHelp() {
    console.log('\n🛠️  FFmpeg Installation Help:');
    console.log('\n  Raspberry Pi / Ubuntu / Debian:');
    console.log('    sudo apt update');
    console.log('    sudo apt install ffmpeg');
    console.log('\n  Alternative (full codecs):');
    console.log('    sudo apt install ffmpeg-full');
    console.log('\n  Manual compilation (if packages don\'t work):');
    console.log('    # This includes all codecs');
    console.log('    sudo apt install build-essential');
    console.log('    # Follow: https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu');
    console.log('\n  After installation:');
    console.log('    ffmpeg -version');
    console.log('    node diagnose-ffmpeg.js');
}

checkFFmpeg().then(() => {
    if (process.argv.includes('--help')) {
        showInstallationHelp();
    }
}).catch(console.error);
