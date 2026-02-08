const classes = ["Science", "Skill", "Mutant", "Cosmic", "Tech", "Mystic"];
const WEIGHT_RANK = 1000;
const WEIGHT_SIG = 5;

let myRoster = [];
let activeClass = "Science"; // Default view
let searchTerm = "";

async function init() {
    const fetchTasks = classes.map(cls =>
        fetch(`./data/${cls.toLowerCase()}.json`).then(res => res.json())
    );

    const results = await Promise.all(fetchTasks);
    const allChamps = results.flat();
    const saved = JSON.parse(localStorage.getItem('mcoc_7star_save')) || {};

    myRoster = allChamps.map(champ => ({
        ...champ,
        rank: saved[champ.id]?.rank || 1,
        sig: saved[champ.id]?.sig || 0
    }));

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        render();
    });

    switchClass('Science'); // Set initial tab
}

function switchClass(cls) {
    activeClass = cls;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === cls) btn.classList.add('active');
    });
    render();
}

function calculateScore(c) { return (c.rank * WEIGHT_RANK) + (c.sig * WEIGHT_SIG); }

function render() {
    const container = document.getElementById('tables-container');
    container.innerHTML = '';

    // Sort the entire roster for Global Rank
    const globalSorted = [...myRoster].sort((a, b) => calculateScore(b) - calculateScore(a));

    // Filter by Active Tab and Search
    const filteredList = myRoster.filter(c =>
        c.class === activeClass && c.name.toLowerCase().includes(searchTerm)
    );

    // Sort by class rank
    filteredList.sort((a, b) => calculateScore(b) - calculateScore(a));

    const tableHTML = `
        <h2>${activeClass} Champions</h2>
        <table>
            <thead>
                <tr>
                    <th>Champion</th>
                    <th>Rank (1-6)</th>
                    <th>Sig (0-200)</th>
                    <th>Score</th>
                    <th>Class Rank</th>
                    <th>Global Rank</th>
                </tr>
            </thead>
            <tbody>
                ${filteredList.map((champ, index) => {
        const score = calculateScore(champ);
        const globalRank = globalSorted.findIndex(c => c.id === champ.id) + 1;
        return `
                        <tr>
                            <td><strong>${champ.name}</strong></td>
                            <td><select onchange="update('${champ.id}', 'rank', this.value)">
                                ${[1, 2, 3, 4, 5, 6].map(r => `<option value="${r}" ${champ.rank == r ? 'selected' : ''}>R${r}</option>`).join('')}
                            </select></td>
                            <td><input type="number" value="${champ.sig}" onchange="update('${champ.id}', 'sig', this.value)"></td>
                            <td class="total-score">${score}</td>
                            <td class="class-rank">#${index + 1}</td>
                            <td class="global-rank">#${globalRank} Overall</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
    document.getElementById('stats-summary').innerText = `Total Roster: ${myRoster.length} Champions`;
}

function update(id, field, value) {
    const champ = myRoster.find(c => c.id === id);
    champ[field] = parseInt(value) || 0;

    // Save state
    const saveObj = {};
    myRoster.forEach(c => saveObj[c.id] = { rank: c.rank, sig: c.sig });
    localStorage.setItem('mcoc_7star_save', JSON.stringify(saveObj));

    render();
}

init();