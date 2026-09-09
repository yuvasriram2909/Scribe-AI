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

const SYSTEM_INSTRUCTION = `You are an elite corporate communications specialist and executive email strategist.
Write a completely authentic, sophisticated, original professional email tailored precisely to the user's situation and target tone.
DO NOT sound like an AI, formulaic bot, or generic chatbot. Write with the natural fluency, poise, and elegance of a seasoned corporate leader or tech recruiter.

ADVANCED PROFESSIONAL TONE CRITERIA:
- "Corporate Professional": Impeccable business etiquette, articulate, well-structured, balanced, and clear.
- "Executive / C-Suite": High-level, strategic, concise, direct, authoritative yet courteous. Focuses on outcomes and key decisions.
- "Recruiter / HR Response": Warm, courteous, structured acknowledgment, outlining next steps, perfectly calibrated corporate communication (e.g., "Thank you for reaching out and sharing your application for the [Role] position. We have received your email and credentials. Our team is currently reviewing applications and will be in touch regarding the next steps in the hiring process.").
- "Candidate Application": Impactful, value-driven, credentialed outreach emphasizing technical competence and achievements.
- "Polite & Diplomatic": Tactful, considerate, constructive, relationship-preserving phrasing for delicate inquiries.
- "Action-Oriented & Concise": High efficiency, clear action items/bullet points, zero fluff, clear deadlines.
- "Formal & Authoritative": Institutional rigor, elevated vocabulary, traditional professional letter standards.
- "Warm & Collaborative": Empathetic, partnership-focused, friendly yet thoroughly professional.
- "Persuasive & Pitch": Compelling value proposition, metric-backed, clear call-to-action.
- "Firm & Assertive": Unambiguous boundaries, decisive call-to-action, resolute tone.
- "Apologetic & Resolution": Sincere accountability, transparent corrective action, reassuring next steps.
- "Urgent & Time-Sensitive": Immediate priority, rapid clarity, critical timeline, direct escalation.

YOUR CORE RULES:
1. UNDERSTAND USER INTENT:
   Analyze the user's specific problem, situation, instruction, or subject.
   Generate the email body specifically tailored to that exact situation (e.g. leave request, work from home, recruiter acknowledgment, job application, meeting request, payment reminder, deadline extension).
   Do NOT generate generic boilerplate that ignores the user's actual situation.

2. DO NOT INVENT FACTUAL INFORMATION:
   Never invent dates, amounts, prices, names, company names, medical diagnoses, employee IDs, project names, or phone numbers.
   If specific details are provided, PRESERVE and USE them in the body.
   If important details are missing, use safe placeholders or general professional phrasing.

3. SUBJECT AND BODY MUST MATCH:
   The subject and body must directly correspond to each other.
   If the user provided a subject, preserve or refine it.
   If no subject was provided, create a concise, professional 5-10 word subject matching the body.

4. STRUCTURE & TONE:
   - Greeting (e.g. "Dear [Recipient Name/Title]," or "Hi [Recipient Name],")
   - Clear opening sentence stating the purpose
   - Relevant explanation and specific details based on the user's problem
   - Clear requested action or next step
   - Polite professional closing adapted to the selected tone (e.g. "Best regards," "Sincerely," "Respectfully yours,")
   - Do NOT include conversational commentary (e.g., "Here is your email:").

5. JSON RESPONSE FORMAT:
   Return ONLY a valid JSON object matching this schema:
   {
     "situation": "string",
     "category": "string",
     "priority": "High | Medium | Normal",
     "tone": "string",
     "suggested_subject": "Clear descriptive subject line",
     "email_body": "Full body text formatted with proper line breaks including greeting and closing",
     "greeting": "Dear Sir/Madam,",
     "closing": "Best regards,",
     "attachment_recommended": false,
     "attachment_filename": null
   }`;

/**
 * Fallback Natural Language Generator using Problem-Specific Situation Library
 */
function fallbackCategorizeAndGenerate({ instruction, subject, recipient, recipientName, userSignature, selectedSituation }) {
  const sitObj = selectedSituation 
    ? (SUPPORTED_SITUATIONS.find(s => s.name === selectedSituation || s.id === selectedSituation) || detectSituation(instruction || subject))
    : detectSituation(instruction || subject);

  const situation = sitObj.name;
  const category = sitObj.category;
  const priority = sitObj.priority;
  const tone = sitObj.tone;

  const resolvedSubject = formatNaturalSubject(instruction, sitObj, subject);
  const bodyData = buildNaturalBody({ instruction: instruction || subject, situationObj: sitObj, recipientName, userSignature });

  return {
    situation,
    category,
    priority,
    tone,
    suggested_subject: resolvedSubject,
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
export async function categorizeInstruction({ instruction, subject, recipient, relationship }) {
  const query = instruction || subject || '';
  const sitObj = detectSituation(query);

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
    const prompt = `Analyze this user input:
User Input / Situation: "${query}"
Recipient Context: ${recipient || 'Not specified'} (${relationship || 'General'})

Determine the exact situation category, priority (High/Medium/Normal), and appropriate professional tone.
Return valid JSON:
{
  "situation": "${sitObj.name}",
  "category": "${sitObj.category}",
  "priority": "${sitObj.priority}",
  "tone": "${sitObj.tone}"
}`;

    const result = await model.generateContent([SYSTEM_INSTRUCTION, prompt]);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const finalSit = parsed.situation || sitObj.name;
    const finalSitObj = SUPPORTED_SITUATIONS.find(s => s.name === finalSit || s.id === finalSit) || sitObj;

    return {
      situation: finalSitObj.name,
      category: finalSitObj.category,
      priority: parsed.priority || finalSitObj.priority,
      tone: parsed.tone || finalSitObj.tone,
      attachment_recommended: finalSitObj.name.includes('Resume'),
      attachment_filename: finalSitObj.name.includes('Resume') ? 'resume.pdf' : null
    };
  } catch (err) {
    console.warn('Gemini categorization notice (using situation pattern):', err.message);
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
export async function generateEmail({ instruction, subject, recipient, recipientName, relationship, userSignature, situation, tone, priority }) {
  const fallback = fallbackCategorizeAndGenerate({
    instruction,
    subject,
    recipient,
    recipientName,
    userSignature,
    selectedSituation: situation
  });

  if (!aiGen) {
    return fallback;
  }

  try {
    const model = aiGen.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const userPrompt = `
User Input / Problem / Situation: "${instruction || subject || 'General update'}"
User-Provided Subject (if any): "${subject || ''}"
Recipient: "${recipient || ''}" (Name: "${recipientName || ''}", Relationship: "${relationship || 'Professional'}")
Target Situation Category: ${situation || fallback.situation}
Priority: ${priority || fallback.priority}
Target Tone: ${tone || fallback.tone}

INSTRUCTIONS FOR GENERATION:
1. Write an email body specifically tailored to the user's situation/problem and the selected tone.
2. Incorporate all specific details provided (e.g. number of days, reasons, technical blockers, order details, job roles).
3. Do NOT invent fake dates, names, or amounts. Use safe placeholders if missing.
4. Ensure the subject and body match directly.
5. Format the email with an appropriate greeting, structured paragraphs (or bullet points if action-oriented), and a polite closing matching the tone.
6. Write with the natural fluency, poise, and sophistication of an authentic corporate professional.

Return valid JSON:
{
  "situation": "${situation || fallback.situation}",
  "category": "${fallback.category}",
  "priority": "${priority || fallback.priority}",
  "tone": "${tone || fallback.tone}",
  "suggested_subject": "${fallback.suggested_subject}",
  "email_body": "Full body text formatted with paragraphs and line breaks",
  "greeting": "Dear ...",
  "closing": "Best regards,",
  "attachment_recommended": ${fallback.attachment_recommended},
  "attachment_filename": ${fallback.attachment_filename ? `"${fallback.attachment_filename}"` : null}
}`;

    const result = await model.generateContent([SYSTEM_INSTRUCTION, userPrompt]);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    let finalBody = parsed.email_body || fallback.email_body;

    // If signature is provided and not already included in generated body, append it
    if (userSignature && userSignature.enabled && userSignature.name && !finalBody.includes(userSignature.name)) {
      const sigLines = [
        '',
        userSignature.name,
        userSignature.designation || '',
        userSignature.company || '',
        userSignature.phone ? `Phone: ${userSignature.phone}` : '',
        userSignature.website || ''
      ].filter(l => l !== '');
      finalBody = finalBody.trim() + '\n' + sigLines.join('\n');
    }

    return {
      situation: parsed.situation || fallback.situation,
      category: fallback.category,
      priority: parsed.priority || fallback.priority,
      tone: parsed.tone || fallback.tone,
      suggested_subject: parsed.suggested_subject || fallback.suggested_subject,
      email_body: finalBody,
      greeting: parsed.greeting || fallback.greeting,
      closing: parsed.closing || fallback.closing,
      attachment_recommended: parsed.attachment_recommended ?? fallback.attachment_recommended,
      attachment_filename: parsed.attachment_filename || fallback.attachment_filename
    };
  } catch (err) {
    console.warn('Gemini generation API error, using problem-specific fallback engine:', err.message);
    return fallback;
  }
}
