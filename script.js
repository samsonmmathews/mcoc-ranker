// Configuration for scoring
const WEIGHT_RANK = 1000; // Each rank gives 1000 points
const WEIGHT_SIG = 5;     // Each sig level gives 5 points

const classes = ["Science", "Skill", "Mutant", "Cosmic", "Tech", "Mystic"];
let allChampions = [];

// 1. Fetch data from the community 2026 endpoint
async function init() {
    try {
        const response = await fetch('https://cocpit.org/data/champions.json');
        const data = await response.json();
        
        // Filter: only show champions available as 7* up to Feb 2026
        // Note: In a real app, we check the "stars" or "releaseDate" property
        allChampions = data.filter(champ => champ.has7Star === true || champ.releaseDate <= "2026-02");
        
        renderTables();
    } catch (error) {
        console.error("Could not load data. Ensure the API URL is accessible.", error);
    }
}

function renderTables() {
    const container = document.getElementById('tables-container');
    container.innerHTML = '';

    classes.forEach(className => {
        const section = document.createElement('section');
        section.innerHTML = `<h2>${className} Class</h2>`;
        
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Champion</th>
                    <th>Rank (1-6)</th>
                    <th>Signature (0-200)</th>
                    <th>Score</th>
                    <th>Global Rank</th>
                </tr>
            </thead>
            <tbody id="body-${className.toLowerCase()}"></tbody>
        `;
        
        section.appendChild(table);
        container.appendChild(section);
        
        const classChamps = allChampions.filter(c => c.class === className);
        updateTableRows(className.toLowerCase(), classChamps);
    });
}

function updateTableRows(classId, champs) {
    const tbody = document.getElementById(`body-${classId}`);
    
    // Sort champs by score before rendering
    champs.sort((a, b) => calculateScore(b) - calculateScore(a));

    tbody.innerHTML = champs.map((champ, index) => {
        const score = calculateScore(champ);
        return `
            <tr>
                <td>${champ.name}</td>
                <td>
                    <select onchange="updateChamp('${champ.id}', 'rank', this.value)">
                        ${[1,2,3,4,5,6].map(r => `<option value="${r}" ${champ.userRank == r ? 'selected' : ''}>R${r}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <input type="number" min="0" max="200" value="${champ.userSig || 0}" 
                        onchange="updateChamp('${champ.id}', 'sig', this.value)">
                </td>
                <td class="total-score">${score}</td>
                <td class="final-rank">#${index + 1}</td>
            </tr>
        `;
    }).join('');
}

// 4 & 5. Scoring and Updating
function calculateScore(champ) {
    const rankVal = (champ.userRank || 1) * WEIGHT_RANK;
    const sigVal = (champ.userSig || 0) * WEIGHT_SIG;
    return rankVal + sigVal;
}

function updateChamp(id, field, value) {
    const champ = allChampions.find(c => c.id === id);
    if (field === 'rank') champ.userRank = parseInt(value);
    if (field === 'sig') champ.userSig = parseInt(value);
    
    // Refresh the view to update scores and sorting
    renderTables();
}

init();