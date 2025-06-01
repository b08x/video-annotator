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
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'; // Added React import for CSSProperties
import {timeToSecs} from './utils';

const formatTime = (t: number) =>
  `${Math.floor(t / 60)}:${Math.floor(t % 60)
    .toString()
    .padStart(2, '0')}`;

interface TimecodeItem {
  time: string;
  text?: string;
  value?: number | string; // value can be number or string
}

interface VideoPlayerProps {
  url: string | null;
  timecodeList: TimecodeItem[] | null;
  requestedTimecode: number | null;
  isLoadingVideo: boolean;
  videoError: boolean;
  jumpToTimecode: (timeInSeconds: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>; 
  onUploadButtonClick?: () => void; // New prop for upload button
}

export default function VideoPlayer({
  url,
  timecodeList,
  requestedTimecode,
  isLoadingVideo,
  videoError,
  jumpToTimecode,
  videoRef,
  onUploadButtonClick, // Destructure new prop
}: VideoPlayerProps) {
  const [duration, setDuration] = useState(0);
  const [scrubberTime, setScrubberTime] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<string | undefined>(undefined);
  
  const currentSecs = videoRef.current?.currentTime || 0;
  const currentPercent = duration > 0 ? (currentSecs / duration) * 100 : 0;


  const timecodeListReversed = useMemo(
    () => timecodeList?.slice().reverse(),
    [timecodeList],
  );

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => console.error("Error attempting to play video:", error));
      }
    }
  }, [isPlaying, videoRef]);

  const updateDuration = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const updateTime = () => {
    if (videoRef.current && !isScrubbing) {
      const currentTime = videoRef.current.currentTime;
      const currentDuration = videoRef.current.duration;
      setScrubberTime(currentDuration > 0 ? currentTime / currentDuration : 0);

      if (timecodeListReversed) {
        const activeCaption = timecodeListReversed.find(
          (t) => timeToSecs(t.time) <= currentTime,
        );
        setCurrentCaption(activeCaption?.text);
      }
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  useEffect(() => {
    setScrubberTime(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [url, videoRef]);

  useEffect(() => {
    if (videoRef.current && requestedTimecode !== null && !isNaN(requestedTimecode)) {
      videoRef.current.currentTime = requestedTimecode;
    }
  }, [requestedTimecode, videoRef]);

  useEffect(() => {
    const onKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA' &&
        e.key === ' '
      ) {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', onKeyPress);

    return () => {
      document.removeEventListener('keydown', onKeyPress);
    };
  }, [togglePlay]);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && duration > 0) {
      const newScrubberTime = e.target.valueAsNumber;
      setScrubberTime(newScrubberTime);
      videoRef.current.currentTime = newScrubberTime * duration;
    }
  };
  

  return (
    <div className="videoPlayer">
      {url && !isLoadingVideo ? (
        <>
          <div className="videoContainer">
            <video
              src={url}
              ref={videoRef}
              onClick={togglePlay}
              onLoadedMetadata={updateDuration}
              onTimeUpdate={updateTime}
              onPlay={onPlay}
              onPause={onPause}
              preload="metadata"
              crossOrigin="anonymous"
              aria-label="Video content"
            />

            {currentCaption && (
              <div className="videoCaption" aria-live="assertive">{currentCaption}</div>
            )}
          </div>

          <div className="videoControls" aria-label="Video controls">
            <div className="videoScrubber">
              <input
                style={{ '--pct': `${currentPercent}%` } as React.CSSProperties}
                type="range"
                min="0"
                max="1"
                value={scrubberTime}
                step="0.000001"
                onChange={handleScrubberChange}
                onPointerDown={() => setIsScrubbing(true)}
                onPointerUp={() => setIsScrubbing(false)}
                aria-label="Video progress scrubber"
              />
            </div>
            <div className="timecodeMarkers">
              {timecodeList?.map(({time, text, value}, i) => {
                const secs = timeToSecs(time);
                const pct = duration > 0 ? (secs / duration) * 100 : 0;

                return (
                  <div
                    className="timecodeMarker"
                    key={i}
                    style={{left: `${pct}%`}}
                    aria-hidden="true"
                    >
                    <button
                      className="timecodeMarkerTick"
                      onClick={() => jumpToTimecode(secs)}
                      aria-label={`Jump to annotation at ${time}`}
                      >
                      <div />
                    </button>
                    <div
                      className={c('timecodeMarkerLabel', {right: pct > 50})}>
                      <div>{time}</div>
                      <p>{String(value !== undefined ? value : text || "")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="videoTime">
              <button onClick={togglePlay} aria-label={isPlaying ? "Pause video" : "Play video"}>
                <span className="icon" aria-hidden="true">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <span>{formatTime(currentSecs)} / {formatTime(duration)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="emptyVideo" role="status">
          {isLoadingVideo ? (
            <p>Processing video...</p>
          ) : videoError ? (
            <p>Error processing video. Please try a different file or check console for details.</p>
          ) : (
            <div className="uploadPrompt">
              <p>Drag and drop a video file here</p>
              {onUploadButtonClick && (
                <>
                  <p>or</p>
                  <button onClick={onUploadButtonClick} className="button selectFileButton" aria-label="Select video file from device">
                    Select File
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}