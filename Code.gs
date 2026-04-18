/**
 * Master Sync Script
 * Loops through ALL tabs in your spreadsheet to update champion stats.
 */
function updateAllClasses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();

  console.log("🚀 Starting Master Sync for all 6 classes...");

  allSheets.forEach(sheet => {
    const sheetName = sheet.getName();
    
    // Optional: Only run on the 6 class sheets
    const classes = ["Science", "Skill", "Mutant", "Cosmic", "Tech", "Mystic"];
    if (classes.indexOf(sheetName) === -1) {
      console.log(`Skipping tab: ${sheetName} (not a class tab)`);
      return;
    }

    console.log(`--- Processing Class: ${sheetName} ---`);
    processSheet(sheet);
  });

  console.log("✅ Master Sync Complete!");
}

function processSheet(sheet) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const slug = data[i][0]; // Column A
    const displayName = data[i][1]; // Column B
    
    // Skip if ID is empty or still the generic 'sc_001', 'mu_001', etc.
    if (!slug || /^[a-z]{2}_\d{3}$/.test(slug)) continue;

    const url = `https://cocpit.org/champions/${slug}`;
    
    try {
      const options = {
        'muteHttpExceptions': true,
        'headers': { 'User-Agent': 'Mozilla/5.0' }
      };
      
      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() !== 200) continue;

      const html = response.getContentText();
      
      // Pull the stats
      const stats = [
        extractValue(html, 'damage'),
        extractValue(html, 'defense'),
        extractValue(html, 'durability'),
        extractValue(html, 'simplicity'),
        extractValue(html, 'utility')
      ];

      const totalFound = stats.reduce((a, b) => a + b, 0);

      if (totalFound > 0) {
        const doubledStats = stats.map(s => s * 2);
        // Updates Columns E, F, G, H, I
        sheet.getRange(i + 1, 5, 1, 5).setValues([doubledStats]);
        console.log(`Success: Updated ${displayName} in ${sheet.getName()}`);
      }

    } catch (err) {
      // Silently skip errors to keep the loop moving
    }
  }
}

function extractValue(html, key) {
  // This new pattern looks for digits, an optional dot, and more digits
  const patterns = [
    new RegExp(`"${key}"\\s*:\\s*"?(\\d+\\.?\\d*)"`, 'i'),
    new RegExp(`"${key}"\\s*:\\s*(\\d+\\.?\\d*)`, 'i'),
    new RegExp(`${key}\\s*:\\s*(\\d+\\.?\\d*)`, 'i')
  ];

  for (let regex of patterns) {
    const match = html.match(regex);
    if (match) {
      // parseFloat ensures we keep the .5 before doubling
      return parseFloat(match[1]);
    }
  }
  return 0;
}