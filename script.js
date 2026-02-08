// Replace with your Sheet ID (found between /d/ and /edit in your URL)
const SHEET_ID = '2PACX-1vQYR-sUCrn2Z6dK78_eQ2E0CtDHjP_32vA3hsF-By9iQnO8rRdFgBvPdzaRRRsMlxbuzdGMOwHO6sXh';

// Replace these numbers with the GID for each tab from your URL
const GID_MAP = {
    "Science": "0",
    "Skill": "1150357155",
    "Mutant": "1080622234",
    "Cosmic": "1308401936",
    "Tech": "1634787102",
    "Mystic": "455966228"
};

const WEIGHT_RANK = 1000;
const WEIGHT_STATS = 100;
const WEIGHT_SIG = 2;

function calculateScore(c) {
    const rankScore = (parseInt(c.rank) || 0) * WEIGHT_RANK;
    const sigScore = (parseInt(c.sig_level) || 0) * WEIGHT_SIG;

    // Performance Stats (out of 10)
    const perfScore = (
        (parseInt(c.damage) || 0) +
        (parseInt(c.defense) || 0) +
        (parseInt(c.durability) || 0) +
        (parseInt(c.simplicity) || 0) +
        (parseInt(c.utility) || 0)
    ) * WEIGHT_STATS;

    return rankScore + sigScore + perfScore;
}

async function switchClass(className) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === className);
    });

    const container = document.getElementById('tables-container');
    container.innerHTML = '<div class="loader">Updating Class Rankings...</div>';

    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${GID_MAP[className]}&output=csv`;
        const response = await fetch(csvUrl);
        const data = await response.text();

        const lines = data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const roster = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            let obj = {};
            headers.forEach((header, i) => obj[header] = values[i]);
            obj.totalScore = calculateScore(obj);
            return obj;
        }).filter(c => c.name);

        // Sort: Highest Score first
        roster.sort((a, b) => b.totalScore - a.totalScore);

        renderTable(className, roster);
    } catch (err) {
        container.innerHTML = `<div style="color:red">Error loading data. Check your Google Sheet headers.</div>`;
    }
}

function renderTable(className, roster) {
    const container = document.getElementById('tables-container');

    // Helper function to check for perfect 10s
    const formatStat = (val) => {
        const isPerfect = parseInt(val) === 10;
        return `<td class="stat-val ${isPerfect ? 'gold-stat' : ''}">${val || 0}</td>`;
    };

    container.innerHTML = `
        <h2>${className} Class Rankings</h2>
        <table>
            <thead>
                <tr>
                    <th>Champion</th>
                    <th>R/Sig</th>
                    <th>DMG</th>
                    <th>DEF</th>
                    <th>DUR</th>
                    <th>SIM</th>
                    <th>UTL</th>
                    <th>Total Score</th>
                    <th>Class Rank</th>
                </tr>
            </thead>
            <tbody>
                ${roster.map((c, i) => `
                    <tr>
                        <td><strong>${c.name}</strong></td>
                        <td>R${c.rank} / S${c.sig_level}</td>
                        ${formatStat(c.damage)}
                        ${formatStat(c.defense)}
                        ${formatStat(c.durability)}
                        ${formatStat(c.simplicity)}
                        ${formatStat(c.utility)}
                        <td class="score">${c.totalScore}</td>
                        <td class="rank-badge">#${i + 1}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Start the app
switchClass('Science');