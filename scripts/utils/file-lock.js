import fs from 'fs/promises';
import { createHash } from 'crypto';

class FileLock {
    constructor() {
        this.locks = new Map();
    }

    async acquireLock(filePath, timeout = 5000) {
        const start = Date.now();
        
        while (this.locks.has(filePath)) {
            if (Date.now() - start > timeout) {
                throw new Error('Timeout waiting for file lock');
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        this.locks.set(filePath, Date.now());
    }

    releaseLock(filePath) {
        this.locks.delete(filePath);
    }

    async withLock(filePath, operation) {
        try {
            await this.acquireLock(filePath);
            return await operation();
        } finally {
            this.releaseLock(filePath);
        }
    }

    async readFileWithVersion(filePath) {
        return this.withLock(filePath, async () => {
            const content = await fs.readFile(filePath, 'utf-8');
            const version = createHash('md5').update(content).digest('hex');
            return { content: JSON.parse(content), version };
        });
    }

    async writeFileWithVersion(filePath, data, expectedVersion) {
        return this.withLock(filePath, async () => {
            if (expectedVersion) {
                const current = await fs.readFile(filePath, 'utf-8');
                const currentVersion = createHash('md5').update(current).digest('hex');
                
                if (currentVersion !== expectedVersion) {
                    throw new Error('Stale data - file was modified');
                }
            }

            const content = JSON.stringify(data, null, 2);
            await fs.writeFile(filePath, content);
            return createHash('md5').update(content).digest('hex');
        });
    }
}

export const fileLock = new FileLock();