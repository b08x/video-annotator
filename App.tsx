/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import c from 'classnames';
import {useRef, useState, useEffect} from 'react';
import {generateContent, uploadFile as uploadFileToApi} from './api'; // Aliased import
import Chart from './Chart.jsx';
import functions from './functions';
import modesData from './modes'; // Renamed import for clarity
import {timeToSecs, secsToVttTime} from './utils';
import VideoPlayer from './VideoPlayer.jsx';

// Define types for better type safety
interface Timecode {
  time: string;
  text?: string;
  objects?: string[];
  value?: number;
}

interface Mode {
  emoji: string;
  prompt: string | ((input: string) => string);
  isList?: boolean;
  subModes?: Record<string, string>;
  isRegisterType?: boolean;
}

interface Modes {
  [key: string]: Mode;
}

// More specific type for the file state
interface AppFileState {
  displayName: string;
  apiMimeType: string; // MIME type from Google API for API calls
  originalMimeType: string; // Original MIME type from browser File object for <video> tag
  uri: string; // Google API URI
  name: string; // Original file name from browser File object
}

// New interface for Topic Segmentation
interface TopicSegment {
  startTime: string; // e.g., "00:01:15"
  endTime: string;   // e.g., "00:05:30"
  topicDescription: string;
}


const modes: Modes = modesData; // Assert type for modes

const chartModes = Object.keys(modes.Chart.subModes || {});


export default function App() {
  const [vidUrl, setVidUrl] = useState<string | null>(null);
  const [file, setFile] = useState<AppFileState | null>(null);
  const [timecodeList, setTimecodeList] = useState<Timecode[] | null>(null);
  const [registerAnalysisResult, setRegisterAnalysisResult] = useState<object | null>(null);
  const [topicSegments, setTopicSegments] = useState<TopicSegment[] | null>(null); // New state for topic segments
  const [requestedTimecode, setRequestedTimecode] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>(Object.keys(modes)[0]);
  const [activeMode, setActiveMode] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [chartMode, setChartMode] = useState<string>(chartModes[0] || '');
  const [chartPrompt, setChartPrompt] = useState<string>('');
  const [chartLabel, setChartLabel] = useState<string>('');
  const [theme] = useState<'dark' | 'light'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );
  const scrollRef = useRef<HTMLElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isCustomMode = selectedMode === 'Custom';
  const isChartMode = selectedMode === 'Chart';
  const isCustomChartMode = isChartMode && chartMode === 'Custom';
  const hasSubMode = isCustomMode || isChartMode;

  const setTimecodes = ({timecodes}: {timecodes: Timecode[]}) =>
    setTimecodeList(
      timecodes.map((t) => ({...t, text: t.text ? t.text.replace(/\\'/g, "'") : ''})),
    );
  
  const setRegisterResult = ({ analysisResult }: { analysisResult: object }) => {
    setRegisterAnalysisResult(analysisResult);
  };

  const handleSetTopicSegments = ({ segments }: { segments: TopicSegment[] }) => {
    const processedSegments = segments.map(segment => ({
      ...segment,
      topicDescription: segment.topicDescription.replace(/\\'/g, "'"),
    }));
    setTopicSegments(processedSegments);
  };

  const onModeSelect = async (mode: string) => {
    if (!file) return; // Ensure file is uploaded before generating
    setActiveMode(mode);
    setIsLoading(true);
    setChartLabel(chartPrompt);
    setTimecodeList(null); // Clear previous results
    setRegisterAnalysisResult(null); // Clear previous register results
    setTopicSegments(null); // Clear previous topic segments

    const currentModeConfig = modes[mode as keyof typeof modes];
    let promptValue: string;

    if (isCustomMode) {
        promptValue = (currentModeConfig.prompt as (input: string) => string)(customPrompt);
    } else if (isChartMode) {
        const chartSubModeKey = isCustomChartMode ? chartPrompt : (currentModeConfig.subModes?.[chartMode] || '');
        promptValue = (currentModeConfig.prompt as (input: string) => string)(chartSubModeKey);
    } else {
        promptValue = currentModeConfig.prompt as string;
    }

    const resp = await generateContent(
      promptValue,
      functions({
        set_timecodes: setTimecodes,
        set_timecodes_with_objects: setTimecodes,
        set_timecodes_with_numeric_values: ({timecodes}: {timecodes: Timecode[]}) =>
          setTimecodeList(timecodes),
        set_register_analysis_result: setRegisterResult,
        set_topic_segments: handleSetTopicSegments, // Add new callback for HOF
      }),
      { uri: file.uri, mimeType: file.apiMimeType },
    );

    if (resp.functionCalls && resp.functionCalls.length > 0) {
      const fnMap = {
        set_timecodes: setTimecodes,
        set_timecodes_with_objects: setTimecodes,
        set_timecodes_with_numeric_values: ({timecodes}: {timecodes: Timecode[]}) =>
          setTimecodeList(timecodes),
        set_register_analysis_result: setRegisterResult,
        set_topic_segments: handleSetTopicSegments, // Add new callback for execution
      };
      for (const call of resp.functionCalls) {
        if (fnMap[call.name as keyof typeof fnMap]) {
          (fnMap as any)[call.name](call.args);
        } else {
          console.warn(`Unknown function call in response: ${call.name}`);
        }
      }
    }

    setIsLoading(false);
    scrollRef.current?.scrollTo({top: 0, behavior: 'smooth'});
  };

  const processAndSetFile = async (clientUploadedFile: File | null) => {
    if (!clientUploadedFile) return;

    setIsLoadingVideo(true);
    setVidUrl(URL.createObjectURL(clientUploadedFile));
    setTimecodeList(null);
    setRegisterAnalysisResult(null);
    setTopicSegments(null); // Clear topic segments when a new video is processed
    setFile(null);
    setVideoError(false);

    try {
      const res = await uploadFileToApi(clientUploadedFile);
      setFile({
        displayName: res.displayName || clientUploadedFile.name,
        apiMimeType: res.mimeType,
        originalMimeType: clientUploadedFile.type,
        uri: res.uri,
        name: clientUploadedFile.name,
      });
      setIsLoadingVideo(false);
    } catch (err) {
      console.error('Error processing file:', err);
      setVideoError(true);
      setIsLoadingVideo(false);
    }
  };

  const handleDragUpload = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    processAndSetFile(droppedFile);
  };

  const handleFileSelectedChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    processAndSetFile(selectedFile);
    if (event.target) { // Clear input value to allow re-selecting the same file
      event.target.value = '';
    }
  };

  const handleUploadButtonClick = () => {
    inputFileRef.current?.click();
  };


  const handleExport = () => {
    if (!timecodeList || timecodeList.length === 0 || !file || !file.name) {
      alert("No VTT-compatible annotations or video file details available to export. Please ensure a video is processed and has a valid file name.");
      return;
    }

    const videoFileName = file.name; 

    let vttContent = "WEBVTT\n\n";
    timecodeList.forEach((item, index) => {
      const startTimeSecs = timeToSecs(item.time);
      let endTimeSecs;

      if (index < timecodeList.length - 1) {
        endTimeSecs = timeToSecs(timecodeList[index + 1].time);
        if (endTimeSecs <= startTimeSecs) { 
          endTimeSecs = startTimeSecs + 0.5; 
        }
      } else {
        const videoDuration = videoRef.current?.duration;
        if (videoDuration && startTimeSecs < videoDuration) {
           endTimeSecs = Math.min(startTimeSecs + 5, videoDuration);
        } else {
           endTimeSecs = startTimeSecs + 5;
        }
      }

      const captionText = item.value !== undefined ? String(item.value) : (item.text || "");
      
      vttContent += `${index + 1}\n`; 
      vttContent += `${secsToVttTime(startTimeSecs)} --> ${secsToVttTime(endTimeSecs)}\n`;
      vttContent += `${captionText.replace(/\n/g, ' ')}\n\n`;
    });
    
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    
    const safeDisplayName = videoFileName.replace(/[^a-z0-9_.-]/gi, '_').split('.')[0];
    anchor.download = `${safeDisplayName}_annotations.vtt`;
    
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(anchor.href);
  };
  
  const currentActiveModeConfig = activeMode ? modes[activeMode as keyof typeof modes] : undefined;


  return (
    <main
      className={theme}
      onDrop={handleDragUpload}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => {}}
      onDragLeave={() => {}}>
      <input 
        type="file" 
        ref={inputFileRef} 
        style={{ display: 'none' }} 
        onChange={handleFileSelectedChange} 
        accept="video/*" 
      />
      <section className="top">
        {vidUrl && !isLoadingVideo && (
          <>
            <div className={c('modeSelector', {hide: !showSidebar})}>
              {hasSubMode ? (
                <>
                  <div>
                    {isCustomMode ? (
                      <>
                        <h2>Custom prompt:</h2>
                        <textarea
                          placeholder="Type a custom prompt..."
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              onModeSelect(selectedMode);
                            }
                          }}
                          rows={5}
                          aria-label="Custom prompt for video analysis"
                        />
                      </>
                    ) : ( // Chart Mode
                      <>
                        <h2>Chart this video by:</h2>

                        <div className="modeList">
                          {chartModes.map((mode) => (
                            <button
                              key={mode}
                              className={c('button', {
                                active: mode === chartMode,
                              })}
                              onClick={() => setChartMode(mode)}
                              aria-pressed={mode === chartMode}>
                              {mode}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className={c({active: isCustomChartMode})}
                          placeholder="Or type a custom prompt..."
                          value={chartPrompt}
                          onChange={(e) => setChartPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              onModeSelect(selectedMode);
                            }
                          }}
                          onFocus={() => setChartMode('Custom')}
                          rows={2}
                          aria-label="Custom prompt for chart generation"
                        />
                      </>
                    )}
                    <button
                      className="button generateButton"
                      onClick={() => onModeSelect(selectedMode)}
                      disabled={
                        isLoading ||
                        !file ||
                        (isCustomMode && !customPrompt.trim()) ||
                        (isChartMode &&
                          isCustomChartMode &&
                          !chartPrompt.trim())
                      }
                      aria-label="Generate analysis"
                      >
                      ▶️ Generate
                    </button>
                  </div>
                  <div className="backButton">
                    <button
                      onClick={() => setSelectedMode(Object.keys(modes)[0])}
                      aria-label="Back to main analysis modes"
                      >
                      <span className="icon">chevron_left</span>
                      Back
                    </button>
                  </div>
                </>
              ) : ( // Main Mode List
                <>
                  <div>
                    <h2>Explore this video via:</h2>
                    <div className="modeList">
                      {Object.entries(modes).map(([modeKey, {emoji}]) => (
                        <button
                          key={modeKey}
                          className={c('button', {
                            active: modeKey === selectedMode,
                          })}
                          onClick={() => setSelectedMode(modeKey)}
                           aria-pressed={modeKey === selectedMode}
                          >
                          <span className="emoji" aria-hidden="true">{emoji}</span> {modeKey}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <button
                      className="button generateButton"
                      onClick={() => onModeSelect(selectedMode)}
                      disabled={isLoading || !file}
                      aria-label="Generate analysis for selected mode"
                      >
                      ▶️ Generate
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              className="collapseButton"
              onClick={() => setShowSidebar(!showSidebar)}
              aria-label={showSidebar ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={showSidebar}
              >
              <span className="icon">
                {showSidebar ? 'chevron_left' : 'chevron_right'}
              </span>
            </button>
          </>
        )}

        <VideoPlayer
          url={vidUrl}
          requestedTimecode={requestedTimecode}
          timecodeList={timecodeList}
          jumpToTimecode={setRequestedTimecode}
          isLoadingVideo={isLoadingVideo}
          videoError={videoError}
          videoRef={videoRef}
          onUploadButtonClick={handleUploadButtonClick} // Pass handler to VideoPlayer
        />
      </section>

      <div className={c('tools', {inactive: !vidUrl || !file})}>
        <section
          className={c('output', {['mode' + activeMode?.replace(/[^a-zA-Z0-9]/g, '')]: activeMode})}
          ref={scrollRef}
          aria-live="polite"
          aria-busy={isLoading}
          >
          {isLoading ? (
            <div className="loading" role="status">
              Waiting for model<span>...</span>
            </div>
          ) : (
            <>
              {/* Section for Timecode-based output */}
              {timecodeList && timecodeList.length > 0 && (
                <div className="timecodeOutputSection">
                  {activeMode === 'Table' ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Description</th>
                          <th>Objects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timecodeList.map(({time, text, objects}, i) => (
                          <tr
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => setRequestedTimecode(timeToSecs(time))}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRequestedTimecode(timeToSecs(time))}}
                            >
                            <td>
                              <time dateTime={time}>{time}</time>
                            </td>
                            <td>{text}</td>
                            <td>{objects && objects.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : activeMode === 'Chart' ? (
                    <Chart
                      data={timecodeList.filter(item => typeof item.value === 'number') as Array<{time: string; value: number}>}
                      yLabel={isCustomChartMode ? chartLabel : modes.Chart.subModes?.[chartMode] || chartLabel}
                      jumpToTimecode={setRequestedTimecode}
                    />
                  ) : currentActiveModeConfig?.isList ? (
                    <ul>
                      {timecodeList.map(({time, text}, i) => (
                        <li key={i} className="outputItem">
                          <button
                            onClick={() => setRequestedTimecode(timeToSecs(time))}
                            aria-label={`Jump to ${time} - ${text}`}
                            >
                            <time dateTime={time}>{time}</time>
                            <p className="text">{text}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    timecodeList.map(({time, text}, i) => (
                      text ? <span
                        key={i}
                        className="sentence"
                        role="button"
                        tabIndex={0}
                        onClick={() => setRequestedTimecode(timeToSecs(time))}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRequestedTimecode(timeToSecs(time))}}
                        aria-label={`Jump to ${time} - ${text}`}
                        >
                        <time dateTime={time}>{time}</time>
                        <span>{text}</span>
                      </span> : null
                    ))
                  )}
                  {file && (
                    <button
                      className="button exportButton"
                      onClick={handleExport}
                      disabled={!file.name}
                      aria-label="Export annotations as VTT file"
                    >
                      <span className="icon" aria-hidden="true">download</span>
                      Export VTT File
                    </button>
                  )}
                </div>
              )}

              {/* Section for Register Analysis JSON output */}
              {currentActiveModeConfig?.isRegisterType && registerAnalysisResult && (
                <div className="registerOutputSection" style={{ marginTop: (timecodeList && timecodeList.length > 0) ? '20px' : '0' }}>
                  <h4>{activeMode} - Structured Analysis:</h4>
                  <pre className="jsonOutput">{JSON.stringify(registerAnalysisResult, null, 2)}</pre>
                </div>
              )}

              {/* Display Topic Segments */}
              {topicSegments && topicSegments.length > 0 && (
                <div className="topicSegmentsOutputSection" style={{ marginTop: '20px' }}>
                  <h4>Topic Segments:</h4>
                  <ul>
                    {topicSegments.map((segment, index) => (
                      <li key={index} className="outputItem"> {/* Using outputItem for similar styling */}
                        <button 
                          onClick={() => setRequestedTimecode(timeToSecs(segment.startTime))}
                          aria-label={`Jump to topic segment starting at ${segment.startTime}: ${segment.topicDescription}`}
                        >
                          <time dateTime={segment.startTime}>{segment.startTime}</time>
                          <span> - </span>
                          <time dateTime={segment.endTime}>{segment.endTime}</time>
                          <p className="text" style={{ marginLeft: '10px' }}>{segment.topicDescription}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fallback message if no data loaded and not loading */}
              {!isLoading && 
               (!timecodeList || timecodeList.length === 0) && 
               (!registerAnalysisResult || Object.keys(registerAnalysisResult).length === 0) && 
               (!topicSegments || topicSegments.length === 0) && // Include topicSegments in condition
               vidUrl && file && activeMode && (
                <p>No annotations or analysis generated for this mode yet, or the model didn't return any.</p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}