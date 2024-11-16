import { scrapeMNStatutes } from "./mn-statutes"

async function main() {
  await scrapeMNStatutes()
  console.log("Finished")
}

main()
