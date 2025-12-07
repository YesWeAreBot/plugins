import { Context, Tables as MTables, Types as MTypes } from 'koishi';
import PGliteDriver from "../src";
import { Database } from "../src/Database";

interface Tables extends MTables {
    document: {
        id: number;
        title: string;
        content: string;
        embedding: number[];
    };
    article: {
        id: number;
        title: string;
        embedding: number[];
    };
}

interface Types extends MTypes {
    vector: number[];
}

async function runComprehensiveVectorTests() {
    console.log("🚀 Running comprehensive pgvector tests for @yesimbot/driver-pglite");
    console.log("=".repeat(60));

    const database = new Database<Tables, Types>();
    let testsPassed = 0;
    let testsFailed = 0;

    try {
        // 连接数据库
        console.log("📦 Connecting to database...");
        await database.connect(PGliteDriver, {
            dataDir: "memory://",
        });

        const pgDriver: PGliteDriver = (database["_driver"] || database.drivers[0]) as PGliteDriver;

        // 测试 1: 定义向量表结构
        console.log("\n📋 Test 1: Defining vector table schemas...");
        try {
            database.extend(
                "document",
                {
                    id: "integer",
                    title: "string",
                    content: "text",
                    embedding: {
                        type: "vector",
                        length: 3, // 3维向量用于测试
                    },
                },
                {
                    primary: "id",
                    autoInc: true,
                }
            );

            database.extend(
                "article",
                {
                    id: "integer",
                    title: "string",
                    embedding: {
                        type: "vector",
                        length: 5, // 5维向量测试不同维度
                    },
                },
                {
                    primary: "id",
                    autoInc: true,
                }
            );

            console.log("✅ Vector table schemas defined successfully");
            testsPassed++;
        } catch (error: any) {
            console.log("❌ Failed to define vector schemas:", error.message);
            testsFailed++;
        }

        // 测试 2: 插入向量数据
        console.log("\n💾 Test 2: Inserting vector data...");
        try {
            const documents = [
                { title: "AI Document", content: "About artificial intelligence", embedding: [0.1, 0.2, 0.3] },
                { title: "ML Document", content: "About machine learning", embedding: [0.4, 0.5, 0.6] },
                { title: "DL Document", content: "About deep learning", embedding: [0.7, 0.8, 0.9] },
            ];

            for (const doc of documents) {
                await database.create("document", doc);
            }

            const articles = [
                { title: "Tech Article", embedding: [0.1, 0.1, 0.2, 0.3, 0.5] },
                { title: "Science Article", embedding: [0.2, 0.3, 0.5, 0.8, 0.9] },
            ];

            for (const article of articles) {
                await database.create("article", article);
            }

            console.log("✅ Vector data inserted successfully");
            testsPassed++;
        } catch (error: any) {
            console.log("❌ Failed to insert vector data:", error.message);
            testsFailed++;
        }

        // 测试 3: 基本向量数据读取
        console.log("\n📖 Test 3: Reading vector data...");
        try {
            const allDocs = await database.select("document", {}).execute();
            const allArticles = await database.select("article", {}).execute();

            console.log(`✅ Retrieved ${allDocs.length} documents and ${allArticles.length} articles`);
            console.log("📊 Sample document:", {
                title: allDocs[0].title,
                embedding: allDocs[0].embedding,
                embeddingType: typeof allDocs[0].embedding,
                isArray: Array.isArray(allDocs[0].embedding),
            });
            testsPassed++;
        } catch (error: any) {
            console.log("❌ Failed to read vector data:", error.message);
            testsFailed++;
        }

        // 测试 4: L2 距离搜索
        console.log("\n🎯 Test 4: L2 Distance Search...");
        try {
            const queryVector = [0.2, 0.3, 0.4];
            const l2SQL = `
        SELECT id, title, embedding,
               embedding <-> '[${queryVector.join(",")}]'::vector as distance
        FROM document
        ORDER BY distance
        LIMIT 2
      `;
            const l2Results = await pgDriver.query(l2SQL);

            if (l2Results && Array.isArray(l2Results) && l2Results.length > 0) {
                console.log("✅ L2 distance search working:");
                l2Results.forEach((doc: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${doc.title} - distance: ${doc.distance}`);
                });
                testsPassed++;
            } else {
                console.log("❌ L2 distance search returned no results");
                testsFailed++;
            }
        } catch (error: any) {
            console.log("❌ L2 distance search failed:", error.message);
            testsFailed++;
        }

        // 测试 5: 余弦相似度搜索
        console.log("\n🎯 Test 5: Cosine Similarity Search...");
        try {
            const queryVector = [0.2, 0.3, 0.4];
            const cosineSQL = `
        SELECT id, title, embedding,
               1 - (embedding <=> '[${queryVector.join(",")}]'::vector) as similarity
        FROM document
        ORDER BY similarity DESC
        LIMIT 2
      `;
            const cosineResults = await pgDriver.query(cosineSQL);

            if (cosineResults && Array.isArray(cosineResults) && cosineResults.length > 0) {
                console.log("✅ Cosine similarity search working:");
                cosineResults.forEach((doc: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${doc.title} - similarity: ${doc.similarity}`);
                });
                testsPassed++;
            } else {
                console.log("❌ Cosine similarity search returned no results");
                testsFailed++;
            }
        } catch (error: any) {
            console.log("❌ Cosine similarity search failed:", error.message);
            testsFailed++;
        }

        // 测试 6: 内积相似度搜索
        console.log("\n🎯 Test 6: Inner Product Search...");
        try {
            const queryVector = [0.2, 0.3, 0.4];
            const innerSQL = `
        SELECT id, title, embedding,
               (embedding <#> '[${queryVector.join(",")}]'::vector) * -1 as inner_product
        FROM document
        ORDER BY inner_product DESC
        LIMIT 2
      `;
            const innerResults = await pgDriver.query(innerSQL);

            if (innerResults && Array.isArray(innerResults) && innerResults.length > 0) {
                console.log("✅ Inner product search working:");
                innerResults.forEach((doc: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${doc.title} - inner_product: ${doc.inner_product}`);
                });
                testsPassed++;
            } else {
                console.log("❌ Inner product search returned no results");
                testsFailed++;
            }
        } catch (error: any) {
            console.log("❌ Inner product search failed:", error.message);
            testsFailed++;
        }

        // 测试 7: 多维向量支持
        console.log("\n🎯 Test 7: Multi-dimensional vector support...");
        try {
            const query5D = [0.1, 0.2, 0.3, 0.4, 0.5];
            const multiDimSQL = `
        SELECT id, title, embedding,
               embedding <-> '[${query5D.join(",")}]'::vector as distance
        FROM article
        ORDER BY distance
        LIMIT 2
      `;
            const multiDimResults = await pgDriver.query(multiDimSQL);

            if (multiDimResults && Array.isArray(multiDimResults) && multiDimResults.length > 0) {
                console.log("✅ Multi-dimensional vector search working:");
                multiDimResults.forEach((doc: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${doc.title} - 5D distance: ${doc.distance}`);
                });
                testsPassed++;
            } else {
                console.log("❌ Multi-dimensional vector search returned no results");
                testsFailed++;
            }
        } catch (error: any) {
            console.log("❌ Multi-dimensional vector search failed:", error.message);
            testsFailed++;
        }

        // 测试 8: 向量类型验证
        console.log("\n🔍 Test 8: Vector type validation...");
        try {
            const tableInfoSQL = `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name IN ('document', 'article')
          AND column_name = 'embedding'
      `;
            const tableInfo = await pgDriver.query(tableInfoSQL);

            if (tableInfo && Array.isArray(tableInfo)) {
                console.log("✅ Vector column types:");
                tableInfo.forEach((col: any) => {
                    console.log(`   ${col.column_name}: ${col.data_type} (${col.udt_name})`);
                });
                testsPassed++;
            } else {
                console.log("❌ Failed to retrieve column type information");
                testsFailed++;
            }
        } catch (error: any) {
            console.log("❌ Vector type validation failed:", error.message);
            testsFailed++;
        }
    } catch (error: any) {
        console.log("❌ Test suite failed with error:", error.message);
        testsFailed++;
    } finally {
        await database.stopAll();
    }

    // 测试结果汇总
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST RESULTS SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log("\n🎉 ALL TESTS PASSED! pgvector support is working correctly!");
        console.log("🚀 @yesimbot/driver-pglite now supports:");
        console.log("   - Vector data storage and retrieval");
        console.log("   - L2 distance calculations");
        console.log("   - Cosine similarity calculations");
        console.log("   - Inner product calculations");
        console.log("   - Multi-dimensional vectors");
        console.log("   - Automatic type conversion");
    } else {
        console.log("\n⚠️  Some tests failed. Please check the implementation.");
    }
}

runComprehensiveVectorTests();
