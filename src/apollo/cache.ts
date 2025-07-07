import { InMemoryCache } from '@apollo/client';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';

export const cache = new InMemoryCache({
    typePolicies: {
        Query: {
            fields: {
                // For offline mode - return data from cache
                user: {
                    read(existing) {
                        return existing;
                    }
                }
            }
        }
    }
});

// Setup persistence for offline support
export const setupCachePersistence = async () => {
    try {
        await persistCache({
            cache,
            storage: new LocalStorageWrapper(window.localStorage),
            debug: true,
            trigger: 'write' // Persist on every write
        });
    } catch (error) {
        console.error('Error setting up cache persistence:', error);
    }
};
