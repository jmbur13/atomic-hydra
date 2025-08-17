import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  // Ajoute cette ligne pour dire à Vite où est la racine de ton code frontend.
  root: 'src',

  // Cette section est importante pour que le build final fonctionne correctement avec Electron.
  build: {
    outDir: '../dist', // Sortir le build dans un dossier /dist à la racine du projet
    emptyOutDir: true, // Vider le dossier dist avant chaque build
  },
  
  plugins: [vue()],
});