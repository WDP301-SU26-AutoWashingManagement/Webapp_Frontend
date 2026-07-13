/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Plus Jakarta Sans', 'sans-serif'],
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                mono: ['Space Mono', 'monospace'],
            },
            keyframes: {
                float1: {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '50%': { transform: 'translate(-30px, 30px)' },
                },
                float2: {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '50%': { transform: 'translate(20px, -20px)' },
                },
                float3: {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '50%': { transform: 'translate(-15px, 25px)' },
                },
                fadeUp: {
                    from: {
                        opacity: '0',
                        transform: 'translateY(30px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                bounce: {
                    '0%, 100%': {
                        transform: 'translateX(-50%) translateY(0)',
                    },
                    '50%': {
                        transform: 'translateX(-50%) translateY(8px)',
                    },
                },
                'border-beam': {
                    '100%': {
                        'offset-distance': '100%',
                    },
                },
            },
            animation: {
                float1: 'float1 8s ease-in-out infinite',
                float2: 'float2 10s ease-in-out infinite',
                float3: 'float3 12s ease-in-out infinite',
                fadeUp: 'fadeUp 0.8s ease both',
                bounce: 'bounce 2s infinite',
                'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
            },
        },
    },
}
