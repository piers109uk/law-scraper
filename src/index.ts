import { scrapeMNStatutes } from "./mn-statutes"
import { scrapeNYStatutes } from "./ny-laws"

async function main() {
  // await scrapeMNStatutes()
  await scrapeNYStatutes()
  console.log("Finished")
}

main()
