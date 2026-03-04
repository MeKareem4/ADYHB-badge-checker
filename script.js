// Game Constants
const UNIVERSE_ID = 2652295605; // Universe ID for "A Dream You've Had Before"
const PROXY_URL = "https://corsproxy.io/?"; // Public proxy to bypass CORS

let allGameBadges = [];
let userBadgeIds = new Set();

// Initialize: Load game badges on startup
async function init() {
    showStatus("Loading game data...");
    try {
        // Fetch all badges for the game
        const response = await fetch(`${PROXY_URL}https://badges.roblox.com/v1/universes/${UNIVERSE_ID}/badges?limit=50&sortOrder=Asc`);
        const data = await response.json();
        allGameBadges = data.data;
        renderBadges();
        showStatus("Ready to search.");
    } catch (err) {
        showError("Failed to load game badges. The proxy might be down or blocked.");
    }
}

async function fetchUserBadges() {
    const username = document.getElementById('username').value.trim();
    if (!username) return;

    const btn = document.getElementById('searchBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<div class="loader"></div>';
    btn.disabled = true;

    try {
        // 1. Get User ID from Username
        showStatus(`Finding user ID for ${username}...`);
        const userRes = await fetch(`${PROXY_URL}https://users.roblox.com/v1/usernames/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
        });
        const userData = await userRes.json();
        
        if (!userData.data || userData.data.length === 0) {
            throw new Error("User not found.");
        }

        const userId = userData.data[0].id;
        const displayName = userData.data[0].displayName;

        // 2. Update Profile UI
        document.getElementById('userProfile').classList.remove('hidden');
        document.getElementById('displayUsername').innerText = displayName;
        document.getElementById('userThumb').src = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;

        // 3. Check which badges the user has
        showStatus(`Fetching badge progress...`);
        const userBadgesRes = await fetch(`${PROXY_URL}https://badges.roblox.com/v1/users/${userId}/universes/${UNIVERSE_ID}/badges`);
        const userBadgesData = await userBadgesRes.json();
        
        userBadgeIds = new Set(userBadgesData.data.map(b => b.id));

        // 4. Re-render Grid
        renderBadges();
        updateCompletion();
        showStatus("Success!");

    } catch (err) {
        console.error(err);
        showError(err.message || "Failed to fetch data.");
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

function renderBadges() {
    const grid = document.getElementById('badgeGrid');
    grid.innerHTML = '';

    if (allGameBadges.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-600">No badges found.</div>';
        return;
    }

    allGameBadges.forEach(badge => {
        const isUnlocked = userBadgeIds.has(badge.id);
        const badgeEl = document.createElement('div');
        badgeEl.className = `dream-card rounded-xl p-4 flex flex-col items-center text-center group ${isUnlocked ? 'border-purple-500/50' : ''}`;
        
        badgeEl.innerHTML = `
            <div class="relative mb-3">
                <img 
                    src="${PROXY_URL}${badge.iconImageId ? `https://www.roblox.com/badge-thumbnail/image?badgeId=${badge.id}&width=150&height=150&format=png` : 'https://tr.rbxcdn.com/6249a2632b85e003b1456d2524a8ed43/150/150/Image/Png'}" 
                    class="w-20 h-20 rounded-lg ${isUnlocked ? 'badge-unlocked' : 'badge-locked'}"
                    alt="${badge.name}"
                >
                ${isUnlocked ? `
                    <div class="absolute -top-2 -right-2 bg-purple-600 text-white p-1 rounded-full text-[10px] shadow-lg font-bold">
                        ✓
                    </div>
                ` : ''}
            </div>
            <h4 class="text-xs font-bold text-gray-200 line-clamp-1 mb-1">${badge.name}</h4>
            <p class="text-[10px] text-gray-500 line-clamp-2 leading-tight">${badge.description || 'No description available.'}</p>
        `;
        grid.appendChild(badgeEl);
    });
}

function updateCompletion() {
    const count = userBadgeIds.size;
    const total = allGameBadges.length;
    const percent = Math.round((count / total) * 100) || 0;
    document.getElementById('completionRate').innerText = `${count} / ${total} Badges Found (${percent}%)`;
}

function showStatus(msg) {
    const el = document.getElementById('statusMsg');
    if (el) el.innerText = msg;
}

function showError(msg) {
    document.getElementById('errorText').innerText = msg;
    document.getElementById('errorModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('errorModal').classList.add('hidden');
}

// Handle Enter Key
document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchUserBadges();
});

// Start the app
init();
