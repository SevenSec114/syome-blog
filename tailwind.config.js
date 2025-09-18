/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}'
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            'blockquote p::before': {
              content: '""',
            },
            'blockquote p::after': {
              content: '""',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'code': {
              backgroundColor: '#777777',
              color: '#ffffff',
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            },
            'img': {
              margin: '1rem auto',
            }
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}