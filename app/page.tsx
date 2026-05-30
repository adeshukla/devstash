export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F19] px-6">
      <div className="mx-auto max-w-2xl text-center">
        {/* Logo Mark */}
        <div className="mb-8 flex justify-center">
          <svg
            width="72"
            height="72"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100" height="100" rx="22" fill="#0B0F19" />
            <rect width="100" height="100" rx="22" stroke="#1F2937" strokeWidth="2" />
            <path
              d="M23 34L46 50L23 66"
              stroke="#3B82F6"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="53" y="57" width="26" height="7" rx="3.5" fill="#8B5CF6" />
          </svg>
        </div>

        {/* Wordmark */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#F3F4F6] md:text-5xl">
          <span className="text-[#3B82F6]">Dev</span>Stash
        </h1>

        {/* Tagline */}
        <p className="mb-2 text-lg text-[#9CA3AF]">A modern developer ecosystem</p>
        <p className="mb-10 text-sm text-[#9CA3AF]">
          Engineering · Automation · AI Workflows · Frontend Systems
        </p>

        {/* Status Badge */}
        <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827] px-5 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#F59E0B]" />
          <span className="font-mono text-sm text-[#9CA3AF]">Under Construction</span>
        </div>

        {/* Links */}
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://github.com/adeshukla"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-[#9CA3AF] transition-colors hover:text-[#3B82F6]"
          >
            GitHub →
          </a>
          <span className="text-[#1F2937]">|</span>

          <a
            href="mailto:TODO@devstash.me"
            className="font-mono text-sm text-[#9CA3AF] transition-colors hover:text-[#3B82F6]"
          >
            Contact →
          </a>
        </div>

        {/* Domain */}
        <p className="mt-12 font-mono text-xs text-[#1F2937]">devstash.me</p>
      </div>
    </main>
  )
}
