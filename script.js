const SHEET_ID = '2PACX-1vQYR-sUCrn2Z6dK78_eQ2E0CtDHjP_32vA3hsF-By9iQnO8rRdFgBvPdzaRRRsMlxbuzdGMOwHO6sXh';

const GID_MAP = {
    "Science": "0", "Skill": "1150357155", "Mutant": "1080622234",
    "Cosmic": "1308401936", "Tech": "1634787102", "Mystic": "455966228"
};

// ==========================================
//    WEIGHT CONFIGURATION (Adjust these!)
// ==========================================
// These two must add up to 1000 to keep the score out of 1000
const WEIGHT_TOTAL_STATS = 700;       // Importance of DMG, DEF, etc.
const WEIGHT_TOTAL_PROGRESSION = 300; // Importance of Rank and Sig

// Breakdown of Progression (How much of the 300 comes from Rank vs Sig)
const WEIGHT_RANK_PART = 0.75;  // 75% of progression score comes from Rank
const WEIGHT_SIG_PART = 0.25;   // 25% of progression score comes from Sig Level
// ==========================================

function calculateNormalizedScore(c) {
    // 1. Calculate Performance Score (0 to 50 base)
    const statsSum = (parseFloat(c.damage) || 0) + (parseFloat(c.defense) || 0) +
        (parseFloat(c.durability) || 0) + (parseFloat(c.simplicity) || 0) +
        (parseFloat(c.utility) || 0);

    // Apply the Stat weight (e.g., 700)
    const statsFinal = (statsSum / 50) * WEIGHT_TOTAL_STATS;

    // 2. Calculate Progression Score
    // Max Rank is 6, Max Sig is 200
    const rankNormalized = (parseFloat(c.rank) || 0) / 6;
    const sigNormalized = (parseFloat(c.sig_level) || 0) / 200;

    const progressionFinal = (
        (rankNormalized * WEIGHT_RANK_PART) +
        (sigNormalized * WEIGHT_SIG_PART)
    ) * WEIGHT_TOTAL_PROGRESSION;

    // Total Score
    return Math.round(statsFinal + progressionFinal);
}

async function switchClass(className, event) {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (event) {
        event.currentTarget.classList.add('active');
    } else {
        const defaultBtn = document.querySelector(`.tab-button.${className.toLowerCase()}`);
        if (defaultBtn) defaultBtn.classList.add('active');
    }

    const container = document.getElementById('tables-container');
    container.innerHTML = '<div class="loader">Applying weights and ranking...</div>';

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
            obj.totalScore = calculateNormalizedScore(obj);
            return obj;
        }).filter(c => c.name);

        roster.sort((a, b) => b.totalScore - a.totalScore);
        renderTable(className, roster);
    } catch (err) {
        container.innerHTML = `<div style="color:red">Error loading data.</div>`;
    }
}

function renderTable(className, roster) {
    const container = document.getElementById('tables-container');
    container.innerHTML = `
        <h2 style="margin-bottom:20px; font-size: 1.2rem;">${className} Rankings</h2>
        <table>
            <thead>
                <tr>
                    <th>Champion</th>
                    <th>Progression</th>
                    <th>DMG</th><th>DEF</th><th>DUR</th><th>SIM</th><th>UTL</th>
                    <th>Score</th>
                    <th>Rank</th>
                </tr>
            </thead>
            <tbody>
                ${roster.map((c, i) => `
                    <tr>
                        <td>${c.name}</td>
                        <td style="color:#666; font-size:0.8rem;">R${c.rank} • S${c.sig_level}</td>
                        <td class="${parseFloat(c.damage) >= 10 ? 'gold-stat' : ''}">${c.damage || 0}</td>
                        <td class="${parseFloat(c.defense) >= 10 ? 'gold-stat' : ''}">${c.defense || 0}</td>
                        <td class="${parseFloat(c.durability) >= 10 ? 'gold-stat' : ''}">${c.durability || 0}</td>
                        <td class="${parseFloat(c.simplicity) >= 10 ? 'gold-stat' : ''}">${c.simplicity || 0}</td>
                        <td class="${parseFloat(c.utility) >= 10 ? 'gold-stat' : ''}">${c.utility || 0}</td>
                        <td><span class="score-pill">${c.totalScore}</span></td>
                        <td style="font-weight:700; color:#fff;">${i + 1}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Start with Science
switchClass('Science');