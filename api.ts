/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import {FunctionDeclaration, GoogleGenAI, Type} from '@google/genai';

const systemInstruction = `You are an AI assistant that analyzes video content. You MUST use the provided function calling tools to respond. Do NOT output any text, explanations, or markdown code blocks (e.g., \`\`\`python ... \`\`\`). Your entire response must be through function calls. If the user query can be addressed by a function, call it. Adhere strictly to the function's parameter schema.`;

// Use process.env.API_KEY as per guidelines
const client = new GoogleGenAI({apiKey: process.env.API_KEY});

async function generateContent(
  text: string,
  functionDeclarations: FunctionDeclaration[],
  fileMetadata: {uri: string, mimeType: string}, // Changed from Type.Blob to plain object
) {
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17', // Updated model
    contents: [
      {
        role: 'user',
        parts: [
          {text},
          {
            fileData: {
              mimeType: fileMetadata.mimeType,
              fileUri: fileMetadata.uri,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.5,
      tools: [{functionDeclarations}],
    },
  });

  return response;
}

async function uploadFile(file: File) {
  // Create a File object directly for the SDK, which is preferred.
  // The SDK will handle converting it to a Blob internally if needed.
  console.log('Uploading...');
  const uploadedFile = await client.files.upload({
    file: file, // Pass the File object directly
    config: {
      displayName: file.name,
    },
  });
  console.log('Uploaded.');
  console.log('Getting file metadata...');
  let getFile = await client.files.get({
    name: uploadedFile.name,
  });

  // Implement exponential backoff for retries
  let retries = 0;
  const maxRetries = 10; // Increased from 5 to 10
  let delay = 1000; // Initial delay 1 second

  while (getFile.state === 'PROCESSING' && retries < maxRetries) {
    console.log(`Current file status: ${getFile.state}. Retrying in ${delay / 1000}s... (Attempt ${retries + 1}/${maxRetries})`);
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
    getFile = await client.files.get({
      name: uploadedFile.name,
    });
    delay *= 2; // Exponential backoff
    retries++;
  }

  console.log(`Final file status: ${getFile.state}`);
  if (getFile.state === 'FAILED') {
    console.error('File processing failed:', getFile);
    throw new Error(`File processing failed. State: ${getFile.state}. URI: ${getFile.uri}`);
  }
  if (getFile.state !== 'ACTIVE') {
     console.error('File did not become active:', getFile);
     throw new Error(`File processing did not complete successfully. State: ${getFile.state}. URI: ${getFile.uri}`);
  }
  console.log('File processing complete and active.');
  return getFile; // This is a FileMetadata object
}

export {generateContent, uploadFile};