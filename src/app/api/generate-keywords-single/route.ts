import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface PhotoData {
    id: string;
    exif: Record<string, unknown> | null;
    details: {
        full: {
            name: string;
            size: number;
            type: string;
            path: string;
        };
        optimized: {
            
            name: string;
            size: number;
            type: string;
            path: string;
        };

        minified?: {
            name: string;
            size: number;
            type: string;
            path: string;
        };
        thumb?: {
            name: string;
            size: number;
            type: string;
            path: string;
        };
    };
    keywords: string[];
    createdAt: string;
}

const systemPrompt = `You are a helpful AI that analyzes images and provides relevant keywords. 
Please provide specific, accurate, and relevant keywords that describe the main subjects, actions, 
and notable elements in the image. Return between 5-10 keywords per image.`;

const userPrompt = `Please analyze this image and provide relevant keywords that describe its contents. 
Focus on the main subjects, actions, and notable elements.`;

// Define the response schema as an object with a keywords array
const responseSchema = {
    type: 'object',
    properties: {
        keywords: {
            type: 'array',
            items: { type: 'string' }
        }
    },
    required: ['keywords']
};

export async function POST(req: Request) {
    try {
        const { imagePath, apiKey, imageId } = await req.json();

        if (!imagePath || !apiKey || !imageId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Read the image file
        const imageBuffer = await fs.readFile(path.join(process.cwd(), 'public', imagePath));

        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        const { width = 0, height = 0 } = metadata;

        // Calculate new dimensions ensuring longest side is 500px
        let resizeWidth, resizeHeight;
        if (width > 500 || height > 500) {
            if (width >= height) {
                resizeWidth = 500;
                resizeHeight = Math.round((height * 500) / width);
            } else {
                resizeHeight = 500;
                resizeWidth = Math.round((width * 500) / height);
            }
        } else {
            resizeWidth = width;
            resizeHeight = height;
        }

        // Process image with Sharp
        const processedImageBuffer = await sharp(imageBuffer)
            .resize(resizeWidth, resizeHeight, {
                fit: 'fill'
            })
            .toBuffer();

        // Convert to base64
        const processedBase64 = processedImageBuffer.toString('base64');

        // Initialize OpenAI client
        const openai = new OpenAI({ apiKey });

        // Make API request
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${processedBase64}`
                            }
                        }
                    ]
                }
            ],
            functions: [
                {
                    name: 'respondInJSON',
                    description: 'Returns a list of keywords as an array of strings.',
                    parameters: responseSchema,
                },
            ],
            function_call: { name: 'respondInJSON' },
            temperature: 0.5,
            max_tokens: 300,
        });

        // Extract keywords from response
        const content = response.choices[0]?.message?.function_call?.arguments;
        if (!content) {
            throw new Error('No content in response');
        }

        // Parse the JSON response
        const parsedResponse = JSON.parse(content);
        const keywords = parsedResponse.keywords;

        if (!Array.isArray(keywords)) {
            throw new Error('Invalid keywords format');
        }

        // Read and update photos.json
        const photosPath = path.join(process.cwd(), 'public', 'photos.json');
        const photosContent = await fs.readFile(photosPath, 'utf-8');
        let photos = JSON.parse(photosContent);

        // Ensure photos is an array
        if (!Array.isArray(photos)) {
            photos = [];
        }

        // Find and update the image
        const imageIndex = photos.findIndex((img: PhotoData) => img.id === imageId);
        if (imageIndex === -1) {
            throw new Error('Image not found in photos.json');
        }

        // Update keywords
        photos[imageIndex].keywords = keywords;

        // Write back to photos.json
        await fs.writeFile(photosPath, JSON.stringify(photos, null, 2));

        return NextResponse.json({
            id: imageId,
            keywords
        });

    } catch (error) {
        console.error('Error processing image:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process image' },
            { status: 500 }
        );
    }
}




