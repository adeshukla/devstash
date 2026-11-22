import { getAllProjects } from '@/lib/markdown/projects'
import ProjectPage, { generateMetadata as projectMetadata } from '../../../projects/[slug]/page'

// A Lab tool's case study lives under the tool: /lab/<slug>/case-study. It is rendered by the same
// page as /projects/<slug>, but from a real route (not a rewrite) so the HTML built on the server
// is for the address the browser sees. With a rewrite, the nav's active link differed between
// server and browser and React reported a hydration error on every one of these pages.
// The old /projects/<slug> address for a Lab tool redirects here (next.config.ts).

export const dynamicParams = false

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.filter((p) => p.labTool).map((p) => ({ slug: p.slug }))
}

export const generateMetadata = projectMetadata
export default ProjectPage
