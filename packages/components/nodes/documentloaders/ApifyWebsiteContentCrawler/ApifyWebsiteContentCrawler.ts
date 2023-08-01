import { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { TextSplitter } from 'langchain/text_splitter'
import { ApifyDatasetLoader } from 'langchain/document_loaders/web/apify_dataset'
import { Document } from 'langchain/document'

class ApifyWebsiteContentCrawler_DocumentLoaders implements INode {
    label: string
    name: string
    description: string
    type: string
    icon: string
    version: number
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams

    constructor() {
        this.label = 'Apify Website Content Crawler'
        this.name = 'apifyWebsiteContentCrawler'
        this.type = 'Document'
        this.icon = 'apify-symbol-transparent.svg'
        this.version = 1.0
        this.category = 'Document Loaders'
        this.description = 'Load data from Apify Website Content Crawler'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Start URLs',
                name: 'urls',
                type: 'string',
                description: 'One or more URLs of pages where the crawler will start, separated by commas.',
                placeholder: 'https://js.langchain.com/docs/'
            },
            {
                label: 'Crawler type',
                type: 'options',
                name: 'crawlerType',
                options: [
                    {
                        label: 'Headless web browser (Chrome+Playwright)',
                        name: 'playwright:chrome'
                    },
                    {
                        label: 'Stealthy web browser (Firefox+Playwright)',
                        name: 'playwright:firefox'
                    },
                    {
                        label: 'Raw HTTP client (Cheerio)',
                        name: 'cheerio'
                    },
                    {
                        label: 'Raw HTTP client with JavaScript execution (JSDOM) [experimental]',
                        name: 'jsdom'
                    }
                ],
                description:
                    'Select the crawling engine, see <a target="_blank" href="https://apify.com/apify/website-content-crawler#crawling">documentation</a> for additional information.',
                default: 'playwright:firefox'
            },
            {
                label: 'Max crawling depth',
                name: 'maxCrawlDepth',
                type: 'number',
                optional: true,
                default: 1
            },
            {
                label: 'Max crawl pages',
                name: 'maxCrawlPages',
                type: 'number',
                optional: true,
                default: 3
            },
            {
                label: 'Additional input',
                name: 'additionalInput',
                type: 'json',
                default: JSON.stringify({}),
                description:
                    'For additional input options for the crawler see <a target="_blank" href="https://apify.com/apify/website-content-crawler/input-schema">documentation</a>.',
                optional: true
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            }
        ]
        this.credential = {
            label: 'Connect Apify API',
            name: 'credential',
            type: 'credential',
            credentialNames: ['apifyApi']
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter

        // Get input options and merge with additional input
        const urls = nodeData.inputs?.urls as string
        const crawlerType = nodeData.inputs?.crawlerType as string
        const maxCrawlDepth = nodeData.inputs?.maxCrawlDepth as number
        const maxCrawlPages = nodeData.inputs?.maxCrawlPages as number
        const additionalInput =
            typeof nodeData.inputs?.additionalInput === 'object'
                ? nodeData.inputs?.additionalInput
                : JSON.parse(nodeData.inputs?.additionalInput as string)
        const input = {
            startUrls: urls.split(',').map((url) => ({ url: url.trim() })),
            crawlerType,
            maxCrawlDepth,
            maxCrawlPages,
            ...additionalInput
        }

        // Get Apify API token from credential data
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apifyApiToken = getCredentialParam('apifyApiToken', credentialData, nodeData)

        const loader = await ApifyDatasetLoader.fromActorCall('apify/website-content-crawler', input, {
            datasetMappingFunction: (item) =>
                new Document({
                    pageContent: (item.text || '') as string,
                    metadata: { source: item.url }
                }),
            clientOptions: {
                token: apifyApiToken
            }
        })

        return textSplitter ? loader.loadAndSplit(textSplitter) : loader.load()
    }
}

module.exports = { nodeClass: ApifyWebsiteContentCrawler_DocumentLoaders }
