import { NextResponse } from 'next/server'
import OpenAI from "openai";

const openai = new OpenAI({apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true});

const systemPrompt = `
  You will be provided with an original prompt and two user guesses in the following format:

  [original prompt]
  <original prompt goes here>

  [userA guess]
  <userA guess goes here>

  [userB guess]
  <userB guess goes here>

  Your task is to evaluate each user guess in relation to the original prompt on a scale from 1 to 10, where:
  - 10 means the guess perfectly matches the original prompt.
  - 1 means there is no similarity to the original prompt.

  **Evaluation Criteria:**
  1. **Accuracy**: How closely the guess aligns with the details of the original prompt.
  2. **Completeness**: Whether the guess addresses all aspects of the original prompt.
  3. **Creativity**: The uniqueness and imaginative interpretation of the guess while still relating to the original prompt.

  **Output Requirements:**
  - Return only two whole integer numbers separated by a comma, representing the scores for 'userA' and 'userB' respectively.
  - Example of correct output format: '4,7'
  - Do **not** include any additional text, explanations, or formatting.

  **Example Input:**
  [original prompt]
  Birds singing on a stage with a live band playing instrumental music.

  [userA guess]
  A bluebird performs at an outdoor concert with three musicians.

  [userB guess]
  A crowd enjoys a silent night in the park.

  **Expected Output:**
  7,2
`;


export async function POST(req) {
    try {
        const { prompt, userA, userB } = await req.json();
    
        if (!prompt || !userA || !userB) {
          return NextResponse.json(
            { error: { message: "Missing prompt or user guesses." } },
            { status: 400 }
          );
        }

        const fullPrompt = `
        [original prompt]
        ${prompt}
    
        [userA guess]
        ${userA}
    
        [userB guess]
        ${userB}
        `;
    
        const completion = await openai.chat.completions.create({
            messages: [
                {"role": "system", "content": systemPrompt},
                {"role": "user", "content": fullPrompt},
            ],
            model: "gpt-4o-mini",
        });
        const rawResponse = completion.choices[0].message.content.trim();
        const gradePattern = /^\d{1,2},\d{1,2}$/;
        if (!gradePattern.test(rawResponse)) {
            console.error('Unexpected response format:', rawResponse);
            return NextResponse.json(
              { error: { message: "Invalid response format from gpt-4o-mini." } },
              { status: 500 }
            );
        }
        const grades = rawResponse.split(",").map((grade) => parseInt(grade, 10));

        return NextResponse.json({ grades }, { status: 200 });
    } catch (error) {
        console.error('Error in api/evaluate:', error);
        return NextResponse.json(
          { error: { message: error.message || 'Internal Server Error' } },
          { status: 500 }
        );
    }
}