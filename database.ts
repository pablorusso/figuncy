import { join } from 'path';

export class Database {

    database: any;

    constructor(baseDir: string) {
        const databaseFile = join(baseDir, '.data.json');
        console.log(`Saving database at ${databaseFile}`);
        const JSONdb = require('simple-json-db');
        this.database = new JSONdb(databaseFile);
        if (!this.database.get('chatIds')) {
            this.database.set('chatIds', []);
        }
        if (!this.database.get('hasStock')) {
            this.database.set('hasStock', false);
        }
        console.log(`Existent ChatIds: ${this.getChatIds()}`);
        console.log(`Existent HasStock: ${this.getStock()}`);

    }

    updateStock(hasStock: boolean) {
        this.database.set('lastStockCheck', new Date().toISOString());
        const prevStock = this.database.get('hasStock') as boolean;
        if (prevStock != hasStock) {
            this.database.set('hasStock', hasStock);
            return true;
        }
        return false;
    }

    getStock(): boolean {
        return this.database.get('hasStock') as boolean;
    }

    getLastStockCheck(): string {
        return this.database.get('lastStockCheck') as string;
    }

    saveChatId(chatId: number): boolean {
        const chatIds = this.getChatIds();
        if (chatIds.indexOf(chatId) < 0) {
            chatIds.push(chatId);
            this.database.set('chatIds', chatIds);
            console.log(`SAVE. Existent ChatIds: ${this.getChatIds()}`);
            return true;
        }
        return false;
    }

    deleteChatId(chatId: number): boolean {
        const chatIds = this.getChatIds();
        const index = chatIds.indexOf(chatId)
        if (index >= 0) {
            chatIds.splice(index, 1);
            this.database.set('chatIds', chatIds);
            console.log(`DELETE. Existent ChatIds: ${this.getChatIds()}`);
            return true;
        }
        return false;
    }

    getChatIds(): number[] {
        return this.database.get('chatIds') as number[];
    }
}
