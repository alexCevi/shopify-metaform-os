export function getCompareUrl(
  owner: string,
  repo: string,
  base: string,
  head: string,
) {
  return `https://github.com/${owner}/${repo}/compare/${base}...${head}`
}

export function getNewPrUrl(
  owner: string,
  repo: string,
  base: string,
  head: string,
) {
  return `https://github.com/${owner}/${repo}/compare/${base}...${head}?expand=1`
}
