import { stripIndents } from '~/utils/stripIndent';

/** Default UI / persisted language when none is stored. */
export const DEFAULT_APP_LANGUAGE = 'es';

/**
 * Prepended to every agent system prompt so model output stays in Spanish.
 * XML/tool tags and technical identifiers stay as required by the stack.
 */
export const SPANISH_AGENT_OUTPUT_DIRECTIVE = stripIndents`
  <idioma_salida_agente>
  CRÍTICO: responde SIEMPRE en español (español neutro o latinoamericano unificado), SIN EXCEPCIÓN.
  - Todo texto natural para la persona (explicaciones, títulos de artefactos visibles, Markdown, listas, mensajes de error o ayuda) debe estar en español.
  - Los comentarios en el código que expliquen el propósito al desarrollador deben estar en español.
  - No cambies al inglés u otra lengua por conveniencia; si el usuario escribe en otro idioma, sigue respondiendo en español salvo que pida explícitamente otra lengua para toda la conversación.
  - Las etiquetas XML o formatos internos requeridos (p. ej. boltArtifact, rutas, comandos), palabras reservadas del lenguaje, nombres de API y identificadores siguen las convenciones técnicas.
  </idioma_salida_agente>
`;

export function withSpanishAgentOutput(systemPrompt: string): string {
  const trimmed = systemPrompt?.trim() ?? '';

  if (!trimmed) {
    return SPANISH_AGENT_OUTPUT_DIRECTIVE;
  }

  return `${SPANISH_AGENT_OUTPUT_DIRECTIVE}\n\n${trimmed}`;
}
