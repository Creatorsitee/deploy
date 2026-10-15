import React from 'react';

interface FrameworkIconProps {
  frameworkKey: string;
  className?: string;
}

export default function FrameworkIcon({ frameworkKey, className = 'w-4 h-4' }: FrameworkIconProps) {
  const key = (frameworkKey || 'static').toLowerCase();

  switch (key) {
    case 'nextjs':
    case 'next':
      return (
        <svg className={className} viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id="mask0_next" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
            <circle cx="90" cy="90" r="90" fill="black" />
          </mask>
          <g mask="url(#mask0_next)">
            <circle cx="90" cy="90" r="90" fill="black" />
            <path d="M149.508 157.52L69.143 54H54V126H67.9701V71.8016L138.83 162.771C142.616 161.272 146.185 159.511 149.508 157.52Z" fill="white" />
            <rect x="115" y="54" width="14" height="72" fill="white" />
          </g>
        </svg>
      );

    case 'vite':
      return (
        <svg className={className} viewBox="0 0 256 257" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="vite-a" x1="41.08%" y1="0%" x2="58.92%" y2="100%">
              <stop offset="0%" stopColor="#FFEA83" />
              <stop offset="8.333%" stopColor="#FFDD35" />
              <stop offset="100%" stopColor="#FFA800" />
            </linearGradient>
            <linearGradient id="vite-b" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BD34FE" />
              <stop offset="100%" stopColor="#41D1FF" />
            </linearGradient>
          </defs>
          <path fill="url(#vite-b)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 002.323 0l117.915-21.517c5.457-.976 9.574 4.856 6.828 9.67z" />
          <path fill="url(#vite-a)" d="M185.432 0L106.32 153.21a2.802 2.802 0 01-5.18-.088L65.578 78.435a2.802 2.802 0 012.597-3.955h41.054a2.802 2.802 0 002.583-1.72L127.35 34.3a2.802 2.802 0 012.583-1.72h52.902a2.802 2.802 0 012.597 3.955z" />
        </svg>
      );

    case 'react':
    case 'create-react-app':
      return (
        <svg className={className} viewBox="-11.5 -10.23174 23 20.46348" xmlns="http://www.w3.org/2000/svg">
          <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
          <g stroke="#61dafb" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      );

    case 'vue':
      return (
        <svg className={className} viewBox="0 0 256 221" xmlns="http://www.w3.org/2000/svg">
          <path fill="#41B883" d="M204.8 0H256L128 220.8 0 0h97.92L128 51.2 158.08 0h46.72z" />
          <path fill="#34495E" d="M0 0l128 220.8L256 0h-51.2L128 132.48 51.2 0H0z" />
          <path fill="#41B883" d="M51.2 0L128 132.48 204.8 0h-46.72L128 51.2 97.92 0H51.2z" />
        </svg>
      );

    case 'nuxt':
    case 'nuxtjs':
      return (
        <svg className={className} viewBox="0 0 256 182" xmlns="http://www.w3.org/2000/svg">
          <path fill="#00DC82" d="M109.117 38.647L1.246 179.992c-1.638 2.673.327 6.008 3.486 6.008h89.898c1.88 0 3.595-1.035 4.467-2.673l30.407-57.065c.872-1.638 3.218-1.638 4.09 0l30.407 57.065c.872 1.638 2.587 2.673 4.467 2.673h30.137c3.159 0 5.124-3.335 3.486-6.008L116.09 38.647c-.872-1.638-3.218-1.638-4.09 0z" />
          <path fill="#002E3B" d="M192.515 38.647l-60.814 114.13c-.872 1.638 1.09 3.595 2.728 2.728l118.825-63.538c2.834-1.526 2.834-5.558 0-7.084L199.432 38.647c-1.638-2.673-5.279-2.673-6.917 0z" />
        </svg>
      );

    case 'astro':
      return (
        <svg className={className} viewBox="0 0 256 366" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FF5D01" d="M128 0c-11.8 0-22.3 6.9-27 17.5L.9 242.3c-2 4.6-.2 9.9 4.2 12.3l49.3 26.6c4.4 2.4 9.9 1 12.7-3.2l29.4-44.1h63l29.4 44.1c2.8 4.2 8.3 5.6 12.7 3.2l49.3-26.6c4.4-2.4 6.2-7.7 4.2-12.3L155 17.5C150.3 6.9 139.8 0 128 0zm-15 175l15-70 15 70h-30z" />
        </svg>
      );

    case 'svelte':
    case 'sveltekit':
      return (
        <svg className={className} viewBox="0 0 256 295" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FF3E00" d="M228.2 27.2C200.7 2.1 157.9-6.3 119.8 4.3 84.7 14 55 38.3 38.9 71.3c-15.6 32-17.7 69.4-6.1 103 2.1 6.1 7.2 10.8 13.5 12.4l38.2 9.8c7.4 1.9 14.9-2.1 17.7-9.3 5.1-13 13.3-24.5 24.1-33 19.3-15.1 46.2-18.7 68.7-9.1 13 5.5 23.2 15.6 28.5 28.5 5.3 12.9 4.8 27.5-1.5 39.8-8.1 15.8-22.7 27-39.7 30.6-21.7 4.6-44.4-1.2-61.2-15.5l-12.3-10.5c-4.9-4.2-12-4.8-17.5-1.4L18 251.2c-5.8 3.6-8.8 10.3-7.2 16.9C21.7 311 63.8 340.2 110.8 340c49.3-.2 94.7-25 120.3-66.9 23.6-38.6 23.6-87.3 0-125.9-10.2-16.7-24.2-30.8-40.9-41 21.3-15 34.6-38.8 35.8-64.8.8-18.3-4.5-36.4-15.2-51.2z" />
        </svg>
      );

    case 'remix':
      return (
        <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" rx="48" fill="#121212" />
          <path d="M64 80C64 71.1634 71.1634 64 80 64H160C177.673 64 192 78.3269 192 96C192 109.832 183.238 121.616 170.887 126.113L192 192H156L138 136H96V192H64V80ZM96 96V108H152C158.627 108 164 102.627 164 96C164 89.3726 158.627 84 152 84H96V96Z" fill="#38BDF8" />
        </svg>
      );

    case 'gatsby':
      return (
        <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <circle cx="128" cy="128" r="128" fill="#663399" />
          <path fill="#FFF" d="M128 32c-53 0-96 43-96 96 0 35.7 19.5 66.8 48.5 83.3L195.3 96.5C180 58.2 156.4 32 128 32zm-67.2 150.3C42 166.5 32 148.4 32 128c0-11 2.3-21.5 6.4-31l110.8 110.8c-24.8 11.2-53.6 8.5-88.4-25.5zm128.2-12C198 156.2 208 143 208 128c0-26.5-16.1-49.2-39-59V96h-24v72h24v-31.7c11.7 8.2 20 20.3 20 34 0 10.6-5.2 20-13 25.5l13 21.2z" />
        </svg>
      );

    case 'angular':
      return (
        <svg className={className} viewBox="0 0 256 273" xmlns="http://www.w3.org/2000/svg">
          <path fill="#DD0031" d="M128 0L0 45.6l19.5 168.9L128 273l108.5-58.5L256 45.6L128 0z" />
          <path fill="#C3002F" d="M128 0v273l108.5-58.5L256 45.6L128 0z" />
          <path fill="#FFF" d="M128 31.2l-65.7 147.2h25.4l13.2-33.1h54.2l13.2 33.1h25.4L128 31.2zm18.3 93.3h-36.6L128 73.1l18.3 51.4z" />
        </svg>
      );

    case 'docusaurus':
    case 'docusaurus-2':
      return (
        <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" rx="48" fill="#3578E5" />
          <path fill="#FFF" d="M128 32C74.98 32 32 74.98 32 128s42.98 96 96 96 96-42.98 96-96S181.02 32 128 32zm38 136h-28l-18-40h-20v40H76V88h52c22.09 0 40 17.91 40 40 0 15.93-9.33 29.68-22.8 36L166 168zm-38-60h-24v24h24c6.63 0 12-5.37 12-12s-5.37-12-12-12z" />
        </svg>
      );

    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}
