/** @type {import('next').NextConfig} */
const repoName = process.env.GITHUB_REPOSITORY_NAME || ''
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGitHubPages && repoName ? `/${repoName}` : '',
  images: { unoptimized: true },
}

export default nextConfig
