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
import {FunctionDeclaration, Type} from '@google/genai';

const functions: FunctionDeclaration[] = [
  {
    name: 'set_timecodes',
    description: 'Set the timecodes for the video with associated text',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              text: {
                type: Type.STRING,
              },
            },
            required: ['time', 'text'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_timecodes_with_objects',
    description:
      'Set the timecodes for the video with associated text and object list',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              text: {
                type: Type.STRING,
              },
              objects: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
            },
            required: ['time', 'text', 'objects'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_timecodes_with_numeric_values',
    description:
      'Set the timecodes for the video with associated numeric values',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              value: {
                type: Type.NUMBER,
              },
            },
            required: ['time', 'value'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_register_analysis_result',
    description: 'Set the analysis result from a register-based prompt as a JSON object.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        analysisResult: {
          type: Type.OBJECT,
          description: "The JSON object containing the analysis. Structure depends on the specific register prompt used."
          // Properties are not strictly defined here to allow flexibility for different register JSON structures
        }
      },
      required: ['analysisResult'],
    },
  },
  {
    name: 'set_topic_segments',
    description: "Sets the identified topic segments for the video. Each segment includes a start time, an end time, and a textual description of the topic discussed or shown during that segment.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        segments: {
          type: Type.ARRAY,
          description: "An array of topic segments identified in the video.",
          items: {
            type: Type.OBJECT,
            description: "A single topic segment with its time boundaries and description.",
            properties: {
              startTime: {
                type: Type.STRING,
                description: "The start time of the topic segment in HH:MM:SS or MM:SS format."
              },
              endTime: {
                type: Type.STRING,
                description: "The end time of the topic segment in HH:MM:SS or MM:SS format."
              },
              topicDescription: {
                type: Type.STRING,
                description: "A concise (1-2 sentences) description of the main topic covered in this segment of the video."
              }
            },
            required: ['startTime', 'endTime', 'topicDescription']
          }
        }
      },
      required: ['segments']
    }
  }
];

export default (fnMap) =>
  functions.map((fn) => ({
    ...fn,
    callback: fnMap[fn.name],
  }));