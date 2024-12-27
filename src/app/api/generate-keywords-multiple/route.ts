import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { FileData } from '@/types/file';

interface ImageMetadata {
    width: number;
    height: number;
    aspect: number;
}

interface ImageToProcess {
    id: string;
    path: string;
    quadrantNum: number;
    dimensions?: ImageMetadata;
}

interface KeywordResponse {
    wide: string[];
    narrow: string[];
    specific: string[];
}

interface BatchKeywordResponse {
    [key: number]: KeywordResponse;
}

interface ResponseSchemaProperty {
    type: string;
    properties: {
        wide: { type: string; items: { type: string } };
        narrow: { type: string; items: { type: string } };
        specific: { type: string; items: { type: string } };
    };
    required: string[];
}

function createResponseSchema(numItems: number) {
    const properties: Record<string, ResponseSchemaProperty> = {};
    
    // Create schema properties for each quadrant that exists
    for (let i = 1; i <= numItems; i++) {
        properties[i] = {
            type: 'object',
            properties: {
                wide: { type: 'array', items: { type: 'string' } },
                narrow: { type: 'array', items: { type: 'string' } },
                specific: { type: 'array', items: { type: 'string' } }
            },
            required: ['wide', 'narrow', 'specific']
        };
    }

    return {
        type: 'object',
        properties,
        required: Array.from({ length: numItems }, (_, i) => String(i + 1))
    };
}

const systemPrompt = `You are a helpful AI that analyzes images and provides relevant keywords. 
Please provide specific, accurate, and relevant keywords that describe the main subjects, actions, 
and notable elements in the image. Return between 5-10 keywords per category. We want wide, narrow, and specific keywords. Wide keywords are broad, general descriptors. Narrow keywords are more specific. Specific keywords are very detailed or unique elements. The goal here is to produce good keywords for when we share this image. Some of them will be used on etsy, pinterest, instagram etc.
 The images are in a quadrant and go clockwise.`;

async function getImageMetadata(filepath: string): Promise<ImageMetadata> {
    try {
        const fullPath = path.join(process.cwd(), 'public', filepath);
        const metadata = await sharp(fullPath).metadata();
        
        if (!metadata.width || !metadata.height) {
            throw new Error('Could not get image dimensions');
        }

        return {
            width: metadata.width,
            height: metadata.height,
            aspect: metadata.width / metadata.height
        };
    } catch (error) {
        console.error(`Error getting metadata for ${filepath}:`, error);
        throw new Error(`Failed to process image metadata: ${filepath}`);
    }
}

async function processBatchItems(items: ImageToProcess[]): Promise<ImageToProcess[]> {
    return Promise.all(items.map(async (item) => {
        const metadata = await getImageMetadata(item.path);
        return {
            ...item,
            dimensions: metadata
        };
    }));
}

async function createQuadrantImage(items: ImageToProcess[], aspect: number): Promise<Buffer> {
    const MAX_SIZE = 500;
    const numItems = items.length;
    
    // Determine if we should use horizontal or vertical layout based on average aspect ratio
    const isVerticalLayout = aspect < 1;
    
    // Calculate dimensions to maintain max size of 500px on longest side
    let compositeWidth: number, compositeHeight: number, cellWidth: number, cellHeight: number;
    
    if (isVerticalLayout) {
        // Portrait images - arrange horizontally
        cellWidth = Math.round(MAX_SIZE / aspect);
        cellHeight = MAX_SIZE;
        compositeWidth = cellWidth * Math.min(numItems, 2);
        compositeHeight = cellHeight * Math.ceil(numItems / 2);
    } else {
        // Landscape images - arrange vertically
        cellWidth = MAX_SIZE;
        cellHeight = Math.round(MAX_SIZE / aspect);
        compositeWidth = cellWidth * Math.ceil(numItems / 2);
        compositeHeight = cellHeight * Math.min(numItems, 2);
    }

    // Create composite canvas
    const composite = sharp({
        create: {
            width: compositeWidth,
            height: compositeHeight,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
        }
    });

    // Calculate positions for clockwise arrangement
    function getPosition(index: number): { row: number; col: number } {
        if (isVerticalLayout) {
            // For portrait images (horizontal layout)
            if (numItems <= 2) {
                return { row: 0, col: index };
            } else {
                const clockwisePositions = [
                    { row: 0, col: 0 }, // top-left
                    { row: 0, col: 1 }, // top-right
                    { row: 1, col: 1 }, // bottom-right
                    { row: 1, col: 0 }  // bottom-left
                ];
                return clockwisePositions[index];
            }
        } else {
            // For landscape images (vertical layout)
            if (numItems <= 2) {
                return { row: index, col: 0 };
            } else {
                const clockwisePositions = [
                    { row: 0, col: 0 }, // top-left
                    { row: 0, col: 1 }, // top-right
                    { row: 1, col: 1 }, // bottom-right
                    { row: 1, col: 0 }  // bottom-left
                ];
                return clockwisePositions[index];
            }
        }
    }

    // Prepare overlays with proper aspect ratio preservation
    const overlays = await Promise.all(items.map(async (item, index) => {
        const { row, col } = getPosition(index);
        
        // Update the item's quadrant number to match its position
        item.quadrantNum = index + 1;
        
        const buffer = await fs.readFile(path.join(process.cwd(), 'public', item.path));
        
        // Resize image to fit cell while maintaining aspect ratio
        const resizedBuffer = await sharp(buffer)
            .resize(cellWidth, cellHeight, { 
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .toBuffer();

        // Create text overlay with quadrant number using SVG
        const svgText = Buffer.from(`
            <svg width="60" height="60">
                <rect x="0" y="0" width="60" height="60" fill="rgba(0,0,0,0.7)"/>
                <text x="30" y="40" font-family="Arial" font-size="32" fill="white" text-anchor="middle">${item.quadrantNum}</text>
            </svg>
        `);

        return [
            {
                input: resizedBuffer,
                top: row * cellHeight,
                left: col * cellWidth
            },
            {
                input: svgText,
                top: row * cellHeight + 10,
                left: col * cellWidth + 10
            }
        ];
    }));

    // Flatten overlays array
    const flatOverlays = overlays.flat();

    // Create composite and convert to JPEG
    return composite.composite(flatOverlays).jpeg().toBuffer();
}

// Add a function to group images by aspect ratio
function groupImagesByAspectRatio(images: ImageToProcess[]): ImageToProcess[][] {
    // Sort images by aspect ratio
    const sortedImages = [...images].sort((a, b) => {
        const aspectA = a.dimensions?.aspect || 1;
        const aspectB = b.dimensions?.aspect || 1;
        return aspectA - aspectB;
    });

    const groups: ImageToProcess[][] = [];
    let currentGroup: ImageToProcess[] = [];

    for (const image of sortedImages) {
        const currentAspect = image.dimensions?.aspect || 1;

        if (currentGroup.length === 0) {
            currentGroup.push(image);
        } else {
            const groupAspect = currentGroup[0].dimensions?.aspect || 1;
            // If aspects are within 20% of each other, add to current group
            if (Math.abs(currentAspect - groupAspect) / groupAspect <= 0.2) {
                currentGroup.push(image);
            } else {
                groups.push(currentGroup);
                currentGroup = [image];
            }
        }

        // If current group has 4 images or this is the last image, push group
        if (currentGroup.length === 4 || image === sortedImages[sortedImages.length - 1]) {
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
        }
    }

    return groups;
}

async function ensureDirectoryExists(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function saveCompositeImage(buffer: Buffer, aspect: number): Promise<string> {
    const timestamp = Date.now();
    const filename = `composite_${aspect}_${timestamp}.jpg`;
    
    // Create path for batch images
    const batchDir = path.join(process.cwd(), 'public', 'photos', 'batchImages');
    await ensureDirectoryExists(batchDir);
    
    const filePath = path.join(batchDir, filename);
    
    try {
        // Ensure we're writing a valid JPEG
        const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
        await fs.writeFile(filePath, jpegBuffer);
        // Return the path relative to public directory for potential frontend use
        return path.join('photos', 'batchImages', filename);
    } catch (error) {
        console.error('Error saving composite image:', error);
        throw new Error('Failed to save composite image');
    }
}

export async function POST(req: Request) {
    try {
        const { images, apiKey } = await req.json();

        if (!Array.isArray(images) || !apiKey) {
            return NextResponse.json(
                { error: 'Invalid input format or missing API key' },
                { status: 400 }
            );
        }

        const openai = new OpenAI({ apiKey });
        const photosPath = path.join(process.cwd(), 'public', 'photos.json');
        const photosContent = await fs.readFile(photosPath, 'utf-8');
        const photos: FileData[] = JSON.parse(photosContent);
        const results: { id: string; keywords: string[] }[] = [];

        // First process all images to get their dimensions
        const processedImages = await processBatchItems(images);
        
        // Group images by aspect ratio
        const imageGroups = groupImagesByAspectRatio(processedImages);
        console.log(`Processing ${imageGroups.length} groups of images`);

        // Process each group sequentially
        for (const batchImages of imageGroups) {
            console.log(`Processing batch of ${batchImages.length} images`);
            
            // Calculate average aspect ratio for the batch
            const avgAspect = batchImages.reduce((sum, item) => sum + (item.dimensions?.aspect || 1), 0) / batchImages.length;
            
            // Create quadrant image for this batch
            const compositeBuffer = await createQuadrantImage(batchImages, avgAspect);
            const savedImagePath = await saveCompositeImage(compositeBuffer, avgAspect);
            
            // Convert buffer to base64 with proper JPEG header
            const base64Image = `data:image/jpeg;base64,${compositeBuffer.toString('base64')}`;

            console.log(`Created composite image at: ${savedImagePath}`);

            // Generate dynamic response schema based on number of items in this batch
            const responseSchema = createResponseSchema(batchImages.length);

            // Get keywords from OpenAI for this batch
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Please analyze this composite image containing ${batchImages.length} photos arranged in a quadrant. 
Each photo is numbered clockwise starting from top-left (1) to ${
                                    batchImages.length === 2 ? 'top-right (2)' :
                                    batchImages.length === 3 ? 'bottom-right (3)' :
                                    'bottom-left (4)'
                                }. 
For each numbered photo, provide 10 keywords in three categories:
- wide: broad, general descriptors
- narrow: more specific descriptors
- specific: very detailed or unique elements
Please maintain the numbering in your response to match each photo's position.`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64Image
                                }
                            }
                        ]
                    }
                ],
                functions: [{ 
                    name: 'processKeywords', 
                    parameters: responseSchema 
                }],
                function_call: { name: 'processKeywords' },
                max_tokens: 1000,
            });

            const content = response.choices[0]?.message?.function_call?.arguments;
            if (!content) {
                throw new Error('No content in response');
            }

            const keywordResponse: BatchKeywordResponse = JSON.parse(content);

            // Update keywords for each image in this batch
            for (const item of batchImages) {
                const quadrantKeywords = keywordResponse[item.quadrantNum];
                if (quadrantKeywords) {
                    const allKeywords = [
                        ...quadrantKeywords.wide,
                        ...quadrantKeywords.narrow,
                        ...quadrantKeywords.specific
                    ];

                    // Update photos.json
                    const photoIndex = photos.findIndex(p => p.id === item.id);
                    if (photoIndex !== -1) {
                        photos[photoIndex].keywords = allKeywords;
                        results.push({ id: item.id, keywords: allKeywords });
                    }
                }
            }
        }

        // Save updated photos.json after all batches are processed
        await fs.writeFile(photosPath, JSON.stringify(photos, null, 2));

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error processing batch images:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process images' },
            { status: 500 }
        );
    }
} 