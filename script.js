const classes = ["Science", "Skill", "Mutant", "Cosmic", "Tech", "Mystic"];
const WEIGHT_RANK = 1000;
const WEIGHT_SIG = 5;

let myRoster = [];
let searchTerm = "";

/**
 * 1. INITIALIZE APP
 * Fetches your local champions.json and merges with saved user data.
 */
async function init() {
    try {
        const response = await fetch('./champions.json');
        if (!response.ok) throw new Error("Could not find champions.json");

        const CHAMPION_DATA = await response.json();
        const saved = JSON.parse(localStorage.getItem('mcoc_7star_save')) || {};

        // Merge base data with your custom ranks/signatures
        myRoster = CHAMPION_DATA.map(champ => ({
            ...champ,
            rank: saved[champ.id]?.rank || 1,
            sig: saved[champ.id]?.sig || 0
        }));

        setupSearch();
        render();
    } catch (error) {
        console.error("Initialization Error:", error);
        document.getElementById('tables-container').innerHTML =
            `<p style="color:red; text-align:center;">Error: ${error.message}. Please ensure champions.json is in the same folder.</p>`;
    }
}

/**
 * 2. SEARCH LOGIC
 * Listen for typing in the search bar.
 */
function setupSearch() {
    // We assume you added <input id="searchInput"> to your index.html
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            render(); // Re-render with filter
        });
    }
}

/**
 * 3. CALCULATION & SORTING
 * Logic for Score and Global Ranking.
 */
function calculateScore(champ) {
    return (champ.rank * WEIGHT_RANK) + (champ.sig * WEIGHT_SIG);
}

/**
 * 4. RENDER TABLES
 * Builds the HTML tables based on Class and Search Filter.
 */
function render() {
    const container = document.getElementById('tables-container');
    container.innerHTML = '';

    // Create a copy for global ranking (calculated before search filtering)
    const globalSorted = [...myRoster].sort((a, b) => calculateScore(b) - calculateScore(a));

    classes.forEach(cls => {
        // Filter by class AND by search term
        const classList = myRoster.filter(c =>
            c.class === cls &&
            c.name.toLowerCase().includes(searchTerm)
        );

        // Don't show the table if no champions match the search in this class
        if (classList.length === 0) return;

        // Sort by score within the class
        classList.sort((a, b) => calculateScore(b) - calculateScore(a));

        const section = document.createElement('div');
        section.className = "class-section";
        section.innerHTML = `<h2>${cls} Class</h2>`;

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Champion</th>
                        <th>Rank (1-6)</th>
                        <th>Signature</th>
                        <th>Total Score</th>
                        <th>Global Rank</th>
                    </tr>
                </thead>
                <tbody>
        `;

        tableHTML += classList.map(champ => {
            const score = calculateScore(champ);
            const gRank = globalSorted.findIndex(c => c.id === champ.id) + 1;

            return `
                <tr>
                    <td><strong>${champ.name}</strong></td>
                    <td>
                        <select onchange="update('${champ.id}', 'rank', this.value)">
                            ${[1, 2, 3, 4, 5, 6].map(r => `<option value="${r}" ${champ.rank == r ? 'selected' : ''}>R${r}</option>`).join('')}
                        </select>
                    </td>
                    <td>
                        <input type="number" min="0" max="200" value="${champ.sig}" 
                            onchange="update('${champ.id}', 'sig', this.value)">
                    </td>
                    <td class="total-score">${score}</td>
                    <td><span class="final-rank">#${gRank}</span></td>
                </tr>
            `;
        }).join('');

        tableHTML += `</tbody></table>`;
        section.innerHTML += tableHTML;
        container.appendChild(section);
    });

    updateSummary();
}

/**
 * 5. UPDATE & SAVE
 * Changes data and saves it to the browser's LocalStorage.
 */
function update(id, field, value) {
    const champ = myRoster.find(c => c.id === id);
    if (!champ) return;

    champ[field] = parseInt(value) || 0;

    // Save to LocalStorage
    const saveObj = {};
    myRoster.forEach(c => saveObj[c.id] = { rank: c.rank, sig: c.sig });
    localStorage.setItem('mcoc_7star_save', JSON.stringify(saveObj));

    render();
}

function updateSummary() {
    const summary = document.getElementById('stats-summary');
    if (summary) {
        summary.innerText = `Displaying ${myRoster.length} Champions`;
    }
}

init();