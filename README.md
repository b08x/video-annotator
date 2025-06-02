# Video Analyzer - AI-Powered Video Analysis Tool

## What is this project?

This is a web application that uses Google's Gemini AI to analyze videos. You drag and drop a video file into the application, and it can:

- Generate scene-by-scene captions
- Create summaries
- Extract key moments
- Generate charts based on video content
- Create custom analyses based on your prompts

## Table of Contents

1. [Features](#features)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Usage](#usage)
5. [How It Works](#how-it-works)
6. [Project Structure](#project-structure)
7. [Troubleshooting](#troubleshooting)

## Features

### Pre-built Analysis Modes

- **👀 A/V Captions**: Generates descriptions of each scene with any spoken text
- **📝 Paragraph**: Creates a 3-5 sentence summary of the entire video
- **🔑 Key Moments**: Extracts important moments as bullet points
- **🤓 Table**: Identifies 5 key shots with descriptions and visible objects
- **🌸 Haiku**: Creates a poetic haiku based on the video content
- **📈 Chart**: Generates data visualizations (excitement levels, people count, etc.)
- **🧩 Topic Segmentation**: Identifies distinct conceptual and thematic segments in the video.
- **🔧 Custom**: Analyze videos with your own custom prompts

### Key Features

- Click any timestamp to jump to that moment in the video
- Export annotations as VTT subtitle files
- Real-time video playback with synchronized captions
- Interactive charts that link to video timestamps
- Responsive design that works on desktop and mobile

## Requirements

### To run with Docker (Recommended)

- Docker Desktop installed on your computer
- A Google Gemini API key (free tier available)
- A web browser (Chrome, Firefox, Safari, Edge)

### To run without Docker

- Node.js version 20 or higher
- npm (comes with Node.js)
- A Google Gemini API key
- A web browser

## Installation

### Option 1: Using Docker (Recommended)

1. **Clone or download this project**

   ```bash
   git clone <repository-url>
   cd video-analyzer
   ```

2. **Get a Gemini API key**
   - Go to <https://makersuite.google.com/app/apikey>
   - Click "Create API key"
   - Copy the key that starts with "AIza..."

3. **Create a `.env` file**
   - In the project folder, create a new file named `.env`
   - Add this line (replace with your actual key):

   ```shell
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```

4. **Build the Docker image**

   ```bash
   docker-compose build
   ```

   This will take 2-5 minutes the first time.

5. **Start the application**

   ```bash
   docker-compose up -d
   ```

6. **Open your browser**
   - Go to <http://localhost:3000>
   - You should see the video analyzer interface

### Option 2: Without Docker

1. **Clone or download this project**

   ```bash
   git clone <repository-url>
   cd video-analyzer
   ```

2. **Get a Gemini API key** (same as step 2 above)

3. **Create a `.env.local` file**
   - In the project folder, create a new file named `.env.local`
   - Add this line:

   ```
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

   This will download all required packages (takes 1-3 minutes).

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Go to <http://localhost:5173>
   - You should see the video analyzer interface

## Usage

### Step 1: Upload a Video

1. Drag and drop a video file onto the application
   - Supported formats: MP4, WebM, MOV, AVI
   - Maximum recommended size: 100MB
2. Wait for "Processing video..." to complete
3. The video will appear in the player

### Step 2: Choose an Analysis Mode

1. On the left sidebar, you'll see different analysis options:
   - **A/V captions**: Best for understanding what happens scene-by-scene
   - **Paragraph**: Best for getting a quick summary
   - **Key moments**: Best for finding important parts
   - **Table**: Best for visual analysis of scenes
   - **Haiku**: Best for creative/artistic interpretation
   - **Chart**: Best for data visualization
   - **Topic Segmentation**: Best for breaking down videos into topical sections
   - **Custom**: Best for specific questions

2. Click on your desired mode
3. Click the "▶️ Generate" button

### Step 3: Interact with Results

- **Click timestamps**: Jump to that moment in the video
- **Hover over charts**: See exact values
- **Use video controls**: Play/pause with spacebar
- **Export VTT**: Click "Export VTT File" to download subtitles

### Custom Mode Example Prompts

- "Find all moments where someone is speaking"
- "Identify scenes with outdoor locations"
- "List all text that appears on screen"
- "Find moments of high action or movement"

### Chart Mode Options

- **Excitement**: Rates each scene 1-10 for excitement level
- **Importance**: Rates scene importance to overall video
- **Number of people**: Counts visible people
- **Custom**: Create your own metric

## How It Works

### Technical Flow

1. **Video Upload**: Files are uploaded to Google's Gemini Files API
2. **AI Processing**: Gemini analyzes the video based on your selected mode
3. **Timestamp Extraction**: The AI identifies specific moments and their timecodes
4. **Display Results**: Results are shown with clickable timestamps
5. **Video Sync**: Clicking timestamps updates the video player position

### Technologies Used

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **AI Model**: Google Gemini 2.5 Flash
- **Styling**: Custom CSS with CSS variables
- **Charts**: D3.js for data visualization
- **Video Player**: HTML5 video element with custom controls
- **Deployment**: Docker with Nginx

## Project Structure

```
video-analyzer/
├── App.tsx              # Main application component
├── VideoPlayer.tsx      # Video player with controls
├── Chart.tsx           # Chart visualization component
├── api.ts              # Gemini API integration
├── functions.ts        # AI function declarations
├── modes.ts            # Analysis mode configurations
├── utils.ts            # Helper functions
├── index.css           # Application styles
├── docker/             # Docker configuration
│   ├── Dockerfile      # Container definition
│   ├── nginx.conf      # Web server config
│   └── docker-compose.yml
└── package.json        # Project dependencies
```

## Troubleshooting

### "Error processing video"

- **Cause**: File too large or unsupported format
- **Fix**: Try a smaller file or convert to MP4

### "Waiting for model..." stays forever

- **Cause**: Invalid API key or network issue
- **Fix**:
  1. Check your API key in `.env` or `.env.local`
  2. Ensure you have internet connection
  3. Check browser console for errors (F12)

### Video won't play

- **Cause**: Browser codec compatibility
- **Fix**: Convert video to H.264 MP4 format

### Docker won't start

- **Cause**: Port conflict or Docker not running
- **Fix**:
  1. Ensure Docker Desktop is running
  2. Check if port 3000 is in use: `lsof -i :3000`
  3. Stop other services using the port

### Can't see analysis results

- **Cause**: API quota exceeded or response parsing error
- **Fix**:
  1. Wait a few minutes (quota resets)
  2. Try a shorter video
  3. Check browser console for specific errors

### Export VTT not working

- **Cause**: No annotations generated
- **Fix**: Ensure you've generated analysis before exporting

## Common Commands

### Docker Commands

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose build --no-cache
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tips for Best Results

1. **Video Quality**: Higher quality videos produce better analysis
2. **Video Length**: 30 seconds to 5 minutes works best
3. **Clear Audio**: For caption modes, ensure audio is clear
4. **Stable Scenes**: Quick cuts may be harder to analyze
5. **Custom Prompts**: Be specific about what you want to find

## Privacy Note

- Videos are uploaded to Google's servers for processing
- Videos are automatically deleted after 48 hours
- No data is stored locally except browser cache
- Clear browser data to remove any cached content

## Support

If you encounter issues:

1. Check the browser console (F12) for error messages
2. Ensure your API key is valid
3. Try a different video file
4. Restart the Docker container
5. Check the troubleshooting section above

## License

This project is licensed under the Apache License 2.0. See LICENSE file for details.
