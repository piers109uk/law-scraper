import { Dataset, Log, PlaywrightCrawler } from "crawlee"
import { Page } from "playwright"

export interface IStatuteData {
  id: string
  url: string
  title: string | null
  /** section content */
  text: string | null
}

/** Pull data from a statute page */
async function extractStatuteData(page: Page, log: Log): Promise<IStatuteData> {
  const section = page.locator(".section").first()

  const url = page.url()
  const urlParts = url.split("/")
  const id = urlParts[urlParts.length - 1]

  const titleLocator = section.locator(".shn")
  const title = await titleLocator.textContent({ timeout: 1000 }).catch(() => {
    log.warning(`No title found for ${url}`)
    return null
  })
  if (!title) return { url, id, title, text: null }
  const innerTexts = await section.locator("p").allInnerTexts() // Extract the main text content from the paragraph(s)
  const text = innerTexts.join("\n") // Join paragraph texts if there are multiple paragraphs
  return { id, url, title, text }
}

export async function scrapeMNStatutes() {
  const partsDataset = await Dataset.open("parts")
  const chaptersDataset = await Dataset.open("chapters")

  const crawler = new PlaywrightCrawler({
    // maxConcurrency: 20,
    maxRequestsPerCrawl: 20,
    async requestHandler({ page, request, enqueueLinks, log }) {
      console.log(`Processing: ${request.url} with label ${request.label}`)

      if (request.label === "SECTION") {
        const statuteData = await extractStatuteData(page, log)
        if (statuteData) await Dataset.pushData(statuteData)
        log.info("statuteData", statuteData)
      } else if (request.label === "CHAPTER") chaptersDataset.pushData({ url: request.url })
      else if (request.label === "PART") partsDataset.pushData({ url: request.url })

      // enqueueLinks is magic and the labels are how you know what page you're on
      await enqueueLinks({
        globs: [
          { glob: "https://www.revisor.mn.gov/statutes/part/*", label: "PART" },
          { glob: "https://www.revisor.mn.gov/statutes/cite/*.*", label: "SECTION" },
          { glob: "https://www.revisor.mn.gov/statutes/cite/!(*.*)", label: "CHAPTER" },
        ],
      })
    },
  })

  await crawler.run(["https://www.revisor.mn.gov/statutes"])
}
