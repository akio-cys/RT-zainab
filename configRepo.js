// configRepo.js - IndexedDB helper for storing large configurations and media assets
(function() {
    const DB_NAME = 'ApologySiteDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'configStore';
    const KEY_NAME = 'site_config';

    function getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    window.ConfigRepo = {
        // Load configuration asynchronously
        load: async function(defaultConfig) {
            try {
                const db = await getDB();
                const config = await new Promise((resolve, reject) => {
                    const transaction = db.transaction(STORE_NAME, 'readonly');
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.get(KEY_NAME);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                if (config) {
                    return config;
                }
            } catch (err) {
                console.warn("IndexedDB load failed, falling back to LocalStorage:", err);
            }

            // Fallback to localStorage
            try {
                const local = localStorage.getItem('site_config');
                if (local) {
                    return JSON.parse(local);
                }
            } catch (err) {
                console.warn("LocalStorage load failed:", err);
            }

            // Fallback to default or window overrides
            return null;
        },

        // Save configuration asynchronously
        save: async function(config) {
            try {
                const db = await getDB();
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction(STORE_NAME, 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.put(config, KEY_NAME);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
                console.log("Configuration saved to IndexedDB successfully.");
            } catch (err) {
                console.warn("IndexedDB save failed, writing to LocalStorage:", err);
                try {
                    localStorage.setItem('site_config', JSON.stringify(config));
                } catch (localErr) {
                    console.error("LocalStorage write failed too:", localErr);
                    throw localErr; // Throw to show error on UI
                }
            }
        },

        // Delete configuration from IndexedDB and LocalStorage
        clear: async function() {
            try {
                const db = await getDB();
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction(STORE_NAME, 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.delete(KEY_NAME);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
                console.log("Configuration deleted from IndexedDB.");
            } catch (err) {
                console.warn("IndexedDB delete failed:", err);
            }

            try {
                localStorage.removeItem('site_config');
            } catch (err) {
                console.warn("LocalStorage remove failed:", err);
            }
        }
    };
})();
