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

interface Mode {
  emoji: string;
  prompt: string | ((input: string) => string);
  isList?: boolean;
  subModes?: Record<string, string>;
  isRegisterType?: boolean; // Added to identify modes returning structured JSON
}

interface Modes {
  [key: string]: Mode;
}

const modes: Modes = {
  'A/V captions': {
    emoji: '👀',
    prompt: `For each scene in this video, generate captions that describe the \
    scene along with any spoken text placed in quotation marks. Place each \
    caption into an object sent to set_timecodes with the timecode of the caption \
    in the video.`,
    isList: true,
  },

  Paragraph: {
    emoji: '📝',
    prompt: `Generate a paragraph that summarizes this video. Keep it to 3 to 5 \
sentences. Place each sentence of the summary into an object sent to \
set_timecodes with the timecode of the sentence in the video.`,
  },

  'Key moments': {
    emoji: '🔑',
    prompt: `Generate bullet points for the video. Place each bullet point into an \
object sent to set_timecodes with the timecode of the bullet point in the video.`,
    isList: true,
  },

  Table: {
    emoji: '🤓',
    prompt: `Choose 5 key shots from this video and call set_timecodes_with_objects \
with the timecode, text description of 10 words or less, and a list of objects \
visible in the scene (with representative emojis).`,
  },

  Haiku: {
    emoji: '🌸',
    prompt: `Generate a haiku for the video. Place each line of the haiku into an \
object sent to set_timecodes with the timecode of the line in the video. Make sure \
to follow the syllable count rules (5-7-5).`,
  },

  Chart: {
    emoji: '📈',
    prompt: (input: string) =>
      `Generate chart data for this video based on the following instructions: \
${input}. Call set_timecodes_with_numeric_values once with the list of data values and timecodes.`,
    subModes: {
      Excitement:
        'for each scene, estimate the level of excitement on a scale of 1 to 10',
      Importance:
        'for each scene, estimate the level of overall importance to the video on a scale of 1 to 10',
      'Number of people': 'for each scene, count the number of people visible',
    },
  },

  Custom: {
    emoji: '🔧',
    prompt: (input: string) =>
      `Call set_timecodes once using the following instructions: ${input}`,
    isList: true,
  },

  'IT Workflow (T)': {
    emoji: '🛠️',
    prompt: `Analyze this video with a focus on IT workflow patterns.
Consider: 1. Technical procedures and system commands, 2. Software configuration steps, 3. System interaction patterns, 4. Technical terminology and jargon, 5. Step-by-step process structures.
Identify: - Main workflow topic, - Technical tools and commands used, - Configuration patterns, - System interaction sequences.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main workflow topic",
  "keywords": ["technical term 1", "command 2"],
  "relationship": "CONTINUATION",
  "confidence": 85
}`,
    isRegisterType: true,
  },

  'GenAI (T)': {
    emoji: '🤖',
    prompt: `Analyze this video with a focus on generative AI patterns.
Consider: 1. AI model architectures and parameters, 2. Prompt engineering techniques, 3. Model output patterns, 4. Implementation strategies, 5. API integration methods.
Identify: - Main AI topic, - Model-specific terminology, - Technical parameters, - Implementation patterns.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main AI topic",
  "keywords": ["model term 1", "parameter 2"],
  "relationship": "NEW",
  "confidence": 85
}`,
    isRegisterType: true,
  },

  'Tech Support (T)': {
    emoji: '🧰',
    prompt: `Analyze this video with a focus on technical support patterns.
Consider: 1. Problem descriptions and symptoms, 2. Diagnostic procedures, 3. Error patterns and messages, 4. Resolution steps, 5. Verification methods.
Identify: - Main support topic, - Technical issues, - Resolution patterns, - Verification steps.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main support topic",
  "keywords": ["error term 1", "solution 2"],
  "relationship": "SHIFT",
  "confidence": 85
}`,
    isRegisterType: true,
  },

  'Educational (T)': {
    emoji: '🎓',
    prompt: `Analyze this video with a focus on educational content patterns.
Consider: 1. Learning objectives and outcomes, 2. Key concepts and principles, 3. Instructional methods and approaches, 4. Examples and illustrations, 5. Assessment and practice elements.
Identify: - Main educational topic, - Key concepts, - Teaching patterns, - Learning activities.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main educational topic",
  "keywords": ["concept 1", "principle 2"],
  "relationship": "CONTINUATION",
  "confidence": 85
}`,
    isRegisterType: true,
  },

  'IT Workflow (M)': {
    emoji: '✨🛠️',
    prompt: `First, identify up to 5 key textual utterances or distinct spoken segments in this video related to IT workflow patterns. For each, call 'set_timecodes' with the 'time' and 'text' of the utterance.

Second, analyze the entire video with a focus on IT workflow patterns, considering both text and visual elements.
In the TEXT, consider: 1. Technical procedures and system commands, 2. Software configuration steps, 3. System interaction patterns, 4. Technical terminology and jargon, 5. Step-by-step process structures.
In the VISUALS, consider: 1. Software interfaces and tools shown, 2. Command-line environments, 3. Configuration screens, 4. Visual demonstrations of procedures, 5. Technical environments and setups.
Identify text-based topics, keywords, relationship, and confidence. Also identify visual topic, visual keywords, visual relationship, and a visual summary.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main workflow topic from text",
  "keywords": ["technical term 1", "command 2"],
  "relationship": "CONTINUATION",
  "confidence": 85,
  "visual_topic": "what is being shown visually",
  "visual_keywords": ["interface element 1", "visual cue 2"],
  "visual_relationship": "CONTINUATION",
  "visual_summary": "Brief description of what's being shown on screen"
}
Ensure you call 'set_timecodes' for the key textual segments BEFORE calling 'set_register_analysis_result' for the overall summary, if both types of information are generated.`,
    isRegisterType: true,
  },

  'GenAI (M)': {
    emoji: '✨🤖',
    prompt: `Analyze this video with a focus on generative AI patterns, considering both text and visual elements.
In the TEXT, consider: 1. AI model architectures and parameters, 2. Prompt engineering techniques, 3. Model output patterns, 4. Implementation strategies, 5. API integration methods.
In the VISUALS, consider: 1. AI interfaces and dashboards, 2. Visual demonstrations of AI capabilities, 3. Model output examples, 4. Prompt construction interfaces, 5. Visual representations of AI concepts.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main AI topic from text",
  "keywords": ["model term 1", "parameter 2"],
  "relationship": "NEW",
  "confidence": 85,
  "visual_topic": "what is being shown visually",
  "visual_keywords": ["interface element 1", "output example 2"],
  "visual_relationship": "NEW",
  "visual_summary": "Brief description of what's being shown on screen"
}`,
    isRegisterType: true,
  },

  'Tech Support (M)': {
    emoji: '✨🧰',
    prompt: `Analyze this video with a focus on technical support patterns, considering both text and visual elements.
In the TEXT, consider: 1. Problem descriptions and symptoms, 2. Diagnostic procedures, 3. Error patterns and messages, 4. Resolution steps, 5. Verification methods.
In the VISUALS, consider: 1. Error screens and messages, 2. Diagnostic tool interfaces, 3. Visual demonstrations of issues, 4. Step-by-step resolution visuals, 5. System state indicators.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main support topic from text",
  "keywords": ["error term 1", "solution 2"],
  "relationship": "SHIFT",
  "confidence": 85,
  "visual_topic": "what is being shown visually",
  "visual_keywords": ["error screen 1", "interface element 2"],
  "visual_relationship": "SHIFT",
  "visual_summary": "Brief description of what's being shown on screen"
}`,
    isRegisterType: true,
  },

  'Educational (M)': {
    emoji: '✨🎓',
    prompt: `Analyze this video with a focus on educational content patterns, considering both text and visual elements.
In the TEXT, consider: 1. Learning objectives and outcomes, 2. Key concepts and principles, 3. Instructional methods and approaches, 4. Examples and illustrations, 5. Assessment and practice elements.
In the VISUALS, consider: 1. Visual aids and diagrams, 2. Demonstrations and examples, 3. Educational interfaces, 4. Visual representations of concepts, 5. Learning activities shown on screen.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "topic": "main educational topic from text",
  "keywords": ["concept 1", "principle 2"],
  "relationship": "CONTINUATION",
  "confidence": 85,
  "visual_topic": "what is being shown visually",
  "visual_keywords": ["diagram 1", "visual example 2"],
  "visual_relationship": "CONTINUATION",
  "visual_summary": "Brief description of what's being shown on screen"
}`,
    isRegisterType: true,
  },

  'Topic Segmentation': {
    emoji: '🧩',
    prompt: `Please analyze the provided video to identify distinct conceptual and thematic segments.
Your goal is to break the video down into logical parts based on the topics discussed or shown.
For each identified segment, determine a precise start time and end time (in HH:MM:SS or MM:SS format).
Also, provide a concise (1-2 sentences) textual description that clearly summarizes the main topic of that segment.
Consider all available information in the video, including spoken words, visual elements, on-screen text, and overall narrative flow to make your segmentation decisions.
The segments should be sequential and cover the main parts of the video. Aim for segments that are neither too short (trivial) nor too long (covering multiple distinct topics).
Use the 'set_topic_segments' function to return all identified segments.`,
    isList: true, // Though not strictly a list output like A/V captions, this ensures the UI can handle it similarly if needed, or it can be ignored if display logic for topic segments is distinct.
  },

  'Segment Summary': {
    emoji: '📋',
    prompt: `Summarize this video and identify the key topics discussed.
Respond by calling the 'set_register_analysis_result' function with a single JSON object in the 'analysisResult' parameter, structured as follows:
{
  "summary": "A concise summary of the video content.",
  "topics": ["topic1", "topic2", "relevant_concept"]
}`,
    isRegisterType: true,
  },
};

export default modes;