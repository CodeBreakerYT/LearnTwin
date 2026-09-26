import "server-only";

/**
 * Reads a server-side secret at request time.
 *
 * The name is passed as a variable on purpose: with a literal `process.env.GROQ_API_KEY` the compiler records
 * the variable's value in its build cache, which then lands in the build output and trips secret scanners.
 * Dynamic access keeps secret values out of build artifacts entirely.
 */
export const serverEnv = (name: string): string | undefined => process.env[name] || undefined;
