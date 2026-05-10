/**
 * Base evaluator interface. Each evaluator implements:
 *   evaluate(alert, deps?) -> { triggered: boolean, payload: object }
 *
 * `alert` is a Prisma Alert record with included relations (skin, case, user).
 * Evaluator is responsible for fetching any extra data it needs (e.g. price history).
 * `deps` is an optional object with injectable dependencies for testing.
 */
export class BaseEvaluator {
  async evaluate(/* alert, deps */) {
    throw new Error('Evaluator must implement evaluate()');
  }
}
