// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const SHEET_ID = "1mON2kVwMw5NNc8PNwHIliO0hIDBCu-VNxMXbJ5toQwU";
const SEMESTERS = ["S8", "S6", "S4", "S2"];

// ─── FETCH ONE SEMESTER TAB ────────────────────────────────────────────────────
async function fetchSheetData(semester) {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${semester}&headers=1`;
        const response = await fetch(url);
        const text = await response.text();

        // Strip Google's JSONP wrapper
        const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const json = JSON.parse(jsonStr);
        const rows = json.table.rows;

        if (!rows) return [];

        return rows.map(row => ({
            batch: row.c[0]?.v || "",   // A - Batch
            projectName: row.c[1]?.v || "",   // B - Project Name
            abstract: row.c[2]?.v || "",   // C - Abstract
            teamMembers: row.c[3]?.v || "",   // D - Team Members
            semester: row.c[4]?.v || semester, // E - Semester
            facultyGuide: row.c[5]?.v || "",   // F - Faculty Guide
            liveURL: row.c[6]?.v || "",   // G - Live URL
            videoLink: row.c[7]?.v || "",   // H - Video Link
            pdfLink: row.c[8]?.v || "",   // I - PDF Link
            imageURLs: row.c[9]?.v || "",   // J - Image URLs
        })).filter(p => p.projectName && p.projectName.trim() !== "" && p.projectName !== "Project Name");

    } catch (e) {
        console.error(`[sheets.js] Failed to fetch ${semester}:`, e);
        return [];
    }
}

// ─── FETCH ALL SEMESTERS IN PARALLEL ──────────────────────────────────────────
async function fetchAllProjects() {
    const results = await Promise.all(SEMESTERS.map(sem => fetchSheetData(sem)));
    return results.flat();
}
