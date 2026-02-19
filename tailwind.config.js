/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary': {
                    50: '#f0f4ff',
                    100: '#e0e8ff',
                    200: '#c7d4ff',
                    300: '#a3b8ff',
                    400: '#7a8fff',
                    500: '#5b6bfc',
                    600: '#4a4df1',
                    700: '#3e3dd6',
                    800: '#3334ad',
                    900: '#2f3187',
                },
                'scratch': {
                    blue: '#4C97FF',
                    purple: '#9966FF',
                    pink: '#CF63CF',
                    red: '#FF6680',
                    orange: '#FFAB19',
                    yellow: '#FFBF00',
                    green: '#40BF4A',
                    cyan: '#5CB1D6',
                }
            },
            animation: {
                'bounce-slow': 'bounce 2s infinite',
                'pulse-glow': 'pulse-glow 2s infinite',
                'sprite-move': 'sprite-move 0.5s ease-out',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 5px rgba(91, 107, 252, 0.5)' },
                    '50%': { boxShadow: '0 0 20px rgba(91, 107, 252, 0.8)' },
                },
                'sprite-move': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(10px)' },
                }
            }
        },
    },
    plugins: [],
}
