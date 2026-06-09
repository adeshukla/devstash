// components/blog/AuthorBio.tsx
import Image from 'next/image'
import Link from 'next/link'

interface AuthorBioProps {
  author: string
}

// Extend this when you have real author data
const AUTHORS: Record<
  string,
  {
    name: string
    bio: string
    avatar: string
    github: string
    twitter?: string
  }
> = {
  'Adesh Shukla': {
    name: 'Adesh Shukla',
    bio: 'Frontend developer with a design background. Building DevStash — a developer ecosystem covering automation, AI workflows, and modern frontend systems.',
    avatar: '/images/avatar.webp',
    github: 'https://github.com/adeshukla',
    twitter: 'https://twitter.com/adeshukla',
  },
}

export function AuthorBio({ author }: AuthorBioProps) {
  const data = AUTHORS[author]
  if (!data) return null

  return (
    <div className="border-ds-border bg-ds-surface flex gap-4 rounded-xl border p-5">
      <div className="border-ds-border relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2">
        <Image src={data.avatar} alt={data.name} fill className="object-cover" sizes="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-ds-text mb-0.5 font-semibold">{data.name}</p>
        <p className="text-ds-muted mb-2 text-sm leading-relaxed">{data.bio}</p>
        <div className="text-ds-muted flex gap-3 text-xs">
          <Link
            href={data.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ds-accent transition-colors"
          >
            GitHub
          </Link>
          {data.twitter && (
            <Link
              href={data.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ds-accent transition-colors"
            >
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
