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

import {max, min} from 'd3-array';
import {scaleBand, scaleLinear} from 'd3-scale';
import {line as d3Line} from 'd3-shape'; // Renamed to avoid conflict with line type
import {useEffect, useRef, useState}  from 'react';
import {timeToSecs} from './utils';

interface ChartDataPoint {
  time: string;
  value: number; // Ensure value is always number for chart
}

interface ChartProps {
  data: ChartDataPoint[];
  yLabel: string;
  jumpToTimecode: (timeInSeconds: number) => void;
}

export default function Chart({data, yLabel, jumpToTimecode}: ChartProps) {
  const chartRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const margin = 55;
  const xMax = width;
  const yMax = height - margin;

  // Ensure data is not empty for scales
  const safeData = data.length > 0 ? data : [{time: "0:00", value: 0}];

  const xScale = scaleBand()
    .range([margin + 10, xMax])
    .domain(safeData.map((d) => d.time))
    .padding(0.2);

  const vals = safeData.map((d) => d.value);
  const yMin = min(vals);
  const yMaximum = max(vals);
  
  const yScale = scaleLinear()
    .domain([yMin === undefined ? 0 : yMin, yMaximum === undefined ? 1 : yMaximum])
    .nice()
    .range([yMax, margin]);

  const yTicks = yScale.ticks(Math.floor(height / 70));

  const lineGenerator = d3Line<ChartDataPoint>()
    .x((d) => xScale(d.time) ?? 0) // Provide fallback for xScale
    .y((d) => yScale(d.value));

  useEffect(() => {
    const setSize = () => {
      if (chartRef.current) {
        setWidth(chartRef.current.clientWidth);
        setHeight(chartRef.current.clientHeight);
      }
    };

    setSize();
    const resizeObserver = new ResizeObserver(setSize);
    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }
    
    window.addEventListener('resize', setSize); // Keep this for broader compatibility

    return () => {
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current);
      }
      window.removeEventListener('resize', setSize);
    };
  }, []);

  if (!data || data.length === 0) {
    return <div className="chartPlaceholder">Not enough data to display chart.</div>;
  }

  return (
    <svg className="lineChart" ref={chartRef} aria-label={`Chart showing ${yLabel} over time`}>
      <g className="axisLabels yAxis" transform={`translate(0 ${0})`} aria-hidden="true">
        {yTicks.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick} transform={`translate(0 ${y})`}>
              <line x1={margin} x2={xMax} stroke="currentColor" strokeOpacity="0.2" />
              <text x={margin - 10} dy="0.25em" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
      </g>

      <g
        className="axisLabels xLabels timeLabels"
        transform={`translate(0 ${yMax + 5})`} 
        aria-hidden="true">
        {safeData.map(({time}, i) => {
          const xPos = xScale(time);
          if (xPos === undefined) return null; // Skip if xScale can't map time
          // Display fewer labels if too many, e.g., every nth label
          const tickFrequency = Math.max(1, Math.floor(safeData.length / (width / 60))); // Adjust 60 for desired label density
          if (i % tickFrequency !== 0 && i !== safeData.length -1) return null;

          return (
            <g key={i} transform={`translate(${xPos}, 0)`} className="xAxisTick">
               <line y1={0} y2={-5} stroke="currentColor" />
               <text
                y={15} // Position below the tick line
                textAnchor="middle"
                role="button"
                tabIndex={0}
                onClick={() => jumpToTimecode(timeToSecs(time))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') jumpToTimecode(timeToSecs(time))}}
                aria-label={`Jump to time ${time}`}
                >
                {time.length > 5 ? time.replace(/^00:/, '') : time}
              </text>
            </g>
          );
        })}
      </g>
      
      <g role="presentation">
        <path d={lineGenerator(safeData) || ""} fill="none" stroke="var(--gemini-blue)" strokeWidth="2"/>
      </g>

      <g role="list" aria-label="Data points">
        {safeData.map(({time, value}, i) => {
          const cx = xScale(time);
          const cy = yScale(value);
          if (cx === undefined) return null; // Skip if position is unknown

          return (
            <g key={i} className="dataPoint" role="listitem" aria-label={`Time: ${time}, Value: ${value}`}>
              <circle 
                cx={cx} 
                cy={cy} 
                r={4} 
                fill="var(--gemini-blue)"
                role="button"
                tabIndex={0}
                onClick={() => jumpToTimecode(timeToSecs(time))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') jumpToTimecode(timeToSecs(time))}}
                aria-label={`Data point at ${time}, value ${value}. Click to jump to this time in video.`}
                />
              <text x={cx} y={cy - 12} textAnchor="middle" fontSize="10px" fill="currentColor">
                {value}
              </text>
            </g>
          );
        })}
      </g>

      <text
        className="axisTitle yAxisTitle"
        x={-(yMax + margin) / 2} // Centered along the y-axis line
        y={margin / 2 - 10} // Positioned to the left of y-axis labels
        transform="rotate(-90)"
        textAnchor="middle"
        aria-hidden="true">
        {yLabel}
      </text>
    </svg>
  );
}