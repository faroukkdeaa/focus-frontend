// Quick test to check if .env is loaded
console.log('Testing .env file loading...');
console.log('VITE_GEMINI_API_KEY exists:', import.meta.env.VITE_GEMINI_API_KEY ? 'YES' : 'NO');
console.log('First 10 chars:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10));
