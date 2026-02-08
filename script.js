const classes = ["Science", "Skill", "Mutant", "Cosmic", "Tech", "Mystic"];
const WEIGHT_RANK = 1000;
const WEIGHT_SIG = 5;

let myRoster = [];
let searchTerm = "";

async function init() {
    try {
        // Fetch all 6 files at once
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

        render();
    } catch (e) {
        document.getElementById('tables-container').innerHTML = "Missing data files in /data/";
    }
}

function calculateScore(c) { return (c.rank * WEIGHT_RANK) + (c.sig * WEIGHT_SIG); }

function render() {
    const container = document.getElementById('tables-container');
    container.innerHTML = '';
    const globalSorted = [...myRoster].sort((a, b) => calculateScore(b) - calculateScore(a));

    classes.forEach(cls => {
        const classList = myRoster.filter(c => c.class === cls && c.name.toLowerCase().includes(searchTerm));
        if (classList.length === 0) return;

        classList.sort((a, b) => calculateScore(b) - calculateScore(a));

        const section = document.createElement('div');
        section.innerHTML = `<h2>${cls}</h2><table><thead><tr><th>Champ</th><th>Rank</th><th>Sig</th><th>Score</th><th>Global Rank</th></tr></thead><tbody>
            ${classList.map(champ => {
            const score = calculateScore(champ);
            const gRank = globalSorted.findIndex(c => c.id === champ.id) + 1;
            return `<tr>
                    <td>${champ.name}</td>
                    <td><select onchange="update('${champ.id}', 'rank', this.value)">
                        ${[1, 2, 3, 4, 5, 6].map(r => `<option value="${r}" ${champ.rank == r ? 'selected' : ''}>R${r}</option>`).join('')}
                    </select></td>
                    <td><input type="number" value="${champ.sig}" onchange="update('${champ.id}', 'sig', this.value)"></td>
                    <td class="total-score">${score}</td>
                    <td class="final-rank">#${gRank}</td>
                </tr>`;
        }).join('')}
        </tbody></table>`;
        container.appendChild(section);
    });
    document.getElementById('stats-summary').innerText = `Total: ${myRoster.length} 7-Stars`;
}

function update(id, field, value) {
    const champ = myRoster.find(c => c.id === id);
    champ[field] = parseInt(value) || 0;
    const saveObj = {};
    myRoster.forEach(c => saveObj[c.id] = { rank: c.rank, sig: c.sig });
    localStorage.setItem('mcoc_7star_save', JSON.stringify(saveObj));
    render();
}

init();