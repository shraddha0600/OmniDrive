import { cn } from '@/lib/utils'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 border border-white/20 transition-transform hover:scale-105', className)}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" role="img" aria-label="OmniDrive AI logo">
        <defs>
          <linearGradient id="omniGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="0.5" stopColor="#C084FC" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        {/* Outer Omni Ring */}
        <circle cx="20" cy="20" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" />
        <path
          d="M20 7C27.1797 7 33 12.8203 33 20C33 27.1797 27.1797 33 20 33"
          stroke="url(#omniGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Central AI Sparkle Star */}
        <path
          d="M20 12L21.4 17.6L27 19L21.4 20.4L20 26L18.6 20.4L13 19L18.6 17.6L20 12Z"
          fill="white"
        />
        <circle cx="27" cy="13" r="2" fill="#38BDF8" />
        <circle cx="13" cy="27" r="2" fill="#A855F7" />
      </svg>
    </div>
  )
}
