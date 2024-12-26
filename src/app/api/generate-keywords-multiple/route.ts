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
and notable elements in the image. Return between 5-10 keywords per image. The images are in a quadrant and go clockwise.`;

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
    const cols = 2;
    const rows = Math.ceil(numItems / 2);
    
    // Calculate dimensions based on aspect ratio
    let cellWidth: number, cellHeight: number;
    if (aspect >= 1) {
        cellWidth = MAX_SIZE;
        cellHeight = Math.round(MAX_SIZE / aspect);
    } else {
        cellHeight = MAX_SIZE;
        cellWidth = Math.round(MAX_SIZE * aspect);
    }

    // Create composite canvas
    const compositeWidth = cellWidth * cols;
    const compositeHeight = cellHeight * rows;
    
    const composite = sharp({
        create: {
            width: compositeWidth,
            height: compositeHeight,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
        }
    });

    // Create a white background rectangle for the number
    const numberBgSize = 30;
    const numberBg = await sharp({
        create: {
            width: numberBgSize,
            height: numberBgSize,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
    }).png().toBuffer();

    // Prepare overlays with proper aspect ratio preservation
    const overlays = await Promise.all(items.map(async (item, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        
        const buffer = await fs.readFile(path.join(process.cwd(), 'public', item.path));
        
        // Use the item's dimensions to maintain aspect ratio
        const itemAspect = item.dimensions?.aspect || 1;
        let resizeWidth = cellWidth;
        let resizeHeight = cellHeight;
        let verticalOffset = 0;
        let horizontalOffset = 0;
        
        if (itemAspect > 1) {
            resizeHeight = Math.round(cellWidth / itemAspect);
            verticalOffset = Math.round((cellHeight - resizeHeight) / 2);
        } else {
            resizeWidth = Math.round(cellHeight * itemAspect);
            horizontalOffset = Math.round((cellWidth - resizeWidth) / 2);
        }

        // Create the image with number overlay
        const imageWithNumber = await sharp(buffer)
            .resize(resizeWidth, resizeHeight, { fit: 'fill' })
            .composite([
                {
                    input: numberBg,
                    top: 10,
                    left: 10,
                },
                {
                    input: {
                        text: {
                            text: item.quadrantNum.toString(),
                            font: 'sans',
                            width: 20,
                            height: 20,
                            rgba: true,
                        }
                    },
                    top: 15,
                    left: 15,
                }
            ])
            .toBuffer();

        return {
            input: imageWithNumber,
            top: row * cellHeight + verticalOffset,
            left: col * cellWidth + horizontalOffset
        };
    }));

    // Create composite and convert to JPEG
    return composite.composite(overlays).jpeg().toBuffer();
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

// Add this function to group images by aspect ratio
function groupImagesByAspect(items: ImageToProcess[]): ImageToProcess[][] {
    // First sort by aspect ratio
    const sortedItems = [...items].sort((a, b) => {
        const aspectA = a.dimensions?.aspect || 1;
        const aspectB = b.dimensions?.aspect || 1;
        return aspectA - aspectB;
    });

    const groups: ImageToProcess[][] = [];
    let currentGroup: ImageToProcess[] = [];

    for (const item of sortedItems) {
        const itemAspect = item.dimensions?.aspect || 1;
        
        // If this is the first item in a group, add it
        if (currentGroup.length === 0) {
            currentGroup.push(item);
            continue;
        }

        // Get the average aspect ratio of the current group
        const groupAspect = currentGroup.reduce((sum, groupItem) => 
            sum + (groupItem.dimensions?.aspect || 1), 0) / currentGroup.length;

        // If the aspect ratios are similar (within 20% of each other)
        // and the group isn't full, add to current group
        if (Math.abs(itemAspect - groupAspect) / groupAspect < 0.2 && currentGroup.length < 4) {
            currentGroup.push(item);
        } else {
            // Start a new group
            groups.push(currentGroup);
            currentGroup = [item];
        }
    }

    // Add the last group if it has items
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    return groups;
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

        // First process all items to get their dimensions
        const processedItems = await processBatchItems(images);
        
        // Group images by similar aspect ratios
        const aspectGroups = groupImagesByAspect(processedItems);

        // Process each aspect group
        for (const groupItems of aspectGroups) {
            // Calculate average aspect ratio for this group
            const avgAspect = groupItems.reduce((sum, item) => 
                sum + (item.dimensions?.aspect || 1), 0) / groupItems.length;
            
            // Create quadrant image for this group
            const compositeBuffer = await createQuadrantImage(groupItems, avgAspect);
            const savedImagePath = await saveCompositeImage(compositeBuffer, avgAspect);
            
            // Convert buffer to base64 with proper JPEG header
            const base64Image = `data:image/jpeg;base64,${compositeBuffer.toString('base64')}`;

            console.log(`Saved composite image to: ${savedImagePath}`);

            // Generate dynamic response schema based on number of items
            const responseSchema = createResponseSchema(groupItems.length);

            // Get keywords from OpenAI with dynamic schema
            const response = await openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Please analyze this composite image containing ${groupItems.length} photos arranged in a quadrant. 
Each photo is numbered clockwise starting from top-left (1) to ${
                                    groupItems.length === 2 ? 'top-right (2)' :
                                    groupItems.length === 3 ? 'bottom-right (3)' :
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

            // Update keywords for each image in the batch
            for (const item of groupItems) {
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

        // Save updated photos.json
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