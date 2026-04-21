require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is required");
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("OutfittrDB");
        const result = await db.collection("Users").updateMany(
            { verified: { $exists: false } },
            { $set: { verified: true } }
        );

        console.log(`Users updated: ${result.modifiedCount}`);
    } finally {
        await client.close();
    }
}

main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
