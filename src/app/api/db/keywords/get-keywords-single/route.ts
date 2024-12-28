import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

const systemPrompt = `You are a helpful AI that analyzes images and provides relevant keywords. 
Please provide specific, accurate, and relevant keywords that describe the main subjects, actions, 
and notable elements in the image. Return between 5-10 keywords per category. We want wide, narrow, and specific keywords. Wide keywords are broad, general descriptors. Narrow keywords are more specific. Specific keywords are very detailed or unique elements. The goal here is to produce good keywords for when we share this image. Some of them will be used on etsy, pinterest, instagram etc.`;

export async function POST(request: Request) {
    let db;
    try {
        const { photoId, apiKey } = await request.json();

        if (!photoId || !apiKey) {
            console.error('Missing parameters:', { photoId: !!photoId, apiKey: !!apiKey });
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const openai = new OpenAI({ apiKey });

        // Open database connection
        db = await open({
            filename: path.join(process.cwd(), 'db/photo-phriend.db'),
            driver: sqlite3.Database
        });

        // Get photo details from database
        const photo = await db.get(`
            SELECT p.*, pd.path
            FROM photos p
            LEFT JOIN photo_details pd ON p.id = pd.photo_id
            WHERE p.id = ? AND pd.version_type = 'optimized'
        `, [photoId]);

        if (!photo) {
            console.error('Photo not found:', photoId);
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: 404 }
            );
        }

        console.log('Found photo:', { id: photo.id, path: photo.path });

        // Read the image file
        const imagePath = path.join(process.cwd(), 'public', photo.path);
        console.log('Reading image from:', imagePath);
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        // Generate keywords using OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Please analyze this image and provide keywords in three categories: wide (broad, general descriptors), narrow (more specific descriptors), and specific (very detailed or unique elements)." },
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
                parameters: {
                    type: 'object',
                    properties: {
                        wide: { type: 'array', items: { type: 'string' } },
                        narrow: { type: 'array', items: { type: 'string' } },
                        specific: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['wide', 'narrow', 'specific']
                }
            }],
            function_call: { name: 'processKeywords' },
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.function_call?.arguments;
        if (!content) {
            throw new Error('No content in response');
        }

        const keywordResponse = JSON.parse(content);
        const allKeywords = [
            ...keywordResponse.wide,
            ...keywordResponse.narrow,
            ...keywordResponse.specific
        ];

        // Begin transaction
        await db.run('BEGIN TRANSACTION');

        try {
            // Delete existing keywords for this photo
            await db.run('DELETE FROM photo_keywords WHERE photo_id = ?', [photoId]);

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
                `, [photoId, result.id]);
            }

            await db.run('COMMIT');

            return NextResponse.json({
                id: photoId,
                keywords: allKeywords
            });

        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error generating keywords:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate keywords' },
            { status: 500 }
        );
    } finally {
        if (db) {
            await db.close();
        }
    }
}