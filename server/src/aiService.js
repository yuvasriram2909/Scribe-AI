import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { detectSituation, formatNaturalSubject, buildNaturalBody, SUPPORTED_SITUATIONS } from './emailPatterns.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
let aiGen = null;
if (apiKey && apiKey.trim() !== '') {
  try {
    aiGen = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('GoogleGenerativeAI initialization warning:', err.message);
  }
}

const SYSTEM_INSTRUCTION = `You are an intelligent professional email situation detector and content generator.

SUPPORTED SITUATIONS:
1. 🚨 Emergency (Priority: High, Tone: Urgent)
2. ⚠️ Important / Necessary (Priority: High/Medium, Tone: Professional/Direct)
3. 💼 Official / Professional (Priority: Normal, Tone: Professional)
4. 📅 Leave / Holiday (Priority: Normal, Tone: Professional)
5. 📄 Resume / Job Application (Priority: Normal, Tone: Formal)
6. 🔄 Follow-up (Priority: Normal/Medium, Tone: Professional)
7. 💬 Casual (Priority: Normal, Tone: Friendly)
8. 🎉 Celebration / Occasion (Priority: Normal, Tone: Warm)

CRITICAL RULES:
1. Understand the user's intent instead of copying or quoting their sentence.
2. Generate natural descriptive subjects (5–12 words).
3. Generate natural, clear email bodies without labels like "Summary:", "User said:", "AI-generated:".
4. NEVER invent missing facts, names, dates, or medical reasons.
5. Return ONLY a valid JSON object matching the required schema.`;

/**
 * Fallback Natural Language Generator using Situation Library
 */
function fallbackCategorizeAndGenerate({ instruction, recipient, recipientName, userSignature, selectedSituation }) {
  const sitObj = selectedSituation 
    ? (SUPPORTED_SITUATIONS.find(s => s.name === selectedSituation || s.id === selectedSituation) || detectSituation(instruction))
    : detectSituation(instruction);

  const situation = sitObj.name;
  const category = sitObj.category;
  const priority = sitObj.priority;
  const tone = sitObj.tone;

  const subject = formatNaturalSubject(instruction, sitObj);
  const bodyData = buildNaturalBody({ instruction, situationObj: sitObj, recipientName, userSignature });

  return {
    situation,
    category,
    priority,
    tone,
    suggested_subject: subject,
    email_body: bodyData.body,
    greeting: bodyData.greeting,
    closing: bodyData.closing,
    attachment_recommended: situation.includes('Resume'),
    attachment_filename: situation.includes('Resume') ? 'resume.pdf' : null
  };
}

/**
 * AI Situation Categorization Service
 */
export async function categorizeInstruction({ instruction, recipient, relationship }) {
  const sitObj = detectSituation(instruction);

  if (!aiGen) {
    return {
      situation: sitObj.name,
      category: sitObj.category,
      priority: sitObj.priority,
      tone: sitObj.tone,
      attachment_recommended: sitObj.name.includes('Resume'),
      attachment_filename: sitObj.name.includes('Resume') ? 'resume.pdf' : null
    };
  }

  try {
    const model = aiGen.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this instruction: "${instruction}". Detect the exact situation, priority, and tone. Return JSON: {"situation": "${sitObj.name}", "category": "${sitObj.category}", "priority": "${sitObj.priority}", "tone": "${sitObj.tone}"}`;

    const result = await model.generateContent([SYSTEM_INSTRUCTION, prompt]);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const finalSit = parsed.situation || sitObj.name;
    const finalSitObj = SUPPORTED_SITUATIONS.find(s => s.name === finalSit) || sitObj;

    return {
      situation: finalSitObj.name,
      category: finalSitObj.category,
      priority: finalSitObj.priority,
      tone: finalSitObj.tone,
      attachment_recommended: finalSitObj.name.includes('Resume'),
      attachment_filename: finalSitObj.name.includes('Resume') ? 'resume.pdf' : null
    };
  } catch (err) {
    console.warn('Gemini categorization error, using fallback:', err.message);
    return {
      situation: sitObj.name,
      category: sitObj.category,
      priority: sitObj.priority,
      tone: sitObj.tone,
      attachment_recommended: sitObj.name.includes('Resume'),
      attachment_filename: sitObj.name.includes('Resume') ? 'resume.pdf' : null
    };
  }
}

/**
 * AI Email Generation Service
 */
export async function generateEmail({ instruction, recipient, recipientName, userSignature, situation, tone, priority }) {
  const fallback = fallbackCategorizeAndGenerate({ instruction, recipient, recipientName, userSignature, selectedSituation: situation });

  if (!aiGen) {
    return fallback;
  }

  try {
    const model = aiGen.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const userPrompt = `
Instruction: "${instruction}"
Target Situation: ${situation || fallback.situation}
Priority: ${priority || fallback.priority}
Tone: ${tone || fallback.tone}

Generate natural email prose without labels or meta commentary.
Return ONLY valid JSON:
{
  "situation": "${situation || fallback.situation}",
  "category": "${fallback.category}",
  "priority": "${priority || fallback.priority}",
  "tone": "${tone || fallback.tone}",
  "suggested_subject": "5-12 word clear subject line",
  "email_body": "Full body text",
  "greeting": "Dear ...",
  "closing": "Best regards,",
  "attachment_recommended": ${fallback.attachment_recommended},
  "attachment_filename": ${fallback.attachment_filename ? `"${fallback.attachment_filename}"` : null}
}`;

    const result = await model.generateContent([SYSTEM_INSTRUCTION, userPrompt]);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      situation: parsed.situation || fallback.situation,
      category: fallback.category,
      priority: parsed.priority || fallback.priority,
      tone: parsed.tone || fallback.tone,
      suggested_subject: parsed.suggested_subject || fallback.suggested_subject,
      email_body: parsed.email_body || fallback.email_body,
      greeting: parsed.greeting || fallback.greeting,
      closing: parsed.closing || fallback.closing,
      attachment_recommended: parsed.attachment_recommended ?? fallback.attachment_recommended,
      attachment_filename: parsed.attachment_filename || fallback.attachment_filename
    };
  } catch (err) {
    console.warn('Gemini generation API error, using pattern engine fallback:', err.message);
    return fallback;
  }
}
