/**
 * Multi-model router for the question generation pipeline.
 * Routes each skill to the best-suited free model via OpenRouter.
 *
 * Model assignments:
 *  - quantitative → Qwen3 80B (strong math/reasoning)
 *  - verbal       → Llama 3.3 70B (strong language understanding)
 *  - logical      → Llama 3.3 70B (strong reasoning)
 *  - fallback     → Hermes 3 405B (heavy-weight backup for any skill)
 */

const MODELS = {
  quantitative: {
    primary: 'qwen/qwen3-next-80b-a3b-instruct:free',
    fallback: 'nousresearch/hermes-3-llama-3.1-405b:free',
    label: 'Qwen3-80B (math specialist)'
  },
  verbal: {
    primary: 'meta-llama/llama-3.3-70b-instruct',
    fallback: 'nousresearch/hermes-3-llama-3.1-405b:free',
    label: 'Llama-3.3-70B (language specialist)'
  },
  logical: {
    primary: 'meta-llama/llama-3.3-70b-instruct',
    fallback: 'nousresearch/hermes-3-llama-3.1-405b:free',
    label: 'Llama-3.3-70B (reasoning specialist)'
  },
  spatial: {
    // Spatial is generated programmatically — no LLM needed.
    primary: null,
    fallback: null,
    label: 'SVG Templates (programmatic)'
  }
};

function getModel(skill, useFallback = false) {
  const entry = MODELS[skill] || MODELS.verbal;
  return useFallback ? entry.fallback : entry.primary;
}

function getLabel(skill) {
  return (MODELS[skill] || MODELS.verbal).label;
}

module.exports = { MODELS, getModel, getLabel };
