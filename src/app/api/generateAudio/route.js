// File: /app/api/generateAudio/route.js

import { NextResponse } from 'next/server';

// Replace with the actual base URL of the sound generation API
const SOUND_GENERATION_API_URL = process.env.NEXT_PUBLIC_ELEVENLABS_SOUND_GENERATION_API_URL;

// Your API key for the sound generation service
const SOUND_GENERATION_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

export async function POST(req) {
  try {
    // Parse the JSON body of the request
    const { text, durationSeconds, promptInfluence } = await req.json();

    // Input Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: { message: "Missing or invalid 'text' field." } },
        { status: 400 }
      );
    }

    if (durationSeconds !== undefined) {
      if (typeof durationSeconds !== 'number' || durationSeconds < 0.5 || durationSeconds > 22) {
        return NextResponse.json(
          { error: { message: "'durationSeconds' must be a number between 0.5 and 22." } },
          { status: 400 }
        );
      }
    }

    if (promptInfluence !== undefined) {
      if (typeof promptInfluence !== 'number' || promptInfluence < 0 || promptInfluence > 1) {
        return NextResponse.json(
          { error: { message: "'promptInfluence' must be a number between 0 and 1." } },
          { status: 400 }
        );
      }
    }

    // Prepare the request payload
    const requestBody = {
      text,
      durationSeconds: durationSeconds || null, // If not provided, set to null to let the API determine
      promptInfluence: promptInfluence !== undefined ? promptInfluence : 0.3, // Default to 0.3
    };

    console.log('JSON.stringify(requestBody): ', JSON.stringify(requestBody));

    // Make the POST request to the sound generation API
    const response = await fetch(SOUND_GENERATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': SOUND_GENERATION_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from sound-generation API:', errorText);
      return NextResponse.json(
        { error: { message: 'Failed to generate sound effect.' } },
        { status: 500 }
      );
    }

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Convert the ArrayBuffer to a base64 string
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    // Return the base64 audio string to the frontend
    return NextResponse.json({ audio: base64Audio }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/generateAudio:', error);
    return NextResponse.json(
      { error: { message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}
