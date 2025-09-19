/**
 * Digital Guidance Platform - Database Management
 * Handles all localStorage operations with error handling and data validation
 */

class DatabaseManager {
    constructor() {
        this.storageKeys = {
            userProfile: 'userProfile',
            quizResults: 'quizResults',
            timelineEvents: 'timelineEvents',
            collegeFavorites: 'collegeFavorites',
            courseComparisons: 'courseComparisons',
            appSettings: 'appSettings'
        };
        
        this.initializeDatabase();
    }

    /**
     * Initialize database with default values if needed
     */
    initializeDatabase() {
        try {
            // Check if localStorage is available
            if (!this.isLocalStorageAvailable()) {
                console.warn('localStorage is not available. Using memory storage.');
                this.useMemoryStorage = true;
                this.memoryStorage = {};
                return;
            }

            // Initialize default app settings
            if (!this.getData(this.storageKeys.appSettings)) {
                this.saveData(this.storageKeys.appSettings, {
                    theme: 'light',
                    language: 'en',
                    notifications: true,
                    autoSave: true,
                    createdAt: new Date().toISOString()
                });
            }

            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    /**
     * Check if localStorage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Save data to storage with error handling
     */
    saveData(key, data) {
        try {
            if (this.useMemoryStorage) {
                this.memoryStorage[key] = JSON.stringify(data);
                return true;
            }

            // Validate data before saving
            if (data === null || data === undefined) {
                console.warn(`Attempting to save null/undefined data for key: ${key}`);
                return false;
            }

            const serializedData = JSON.stringify(data);
            
            // Check storage quota
            if (this.isStorageQuotaExceeded(serializedData)) {
                console.warn('Storage quota exceeded. Cleaning up old data.');
                this.cleanupOldData();
            }

            localStorage.setItem(key, serializedData);
            console.log(`Data saved successfully for key: ${key}`);
            return true;
        } catch (error) {
            console.error(`Error saving data for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get data from storage with error handling
     */
    getData(key) {
        try {
            if (this.useMemoryStorage) {
                const data = this.memoryStorage[key];
                return data ? JSON.parse(data) : null;
            }

            const data = localStorage.getItem(key);
            if (!data) return null;

            return JSON.parse(data);
        } catch (error) {
            console.error(`Error retrieving data for key ${key}:`, error);
            // Remove corrupted data
            this.removeData(key);
            return null;
        }
    }

    /**
     * Remove data from storage
     */
    removeData(key) {
        try {
            if (this.useMemoryStorage) {
                delete this.memoryStorage[key];
                return true;
            }

            localStorage.removeItem(key);
            console.log(`Data removed successfully for key: ${key}`);
            return true;
        } catch (error) {
            console.error(`Error removing data for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Check if storage quota is exceeded
     */
    isStorageQuotaExceeded(newData) {
        try {
            const currentSize = new Blob([JSON.stringify(localStorage)]).size;
            const newDataSize = new Blob([newData]).size;
            const totalSize = currentSize + newDataSize;
            
            // Assume 5MB limit for localStorage
            return totalSize > 5 * 1024 * 1024;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clean up old data to free storage space
     */
    cleanupOldData() {
        try {
            // Remove old quiz results (keep only the latest)
            const quizResults = this.getData(this.storageKeys.quizResults);
            if (quizResults && Array.isArray(quizResults)) {
                const latestResult = quizResults[quizResults.length - 1];
                this.saveData(this.storageKeys.quizResults, latestResult);
            }

            // Remove old timeline events (keep only future events)
            const timelineEvents = this.getData(this.storageKeys.timelineEvents);
            if (timelineEvents && Array.isArray(timelineEvents)) {
                const now = new Date();
                const futureEvents = timelineEvents.filter(event => 
                    new Date(event.date) >= now
                );
                this.saveData(this.storageKeys.timelineEvents, futureEvents);
            }

            console.log('Old data cleaned up successfully');
        } catch (error) {
            console.error('Error cleaning up old data:', error);
        }
    }

    /**
     * Export all data for backup
     */
    exportAllData() {
        try {
            const allData = {};
            
            Object.values(this.storageKeys).forEach(key => {
                const data = this.getData(key);
                if (data) {
                    allData[key] = data;
                }
            });

            allData.exportDate = new Date().toISOString();
            allData.version = '1.0';

            return allData;
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * Import data from backup
     */
    importAllData(backupData) {
        try {
            if (!backupData || typeof backupData !== 'object') {
                throw new Error('Invalid backup data format');
            }

            Object.values(this.storageKeys).forEach(key => {
                if (backupData[key]) {
                    this.saveData(key, backupData[key]);
                }
            });

            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        try {
            if (this.useMemoryStorage) {
                return {
                    used: Object.keys(this.memoryStorage).length,
                    total: 'Memory Storage',
                    percentage: 0
                };
            }

            const totalSize = new Blob([JSON.stringify(localStorage)]).size;
            const maxSize = 5 * 1024 * 1024; // 5MB assumption
            
            return {
                used: this.formatBytes(totalSize),
                total: this.formatBytes(maxSize),
                percentage: Math.round((totalSize / maxSize) * 100)
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate user profile data
     */
    validateUserProfile(profileData) {
        const requiredFields = ['name', 'age', 'class'];
        const errors = [];

        requiredFields.forEach(field => {
            if (!profileData[field]) {
                errors.push(`${field} is required`);
            }
        });

        if (profileData.age && (profileData.age < 13 || profileData.age > 30)) {
            errors.push('Age must be between 13 and 30');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate quiz results data
     */
    validateQuizResults(quizData) {
        const errors = [];

        if (!quizData.answers || typeof quizData.answers !== 'object') {
            errors.push('Quiz answers are required');
        }

        if (!quizData.primaryStream) {
            errors.push('Primary stream is required');
        }

        if (!quizData.confidence || quizData.confidence < 0 || quizData.confidence > 100) {
            errors.push('Valid confidence score is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Create global database instance
window.dbManager = new DatabaseManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
}