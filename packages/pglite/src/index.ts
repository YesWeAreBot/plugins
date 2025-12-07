import { Context, MaybeArray, Schema, Service } from "koishi";
import { Random} from "koishi";
import { EmbedModel, ModelDescriptor, Services } from "koishi-plugin-yesimbot";
import { Config } from "./config";
import type {
    Driver,
    Field,
    FlatKeys,
    FlatPick,
    Indexable,
    Model,
    Tables as MTables,
    Types as MTypes,
    Query,
    Relation,
    Row,
    Selection,
    Update,
    Values,
} from "minato";
import { Create, Database } from "./Database";
import { PGliteDriver } from "./Driver";
import path from "path";

declare module "koishi" {
    interface Services {
        "vector-driver": PGLiteService;
    }
}

export interface Types extends MTypes {
    vector: number[];
}

export interface Tables extends MTables {
    documents: {
        id: string;
        content: string;
        metadata: object | null;
        vector: Types["vector"];
    };
}

export interface VectorStore {
    create: Database<Tables, Types>["create"];
    extend: Database<Tables, Types>["extend"];
    get: Database<Tables, Types>["get"];
    remove: Database<Tables, Types>["remove"];
    select: Database<Tables, Types>["select"];
    upsert: Database<Tables, Types>["upsert"];
}

export default class PGLiteService extends Service<Config> {
    public static readonly name = "vector-driver";
    public static readonly Config: Schema<Config> = Config;
    public static readonly inject = [Services.Model];

    private db: Database<Tables, Types>;
    private embedModel!: EmbedModel;
    private driver!: PGliteDriver;
    
    constructor(ctx: Context, config: Config) {
        super(ctx, "vector-driver", true);
        this.config = config;
        this.db = new Database<Tables, Types>();
    }
    
    async start() {

        let dataDir: string;
        if (this.config.dataDir === "memory://") {
            dataDir = this.config.dataDir;
        } else {
            dataDir = path.resolve(this.ctx.baseDir, this.config.dataDir);
        }

        await this.db.connect(PGliteDriver, {
            dataDir,
            dimension: this.config.dimension,
            embeddingModel: this.config.embeddingModel,
        });

        this.driver = this.db.drivers[0] as PGliteDriver;

        try {
            if (this.config.embeddingModel) {
                this.embedModel = this.ctx[Services.Model].getEmbedModel(this.config.embeddingModel) as EmbedModel;
            }

            if (this.driver) {
                this.logger.info(`Using PGlite at ${this.driver.config.dataDir}`);
            } else {
                throw new Error("PGlite driver is not available.");
            }

            this.extend("documents", {
                id: "string",
                content: "string",
                metadata: "json",
                vector: {
                    type: "vector",
                    length: this.config.dimension,
                },
            });

            this.create("documents", {
                id: Random.id(),
                content: "This is a sample document.",
                metadata: { source: "system" },
                vector: new Array(this.config.dimension).fill(0),
            });

            const queryVector = new Array(this.config.dimension).fill(0.1);
            const l2SQL = `
        SELECT id, content, metadata,
               vector <-> '[${queryVector.join(",")}]'::vector as distance
        FROM documents
        ORDER BY distance
        LIMIT 2
      `;
            const results = await this.query<{ id: string; content: string; metadata: object; distance: number }[]>(l2SQL);
            this.logger.info("Sample query results:", results);

            this.logger.info("Vector store is ready.");
        } catch (error: any) {
            this.logger.warn(error.message);
        }
    }

    query<T extends any[] = any[]>(sql: string): Promise<T> {
        return this.driver.query<T>(sql);
    }

    create<K extends keyof Tables>(table: K, data: Create<Tables[K], Tables>): Promise<Tables[K]> {
        return this.db.create(table, data);
    }

    extend<K extends keyof Tables>(
        name: K,
        fields: Field.Extension<Tables[K], Types>,
        config?: Partial<Model.Config<FlatKeys<Tables[K]>>>
    ): void {
        this.db.extend(name, fields, config);
    }

    get<K extends keyof Tables>(table: K, query: Query<Tables[K]>): Promise<Tables[K][]>;
    get<K extends keyof Tables, P extends FlatKeys<Tables[K]> = any>(
        table: K,
        query: Query<Tables[K]>,
        cursor?: Driver.Cursor<P, Tables, K>
    ): Promise<FlatPick<Tables[K], P>[]> {
        return this.db.get(table, query, cursor);
    }

    remove<K extends keyof Tables>(table: K, query: Query<Tables[K]>): Promise<Driver.WriteResult> {
        return this.db.remove(table, query);
    }

    select<T>(table: Selection<T>, query?: Query<T>): Selection<T>;
    select<K extends keyof Tables>(
        table: K,
        query?: Query<Tables[K]>,
        include?: Relation.Include<Tables[K], Values<Tables>> | null
    ): Selection<Tables[K]> {
        return this.db.select(table, query, include);
    }

    upsert<K extends keyof Tables>(
        table: K,
        upsert: Row.Computed<Tables[K], Update<Tables[K]>[]>,
        keys?: MaybeArray<FlatKeys<Tables[K], Indexable>>
    ): Promise<Driver.WriteResult> {
        return this.db.upsert(table, upsert, keys);
    }
}