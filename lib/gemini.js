/**
 * Guardian AI — AI Gateway Abstraction Layer
 * All Gemini API calls route through this single interface.
 * This is the AIGateway described in the PRD — enables model-agnostic AI calls.
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model selection — use Flash for speed/cost, Pro for quality
const MODELS = {
  flash: 'gemini-2.0-flash',
  pro: 'gemini-1.5-pro',
};

/**
 * Core Gemini API call — all AI features route through here
 */
export async function callGemini(prompt, options = {}) {
  const {
    model = 'flash',
    temperature = 0.7,
    maxTokens = 2048,
    systemInstruction = null,
  } = options;

  const modelName = MODELS[model] || MODELS.flash;

  if (!GEMINI_API_KEY) {
    // Return simulated response when no API key is configured
    return getSimulatedResponse(prompt, options);
  }

  try {
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(
      `${GEMINI_API_URL}/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return getSimulatedResponse(prompt, options);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return getSimulatedResponse(prompt, options);
  }
}

/**
 * AssetSentinel — Analyze an image/media for content matching
 */
export async function analyzeMediaContent(description) {
  const prompt = `You are an AI content analysis engine for Guardian AI, a digital asset protection platform.

Analyze this media description and provide:
1. Content category (sports_broadcast, music, movie, news, photography, other)
2. Key identifying features (colors, logos, text, watermarks, people)
3. Estimated uniqueness score (0-100)
4. Suggested protection priority (low, medium, high, critical)

Media description: ${description}

Respond in valid JSON format:
{
  "category": "string",
  "features": ["string"],
  "uniquenessScore": number,
  "protectionPriority": "string",
  "summary": "string"
}`;

  return callGemini(prompt, {
    model: 'flash',
    temperature: 0.3,
    systemInstruction: 'You are Guardian AI\'s AssetSentinel engine. Always respond in valid JSON.',
  });
}

/**
 * AssetSentinel — Generate DMCA takedown notice
 */
export async function generateDMCANotice(assetName, infringementUrl, platform, orgName) {
  const prompt = `Generate a professional DMCA takedown notice with the following details:

- Rights holder organization: ${orgName}
- Protected asset: ${assetName}
- Infringing URL: ${infringementUrl}
- Platform: ${platform}
- Date: ${new Date().toISOString().split('T')[0]}

Include all legally required DMCA elements:
1. Identification of the copyrighted work
2. Identification of the infringing material
3. Contact information placeholder
4. Good faith statement
5. Accuracy statement
6. Authorization statement

Format as a professional legal notice.`;

  return callGemini(prompt, {
    model: 'flash',
    temperature: 0.2,
    maxTokens: 3000,
    systemInstruction: 'You are a legal document generator for Guardian AI. Generate professional, legally compliant DMCA takedown notices.',
  });
}

/**
 * CrisisCommand — Classify emergency type and severity
 */
export async function classifyCrisis(description, venueType, zoneInfo) {
  const prompt = `You are Guardian AI's CrisisCommand emergency classification engine.

Classify this emergency report:
- Report: "${description}"
- Venue type: ${venueType || 'unknown'}
- Zone: ${zoneInfo || 'unknown'}

Respond in valid JSON:
{
  "crisisType": "fire|medical|security|evacuation|natural_disaster|infrastructure",
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "immediateActions": ["string"],
  "requiredResponders": ["string"],
  "estimatedResponseTime": "string",
  "briefing": "string"
}`;

  return callGemini(prompt, {
    model: 'flash',
    temperature: 0.1,
    systemInstruction: 'You are Guardian AI\'s crisis classification AI. Respond ONLY in valid JSON. Lives depend on your accuracy.',
  });
}

/**
 * CrisisCommand — Generate response action plan 
 */
export async function generateCrisisActionPlan(crisisType, severity, venueCapacity, staffAvailable) {
  const prompt = `Generate an emergency response action plan:

Crisis type: ${crisisType}
Severity: ${severity}
Venue capacity: ${venueCapacity} people
Available staff: ${staffAvailable}

Generate a step-by-step action plan with:
1. Immediate actions (first 60 seconds)
2. Short-term response (1-5 minutes)
3. Coordination tasks
4. External service alerts needed
5. Evacuation guidance if applicable

Respond in valid JSON:
{
  "actions": [
    {
      "priority": 1,
      "task": "string",
      "assignTo": "role",
      "timeframe": "string",
      "critical": boolean
    }
  ],
  "externalAlerts": ["string"],
  "evacuationRequired": boolean,
  "estimatedResolutionTime": "string"
}`;

  return callGemini(prompt, {
    model: 'flash',
    temperature: 0.2,
    maxTokens: 3000,
    systemInstruction: 'You are Guardian AI\'s emergency response planner. Generate precise, actionable crisis response plans. Lives depend on clarity.',
  });
}

/**
 * Simulated responses when no API key is present
 */
function getSimulatedResponse(prompt, options) {
  if (prompt.includes('DMCA')) {
    return `DMCA TAKEDOWN NOTICE\n\nPursuant to 17 U.S.C. § 512(c)\n\nDate: ${new Date().toISOString().split('T')[0]}\n\nTo Whom It May Concern,\n\nI am writing to notify you of copyright infringement on your platform. The copyrighted work being infringed is owned by the rights holder organization identified below.\n\nThis notice is generated by Guardian AI's automated rights protection system.\n\n[This is a simulated DMCA notice - configure NEXT_PUBLIC_GEMINI_API_KEY for real AI-generated notices]`;
  }
  
  if (prompt.includes('Classify') || prompt.includes('emergency')) {
    return JSON.stringify({
      crisisType: 'security',
      severity: 'high',
      confidence: 0.87,
      immediateActions: ['Secure affected zone', 'Alert on-site medical team', 'Notify venue management'],
      requiredResponders: ['Security team', 'Medical staff', 'Management'],
      estimatedResponseTime: '2-4 minutes',
      briefing: 'Security incident detected. AI classification confidence: 87%. Immediate response recommended.'
    });
  }
  
  if (prompt.includes('action plan')) {
    return JSON.stringify({
      actions: [
        { priority: 1, task: 'Secure the perimeter of the affected zone', assignTo: 'Security Lead', timeframe: '0-60 seconds', critical: true },
        { priority: 2, task: 'Deploy medical team to zone', assignTo: 'Medical Officer', timeframe: '0-60 seconds', critical: true },
        { priority: 3, task: 'Activate venue PA system with instructions', assignTo: 'Operations Manager', timeframe: '1-2 minutes', critical: false },
        { priority: 4, task: 'Contact external emergency services', assignTo: 'Crisis Coordinator', timeframe: '1-3 minutes', critical: true },
      ],
      externalAlerts: ['Local police', 'Ambulance services'],
      evacuationRequired: false,
      estimatedResolutionTime: '15-30 minutes'
    });
  }

  return JSON.stringify({
    category: 'sports_broadcast',
    features: ['team logo', 'stadium footage', 'broadcast overlay'],
    uniquenessScore: 85,
    protectionPriority: 'high',
    summary: 'High-value sports broadcast content detected. Immediate protection recommended.'
  });
}
