/*
 * Maximum tokens for response generation (updated for modern model capabilities)
 * This serves as a fallback when model-specific limits are unavailable
 * Modern models like Claude 3.5, GPT-4o, and Gemini Pro support 128k+ tokens
 */
export const MAX_TOKENS = 128000;

/*
 * Provider-specific default completion token limits
 * Used as fallbacks when model doesn't specify maxCompletionTokens
 */
export const PROVIDER_COMPLETION_LIMITS: Record<string, number> = {
  OpenAI: 4096, // Standard GPT models (o1 models have much higher limits)
  Github: 4096, // GitHub Models use OpenAI-compatible limits
  Anthropic: 64000, // Conservative limit for Claude 4 models (Opus: 32k, Sonnet: 64k)
  Google: 8192, // Gemini 1.5 Pro/Flash standard limit
  Cohere: 4000,
  DeepSeek: 8192,
  Groq: 8192,
  HuggingFace: 4096,
  Mistral: 8192,
  Ollama: 8192,
  OpenRouter: 8192,
  Perplexity: 8192,
  Together: 8192,
  xAI: 8192,
  LMStudio: 8192,
  OpenAILike: 8192,
  AmazonBedrock: 8192,
  Hyperbolic: 8192,

  /** OpenAI-compatible chat; output cap when model has no maxCompletionTokens (see Moonshot docs for current max). */
  Moonshot: 16384,
};

/*
 * Reasoning models that require maxCompletionTokens instead of maxTokens
 * These models use internal reasoning tokens and have different API parameter requirements
 *
 * Also fixed temperature (1) only — OpenAI rejects other values. Model ids from aggregators
 * look like "openai/o1-preview" or "openai/gpt-5", so we match after /, _, or start of string.
 */
export function isReasoningModel(modelName: string): boolean {
  /*
   * Segment after / or . (OpenRouter: "openai/o1-preview") or at start ("o1-mini").
   * These models need maxCompletionTokens + temperature 1 on OpenAI-compatible APIs.
   */
  if (/(?:^|[/_.-])(o1|o3)(?:[/_.-]|$)/i.test(modelName)) {
    return true;
  }

  // gpt-5* — must not match gpt-4, gpt-4o, etc.
  if (/(?:^|[/_.-])gpt-5(?:[/_.-]|$)/i.test(modelName)) {
    return true;
  }

  return false;
}

/**
 * Some APIs (OpenAI reasoning, Moonshot Kimi K2.5, etc.) reject any sampling temperature except 1.
 */
export function modelRequiresTemperatureOne(modelName: string): boolean {
  if (isReasoningModel(modelName)) {
    return true;
  }

  const id = modelName.toLowerCase();

  // Moonshot Kimi K2.5 — API: "invalid temperature: only 1 is allowed for this model"
  if (/kimi-k2[._-]5\b/i.test(id) || id.includes('kimi-k2.5')) {
    return true;
  }

  if (id.includes('kimi-thinking')) {
    return true;
  }

  return false;
}

// limits the number of model responses that can be returned in a single request
export const MAX_RESPONSE_SEGMENTS = 2;

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
  isLocked?: boolean;
  lockedByFolder?: string;
}

export interface Folder {
  type: 'folder';
  isLocked?: boolean;
  lockedByFolder?: string;
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yml',
];
