<script setup lang="ts">
import { ref } from 'vue';
// Le chemin a changé pour pointer vers le dossier "views"
import GameLibrary from './views/GameLibrary.vue';

const activeModule = ref('Games');
</script>

<template>
  <div class="app-container">
    <header class="main-header">
      <div class="logo">
        <div class="logo-icon"></div>
        <span>Atomic-Hydra</span>
      </div>
      <nav class="main-nav">
        <a href="#" @click="activeModule = 'Itch'" :class="{ active: activeModule === 'Itch' }">🎮 Itch.io</a>
        <a href="#" @click="activeModule = 'Music'" :class="{ active: activeModule === 'Music' }">🎵 Musique</a>
        <a href="#" @click="activeModule = 'Web'" :class="{ active: activeModule === 'Web' }">🌐 Navigateur</a>
        <a href="#" @click="activeModule = 'Games'" :class="{ active: activeModule === 'Games' }">🕹️ Bibliothèque</a>
        <a href="#" @click="activeModule = 'Downloads'" :class="{ active: activeModule === 'Downloads' }">📥 Téléchargements</a>
      </nav>
      <div class="user-profile">
        <span>Jessica Lopez</span>
        <img src="https://i.pravatar.cc/32" alt="User Avatar">
      </div>
    </header>

    <main class="content-wrapper">
      <div v-if="activeModule === 'Itch'">
        <div class="content-header"><h1>Navigateur Itch.io</h1></div>
        <div class="card"><p style="text-align: center; padding: 2rem;">[Le navigateur centré sur Itch.io s'affichera ici]</p></div>
      </div>
      <div v-if="activeModule === 'Music'">
        <div class="content-header"><h1>Navigateur YouTube Music</h1></div>
        <div class="card"><p style="text-align: center; padding: 2rem;">[Le navigateur centré sur YouTube Music s'affichera ici]</p></div>
      </div>
      <div v-if="activeModule === 'Web'">
        <div class="content-header"><h1>Navigateur Web</h1></div>
        <div class="card"><p style="text-align: center; padding: 2rem;">[Le navigateur standard s'affichera ici]</p></div>
      </div>
      
      <GameLibrary v-if="activeModule === 'Games'" />

      <div v-if="activeModule === 'Downloads'">
        <div class="content-header"><h1>Mes Téléchargements</h1></div>
        <div class="card"><p style="text-align: center; padding: 2rem;">[Le gestionnaire de téléchargements s'affichera ici]</p></div>
      </div>
    </main>
  </div>
</template>

<style>
/* LE STYLE NE CHANGE PAS */
:root {
  --bg-primary: #202123;
  --bg-secondary: #2D2F34;
  --border-color: #434447;
  --text-primary: #FFFFFF;
  --text-secondary: #A9A9A9;
  --accent-primary: #FE4A5A;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body, html, #app {
  height: 100vh; width: 100vw;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}
.app-container { display: flex; flex-direction: column; height: 100%; }
.main-header {
  display: flex; align-items: center; padding: 0 1.5rem; height: 60px;
  background-color: var(--bg-secondary); border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.logo { display: flex; align-items: center; font-weight: 600; }
.logo-icon {
  width: 24px; height: 24px; background-color: var(--accent-primary);
  border-radius: 50%; margin-right: 0.75rem;
}
.main-nav { margin-left: 2rem; display: flex; align-items: center; gap: 0.5rem; }
.main-nav a {
  display: flex; align-items: center; gap: 0.5rem;
  text-decoration: none; color: var(--text-secondary); padding: 0.5rem 1rem;
  border-radius: 6px; transition: all 0.2s ease;
}
.main-nav a.active, .main-nav a:hover {
  background-color: var(--bg-primary); color: var(--text-primary);
}
.user-profile { display: flex; align-items: center; margin-left: auto; }
.user-profile img {
  width: 32px; height: 32px; border-radius: 50%; margin-left: 0.75rem;
}
.content-wrapper { padding: 2rem; overflow-y: auto; flex-grow: 1; }
.content-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
}
.content-header h1 { font-size: 1.75rem; }
.card {
  background-color: var(--bg-secondary); border-radius: 8px;
  padding: 1.5rem; border: 1px solid var(--border-color);
}
</style>