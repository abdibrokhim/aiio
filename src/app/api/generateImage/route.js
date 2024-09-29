import { NextResponse } from 'next/server'
import OpenAI from "openai";

const openai = new OpenAI({apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true});

export async function POST(req) {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
        return NextResponse.json(
          { error: { message: "Missing or invalid 'prompt' field." } },
          { status: 400 }
        );
    }

    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });
        const image_url = response.data[0].url;
        if (image_url) {
            console.log('openai image_url: ', image_url);
            return NextResponse.json({ imageUrl: image_url }, {
                status: 200,
            })
        } else {
            return new NextResponse(JSON.stringify({ error: { message: 'No image URL returned' } }), {
                status: 500,
            })
        }
    } catch (error) {
        console.error('Error in /api/generateImage:', error);
        return new NextResponse(JSON.stringify({ error: { message: error.message } }), {
            status: 500,
        })
    }
}