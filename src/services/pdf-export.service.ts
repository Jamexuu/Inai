import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { BloodSugarLog, BloodPressureLog, MedicineWithSchedules, MedicineLog } from '@/types';
import { getSugarCategory, getSugarCategoryStyle, getSugarContextLabel } from '@/utils/sugar.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';
import { formatTo12Hour } from '@/utils/date.utils';
import { bloodSugarService } from './blood-sugar.service';
import { bloodPressureService } from './blood-pressure.service';
import { medicineService } from './medicine.service';

export type ReportType = 'all' | 'sugar' | 'bp' | 'medicines';

export interface GeneratePdfOptions {
  reportType: ReportType;
  patientName?: string;
  notes?: string;
}

export class PdfExportService {
  /**
   * Generates a PDF file from health records and opens the native share/save sheet or print dialog.
   */
  async exportReport(options: GeneratePdfOptions): Promise<string | null> {
    const html = await this.buildReportHtml(options);

    try {
      if (Platform.OS === 'web') {
        // On web, Print.printAsync triggers browser print / save-as-pdf dialog
        await Print.printAsync({ html });
        return null;
      }

      // On Android and iOS: render to local PDF file
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share or Save Health Report PDF',
        });
      }

      return uri;
    } catch (err) {
      console.error('Failed to export PDF report:', err);
      throw err;
    }
  }

  /**
   * Direct print option for home printers or network printers
   */
  async printReport(options: GeneratePdfOptions): Promise<void> {
    const html = await this.buildReportHtml(options);
    await Print.printAsync({ html });
  }

  /**
   * Builds the complete, printer-friendly HTML string.
   */
  private async buildReportHtml(options: GeneratePdfOptions): Promise<string> {
    const { reportType, patientName = 'Mom' } = options;

    const [allSugar, allBP, allMeds, medLogs] = await Promise.all([
      bloodSugarService.getAllLogs(),
      bloodPressureService.getAllLogs(),
      medicineService.getAllMedicines(),
      medicineService.getRecentLogs(100),
    ]);

    const medMap = new Map<string, MedicineWithSchedules>();
    allMeds.forEach((m) => medMap.set(m.id, m));

    // Calculate averages
    const sugarWeekly = bloodSugarService.calculateWeeklyAverage(allSugar);
    const sugarMonthly = bloodSugarService.calculateMonthlyAverage(allSugar);
    const bpWeekly = bloodPressureService.calculateWeeklyAverage(allBP);
    const bpMonthly = bloodPressureService.calculateMonthlyAverage(allBP);

    const generatedDateStr = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const generatedTimeStr = formatTo12Hour(new Date());

    let reportTitle = 'Comprehensive Health & Routine Report';
    if (reportType === 'sugar') reportTitle = 'Blood Glucose (Sugar) Monitoring Report';
    if (reportType === 'bp') reportTitle = 'Blood Pressure & Pulse Monitoring Report';
    if (reportType === 'medicines') reportTitle = 'Prescription Medicine Intake Log';

    // Build Summary Cards HTML
    let summaryHtml = '';
    if (reportType === 'all' || reportType === 'sugar') {
      summaryHtml += `
        <div class="stat-card">
          <div class="stat-label">Blood Sugar (This Week Avg)</div>
          <div class="stat-value">${sugarWeekly.average ? sugarWeekly.average + ' mg/dL' : 'No data'}</div>
          <div class="stat-sub">${sugarWeekly.count} readings recorded</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Blood Sugar (This Month Avg)</div>
          <div class="stat-value">${sugarMonthly.average ? sugarMonthly.average + ' mg/dL' : 'No data'}</div>
          <div class="stat-sub">${sugarMonthly.count} readings recorded</div>
        </div>
      `;
    }
    if (reportType === 'all' || reportType === 'bp') {
      summaryHtml += `
        <div class="stat-card">
          <div class="stat-label">Blood Pressure (This Week Avg)</div>
          <div class="stat-value">${bpWeekly.avgSystolic ? `${bpWeekly.avgSystolic}/${bpWeekly.avgDiastolic} mmHg` : 'No data'}</div>
          <div class="stat-sub">${bpWeekly.count} readings recorded</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Blood Pressure (This Month Avg)</div>
          <div class="stat-value">${bpMonthly.avgSystolic ? `${bpMonthly.avgSystolic}/${bpMonthly.avgDiastolic} mmHg` : 'No data'}</div>
          <div class="stat-sub">${bpMonthly.count} readings recorded</div>
        </div>
      `;
    }

    // Build Blood Sugar Table
    let sugarTableHtml = '';
    if (reportType === 'all' || reportType === 'sugar') {
      const rows = allSugar
        .map((log) => {
          const cat = getSugarCategory(log.level, log.context);
          const style = getSugarCategoryStyle(cat);
          const d = new Date(log.loggedAt);
          const dateFormatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const timeFormatted = formatTo12Hour(d);

          let badgeColorClass = 'badge-normal';
          if (cat === 'elevated') badgeColorClass = 'badge-elevated';
          if (cat === 'high') badgeColorClass = 'badge-high';
          if (cat === 'low') badgeColorClass = 'badge-low';

          return `
            <tr>
              <td>${dateFormatted} ${timeFormatted}</td>
              <td class="bold">${log.level} mg/dL</td>
              <td>${getSugarContextLabel(log.context)}</td>
              <td><span class="badge ${badgeColorClass}">${style.label}</span></td>
              <td>${log.notes || '—'}</td>
            </tr>
          `;
        })
        .join('');

      sugarTableHtml = `
        <div class="section-title">Blood Sugar Readings</div>
        ${
          allSugar.length === 0
            ? '<p class="empty-text">No blood sugar records logged yet.</p>'
            : `
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Glucose Level</th>
                  <th>Context</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          `
        }
      `;
    }

    // Build Blood Pressure Table
    let bpTableHtml = '';
    if (reportType === 'all' || reportType === 'bp') {
      const rows = allBP
        .map((log) => {
          const cat = getBPCategory(log.systolic, log.diastolic);
          const style = getBPCategoryStyle(cat);
          const d = new Date(log.loggedAt);
          const dateFormatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const timeFormatted = formatTo12Hour(d);

          let badgeColorClass = 'badge-normal';
          if (cat === 'elevated') badgeColorClass = 'badge-elevated';
          if (cat === 'stage1' || cat === 'stage2' || cat === 'crisis') badgeColorClass = 'badge-high';

          return `
            <tr>
              <td>${dateFormatted} ${timeFormatted}</td>
              <td class="bold">${log.systolic}/${log.diastolic} mmHg</td>
              <td>${log.pulse ? log.pulse + ' bpm' : '—'}</td>
              <td>${log.arm ? log.arm + ' arm' : '—'}</td>
              <td><span class="badge ${badgeColorClass}">${style.label}</span></td>
              <td>${log.notes || '—'}</td>
            </tr>
          `;
        })
        .join('');

      bpTableHtml = `
        <div class="section-title">Blood Pressure & Pulse Readings</div>
        ${
          allBP.length === 0
            ? '<p class="empty-text">No blood pressure records logged yet.</p>'
            : `
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Pressure</th>
                  <th>Pulse</th>
                  <th>Arm</th>
                  <th>Category</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          `
        }
      `;
    }

    // Build Medicine Adherence Table
    let medsTableHtml = '';
    if (reportType === 'all' || reportType === 'medicines') {
      const rows = medLogs
        .map((log) => {
          const med = medMap.get(log.medicineId);
          const name = med ? med.name : 'Prescription';
          const dosage = med ? med.dosage : '';
          const d = new Date(log.loggedAt || log.scheduledTime);
          const dateFormatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const timeFormatted = formatTo12Hour(d);

          let badgeClass = 'badge-normal';
          let label = 'Taken';
          if (log.status === 'skipped') {
            badgeClass = 'badge-elevated';
            label = 'Skipped';
          } else if (log.status === 'missed') {
            badgeClass = 'badge-high';
            label = 'Missed';
          }

          return `
            <tr>
              <td>${dateFormatted} ${timeFormatted}</td>
              <td class="bold">${name}</td>
              <td>${dosage}</td>
              <td><span class="badge ${badgeClass}">${label}</span></td>
              <td>${log.notes || '—'}</td>
            </tr>
          `;
        })
        .join('');

      medsTableHtml = `
        <div class="section-title">Medicine Intake Adherence</div>
        ${
          medLogs.length === 0
            ? '<p class="empty-text">No medicine intake records logged yet.</p>'
            : `
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          `
        }
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${reportTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 16mm 14mm 16mm 14mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #282522;
              background-color: #FFFFFF;
              margin: 0;
              padding: 0;
              font-size: 13px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #3D5A50;
              padding-bottom: 12px;
              margin-bottom: 18px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .brand {
              font-size: 22px;
              font-weight: 800;
              color: #3D5A50;
              letter-spacing: -0.5px;
            }
            .brand-sub {
              font-size: 12px;
              color: #6B645D;
              font-weight: 500;
            }
            .report-title {
              font-size: 18px;
              font-weight: 700;
              color: #282522;
              margin-top: 6px;
            }
            .meta-box {
              text-align: right;
              font-size: 11px;
              color: #6B645D;
            }
            .meta-box strong {
              color: #282522;
            }
            .stats-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-bottom: 20px;
            }
            .stat-card {
              flex: 1 1 200px;
              background-color: #FAF7F2;
              border: 1px solid #E5DED4;
              border-radius: 8px;
              padding: 10px 12px;
            }
            .stat-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #6B645D;
              letter-spacing: 0.5px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: 800;
              color: #282522;
              margin: 3px 0;
            }
            .stat-sub {
              font-size: 11px;
              color: #6B645D;
            }
            .section-title {
              font-size: 15px;
              font-weight: 700;
              color: #3D5A50;
              margin-top: 22px;
              margin-bottom: 8px;
              border-bottom: 1px solid #E5DED4;
              padding-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th {
              background-color: #FAF7F2;
              color: #282522;
              font-weight: 700;
              text-align: left;
              padding: 8px 10px;
              font-size: 11px;
              border-bottom: 1.5px solid #DDD7CD;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 7px 10px;
              border-bottom: 1px solid #EFEAE2;
              font-size: 12px;
              color: #282522;
            }
            tr:nth-child(even) td {
              background-color: #FCFAF7;
            }
            .bold {
              font-weight: 700;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-normal {
              background-color: #E6F2EB;
              color: #2E684D;
              border: 1px solid #B8DCC7;
            }
            .badge-elevated {
              background-color: #FAF0E3;
              color: #A8631E;
              border: 1px solid #EED7B8;
            }
            .badge-high {
              background-color: #FAECEB;
              color: #A33B32;
              border: 1px solid #F0C4C0;
            }
            .badge-low {
              background-color: #FAECE6;
              color: #C46849;
              border: 1px solid #F2CDC1;
            }
            .empty-text {
              font-style: italic;
              color: #8E867E;
              margin: 10px 0;
            }
            .footer-notes {
              margin-top: 30px;
              padding-top: 14px;
              border-top: 1px dashed #DDD7CD;
              font-size: 11px;
              color: #6B645D;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              page-break-inside: avoid;
            }
            .signature-line {
              margin-top: 25px;
              border-top: 1px solid #8E867E;
              width: 220px;
              padding-top: 4px;
              font-size: 11px;
              color: #282522;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Inai</div>
              <div class="brand-sub">Offline-First Daily Health & Medicine Tracker</div>
              <div class="report-title">${reportTitle}</div>
            </div>
            <div class="meta-box">
              <div>Patient: <strong>${patientName}</strong></div>
              <div>Generated: <strong>${generatedDateStr} at ${generatedTimeStr}</strong></div>
              <div>Target Targets: <strong>Sugar &lt; 140 mg/dL · BP &lt; 120/80</strong></div>
            </div>
          </div>

          <div class="stats-grid">
            ${summaryHtml}
          </div>

          ${sugarTableHtml}
          ${bpTableHtml}
          ${medsTableHtml}

          <div class="footer-notes">
            <div>
              <strong>Inai Health Summary</strong><br />
              This record is exported directly from Mom's offline log for healthcare consultations.<br />
              Always consult a medical professional for clinical treatment adjustments.
            </div>
            <div>
              <div class="signature-line">
                Physician Signature / Date
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const pdfExportService = new PdfExportService();

