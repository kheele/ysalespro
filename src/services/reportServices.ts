import {
  CompanyAnalyticsReport,
  IndustryAnalyticsReport,
  LeadConversionReport,
  EmailPerformanceReport,
  OutreachPerformanceReport,
  SalesActivityReport,
} from '@/lib/types';
import {
  MOCK_COMPANY_ANALYTICS,
  MOCK_INDUSTRY_ANALYTICS,
  MOCK_LEAD_CONVERSION,
  MOCK_EMAIL_PERFORMANCE,
  MOCK_OUTREACH_PERFORMANCE,
  MOCK_SALES_ACTIVITY,
} from '@/mock-data/reports';

export type {
  CompanyAnalyticsReport,
  IndustryAnalyticsReport,
  LeadConversionReport,
  EmailPerformanceReport,
  OutreachPerformanceReport,
  SalesActivityReport,
};

export async function getCompanyAnalyticsReports(): Promise<CompanyAnalyticsReport[]> {
  return [...MOCK_COMPANY_ANALYTICS];
}

export async function getIndustryAnalyticsReports(): Promise<IndustryAnalyticsReport[]> {
  return [...MOCK_INDUSTRY_ANALYTICS];
}

export async function getLeadConversionReports(): Promise<LeadConversionReport[]> {
  return [...MOCK_LEAD_CONVERSION];
}

export async function getEmailPerformanceReports(): Promise<EmailPerformanceReport[]> {
  return [...MOCK_EMAIL_PERFORMANCE];
}

export async function getOutreachPerformanceReports(): Promise<OutreachPerformanceReport[]> {
  return [...MOCK_OUTREACH_PERFORMANCE];
}

export async function getSalesActivityReports(): Promise<SalesActivityReport[]> {
  return [...MOCK_SALES_ACTIVITY];
}

export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(",");
  const csvContent = rows.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([headers + "\n" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, sheetName: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const xmlHeader = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${sheetName}">
<Table>`;

  const xmlHeaders = `<Row>` + headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('') + `</Row>`;
  const xmlRows = rows.map(r => `<Row>` + Object.values(r).map(v => `<Cell><Data ss:Type="String">${v}</Data></Cell>`).join('') + `</Row>`).join('\n');
  const xmlFooter = `</Table></Worksheet></Workbook>`;

  const blob = new Blob([xmlHeader + xmlHeaders + xmlRows + xmlFooter], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDFPrint(reportTitle: string): void {
  window.print();
}

export type ReportCategory = "company" | "industry" | "conversion" | "email" | "outreach" | "activity";

export function getCompanyAnalytics(): CompanyAnalyticsReport[] {
  return MOCK_COMPANY_ANALYTICS;
}

export function getIndustryAnalytics(): IndustryAnalyticsReport[] {
  return MOCK_INDUSTRY_ANALYTICS;
}

export function getLeadConversion(): LeadConversionReport[] {
  return MOCK_LEAD_CONVERSION;
}

export function getEmailPerformance(): EmailPerformanceReport[] {
  return MOCK_EMAIL_PERFORMANCE;
}

export function getOutreachPerformance(): OutreachPerformanceReport[] {
  return MOCK_OUTREACH_PERFORMANCE;
}

export function getSalesActivity(): SalesActivityReport[] {
  return MOCK_SALES_ACTIVITY;
}

export const reportServices = {
  getCompanyAnalytics,
  getIndustryAnalytics,
  getLeadConversion,
  getEmailPerformance,
  getOutreachPerformance,
  getSalesActivity,
  getCompanyAnalyticsReports,
  getIndustryAnalyticsReports,
  getLeadConversionReports,
  getEmailPerformanceReports,
  getOutreachPerformanceReports,
  getSalesActivityReports,
  exportCSV: (category: ReportCategory) => {
    switch (category) {
      case "company": exportToCSV("company-analytics", MOCK_COMPANY_ANALYTICS); break;
      case "industry": exportToCSV("industry-analytics", MOCK_INDUSTRY_ANALYTICS); break;
      case "conversion": exportToCSV("lead-conversion", MOCK_LEAD_CONVERSION); break;
      case "email": exportToCSV("email-performance", MOCK_EMAIL_PERFORMANCE); break;
      case "outreach": exportToCSV("outreach-performance", MOCK_OUTREACH_PERFORMANCE); break;
      case "activity": exportToCSV("sales-activity", MOCK_SALES_ACTIVITY); break;
    }
  },
  exportExcel: (category: ReportCategory) => {
    switch (category) {
      case "company": exportToExcel("company-analytics", "Companies", MOCK_COMPANY_ANALYTICS); break;
      case "industry": exportToExcel("industry-analytics", "Industries", MOCK_INDUSTRY_ANALYTICS); break;
      case "conversion": exportToExcel("lead-conversion", "Conversion", MOCK_LEAD_CONVERSION); break;
      case "email": exportToExcel("email-performance", "Email", MOCK_EMAIL_PERFORMANCE); break;
      case "outreach": exportToExcel("outreach-performance", "Outreach", MOCK_OUTREACH_PERFORMANCE); break;
      case "activity": exportToExcel("sales-activity", "Activity", MOCK_SALES_ACTIVITY); break;
    }
  },
  exportPDF: (category: ReportCategory) => {
    exportToPDFPrint(`${category.toUpperCase()} Report`);
  },
  exportToCSV,
  exportToExcel,
  exportToPDFPrint,
};
