/**
 * @file provider-factory.js
 * @description Factory for creating and managing database providers
 *
 * This factory handles database provider selection and fallback mechanisms.
 */

const SupabaseDatabaseProvider = require('./providers/supabase-provider');
const PostgresqlDatabaseProvider = require('./providers/postgres-provider');

/**
 * Database provider types
 * @enum {string}
 */
const PROVIDER_TYPES = {
  SUPABASE: 'supabase',
  POSTGRESQL: 'postgresql'
};

/**
 * Factory for creating database providers
 */
class DatabaseProviderFactory {
  /**
   * Create a database provider
   * @param {string} type - Provider type ('supabase' or 'postgresql')
   * @param {Object} config - Provider configuration
   * @returns {Object} Database provider instance
   */
  static createProvider(type, config) {
    switch (type) {
      case PROVIDER_TYPES.SUPABASE:
        return new SupabaseDatabaseProvider(config);
      case PROVIDER_TYPES.POSTGRESQL:
        return new PostgresqlDatabaseProvider(config);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Create a hybrid provider with fallback capability
   * @param {Object} primaryConfig - Primary provider configuration
   * @param {Object} fallbackConfig - Fallback provider configuration
   * @returns {Object} Hybrid database provider
   */
  static createHybridProvider(primaryConfig, fallbackConfig) {
    // Create both providers
    const primaryProvider = this.createProvider(
      primaryConfig.type,
      primaryConfig.config
    );

    const fallbackProvider = fallbackConfig
      ? this.createProvider(fallbackConfig.type, fallbackConfig.config)
      : null;

    // Wrap with fallback logic
    return this._wrapWithFallback(primaryProvider, fallbackProvider);
  }

  /**
   * Wrap a provider with fallback capability
   * @param {Object} primary - Primary database provider
   * @param {Object} fallback - Fallback database provider
   * @returns {Object} Provider with fallback capability
   * @private
   */
  static _wrapWithFallback(primary, fallback) {
    // If no fallback provided, return primary provider
    if (!fallback) return primary;

    // Create a proxy to handle method calls with fallback
    return new Proxy(primary, {
      get(target, prop) {
        // Get the original property
        const originalProp = target[prop];

        // If it's not a function or it's not in our interface, return it directly
        if (typeof originalProp !== 'function' || prop === 'constructor' || prop.startsWith('_')) {
          return originalProp;
        }

        // Return a wrapped function that tries primary first, then fallback
        return async function (...args) {
          try {
            // Try the primary provider first
            const result = await originalProp.apply(target, args);
            return result;
          } catch (error) {
            // Log the error from primary provider
            console.error(`Primary provider error (${prop}):`, error);

            // Attempt to use fallback provider
            console.log(`Attempting fallback provider for method: ${prop}`);

            if (typeof fallback[prop] === 'function') {
              try {
                return await fallback[prop].apply(fallback, args);
              } catch (fallbackError) {
                console.error(`Fallback provider error (${prop}):`, fallbackError);
                // Re-throw the original error if fallback also fails
                throw error;
              }
            } else {
              // If the method doesn't exist on fallback, throw the original error
              throw error;
            }
          }
        };
      }
    });
  }
}

module.exports = {
  DatabaseProviderFactory,
  PROVIDER_TYPES
};
