const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// --- Font Loading ---
// Adjust this path to where your NotoNastaliqUrdu-Regular.ttf font is located on the server.
const FONT_PATH = path.join(__dirname, '..', 'public', 'fonts', 'NotoNastaliqUrdu-Regular.ttf');
let urduFontBase64 = null;

try {
    if (fs.existsSync(FONT_PATH)) {
        const fontBuffer = fs.readFileSync(FONT_PATH);
        urduFontBase64 = fontBuffer.toString('base64');
        console.log('Urdu font loaded successfully for PDF generation.');
    } else {
        console.warn(`Urdu font not found at ${FONT_PATH}. PDF reports may not render Urdu text correctly.`);
    }
} catch (error) {
    console.error("Error loading Urdu font for PDF generation:", error);
}

// --- HTML Template Function ---
function generateReportHTML(data) {
    // Destructure data with defaults to prevent errors if fields are missing
    const reportTitleUrdu = data.reportTitleUrdu || "رپورٹ";
    const generatedAt = new Date().toLocaleString('ur-PK', { dateStyle: 'full', timeStyle: 'medium' }); // Always use current time
    
    // Destructure competition details, including new fields
    const { competition = {}, participants = [] } = data;
    
    // const competition = data.competition || {}; // This line is redundant and causes the error
    const competitionName = competition.name || "Competition Name N/A";
    const competitionNameUrdu = competition.nameUrdu || "مقابلے کا نام دستیاب نہیں";
    const competitionDate = competition.date ? new Date(competition.date).toLocaleDateString('ur-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const competitionLocationUrdu = competition.locationUrdu || "مقام دستیاب نہیں";
    const competitionStartTime = competition.startTime ? new Date(competition.startTime).toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit'}) : 'N/A';
    const competitionStatusUrdu = competition.statusUrdu || competition.status || "سٹیٹس دستیاب نہیں";
    const coverImageUrl = competition.coverImageUrl || ''; // Use URL from data
    const competitionDescription = competition.description || '';
    const competitionDescriptionUrdu = competition.descriptionUrdu || '';
    const topFinishers = data.topFinishers || []; // Assume this is passed
    const expectedPigeonsPerParticipant = competition.expectedPigeonsPerParticipant; // Used in main table
    const rawCompetitionStartTime = competition.startTime; // Get the raw start time for duration calculation


    let fontFaceStyle = `
        <style>
            body { font-family: Arial, sans-serif; }
            .urdu-text { color: red; /* Indicate missing font */ }
        </style>
    `;

    if (urduFontBase64) {
        fontFaceStyle = `
        <style>
            @font-face {
                font-family: 'NotoNastaliqUrdu';
                src: url(data:font/truetype;charset=utf-8;base64,${urduFontBase64}) format('truetype');
                font-weight: normal;
                font-style: normal;
            }
            body {
                font-family: 'NotoNastaliqUrdu', Arial, sans-serif; /* Fallback fonts */
                direction: rtl; /* Right-to-left for Urdu */
                text-align: right;
                margin: 0; /* Ensure no default browser margins interfere with Puppeteer's margins */
                padding: 0;
            }
            .report-container {
                padding: 5mm; /* Further reduced padding inside the content area */
                font-size: 10pt; /* Base font size */
            }
            h1, p, td, th {
                font-family: 'NotoNastaliqUrdu', Arial, sans-serif;
            }
            .report-meta-header {
                text-align: center;
                margin-bottom: 8mm; /* Reduced margin */
                padding-bottom: 3mm; /* Reduced padding */
                border-bottom: 1px solid #eee;
            }
            .report-main-title { font-size: 14pt; color: #333; margin-bottom: 2mm; }
            .report-generation-date { font-size: 9pt; color: #777; margin: 0; }

            h1 { font-size: 18pt; margin-bottom: 5mm; text-align: center; }
            h2 { font-size: 14pt; margin-top: 8mm; margin-bottom: 4mm; border-bottom: 1px solid #333; padding-bottom: 1mm;}
            /* .report-header related styles removed as it's not used in the current structure */
            .report-header p { margin: 0.5mm 0; }
            .competition-details p { margin: 1mm 0; }
            .english-text, .ltr-cell { 
                font-family: Arial, sans-serif; 
                direction: ltr; 
                text-align: left; 
            }
            .cover-image-block { /* New style for cover image in normal flow */
                width: 100%;
                max-height: 280px; 
                object-fit: cover; 
                margin-bottom: 6mm; /* Further reduced margin */
                border-radius: 5px; 
                display: block; 
            }
            .main-competition-title-container {
                text-align: center;
                margin-top: 5mm; /* Adjusted from 10mm as cover image now pushes content */
                margin-bottom: 8mm;
                /* page-break-after: always; */ /* Moved to the new first-page wrapper */
            }
            .first-page-wrapper {
                page-break-after: always; /* Force page break after this wrapper */
            }
            .main-competition-title { /* This is for the competition's actual name */
                font-size: 24pt; 
                color: #2c3e50; 
                margin-bottom: 2mm;
                padding-bottom: 3mm;
                border-bottom: 2px solid #3498db; 
                display: inline-block;
            }
            .main-competition-subtitle { /* For English name if Urdu is primary */
                font-size: 14pt;
                color: #7f8c8d; 
                margin-top: 1mm;
            }
            .competition-description-section {
                margin-bottom: 10mm;
                padding: 5mm;
                background-color: #fdfdfd;
                border-left: 3px solid #3498db;
            }
            .competition-description-section p {
                margin: 3mm 0;
                line-height: 1.6;
            }
            .competition-details-grid {
                display: grid;
                grid-template-columns: max-content 1fr; /* Labels take their content width, values take the rest */
                gap: 4mm 10mm; /* row-gap column-gap */
                align-items: baseline; /* Align text baselines, good for mixed fonts/sizes */
                margin-top: 4mm; /* Add some space above the grid */
                margin-bottom: 6mm; /* Add some space below the grid */
            }
            .detail-label {
                font-weight: bold;
                /* text-align: right; is default due to body RTL */
            }
            .detail-value {
                /* text-align: right; is default due to body RTL */
                /* .english-text class will override text-align to left */
            }

             table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5mm;
                margin-bottom: 5mm;
                font-size: 9pt;
            }
            th, td {
                border: 1px solid #888; /* Lighter border */
                padding: 2mm;
                text-align: right; /* Default for Urdu */
                vertical-align: top;
            }
            th {
                background-color: #e9e9e9; /* Lighter background */
                font-weight: bold;
            }
            .nested-table { margin-top: 1mm; width: 100%; }
            .nested-table th, .nested-table td { font-size: 8pt; padding: 1mm; background-color: #fdfdfd; }
            .nested-table th { background-color: #f0f0f0; }
            .urdu-text { font-family: 'NotoNastaliqUrdu', Arial, sans-serif; } /* Ensure specific elements use Urdu font */
            .small-text { font-size: 8pt; }
            
            h2.section-heading {
                font-size: 16pt;
                color: #34495e; 
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 2mm; /* Reduced padding */
                margin-top: 8mm; /* Reduced margin */
                margin-bottom: 6mm;
                text-align: right; /* Default for Urdu */
            }
            h2.section-heading.english-text {
                text-align: left;
                direction: ltr;
            }

            .top-finishers-section h2.section-heading { /* "Top Finishers" heading */
                text-align: center; /* Center the "Top Finishers" title */
            }
            .top-finishers {
                display: flex;
                flex-wrap: wrap; /* Allow cards to wrap to the next line */
                justify-content: center; /* Center cards in the row */
                /* overflow-x: auto; Removed, no horizontal scrolling */
                margin: 10mm 0;
                padding: 0; /* Reset padding */
                list-style: none;
                gap: 15mm; /* Space between cards */
            }

            .top-finisher-card {
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 8mm 5mm;
                text-align: center;
                box-sizing: border-box; /* Ensures padding and border are included in the width */
                width: calc(33.3333% - 10mm); /* Aim for 3 cards per row, accounting for gap */
                min-width: 180px;
                flex-shrink: 0; /* Prevent cards from shrinking below their calculated width */
                box-shadow: 0 4px 8px rgba(0,0,0,0.08);
                transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            }
            .top-finisher-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.12);
            }
            .finisher-icon {
                font-size: 2.8em; /* Larger icon */
                margin-bottom: 8mm;
                display: block;
                line-height: 1; /* Ensure icon vertical alignment */
            }
            .top-finisher-card.rank-1 .finisher-icon { color: #ffd700; } /* Gold */
            .top-finisher-card.rank-2 .finisher-icon { color: #c0c0c0; } /* Silver */
            .top-finisher-card.rank-3 .finisher-icon { color: #cd7f32; } /* Bronze */

            .top-finisher-card h3 { /* Participant Name */
                font-size: 1.3em;
                margin-top: 0;
                margin-bottom: 6mm;
                color: #333;
            }
            .top-finisher-card p {
                margin: 2mm 0;
            }
        </style>
        `;
    } else {
        fontFaceStyle = `
        <style>
            /* Fallback font style if Urdu font fails to load */
            body { font-family: Arial, sans-serif; }
            .urdu-text { color: red; /* Indicate missing font */ }
            .report-container { padding: 20mm; }
            /* Add more specific styles for your report */
            h1, h2 { text-align: center; }
        </style>
        `;
        console.warn("Urdu font base64 data not available for PDF. PDF will use fallback fonts.");
    }

    // Helper function to format duration from seconds
    const formatDuration = (totalSeconds) => {
        if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
            return 'N/A';
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let formatted = '';

        if (hours > 0) { // If duration is 1 hour or more
            formatted += `${hours} گھنٹے `;
            formatted += `${String(minutes).padStart(2, '0')} منٹ`;
        } else { // If duration is less than 1 hour
            formatted += `${String(minutes).padStart(2, '0')} منٹ `;
            formatted += `${String(seconds).padStart(2, '0')} سیکنڈ`;
        }
        return formatted.trim();
    };

    const getFinisherIcon = (rank) => {
        if (rank === 1) return '👑'; // Crown U+1F451
        if (rank === 2) return '🥈'; // Silver Medal U+1F948
        if (rank === 3) return '🥉'; // Bronze Medal U+1F949
        if (rank > 3 && rank <=10) return '🏅'; // Sports Medal U+1F3C5 for other top ranks
        return ''; // No icon for ranks beyond a certain point or if rank is not typical
    };

    // Structured competition details
    let detailsList = [
        // { labelUrdu: "مقابلے کا نام (انگریزی)", value: competitionName, valueClass: "english-text" }, // Removed as requested
        { labelUrdu: "تاریخ", value: competitionDate, valueClass: "urdu-text" },
        { labelUrdu: "مقام", value: competitionLocationUrdu, valueClass: "urdu-text" },
        { labelUrdu: "شروع ہونے کا وقت", value: competitionStartTime, valueClass: "urdu-text" },
        { labelUrdu: "سٹیٹس", value: competitionStatusUrdu, valueClass: "urdu-text" },
    ].filter(detail => detail.value && detail.value !== 'N/A'); // Optionally filter out N/A values if desired

    return `
    <!DOCTYPE html>
    <html lang="ur">
    <head>
        <meta charset="UTF-8" />
        <title>${competitionNameUrdu} - رپورٹ</title>
        ${fontFaceStyle}
    </head>
    <body>
        <div class="report-container">
            <!-- Wrapper for all content intended for the first page -->
            <div class="first-page-wrapper">
                <div class="report-meta-header">
                    <p class="report-main-title urdu-text">${reportTitleUrdu}</p>
                    <p class="report-generation-date urdu-text">رپورٹ تیار کرنے کی تاریخ: ${generatedAt}</p>
                </div>

                ${coverImageUrl ? `<img src="${coverImageUrl}" alt="Competition Cover" class="cover-image-block" />` : ''}

                <div class="main-competition-title-container">
                    <h1 class="main-competition-title urdu-text">${competitionNameUrdu || competitionName}</h1>
                    ${(competitionNameUrdu && competitionName && competitionName !== competitionNameUrdu) ? `<h2 class="main-competition-subtitle english-text">${competitionName}</h2>` : ''}
                </div>

                <section class="competition-details">
                    <h2 class="section-heading">مقابلے کی تفصیلات</h2>
                    <div class="competition-details-grid">
                        ${detailsList.map(detail => `
                            <span class="detail-label urdu-text">${detail.labelUrdu}:</span>
                            <span class="detail-value ${detail.valueClass || 'urdu-text'}">${detail.value || 'N/A'}</span>`).join('')}
                    </div>
                </section>
            </div> <!-- End of first-page-wrapper -->

            ${ (competitionDescription || competitionDescriptionUrdu) ? `
            <div class="competition-description-section">
                ${competitionDescription ? `<p class="english-text">${competitionDescription}</p>` : ''}
                ${competitionDescriptionUrdu ? `<p class="urdu-text">${competitionDescriptionUrdu}</p>` : ''}
            </div>` : ''}
             
            ${topFinishers.length > 0 ? `
            <section class="top-finishers-section">
                <h2 class="section-heading">ٹاپ پوزیشن ہولڈرز</h2>
                <ul class="top-finishers">
                    ${topFinishers.map(finisher => `
                        <li class="top-finisher-card rank-${finisher.rank}">
                            <span class="finisher-icon">${getFinisherIcon(finisher.rank)}</span>
                            <h3 class="urdu-text">${finisher.participantName}</h3>
                            <p class="urdu-text">پوزیشن: ${finisher.rank}</p>
                            <p class="urdu-text">کل وقت: ${finisher.totalFlightDurationDisplay}</p>
                        </li>
                    `).join('')}
                </ul>
            </section>` : ''}

            <section class="participants-results">
                <h2 class="section-heading">شرکاء کے نتائج</h2>
                ${participants.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th class="urdu-text">نمبر شمار</th>
                            <th class="urdu-text">شریک کا نام</th>
                            <th class="urdu-text">واپس آنے والے کبوتر</th>
                            <th class="urdu-text">کل وقت</th>
                            <th class="urdu-text">کبوتروں کی آمد</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${participants.map((p, index) => `
                        <tr>
                            <td class="urdu-text">${index + 1}</td>
                            <td class="urdu-text">${p.participantName || 'N/A'}</td>
                            <td class="urdu-text">
                                ${p.numberOfPigeonsRecorded !== undefined ? p.numberOfPigeonsRecorded : 'N/A'}
                                ${expectedPigeonsPerParticipant ? ` / ${expectedPigeonsPerParticipant}` : ''}
                            </td>
                            <td class="urdu-text">${formatDuration(p.totalFlightDurationSeconds)}</td>

                            <td>
                                ${p.flights && p.flights.length > 0 ? `
                                <table class="nested-table">
                                    <thead>
                                        <tr>
                                            <th class="urdu-text" style="width: 33%;">کبوتر نمبر</th>
                                            <th class="urdu-text">آمد کا وقت</th>
                                            <th class="urdu-text">پرواز کا دورانیہ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    ${p.flights.map(f => `
                                        ${(() => {
                                            let flightDurationDisplay = 'N/A';
                                            if (rawCompetitionStartTime && f.arrivalTime) {
                                                const compStartTime = new Date(rawCompetitionStartTime);
                                                const arrivalTime = new Date(f.arrivalTime);
                                                if (!isNaN(compStartTime.getTime()) && !isNaN(arrivalTime.getTime()) && arrivalTime > compStartTime) {
                                                    const durationSeconds = Math.floor((arrivalTime.getTime() - compStartTime.getTime()) / 1000);
                                                    flightDurationDisplay = formatDuration(durationSeconds);
                                                }
                                            }
                                            return `
                                        <tr>
                                            <td class="urdu-text">${f.pigeonNumber}</td>
                                            <td class="urdu-text">${f.arrivalTime ? new Date(f.arrivalTime).toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit'}) : 'N/A'}</td>
                                            <td class="urdu-text">${flightDurationDisplay}</td>
                                        </tr>
                                        `;
                                        })()}
                                    `).join('')}
                                    </tbody>
                                </table>` : '<p class="urdu-text small-text">کوئی پرواز ریکارڈ نہیں ہوئی۔</p>'}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p class="urdu-text">اس مقابلے میں کوئی شریک نہیں ہے۔</p>'}
            </section>
        </div>
    </body>
    </html>
    `;
}

// --- PDF Generation Route ---
router.post('/generate-report-pdf', async (req, res) => {
    try {
        const reportData = req.body; // Data from your React app

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Recommended for server environments
        });
        const page = await browser.newPage();

        const htmlContent = generateReportHTML(reportData);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            // landscape: true, // If you want landscape orientation
            printBackground: true, 
            margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' } // Further reduced Puppeteer margins
        });
        await browser.close();

        // Generate a dynamic filename
        const originalName = reportData.competition?.name || 'Competition';
        const dateSuffix = new Date().toISOString().split('T')[0];

        // Fallback filename (ASCII-only, removes non-printable ASCII and all non-ASCII)
        // Also replaces spaces and other potentially problematic characters for filenames.
        const fallbackBaseName = originalName
            .replace(/[^\x20-\x7E]/g, '') // Remove non-printable and non-ASCII characters
            .replace(/[\s\\/:"*?<>|]+/g, '_') // Replace spaces and other invalid filename chars with underscore
            .replace(/_{2,}/g, '_'); // Replace multiple underscores with a single one
        const fallbackFileName = `Report-${fallbackBaseName || 'Competition'}-${dateSuffix}.pdf`;

        // UTF-8 encoded filename for filename*
        const utf8FileName = `Report-${originalName.replace(/[\s\\/:"*?<>|]+/g, '_').replace(/_{2,}/g, '_')}-${dateSuffix}.pdf`;
        const encodedUtf8FileName = encodeURIComponent(utf8FileName);

        const contentDisposition = `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodedUtf8FileName}`;

        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length, 'Content-Disposition': contentDisposition });
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating PDF. Request Body:", JSON.stringify(req.body, null, 2)); // Log the incoming request body
        console.error("Detailed PDF generation error:", error); // This logs the full error object, including stack
        res.status(500).send({
            message: "PDF generation failed on server. Check server logs for more details.", // A more distinct primary message
            detail: error.message, // The specific error message from the exception
        });
    }
});


module.exports = router;