const SHEET_ID = '2PACX-1vQYR-sUCrn2Z6dK78_eQ2E0CtDHjP_32vA3hsF-By9iQnO8rRdFgBvPdzaRRRsMlxbuzdGMOwHO6sXh';

const GID_MAP = {
    "Science": "0", "Skill": "1150357155", "Mutant": "1080622234",
    "Cosmic": "1308401936", "Tech": "1634787102", "Mystic": "455966228"
};

// ==========================================
//    WEIGHT CONFIGURATION (Adjust these!)
// ==========================================
// These two must add up to 1000 to keep the score out of 1000
const WEIGHT_TOTAL_STATS = 600;       // Importance of DMG, DEF, etc.
const WEIGHT_TOTAL_PROGRESSION = 400; // Importance of Rank and Sig

// --- 1. Performance Stat Weights ---
// These 5 should ideally add up to 1.0 (100%)
const WEIGHT_DAMAGE = 0.33;
const WEIGHT_DEFENSE = 0.14;
const WEIGHT_DURABILITY = 0.25;
const WEIGHT_SIMPLICITY = 0.10;
const WEIGHT_UTILITY = 0.18;

// --- 2. Progression Weights ---
// These 3 should add up to 1.0 (100%)
const WEIGHT_RANK_PART = 0.45;  // 45% of progression from Rank
const WEIGHT_SIG_PART = 0.20;   // 20% of progression from Sig
const WEIGHT_ASC_PART = 0.35;   // 35% of progression from Ascension
// ==========================================

function calculateNormalizedScore(c) {
    // 1. Calculate Weighted Performance Score
    // We multiply each stat (out of 10) by its specific weight
    const weightedStatsSum = 
        ((parseFloat(c.damage) || 0) * WEIGHT_DAMAGE) +
        ((parseFloat(c.defense) || 0) * WEIGHT_DEFENSE) +
        ((parseFloat(c.durability) || 0) * WEIGHT_DURABILITY) +
        ((parseFloat(c.simplicity) || 0) * WEIGHT_SIMPLICITY) +
        ((parseFloat(c.utility) || 0) * WEIGHT_UTILITY);

    // Since stats are out of 10, the max weightedStatsSum is 10.
    // We divide by 10 to get a 0-1 percentage, then multiply by the total stat weight.
    const statsFinal = (weightedStatsSum / 10) * WEIGHT_TOTAL_STATS;

    // 2. Calculate Progression Score
    // Max Rank is 6, Max Sig is 200, Max Ascension is 11
    const rankNormalized = (parseFloat(c.rank) || 0) / 6;
    const sigNormalized = (parseFloat(c.sig_level) || 0) / 200;
    const ascNormalized = (parseFloat(c.ascension) || 0) / 11;

    const progressionFinal = (
        (rankNormalized * WEIGHT_RANK_PART) +
        (sigNormalized * WEIGHT_SIG_PART) + 
        (ascNormalized * WEIGHT_ASC_PART)
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
                    <th>Damage</th><th>Defense</th><th>Durability</th><th>Simplicity</th><th>Utility</th>
                    <th>Score</th>
                    <th>Rank</th>
                </tr>
            </thead>
            <tbody>
                ${roster.map((c, i) => `
                    <tr>
                        <td>${c.name}</td>
                        <td style="color:#666; font-size:0.75rem; line-height:1.2;">
                            R${c.rank} • S${c.sig_level}
                            <span style="color:#00ffcc; font-weight:bold;">(${c.ascension || 0})</span>
                        </td>
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