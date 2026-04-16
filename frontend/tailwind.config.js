/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f4ff',
                    100: '#d9e2ff',
                    200: '#bccaff',
                    300: '#8fa8ff',
                    400: '#5c7aff',
                    500: '#3350ff',
                    600: '#1a33ff',
                    700: '#0019ff',
                    800: '#0014cc',
                    900: '#0010a3',
                    950: '#000852',
                },
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                accent: {
                    purple: '#a855f7',
                    cyan: '#06b6d4',
                    pink: '#ec4899',
                    yellow: '#eab308',
                    vivid: {
                        blue: '#2563eb',
                        purple: '#9333ea',
                        pink: '#db2777',
                        emerald: '#059669',
                    }
                }
            },
            backgroundImage: {
                'mesh-gradient': "radial-gradient(at 0% 0%, hsla(210, 100%, 98%, 1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(220, 100%, 95%, 1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(250, 100%, 95%, 1) 0, transparent 50%)",
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
            },
            animation: {
                'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'blob': 'blob 7s infinite',
                'shine': 'shine 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                shine: {
                    '100%': { left: '125%' },
                }
            }
        },
    },
    plugins: [],
}
