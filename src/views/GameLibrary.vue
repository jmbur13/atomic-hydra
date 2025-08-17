<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// --- État du composant ---
const allCategories = ref<any[]>([]);
const isLoading = ref(true);
const isAdultSectionUnlocked = ref(false);
const showPasswordPrompt = ref(false);
const passwordInput = ref('');
const passwordError = ref('');
const sortOrder = ref('asc');
const showAddGameModal = ref(false);
const newGamePath = ref('');
const selectedCategory = ref('Jeux Locaux');
const newCategoryInput = ref('');

// --- Fonctions d'interaction avec le backend ---
function launchGame(game) { if (game.path) { window.electronAPI.launchGame(game.path); } }
function openGameFolder(game) { if (game.path) { window.electronAPI.openGameFolder(game.path); } }
function showGameContextMenu(game) { const gameData = { id: game.id, path: game.path, isAdult: game.isAdult }; window.electronAPI.showGameContextMenu(gameData); }

// --- Fonctions des boutons de l'en-tête ---
function toggleSortOrder() { sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'; }
async function openAddGameDialog() {
  const result = await window.electronAPI.selectGameFile();
  if (result && result.path) {
    newGamePath.value = result.path;
    selectedCategory.value = 'Jeux Locaux';
    newCategoryInput.value = '';
    showAddGameModal.value = true;
  }
}
async function confirmAddGame() {
  if (!newGamePath.value) return;
  const categoryToSave = newCategoryInput.value.trim() || selectedCategory.value;
  await window.electronAPI.addGame({ path: newGamePath.value, category: categoryToSave });
  showAddGameModal.value = false;
  isLoading.value = true;
  allCategories.value = await window.electronAPI.scanForGames();
  isLoading.value = false;
}

// --- Logique de la section adulte ---
function checkPassword() { if (passwordInput.value === '1234') { isAdultSectionUnlocked.value = true; showPasswordPrompt.value = false; passwordInput.value = ''; passwordError.value = ''; } else { passwordError.value = 'Mot de passe incorrect.'; } }
function lockAdultSection() { isAdultSectionUnlocked.value = false; }

// --- Propriété calculée pour l'affichage (AVEC REGROUPEMENT) ---
const processedCategories = computed(() => {
  if (!allCategories.value) return [];

  const sorter = (a, b) => {
    if (sortOrder.value === 'asc') { return a.title.localeCompare(b.title); } 
    else { return b.title.localeCompare(a.title); }
  };

  let allAdultGames: any[] = [];
  
  const normalCategories = allCategories.value.map(category => {
    const normalGames = category.games.filter(game => !game.isAdult);
    const adultGames = category.games.filter(game => game.isAdult);
    allAdultGames.push(...adultGames);
    
    return {
      ...category,
      games: normalGames.sort(sorter)
    };
  }).filter(category => category.games.length > 0);

  if (allAdultGames.length > 0) {
    normalCategories.push({
      name: 'Adulte',
      games: allAdultGames.sort(sorter),
      isGlobalAdultCategory: true
    });
  }
  
  return normalCategories;
});

// --- Initialisation et communication ---
onMounted(async () => {
  isLoading.value = true;
  allCategories.value = await window.electronAPI.scanForGames();
  isLoading.value = false;
  
  window.electronAPI.onGameMarkedAsAdult(async (gameId) => {
    await window.electronAPI.markGameAsAdult(gameId);
    for (const category of allCategories.value) {
      const game = category.games.find(g => g.id === gameId);
      if (game) { game.isAdult = true; break; }
    }
  });
});
</script>

<template>
  <div class="game-library-container">
    <div class="library-header">
      <input type="search" placeholder="Rechercher dans la bibliothèque..." class="search-library">
      <div class="library-actions">
        <button @click="toggleSortOrder">Trier par {{ sortOrder === 'asc' ? 'A-Z' : 'Z-A' }}</button>
        <button @click="openAddGameDialog">Ajouter un jeu</button>
      </div>
    </div>
    <div v-if="isLoading" class="loading-state"><p>Recherche des jeux en cours...</p></div>

    <div v-else class="categories-wrapper">
      <section v-for="category in processedCategories" :key="category.name" class="game-category">
        
        <div v-if="category.isGlobalAdultCategory">
          <div class="adult-section-header">
            <h2 class="category-title">Adulte</h2>
            <button v-if="isAdultSectionUnlocked" @click="lockAdultSection" class="lock-button">Re-verrouiller</button>
          </div>
          <div v-if="!isAdultSectionUnlocked" class="unlock-prompt">
            <p>Cette section contient du contenu sensible et est protégée.</p>
            <button @click="showPasswordPrompt = true">Déverrouiller</button>
          </div>
          <div v-else class="game-grid">
             <div class="game-card" v-for="game in category.games" :key="game.id" @contextmenu.prevent="showGameContextMenu(game)">
              <div class="game-poster" :style="{ backgroundImage: game.posterUrl ? 'url(' + game.posterUrl + ')' : 'none' }">
                 <span v-if="!game.posterUrl" class="no-poster-title">{{ game.title }}</span>
                <div class="play-overlay">
                  <button v-if="game.path && game.path.endsWith('.exe')" @click="launchGame(game)" class="play-button">Lancer</button>
                  <button v-else @click="openGameFolder(game)" class="folder-button">Dossier</button>
                </div>
              </div>
              <div class="game-title">{{ game.title }}</div>
            </div>
          </div>
        </div>

        <div v-else>
          <h2 class="category-title">{{ category.name }}</h2>
          <div v-if="category.games.length > 0" class="game-grid">
            <div class="game-card" v-for="game in category.games" :key="game.id" @contextmenu.prevent="showGameContextMenu(game)">
              <div class="game-poster" :style="{ backgroundImage: game.posterUrl ? 'url(' + game.posterUrl + ')' : 'none' }">
                <span v-if="!game.posterUrl" class="no-poster-title">{{ game.title }}</span>
                <div class="play-overlay">
                  <button v-if="game.path && game.path.endsWith('.exe')" @click="launchGame(game)" class="play-button">Lancer</button>
                  <button v-else @click="openGameFolder(game)" class="folder-button">Dossier</button>
                </div>
              </div>
              <div class="game-title">{{ game.title }}</div>
            </div>
          </div>
          <p v-else class="no-games-text">Aucun jeu dans cette catégorie.</p>
        </div>
      </section>
    </div>
  </div>

  <div v-if="showAddGameModal" class="password-prompt-overlay" @click.self="showAddGameModal = false">
    <div class="password-prompt-box">
      <h3>Ajouter un Jeu</h3>
      <p>Choisissez une catégorie pour ranger ce jeu :</p>
      <select v-model="selectedCategory" class="category-select">
        <option>Jeux Locaux</option>
        <option v-for="cat in processedCategories.filter(c => c.name !== 'Steam' && c.name !== 'Epic Games' && c.name !== 'Jeux Locaux' && !c.isGlobalAdultCategory)" :key="cat.name">{{ cat.name }}</option>
      </select>
      <p class="or-separator">ou</p>
      <input type="text" v-model="newCategoryInput" placeholder="Créer une nouvelle catégorie" />
      <button @click="confirmAddGame" style="margin-top: 1.5rem;">Enregistrer</button>
    </div>
  </div>
  
  <div v-if="showPasswordPrompt" class="password-prompt-overlay" @click.self="showPasswordPrompt = false">
    <div class="password-prompt-box">
      <h3>Entrer le mot de passe</h3>
      <p>Pour accéder au contenu adulte.</p>
      <input type="password" v-model="passwordInput" @keyup.enter="checkPassword" placeholder="Mot de passe" />
      <p v-if="passwordError" class="error-message">{{ passwordError }}</p>
      <button @click="checkPassword">Accéder</button>
    </div>
  </div>
</template>

<style scoped>
.category-select, .password-prompt-box input[type="text"] { display: block; width: 100%; background-color: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 1rem; }
.or-separator { color: var(--text-secondary); margin-bottom: 1rem; text-align: center; }
.folder-button { background-color: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color); padding: 0.75rem 1.5rem; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer; transform: scale(0.9); transition: all 0.2s ease; }
.game-card:hover .folder-button { transform: scale(1); color: var(--text-primary); }
.game-poster{position:relative;height:240px;background-size:cover;background-position:center}.play-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;opacity:0;transition:opacity .2s ease}.game-card:hover .play-overlay{opacity:1}.play-button{background-color:var(--accent-primary);color:var(--text-primary);border:none;padding:.75rem 1.5rem;border-radius:50px;font-size:1rem;font-weight:600;cursor:pointer;transform:scale(.9);transition:transform .2s ease}.game-card:hover .play-button{transform:scale(1)}.adult-section-header{display:flex;justify-content:space-between;align-items:center}.lock-button{background:none;border:1px solid var(--border-color);color:var(--text-secondary);padding:.5rem 1rem;border-radius:6px;cursor:pointer;font-size:.9rem}.lock-button:hover{background-color:var(--hover-bg);color:var(--text-primary)}.adult-section{margin-top:2rem;border-top:1px solid var(--border-color);padding-top:1rem}.sub-category{border-bottom:none;margin-bottom:1rem}.unlock-prompt{text-align:center;padding:2rem;background-color:var(--bg-secondary);border-radius:8px}.unlock-prompt button{background-color:var(--accent-primary);color:var(--text-primary);padding:.75rem 1.5rem;font-size:1rem;cursor:pointer;border:none;border-radius:6px;margin-top:1rem}.no-games-text{color:var(--text-secondary)}.password-prompt-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.7);backdrop-filter:blur(5px);display:flex;justify-content:center;align-items:center;z-index:1000}.password-prompt-box{background-color:var(--bg-secondary);padding:2rem;border-radius:8px;text-align:center;border:1px solid var(--border-color)}.password-prompt-box h3{margin-bottom:.5rem}.password-prompt-box p{color:var(--text-secondary);margin-bottom:1.5rem}.password-prompt-box input{display:block;width:100%;background-color:var(--bg-primary);border:1px solid var(--border-color);color:var(--text-primary);padding:.75rem;border-radius:6px;margin-bottom:1rem;text-align:center;font-size:1.2rem}.password-prompt-box button{width:100%;background-color:var(--accent-primary);color:var(--text-primary);padding:.75rem;font-size:1rem;cursor:pointer;border:none;border-radius:6px}.error-message{color:#f87171;font-size:.9rem;margin-bottom:1rem!important}.game-category{margin-bottom:3rem}.category-title{font-size:1.5rem;margin-bottom:1.5rem;padding-bottom:.5rem;border-bottom:1px solid var(--border-color)}.no-poster-title{display:flex;align-items:center;justify-content:center;text-align:center;height:100%;padding:1rem;font-size:.9rem;color:var(--text-secondary)}.loading-state{display:flex;justify-content:center;align-items:center;height:50vh;color:var(--text-secondary);font-size:1.2rem}.library-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem}.search-library{background-color:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);padding:.75rem 1rem;border-radius:6px;width:300px;font-size:1rem}.library-actions button{background:none;border:1px solid var(--border-color);color:var(--text-primary);padding:.75rem 1rem;border-radius:6px;cursor:pointer;margin-left:1rem; transition: all 0.2s ease;}.library-actions button:hover{background-color:var(--hover-bg)}.game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1.5rem}.game-card{background-color:var(--bg-secondary);border-radius:8px;overflow:hidden;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease;border:1px solid transparent}.game-card:hover{transform:translateY(-5px);box-shadow:0 10px 20px rgba(0,0,0,.2);border-color:var(--border-color)}.game-poster{height:240px;background-color:#2D2F34;background-size:cover;background-position:center}.game-title{padding:1rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style>