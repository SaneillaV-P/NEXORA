import { z } from "zod";

export type AiProvider = "none" | "gemini" | "anthropic";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

export type AiStatus = {
  provider: AiProvider;
  configured: boolean;
  keyVariable: "GEMINI_API_KEY" | "ANTHROPIC_API_KEY" | null;
};

function getProvider(): AiProvider {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase() || "none";
  if (configured === "none" || configured === "gemini" || configured === "anthropic") {
    return configured;
  }
  throw new Error("AI_PROVIDER doit être défini sur none, gemini ou anthropic.");
}

export function getAiStatus(): AiStatus {
  const provider = getProvider();
  const keyVariable = provider === "gemini"
    ? "GEMINI_API_KEY"
    : provider === "anthropic"
      ? "ANTHROPIC_API_KEY"
      : null;

  return {
    provider,
    configured: keyVariable !== null && Boolean(process.env[keyVariable]),
    keyVariable,
  };
}

export async function generateStructuredResponse<T>(
  options: {
    systemInstruction: string;
    prompt: string;
    schema: z.ZodType<T>;
    maxOutputTokens: number;
  },
): Promise<T | null> {
  const status = getAiStatus();
  if (!status.configured || status.provider === "none" || !status.keyVariable) return null;

  let text: string | undefined;
  if (status.provider === "gemini") {
    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 10_000, retryOptions: { attempts: 1 } },
    });
    const responseSchema = z.toJSONSchema(options.schema);
    delete responseSchema.$schema;
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        maxOutputTokens: options.maxOutputTokens,
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
      },
    });
    text = response.text;
    if (!text) throw new Error("La réponse Gemini ne contient aucun texte.");
  } else {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 10_000,
      maxRetries: 0,
    });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: options.maxOutputTokens,
      system: options.systemInstruction,
      messages: [{ role: "user", content: options.prompt }],
    });
    text = response.content.find((block) => block.type === "text")?.text;
    if (!text) throw new Error("La réponse Anthropic ne contient aucun texte.");
  }

  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("La réponse IA n’est pas un objet JSON.");
  return options.schema.parse(JSON.parse(json));
}
