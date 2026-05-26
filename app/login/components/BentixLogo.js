export function BentixLogo() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className="w-full h-full"
    >
      <defs>
        <linearGradient
          id="bentix-gradient-1"
          x1="31"
          y1="18"
          x2="129"
          y2="142"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#22c7ff" />
          <stop offset="0.48" stopColor="#006dff" />
          <stop offset="1" stopColor="#5b35ff" />
        </linearGradient>
        <linearGradient
          id="bentix-gradient-2"
          x1="122"
          y1="41"
          x2="42"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#46d5ff" />
          <stop offset="0.52" stopColor="#0f64ff" />
          <stop offset="1" stopColor="#4b22e8" />
        </linearGradient>
      </defs>

      <path
        d="M36 38 80 13l44 25v42L80 55 36 80V38Z"
        fill="url(#bentix-gradient-1)"
      />

      <path
        d="M36 80 80 55l44 25v42L80 147l-44-25V80Z"
        fill="url(#bentix-gradient-2)"
      />

      <path d="M80 55 124 80 80 105 36 80 80 55Z" fill="#0f5fff" />
      <path d="M80 13v42L36 80V38L80 13Z" fill="#18bfff" opacity="0.8" />
      <path d="M80 105v42l-44-25V80l44 25Z" fill="#2458ff" opacity="0.6" />

      <path
        d="M80 55v50l44-25-44-25Z"
        fill="#111f8f"
        opacity="0.42"
      />

      <path
        d="M36 38 80 13l44 25v84l-44 25-44-25V38Z"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
      />
    </svg>
  )
}
