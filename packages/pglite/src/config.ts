import { PGliteOptions } from '@electric-sql/pglite'
import enUS from './locales/en-US.yml'
import zhCN from './locales/zh-CN.yml'
import { Schema } from 'koishi'
import { ModelDescriptor } from 'koishi-plugin-yesimbot/services/model'

export interface Config extends PGliteOptions {
    dataDir?: string
    dimension: number;
    embeddingModel?: ModelDescriptor;
}

export const Config: Schema<Config> = Schema
    .object({
        dataDir: Schema.string().default('memory://'),
        dimension: Schema.number().default(1536),
        embeddingModel: Schema.dynamic("modelService.embeddingModels"),
    })
    .i18n({
        'en-US': enUS,
        'zh-CN': zhCN,
    })