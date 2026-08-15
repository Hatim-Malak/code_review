import mongoose from "mongoose";
import readline from "readline";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

await mongoose.connect(process.env.MONGODB_URI);
import fs from "fs";

const count = await mongoose.connection.collection("chats").countDocuments({ repoId: { $exists: false } });

console.log(`Found ${count} chat documents without repoId.`);
if (count === 0) {
    console.log("Nothing to migrate.");
    process.exit(0);
}

const chatsToBackup = await mongoose.connection.collection("chats").find({ repoId: { $exists: false } }).toArray();
fs.writeFileSync(path.join(__dirname, 'chats_backup.json'), JSON.stringify(chatsToBackup, null, 2));
console.log(`Backed up ${chatsToBackup.length} chats to chats_backup.json`);

rl.question(`Delete ${count} old conversations? (type YES to confirm): `, async (answer) => {
    if (answer === "YES") {
        const result = await mongoose.connection.collection("chats").deleteMany({ repoId: { $exists: false } });
        console.log(`Deleted ${result.deletedCount} documents.`);
    } else {
        console.log("Aborted.");
    }
    await mongoose.disconnect();
    rl.close();
});
