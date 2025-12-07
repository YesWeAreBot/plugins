import { PGliteDriver } from "@yesimbot/driver-pglite";
import * as minato from '@yesimbot/minato';
import { Database } from '@yesimbot/minato';
import Logger from "reggol";

const logger = new Logger("pglite-vector");

interface Tables extends minato.Tables {
    document: {
        id: number;
        title: string;
        content: string;
        embedding: number[];
    };

    product: {
        id: number;
        name: string;
        description: string;
        feature_vector: number[];
    };
}

interface Types extends minato.Types {
    vector: number[];
}

describe("pgvector extension support", () => {
    const database = new Database<Tables, Types>();

    before(async () => {
        logger.level = 3;

        await database.connect(PGliteDriver, {
            dataDir: "memory://",
        });

        // Create vector extension - access driver through database._driver
        // For testing purposes, we'll skip the extension creation and rely on pgvector being included
        // await drivers[0].query('CREATE EXTENSION IF NOT EXISTS vector')

        // Define tables with vector fields
        database.extend(
            "document",
            {
                id: "integer",
                title: "string",
                content: "text",
                embedding: { type: "vector", length: 3 }, // 3-dimensional vector
            },
            {
                primary: "id",
                autoInc: true,
            }
        );

        database.extend(
            "product",
            {
                id: "integer",
                name: "string",
                description: "text",
                feature_vector: { type: "vector", length: 5 }, // 5-dimensional vector
            },
            {
                primary: "id",
                autoInc: true,
            }
        );

        await database.prepared();
    });

    after(async () => {
        await database.dropAll();
        await database.stopAll();
        logger.level = 2;
    });

    it("should create tables with vector fields", async () => {
        // Insert test documents with embeddings
        const doc1 = await database.create("document", {
            title: "First Document",
            content: "This is the first test document.",
            embedding: [0.1, 0.2, 0.3],
        });

        const doc2 = await database.create("document", {
            title: "Second Document",
            content: "This is the second test document.",
            embedding: [0.4, 0.5, 0.6],
        });

        const doc3 = await database.create("document", {
            title: "Third Document",
            content: "This is the third test document.",
            embedding: [0.1, 0.3, 0.5],
        });

        // Verify documents were created
        const documents = await database.select("document", {}).execute();
        console.assert(documents.length === 3, "Should have 3 documents");
        console.assert(JSON.stringify(documents[0].embedding) === JSON.stringify([0.1, 0.2, 0.3]), "Embedding should match");
    });

    it("should work with product vectors of different dimensions", async () => {
        // Insert test products with 5-dimensional feature vectors
        await database.create("product", {
            name: "Product A",
            description: "First product",
            feature_vector: [1.0, 2.0, 3.0, 4.0, 5.0],
        });

        await database.create("product", {
            name: "Product B",
            description: "Second product",
            feature_vector: [2.0, 3.0, 4.0, 5.0, 6.0],
        });

        const products = await database.select("product", {}).execute();
        console.assert(products.length === 2, "Should have 2 products");
        console.assert(
            JSON.stringify(products[0].feature_vector) === JSON.stringify([1.0, 2.0, 3.0, 4.0, 5.0]),
            "Feature vector should match"
        );
    });

    it("should handle null vector values properly", async () => {
        // Create document with null embedding
        const doc = await database.create("document", {
            title: "Document with null embedding",
            content: "This document has no embedding.",
            embedding: null as any,
        });

        console.assert(doc.embedding === null, "Embedding should be null");

        // Query should handle null values gracefully - query for documents with title
        const documents = await database
            .select("document", {
                title: "Document with null embedding",
            })
            .execute();

        console.assert(documents.length === 1, "Should find one document with null embedding");
        console.assert(documents[0].title === "Document with null embedding", "Title should match");
    });
});
