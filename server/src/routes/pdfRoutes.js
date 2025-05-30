const express = require('express');
const puppeteer = require('puppeteer-core'); // Use puppeteer-core
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

// --- Translations ---
const translations = {
    ur: {
        reportTitle: "رپورٹ",
        generatedAtLabel: "رپورٹ تیار کرنے کی تاریخ",
        competitionDetailsTitle: "مقابلے کی تفصیلات",
        dateLabel: "تاریخ",
        locationLabel: "مقام",
        startTimeLabel: "شروع ہونے کا وقت",
        statusLabel: "سٹیٹس",
        topFinishersTitle: "ٹاپ پوزیشن ہولڈرز",
        rankLabel: "پوزیشن",
        totalTimeLabel: "کل وقت",
        participantsResultsTitle: "شرکاء کے نتائج",
        tableHdrSrNo: "نمبر شمار",
        tableHdrParticipantName: "شریک کا نام",
        tableHdrPigeonsReturned: "واپس آنے والے کبوتر",
        tableHdrTotalTime: "کل وقت",
        tableHdrPigeonArrivals: "کبوتروں کی آمد",
        nestedTableHdrPigeonNo: "کبوتر نمبر",
        nestedTableHdrArrivalTime: "آمد کا وقت",
        nestedTableHdrFlightDuration: "پرواز کا دورانیہ",
        noFlightsRecorded: "کوئی پرواز ریکارڈ نہیں ہوئی۔",
        noParticipants: "اس مقابلے میں کوئی شریک نہیں ہے۔",
        notAvailable: "دستیاب نہیں",
        hours: "گھنٹے",
        minutes: "منٹ",
        seconds: "سیکنڈ",
        coverImageAlt: "مقابلے کا سرورق"
    },
    en: {
        reportTitle: "Report",
        generatedAtLabel: "Report Generated At",
        competitionDetailsTitle: "Competition Details",
        dateLabel: "Date",
        locationLabel: "Location",
        startTimeLabel: "Start Time",
        statusLabel: "Status",
        topFinishersTitle: "Top Finishers",
        rankLabel: "Rank",
        totalTimeLabel: "Total Time",
        participantsResultsTitle: "Participants Results",
        tableHdrSrNo: "Sr. No.",
        tableHdrParticipantName: "Participant Name",
        tableHdrPigeonsReturned: "Pigeons Returned",
        tableHdrTotalTime: "Total Time",
        tableHdrPigeonArrivals: "Pigeon Arrivals",
        nestedTableHdrPigeonNo: "Pigeon No.",
        nestedTableHdrArrivalTime: "Arrival Time",
        nestedTableHdrFlightDuration: "Flight Duration",
        noFlightsRecorded: "No flights recorded.",
        noParticipants: "No participants in this competition.",
        notAvailable: "N/A",
        hours: "hours",
        minutes: "minutes",
        seconds: "seconds",
        coverImageAlt: "Competition Cover"
    }
};

// --- HTML Template Function ---
function generateReportHTML(data) {
    // Destructure data with defaults to prevent errors if fields are missing
    const { competition = {}, participants = [] } = data;

    // --- Language Determination (Crucial: Use raw input for this decision) ---
    // Log the value of competition.nameUrdu to debug
    console.log('Debugging Language Determination: competition.nameUrdu =', competition.nameUrdu);
    // Refined condition: check if it's a string and not empty after trim
    const reportLanguage = (competition.nameUrdu && typeof competition.nameUrdu === 'string' && competition.nameUrdu.trim() !== '') ? 'ur' : 'en';
    console.log('Debugging Language Determination: reportLanguage determined as =', reportLanguage);

    const t = translations[reportLanguage]; // Get the translation set for the chosen language
    const locale = reportLanguage === 'ur' ? 'ur-PK' : 'en-US';
    // --- End of Language Determination ---

    // Define variables for data, using translated fallbacks where appropriate AFTER language is set
    const competitionName = competition.name || t.notAvailable;
    // Store original values or undefined; display logic will handle fallbacks
    const competitionNameUrdu = competition.nameUrdu; 
    const competitionLocationUrdu = competition.locationUrdu;
    const competitionStatusUrdu = competition.statusUrdu; // This is the Urdu version of status if available
    const competitionStatus = competition.status; // This is the general/English version of status

    const coverImageUrl = competition.coverImageUrl || ''; // Use URL from data
    const competitionDescription = competition.description || '';
    const competitionDescriptionUrdu = competition.descriptionUrdu || '';
    const topFinishers = data.topFinishers || []; // Assume this is passed
    const expectedPigeonsPerParticipant = competition.expectedPigeonsPerParticipant; // Used in main table
    const rawCompetitionStartTime = competition.startTime; // Get the raw start time for duration calculation

    // Effective display values based on language
    const effectiveReportTitle = t.reportTitle;
    const generatedAtDisplay = new Date().toLocaleString(locale, { dateStyle: 'full', timeStyle: 'medium' });

    const mainCompetitionTitleDisplay = reportLanguage === 'ur' ? 
        (competitionNameUrdu || competitionName || t.notAvailable) : 
        (competitionName || competitionNameUrdu || t.notAvailable);
    let subCompetitionTitleDisplay = '';
    // Only show subtitle if both names exist and are different
    if (competition.name && competition.nameUrdu && competition.name !== competition.nameUrdu) {
         subCompetitionTitleDisplay = reportLanguage === 'ur' ? competition.name : competition.nameUrdu;
    }


    const competitionDateDisplay = competition.date ? new Date(competition.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : t.notAvailable;
    const competitionLocationDisplay = reportLanguage === 'ur' ?
        (competitionLocationUrdu || competition.location || t.notAvailable) :
        (competition.location || competitionLocationUrdu || t.notAvailable);
    const competitionStartTimeDisplay = competition.startTime ? new Date(competition.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit'}) : t.notAvailable;
    const competitionStatusDisplay = reportLanguage === 'ur' ?
        (competitionStatusUrdu || competitionStatus || t.notAvailable) :
        (competitionStatus || competitionStatusUrdu || t.notAvailable);

    const primaryDescription = reportLanguage === 'ur' ? competitionDescriptionUrdu : competitionDescription;
    const secondaryDescription = reportLanguage === 'ur' ? competitionDescription : competitionDescriptionUrdu;

    let fontFaceStyle = ``;
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
                font-family: ${reportLanguage === 'en' ? "Arial, 'NotoNastaliqUrdu', sans-serif" : "'NotoNastaliqUrdu', Arial, sans-serif"};
                direction: ${reportLanguage === 'ur' ? 'rtl' : 'ltr'};
                text-align: ${reportLanguage === 'ur' ? 'right' : 'left'};
                margin: 0; /* Ensure no default browser margins interfere with Puppeteer's margins */
                padding: 0;
            }
            .report-container {
                padding: 5mm; /* Further reduced padding inside the content area */
                font-size: 10pt; /* Base font size */
            }            
            .urdu-text { 
                font-family: 'NotoNastaliqUrdu', Arial, sans-serif;
                /* Forcing RTL for urdu text if body is LTR, and vice-versa for english-text */
                /* This is useful for mixed content, though less critical in monolingual reports */
                 ${reportLanguage === 'en' ? 'direction: rtl; text-align: right;' : ''}
            }
            .english-text, .ltr-cell { 
                font-family: Arial, sans-serif; 
                ${reportLanguage === 'ur' ? 'direction: ltr; text-align: left;' : ''}
            }
            h1, p, td, th {
                font-family: ${reportLanguage === 'en' ? "Arial, 'NotoNastaliqUrdu', sans-serif" : "'NotoNastaliqUrdu', Arial, sans-serif"};
            }
            .report-meta-header {
                text-align: center;
                margin-bottom: 8mm; /* Reduced margin */
                padding-bottom: 3mm; /* Reduced padding */
                border-bottom: 1px solid #eee;
            }
            .report-main-title { font-size: 14pt; color: #333; margin-bottom: 2mm; }
            .report-generation-date { font-size: 9pt; color: #777; margin: 0; }

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
                border-${reportLanguage === 'ur' ? 'right' : 'left'}: 3px solid #3498db; /* Adjusted border based on language */
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
            }
            .detail-value {
                /* Values will align based on body's text-align */
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
                /* text-align will be inherited from body or overridden by .english-text/.urdu-text */
                vertical-align: top;
            }
            th {
                background-color: #e9e9e9; /* Lighter background */
                font-weight: bold;
            }
            .nested-table { margin-top: 1mm; width: 100%; }
            .nested-table th, .nested-table td { font-size: 8pt; padding: 1mm; background-color: #fdfdfd; }
            .nested-table th { background-color: #f0f0f0; }
            .small-text { font-size: 8pt; }
            
            h2.section-heading {
                font-size: 16pt;
                color: #34495e; 
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 2mm; /* Reduced padding */
                margin-top: 8mm; /* Reduced margin */
                margin-bottom: 6mm;
                /* text-align will be inherited from body */
            }

            .top-finishers-section h2.section-heading { /* "Top Finishers" heading */
                text-align: center; /* Center the "Top Finishers" title */
            }
            .top-finishers {
                display: flex;
                flex-wrap: wrap; /* Allow cards to wrap to the next line */
                justify-content: center; /* Center cards in the row */
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
            body { 
                font-family: Arial, sans-serif; /* Fallback to Arial */
                direction: ${reportLanguage === 'ur' ? 'rtl' : 'ltr'};
                text-align: ${reportLanguage === 'ur' ? 'right' : 'left'};
                margin: 0; padding: 0;
            }
            .urdu-text { 
                color: red; /* Indicate missing font or issue */
                font-family: Arial, sans-serif; /* Fallback for urdu-text too */
                ${reportLanguage === 'en' ? 'direction: rtl; text-align: right;' : ''}
            }
            .english-text {
                 font-family: Arial, sans-serif;
                 ${reportLanguage === 'ur' ? 'direction: ltr; text-align: left;' : ''}
            }
            .report-container { padding: 20mm; }
        </style>
        `;
        console.warn("Urdu font base64 data not available. PDF will use fallback fonts and styles based on report language.");
    }

    // Helper function to format duration from seconds
    const formatDuration = (totalSeconds) => {
        if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) return t.notAvailable;

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let formatted = '';

        if (hours > 0) { // If duration is 1 hour or more
            formatted += `${hours} ${t.hours} `;
            formatted += `${String(minutes).padStart(2, '0')} ${t.minutes}`;
        } else { // If duration is less than 1 hour
            formatted += `${String(minutes).padStart(2, '0')} ${t.minutes} `;
            formatted += `${String(seconds).padStart(2, '0')} ${t.seconds}`;
        }
        return formatted.trim() || `0 ${t.minutes}`; // Handle 0 case or very short durations
    };

    const getFinisherIcon = (rank) => {
        // SVGs are set to use currentColor for fill, so CSS will determine their color.
        // style="vertical-align: middle;" helps with alignment if used inline with text,
        // and width/height set to 1em allows scaling with font-size.
        const svgAttributes = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 1em; height: 1em; vertical-align: middle;"`;

        if (rank === 1) { // Crown
            return `
            <svg ${svgAttributes}>
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V18h14v1z"/>
            </svg>`;
        }
        // For ranks 2, 3, and 4-10, use a generic medal/award icon.
        // The color will be determined by CSS classes: .rank-2, .rank-3, or default for others.
        if (rank === 2 || rank === 3 || (rank > 3 && rank <= 10)) { // Medal/Award Icon
            return `
            <svg ${svgAttributes}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15l-3.76 2.27 1-4.38-3.24-2.82 4.51-.39L12 7.18l1.49 4.08 4.51.39-3.24 2.82 1 4.38L12 17z"/>
            </svg>`;
        }
        return ''; // No icon for other ranks or if rank is not typical
    };

    // Structured competition details
    let detailsList = [
        { label: t.dateLabel, value: competitionDateDisplay },
        { label: t.locationLabel, value: competitionLocationDisplay },
        { label: t.startTimeLabel, value: competitionStartTimeDisplay },
        { label: t.statusLabel, value: competitionStatusDisplay },
    ].filter(detail => detail.value && detail.value !== t.notAvailable);

    return `
    <!DOCTYPE html>
    <html lang="${reportLanguage}">
    <head>
        <meta charset="UTF-8" />
        <title>${mainCompetitionTitleDisplay} - ${t.reportTitle}</title>
        ${fontFaceStyle}
    </head>
    <body>
        <div class="report-container">
            <!-- Wrapper for all content intended for the first page -->
            <div class="first-page-wrapper">
                <div class="report-meta-header">
                    <p class="report-main-title">${effectiveReportTitle}</p>
                    <p class="report-generation-date">${t.generatedAtLabel}: ${generatedAtDisplay}</p>
                </div>

                ${coverImageUrl ? `<img src="${coverImageUrl}" alt="${t.coverImageAlt}" class="cover-image-block" />` : ''}

                <div class="main-competition-title-container">
                    <h1 class="main-competition-title">${mainCompetitionTitleDisplay}</h1>
                    ${subCompetitionTitleDisplay ? `<h2 class="main-competition-subtitle ${reportLanguage === 'en' ? 'urdu-text' : 'english-text'}">${subCompetitionTitleDisplay}</h2>` : ''}

                </div>

                <section class="competition-details">
                    <h2 class="section-heading">${t.competitionDetailsTitle}</h2>
                    <div class="competition-details-grid">
                        ${detailsList.map(detail => `
                            <span class="detail-label">${detail.label}:</span>
                            <span class="detail-value">${detail.value}</span>`).join('')}
                    </div>
                </section>
            </div> <!-- End of first-page-wrapper -->

            ${ (primaryDescription || (secondaryDescription && secondaryDescription !== primaryDescription)) ? `
            <div class="competition-description-section">
                ${primaryDescription ? `<p>${primaryDescription}</p>` : ''}
                ${(secondaryDescription && secondaryDescription !== primaryDescription) ? `<p class="${reportLanguage === 'en' ? 'urdu-text' : 'english-text'}">${secondaryDescription}</p>` : ''}
            </div>` : ''}
             
            ${topFinishers.length > 0 ? `
            <section class="top-finishers-section">
                <h2 class="section-heading">${t.topFinishersTitle}</h2>
                <ul class="top-finishers">
                    ${topFinishers.map(finisher => `
                        <li class="top-finisher-card rank-${finisher.rank}">
                            <span class="finisher-icon">${getFinisherIcon(finisher.rank)}</span>
                            <h3>${finisher.participantName}</h3>
                            <p>${t.rankLabel}: ${finisher.rank}</p>
                            <p>${t.totalTimeLabel}: ${finisher.totalFlightDurationSeconds !== undefined ? formatDuration(finisher.totalFlightDurationSeconds) : (finisher.totalFlightDurationDisplay || t.notAvailable)}</p>
                        </li>
                    `).join('')}
                </ul>
            </section>` : ''}

            <section class="participants-results">
                <h2 class="section-heading">${t.participantsResultsTitle}</h2>
                ${participants.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>${t.tableHdrSrNo}</th>
                            <th>${t.tableHdrParticipantName}</th>
                            <th>${t.tableHdrPigeonsReturned}</th>
                            <th>${t.tableHdrTotalTime}</th>
                            <th>${t.tableHdrPigeonArrivals}</th>

                        </tr>
                    </thead>
                    <tbody>
                        ${participants.map((p, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${p.participantName || t.notAvailable}</td>
                            <td>
                                ${p.numberOfPigeonsRecorded !== undefined ? p.numberOfPigeonsRecorded : t.notAvailable}
                                ${expectedPigeonsPerParticipant ? ` / ${expectedPigeonsPerParticipant}` : ''}
                            </td>
                            <td>${formatDuration(p.totalFlightDurationSeconds)}</td>

                            <td>
                                ${p.flights && p.flights.length > 0 ? `
                                <table class="nested-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 33%;">${t.nestedTableHdrPigeonNo}</th>
                                            <th>${t.nestedTableHdrArrivalTime}</th>
                                            <th>${t.nestedTableHdrFlightDuration}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    ${p.flights.map(f => `
                                        ${(() => {
                                            let flightDurationDisplay = t.notAvailable;
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
                                            <td>${f.pigeonNumber}</td>
                                            <td>${f.arrivalTime ? new Date(f.arrivalTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit'}) : t.notAvailable}</td>
                                            <td>${flightDurationDisplay}</td>
                                        </tr>
                                        `;
                                        })()}
                                    `).join('')}
                                    </tbody>
                                </table>` : `<p class="small-text">${t.noFlightsRecorded}</p>`}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : `<p>${t.noParticipants}</p>`}
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

        const launchOptions = {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser', // Standard path for system-installed Chromium
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Crucial for resource-constrained environments like Docker/Render
                '--disable-gpu',           // Often helpful in headless environments
                '--no-zygote',             // Can sometimes help with startup issues
                // '--single-process'      // Consider if other args don't resolve issues, but can impact performance
            ]
        };

        const browser = await puppeteer.launch({
            ...launchOptions
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
            .replace(/[\s\\/:"*?<>|]+/g, '_') // Replace spaces and other invalid filename chars with underscore.
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
