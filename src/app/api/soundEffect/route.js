// File: /app/api/generateSoundDescriptors/route.js

import { NextResponse } from 'next/server';
import OpenAI from "openai";

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true});

// Define the system prompt as above
const systemPrompt = `
You are an AI assistant specialized in creating concise and contextually appropriate descriptors for sound effect generation in real-time video games. Your task is to receive a short text input representing an in-game event or action and generate a comma-separated list of descriptive keywords or phrases that will instruct an AI voice generator to produce authentic and immersive game sounds.

**Requirements:**

1. **Conciseness:** The output should consist of only a few descriptive words or short phrases, separated by commas. Aim for clarity and brevity.

2. **Relevance:** Ensure that each descriptor directly relates to the input event and is suitable for enhancing the gaming experience.

3. **Variety:** Use a diverse range of descriptors to cover different aspects of the sound, such as mood, intensity, and style.

4. **Format:** Return only the comma-separated descriptors as a single string. Do not include explanations, additional text, or formatting.

**Examples:**

- **Input:** "Game ended"
  
  **Output:** "Triumphant fanfare, Victory theme, Celebratory horns"

- **Input:** "New user joined"
  
  **Output:** "Welcoming chime, Friendly notification, Pleasant alert"

- **Input:** "9/10"
  
  **Output:** "Cheerful jingle, Uplifting melody, Lighthearted tune"

**Guidelines:**

- Focus on generating descriptors that evoke the intended emotional and atmospheric response within the game.
  
- Consider different sound elements such as instruments, tones, tempo, and emotional cues.
  
- Avoid vague or overly generic descriptors; aim for specificity that enhances the realism of the game environment.

- Ensure that the descriptors are appropriate for a wide range of game genres and scenarios.

**Your Objective:**

Given any short text input describing an in-game event, produce a well-thought-out list of descriptors that will guide the sound generation AI to create fitting and engaging audio effects. Maintain a consistent quality and style that aligns with dynamic and immersive gaming experiences.

**Do not** include any additional information, explanations, or text outside of the comma-separated descriptors.

**Input Example:**
"Player leveled up"

**Expected Output:**
"Ascending tones, Empowering sound, Level-up chime"

`;

export async function POST(req) {
  try {
    const { eventText } = await req.json();

    if (!eventText || typeof eventText !== 'string') {
      return NextResponse.json(
        { error: { message: "Missing or invalid 'eventText' field." } },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: eventText },
      ],
      temperature: 0.7, // Adjust as needed for creativity
      max_tokens: 50,    // Ensure brevity
      n: 1,
      stop: null,
    });

    const descriptors = completion.choices[0].message.content.trim();

    // Validate the response format (e.g., comma-separated)
    const validFormat = /^([^,]+,){1,}[^,]+$/;
    if (!validFormat.test(descriptors)) {
      console.error('Invalid descriptors format:', descriptors);
      return NextResponse.json(
        { error: { message: "Invalid descriptors format received from AI." } },
        { status: 500 }
      );
    }

    return NextResponse.json({ descriptors }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/generateSoundDescriptors:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal Server Error' } },
      { status: 500 }
    );
  }
}
