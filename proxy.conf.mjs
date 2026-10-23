// El back no tiene CORS, así que el front le pega a /api y `ng serve`
// reenvía esas requests al servidor de Express.
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

export default {
  '/api': { target: backendUrl, changeOrigin: true },
};
