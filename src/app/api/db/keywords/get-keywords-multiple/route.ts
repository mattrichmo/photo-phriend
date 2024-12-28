// get-keywords-multiple

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

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
    
    const isVerticalLayout = aspect < 1;
    
    let compositeWidth: number, compositeHeight: number, cellWidth: number, cellHeight: number;
    
    if (isVerticalLayout) {
        cellWidth = Math.round(MAX_SIZE / aspect);
        cellHeight = MAX_SIZE;
        compositeWidth = cellWidth * Math.min(numItems, 2);
        compositeHeight = cellHeight * Math.ceil(numItems / 2);
    } else {
        cellWidth = MAX_SIZE;
        cellHeight = Math.round(MAX_SIZE / aspect);
        compositeWidth = cellWidth * Math.ceil(numItems / 2);
        compositeHeight = cellHeight * Math.min(numItems, 2);
    }

    const composite = sharp({
        create: {
            width: compositeWidth,
            height: compositeHeight,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
        }
    });

    function getPosition(index: number): { row: number; col: number } {
        if (isVerticalLayout) {
            if (numItems <= 2) {
                return { row: 0, col: index };
            } else {
                const clockwisePositions = [
                    { row: 0, col: 0 },
                    { row: 0, col: 1 },
                    { row: 1, col: 1 },
                    { row: 1, col: 0 }
                ];
                return clockwisePositions[index];
            }
        } else {
            if (numItems <= 2) {
                return { row: index, col: 0 };
            } else {
                const clockwisePositions = [
                    { row: 0, col: 0 },
                    { row: 0, col: 1 },
                    { row: 1, col: 1 },
                    { row: 1, col: 0 }
                ];
                return clockwisePositions[index];
            }
        }
    }

    const overlays = await Promise.all(items.map(async (item, index) => {
        const { row, col } = getPosition(index);
        
        item.quadrantNum = index + 1;
        
        const buffer = await fs.readFile(path.join(process.cwd(), 'public', item.path));
        
        const resizedBuffer = await sharp(buffer)
            .resize(cellWidth, cellHeight, { 
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .toBuffer();

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

    const flatOverlays = overlays.flat();

    return composite.composite(flatOverlays).jpeg().toBuffer();
}

function groupImagesByAspectRatio(images: ImageToProcess[]): ImageToProcess[][] {
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
            if (Math.abs(currentAspect - groupAspect) / groupAspect <= 0.2) {
                currentGroup.push(image);
            } else {
                groups.push(currentGroup);
                currentGroup = [image];
            }
        }

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
    const batchDir = path.join(process.cwd(), 'public', 'photos', 'batchImages');
    await ensureDirectoryExists(batchDir);
    const filePath = path.join(batchDir, filename);
    
    try {
        const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
        await fs.writeFile(filePath, jpegBuffer);
        return path.join('photos', 'batchImages', filename);
    } catch (error) {
        console.error('Error saving composite image:', error);
        throw new Error('Failed to save composite image');
    }
}

export async function POST(req: Request) {
    let db;
    try {
        const { images, apiKey } = await req.json();

        if (!Array.isArray(images) || !apiKey) {
            return NextResponse.json(
                { error: 'Invalid input format or missing API key' },
                { status: 400 }
            );
        }

        const openai = new OpenAI({ apiKey });
        
        // Open database connection
        db = await open({
            filename: path.join(process.cwd(), 'db/photo-phriend.db'),
            driver: sqlite3.Database
        });

        const results: { id: string; keywords: string[] }[] = [];

        const processedImages = await processBatchItems(images);
        const imageGroups = groupImagesByAspectRatio(processedImages);
        console.log(`Processing ${imageGroups.length} groups of images`);

        for (const batchImages of imageGroups) {
            console.log(`Processing batch of ${batchImages.length} images`);
            
            const avgAspect = batchImages.reduce((sum, item) => sum + (item.dimensions?.aspect || 1), 0) / batchImages.length;
            
            const compositeBuffer = await createQuadrantImage(batchImages, avgAspect);
            const savedImagePath = await saveCompositeImage(compositeBuffer, avgAspect);
            
            const base64Image = `data:image/jpeg;base64,${compositeBuffer.toString('base64')}`;

            console.log(`Created composite image at: ${savedImagePath}`);

            const responseSchema = createResponseSchema(batchImages.length);

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

            // Begin transaction for this batch
            await db.run('BEGIN TRANSACTION');

            try {
                for (const item of batchImages) {
                    const quadrantKeywords = keywordResponse[item.quadrantNum];
                    if (quadrantKeywords) {
                        const allKeywords = [
                            ...quadrantKeywords.wide,
                            ...quadrantKeywords.narrow,
                            ...quadrantKeywords.specific
                        ];

                        // Delete existing keywords for this photo
                        await db.run('DELETE FROM photo_keywords WHERE photo_id = ?', [item.id]);

                        // Insert new keywords
                        for (const keyword of allKeywords) {
                            // First insert or get the keyword
                            const result = await db.get(`
                                INSERT INTO keywords (keyword)
                                VALUES (?)
                                ON CONFLICT(keyword) DO UPDATE SET keyword=keyword
                                RETURNING id, keyword
                            `, [keyword]);
                            
                            // Then create the photo-keyword association
                            await db.run(`
                                INSERT INTO photo_keywords (photo_id, keyword_id)
                                VALUES (?, ?)
                                ON CONFLICT(photo_id, keyword_id) DO NOTHING
                            `, [item.id, result.id]);
                        }

                        results.push({ id: item.id, keywords: allKeywords });
                    }
                }

                await db.run('COMMIT');
            } catch (error) {
                await db.run('ROLLBACK');
                throw error;
            }
        }

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error processing batch images:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process images' },
            { status: 500 }
        );
    } finally {
        if (db) {
            await db.close();
        }
    }
}

