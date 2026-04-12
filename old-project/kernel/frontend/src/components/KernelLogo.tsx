const KernelLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="kernelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(25, 95%, 55%)" />
        <stop offset="100%" stopColor="hsl(35, 100%, 60%)" />
      </linearGradient>
    </defs>
    {/* Eye outer shape */}
    <path
      d="M50 20C28 20 10 50 10 50s18 30 40 30 40-30 40-30S72 20 50 20z"
      fill="url(#kernelGrad)"
    />
    {/* Iris circle cutout */}
    <circle cx="50" cy="50" r="16" fill="currentColor" className="text-card" />
    {/* Four-pointed star pupil */}
    <path
      d="M50 38 C52 46 54 48 62 50 C54 52 52 54 50 62 C48 54 46 52 38 50 C46 48 48 46 50 38z"
      fill="url(#kernelGrad)"
    />
  </svg>
);

export default KernelLogo;
