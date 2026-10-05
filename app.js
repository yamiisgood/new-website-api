// ============================================================
// API CONFIGURATION
// Your index.py is not changed. This frontend simply calls it.
// Change API_BASE_URL only if your FastAPI is hosted elsewhere.
// ============================================================
const API_BASE_URL = "https://my-fastapi-service-gi31.vercel.app/api/v1";
const API_KEY = "student-api-key-123";

// ============================================================
// DOM REFERENCES
// ============================================================
const datalist = document.getElementById("characterNames");
const heroCharacter = document.getElementById("heroCharacter");

const gameScreen = document.getElementById("game");
const revealScreen = document.getElementById("reveal");
const descriptionClue = document.getElementById("descriptionClue");
const perksClue = document.getElementById("perksClue");
const imageClue = document.getElementById("imageClue");
const zoomImage = document.getElementById("zoomImage");
const modeLabel = document.getElementById("modeLabel");
const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const gameMessage = document.getElementById("gameMessage");
const livesContainer = document.getElementById("lives");
const bloodLayer = document.getElementById("bloodLayer");

const sideLeft = document.getElementById("sideLeft");
const sideRight = document.getElementById("sideRight");

const revealImage = document.getElementById("revealImage");
const revealName = document.getElementById("revealName");
const revealStats = document.getElementById("revealStats");
const resultLabel = document.getElementById("resultLabel");
const playAgainBtn = document.getElementById("playAgainBtn");
const changeModeBtn = document.getElementById("changeModeBtn");

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

// ============================================================
// GAME STATE
// ============================================================
let characters = [];
let currentCharacter = null;
let currentMode = "description";
let lives = 3;
let answered = false;
let lastCharacterId = null;

// ============================================================
// API
// ============================================================
async function loadCharacters() {
    try {
        const response = await fetch(
           `${API_BASE_URL}/characters?limit=100&offset=0&sort_by=name&order=asc`,
            {
                headers: {
                    "x-api-key": API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        characters = data.characters || [];

        if (characters.length === 0) {
            throw new Error("The API returned no characters.");
        }

        fillCharacterNames();
        setHeroCharacter();
    } catch (error) {
        console.error(error);
        console.error("Could not load characters from the API.");
    }
}

// ============================================================
// CHARACTER NAMES + HERO
// ============================================================
function fillCharacterNames() {
    datalist.innerHTML = "";

    characters.forEach(character => {
        const option = document.createElement("option");
        option.value = character.name;
        datalist.appendChild(option);
    });
}

function setHeroCharacter() {
    const preferred = characters.find(character => character.role === "Killer" && character.image);
    const fallback = characters.find(character => character.image);

    if (preferred || fallback) {
        heroCharacter.style.backgroundImage = `url("${(preferred || fallback).image}")`;
    }
}

// ============================================================
// START GAME
// ============================================================
document.querySelectorAll(".mode-card").forEach(card => {
    card.addEventListener("click", () => {
        currentMode = card.dataset.mode;
        startGame();
    });
});

function startGame() {
    if (characters.length === 0) {
        alert("Characters are still loading from the API.");
        return;
    }

    lives = 3;
    answered = false;
    gameMessage.textContent = "";
    gameMessage.className = "game-message";
    bloodLayer.innerHTML = "";
    updateLives();

    currentCharacter = chooseRandomCharacter();
    lastCharacterId = currentCharacter.id;

    prepareBackgroundCharacters();
    buildClue();

    guessInput.value = "";
    gameScreen.classList.remove("hidden");
    revealScreen.classList.add("hidden");
    document.body.classList.add("game-active");

    setTimeout(() => guessInput.focus(), 120);
}

function chooseRandomCharacter() {
    let pool = characters.filter(character => character.id !== lastCharacterId);

    // Image mode must have an image.
    if (currentMode === "image") {
        pool = pool.filter(character => character.image);
    }

    if (pool.length === 0) {
        pool = characters;
    }

    return pool[Math.floor(Math.random() * pool.length)];
}

function prepareBackgroundCharacters() {
    const others = characters.filter(
        character => character.id !== currentCharacter.id && character.image
    );

    const left = others[Math.floor(Math.random() * others.length)];
    const rightPool = others.filter(character => character.id !== left?.id);
    const right = rightPool[Math.floor(Math.random() * rightPool.length)];

    sideLeft.style.backgroundImage = left ? `url("${left.image}")` : "none";
    sideRight.style.backgroundImage = right ? `url("${right.image}")` : "none";
}

// ============================================================
// CLUE MODES
// ============================================================
function buildClue() {
    descriptionClue.classList.add("hidden");
    perksClue.classList.add("hidden");
    imageClue.classList.add("hidden");

    if (currentMode === "description") {
        modeLabel.textContent = "DESCRIPTION";
        descriptionClue.textContent = currentCharacter.description;
        descriptionClue.classList.remove("hidden");
    }

    if (currentMode === "perks") {
        modeLabel.textContent = "PERKS";
        document.getElementById("perk1").textContent = currentCharacter.perk_1;
        document.getElementById("perk2").textContent = currentCharacter.perk_2;
        document.getElementById("perk3").textContent = currentCharacter.perk_3;
        perksClue.classList.remove("hidden");
    }

    if (currentMode === "image") {
        modeLabel.textContent = "ZOOMED IMAGE";
        zoomImage.src = currentCharacter.image;
        zoomImage.style.transform = "scale(5.2)";
        imageClue.classList.remove("hidden");
    }
}

// ============================================================
// GUESSING
// ============================================================
guessForm.addEventListener("submit", event => {
    event.preventDefault();

    if (answered) {
        return;
    }

    const guess = normalize(guessInput.value);
    const answer = normalize(currentCharacter.name);

    if (!guess) {
        return;
    }

    if (guess === answer) {
        answered = true;
        gameMessage.textContent = "CORRECT. THE ENTITY RELEASES YOU.";
        revealCharacter(true);
        return;
    }

    lives--;
    updateLives();
    createBloodSplatter();

    gameMessage.textContent =
        lives > 0
            ? `WRONG. ${lives} ${lives === 1 ? "LIFE" : "LIVES"} REMAIN.`
            : "NO LIVES REMAIN.";
    gameMessage.className = "game-message wrong";

    guessInput.value = "";

    if (currentMode === "image" && lives > 0) {
        zoomOutImage();
    }

    if (lives <= 0) {
        answered = true;
        setTimeout(() => revealCharacter(false), 700);
    }
});

function normalize(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[’']/g, "'")
        .replace(/\s+/g, " ");
}

function updateLives() {
    const lifeIcons = [...livesContainer.children];

    lifeIcons.forEach((icon, index) => {
        icon.classList.toggle("lost", index >= lives);
    });

    livesContainer.setAttribute("aria-label", `${lives} lives remaining`);
}

function zoomOutImage() {
    // Start very close, then reveal more after each wrong guess.
    if (lives === 2) {
        zoomImage.style.transform = "scale(4)";
    } else if (lives === 1) {
        zoomImage.style.transform = "scale(2.8)";
    }
}

// ============================================================
// BLOOD EFFECT
// ============================================================
function createBloodSplatter() {
    for (let i = 0; i < 18; i++) {
        const drop = document.createElement("span");
        drop.className = "blood-drop";

        drop.style.setProperty("--x", `${Math.random() * 86 + 4}%`);
        drop.style.setProperty("--y", `${Math.random() * 72 + 12}%`);
        drop.style.setProperty("--size", `${Math.random() * 44 + 12}px`);
        drop.style.setProperty("--rot", `${Math.random() * 180}deg`);

        bloodLayer.appendChild(drop);
    }
}

// ============================================================
// REVEAL / NEXT ROUND
// ============================================================
function revealCharacter(correct) {
    resultLabel.textContent = correct ? "YOU GUESSED" : "THE ANSWER WAS";
    revealName.textContent = currentCharacter.name.toUpperCase();
    revealImage.src = currentCharacter.image || "";
    revealStats.textContent =
        `${currentCharacter.role} • ${currentCharacter.dlc} • ${currentCharacter.year}`;

    gameScreen.classList.add("hidden");
    revealScreen.classList.remove("hidden");
}

playAgainBtn.addEventListener("click", () => {
    startGame();
});

changeModeBtn.addEventListener("click", () => {
    revealScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    document.body.classList.remove("game-active");
});

// ============================================================
// MOBILE NAVIGATION
// ============================================================
menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("open");
});

navMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("open");
    });
});

// ============================================================
// SMALL SAFETY HELPER
// ============================================================
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Load the API as soon as the page opens.
loadCharacters();
