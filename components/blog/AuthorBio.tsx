// components/blog/AuthorBio.tsx
import fs from 'fs'
import path from 'path'
import Image from 'next/image'
import Link from 'next/link'
import { siteConfig } from '@/content/metadata/site.config'
import { Icon } from '@/components/icons/Icon'

interface AuthorBioProps {
  author: string
}

const AUTHORS: Record<
  string,
  { name: string; bio: string; avatar: string; github: string; twitter?: string }
> = {
  'Adesh Shukla': {
    name: 'Adesh Shukla',
    bio: 'Frontend developer with a design background. Building DevStash — a developer ecosystem covering automation, AI workflows, and modern frontend systems.',
    avatar: '/images/avatar.webp',
    github: siteConfig.author.github,
    twitter: siteConfig.author.x,
  },
}

export function AuthorBio({ author }: AuthorBioProps) {
  const data = AUTHORS[author]
  if (!data) return null

  const avatarAbs = path.join(process.cwd(), 'public', data.avatar.replace(/^\//, ''))
  const avatarExists = fs.existsSync(avatarAbs)

  return (
    <div className="border-ds-border bg-ds-surface flex gap-4 rounded-xl border p-5">
      {/* Avatar */}
      <div className="border-ds-border relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2">
        {avatarExists ? (
          <Image src={data.avatar} alt={data.name} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="bg-ds-surface2 text-ds-accent flex h-full w-full items-center justify-center font-sans text-xl font-bold select-none">
            {data.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-ds-text mb-0.5 font-semibold">{data.name}</p>
        <p className="text-ds-muted mb-2 text-sm leading-relaxed">{data.bio}</p>
        <div className="text-ds-muted flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <Link
            href={data.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ds-accent flex items-center gap-1.5 transition-colors"
          >
            <Icon name="github" className="h-3.5 w-3.5" />
            GitHub
          </Link>
          {data.twitter && (
            <Link
              href={data.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ds-accent flex items-center gap-1.5 transition-colors"
            >
              <Icon name="x" className="h-3.5 w-3.5" />
              Twitter / X
            </Link>
          )}
          <Link href="/about" className="hover:text-ds-accent transition-colors">
            More about me →
          </Link>
        </div>
      </div>
    </div>
  )
}
