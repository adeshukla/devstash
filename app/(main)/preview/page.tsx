// app/(main)/preview/page.tsx
// DELETE THIS FILE BEFORE PRODUCTION

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import { Separator } from '@/components/ui/Separator'
import { CardSkeleton, BlogCardSkeleton } from '@/components/ui/SkeletonLoader'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

export default function PreviewPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-16 px-6 py-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { name: 'Home', url: '/' },
          { name: 'Preview', url: '/preview' },
        ]}
      />

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-ds-muted font-mono text-xs tracking-widest uppercase">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="primary">
            Small
          </Button>
          <Button size="md" variant="primary">
            Medium
          </Button>
          <Button size="lg" variant="primary">
            Large
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/about" variant="ghost">
            As Link →
          </Button>
          <Button href="https://github.com" target="_blank" variant="outline">
            External ↗
          </Button>
        </div>
      </section>

      <Separator />

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-ds-muted font-mono text-xs tracking-widest uppercase">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="blue">Next.js</Badge>
          <Badge variant="purple">TypeScript</Badge>
          <Badge variant="green" dot>
            Live
          </Badge>
          <Badge variant="warn" dot>
            Beta
          </Badge>
          <Badge variant="error">Deprecated</Badge>
          <Badge variant="muted">Draft</Badge>
          <Badge variant="default">Default</Badge>
        </div>
      </section>

      <Separator />

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-ds-muted font-mono text-xs tracking-widest uppercase">Cards</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card variant="default" padding="md">
            <p className="text-ds-muted text-sm">Default card</p>
          </Card>
          <Card variant="hover" padding="md">
            <p className="text-ds-muted text-sm">Hover card</p>
          </Card>
          <Card variant="accent" padding="md">
            <p className="text-ds-muted text-sm">Accent card</p>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-ds-muted font-mono text-xs tracking-widest uppercase">Inputs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" placeholder="you@devstash.me" />
          <Input label="With hint" placeholder="Username" hint="Only letters and numbers" />
          <Input label="With error" placeholder="Email" error="Invalid email address" />
          <Input label="Required" placeholder="Name" required />
        </div>
        <Textarea label="Message" placeholder="Write something..." rows={3} />
      </section>

      <Separator />

      {/* Separators */}
      <section className="space-y-4">
        <h2 className="text-ds-muted font-mono text-xs tracking-widest uppercase">Separators</h2>
        <Separator />
        <Separator label="or continue with" />
        <div className="flex h-16 items-center gap-4">
          <span className="text-ds-muted text-sm">Left</span>
          <Separator orientation="vertical" />
          <span className="text-ds-muted text-sm">Right</span>
        </div>
      </section>

      <Separator />

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="text-ds-muted font-mono text-xs tracking-widest uppercase">
          Skeleton Loaders
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <BlogCardSkeleton />
        </div>
      </section>
    </div>
  )
}
