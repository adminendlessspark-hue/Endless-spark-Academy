
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

async function getClientGeminiApiKey(): Promise<string | null> {
  // 1. Check client-side environment variable
  const envKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY) as string | undefined;
  if (envKey) return envKey;

  // 2. Fallback to reading from Firestore settings/admin
  try {
    const docRef = doc(db, 'settings', 'admin');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().geminiApiKey || null;
    }
  } catch (e) {
    console.error("Failed to fetch client Gemini API key from Firestore:", e);
  }
  return null;
}

async function callGeminiDirectly(apiKey: string, params: {
  model: string;
  contents: any;
  config?: any;
}) {
  let modelName = params.model || "gemini-1.5-flash";
  if (modelName.startsWith("models/")) {
    modelName = modelName.substring(7);
  }
  // Use gemini-1.5-flash for maximum client stability & speed if unspecified or legacy preview is requested
  if (modelName.includes("gemini-3") || modelName.includes("preview")) {
    modelName = "gemini-1.5-flash";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Map roles correctly for Google's REST API ('model' instead of 'assistant')
  const mappedContents = params.contents.map((item: any) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: item.parts.map((p: any) => {
      if (typeof p === 'string') return { text: p };
      if (p.text) return { text: p.text };
      return p;
    })
  }));

  const body: any = {
    contents: mappedContents
  };

  if (params.config) {
    body.generationConfig = {
      temperature: params.config.temperature,
      responseMimeType: params.config.responseMimeType,
      responseSchema: params.config.responseSchema
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  return {
    ...data,
    text: text
  };
}

export async function generateGeminiContent(params: {
  model: string;
  contents: any;
  config?: any;
}) {
  let isBackendWorking = true;
  let response: Response | null = null;
  
  try {
    response = await fetch("/api/gemini/generate-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      isBackendWorking = false;
    }
  } catch (error) {
    console.warn("Express backend API `/api/gemini/generate-content` is unreachable, trying client fallback...", error);
    isBackendWorking = false;
  }

  // If backend call returned ok, try parsing as JSON
  if (isBackendWorking && response) {
    try {
      const clonedResponse = response.clone();
      const textContent = await clonedResponse.text();
      
      // If it's HTML, we hit a static host SPA fallback
      if (textContent.trim().startsWith("<!DOCTYPE") || textContent.trim().startsWith("<html")) {
        console.warn("Express endpoint returned HTML. Hosting environment is likely static-only.");
        isBackendWorking = false;
      } else {
        const data = JSON.parse(textContent);
        const text = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return {
          ...data,
          text: text
        };
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON response from backend, trying client fallback...", parseError);
      isBackendWorking = false;
    }
  }

  // Fallback: Make a direct request to Google Gemini API from client
  if (!isBackendWorking) {
    console.log("Using direct client-side Gemini fallback...");
    const apiKey = await getClientGeminiApiKey();
    if (apiKey) {
      return await callGeminiDirectly(apiKey, params);
    } else {
      throw new Error(
        "🔒 AI Connection Error: The server is hosted on a static provider without a running Node.js backend.\n\n" +
        "👉 To make the AI chatbot work, please:\n" +
        "1. Log into your Admin Panel.\n" +
        "2. Go to Settings > AI Settings.\n" +
        "3. Paste your Gemini API Key and save it."
      );
    }
  }

  throw new Error("Failed to generate content from Gemini");
}
