/**
 * services/export/index.js
 * 
 * Strategy Pattern — Barrel file & Strategy Registry.
 * 
 * This is the single registration point for all export strategies.
 * To add a new export format in the future (e.g., PDF), simply:
 *   1. Create PDFExportStrategy.js with an execute() method
 *   2. Import it here and add: pdf: new PDFExportStrategy()
 * 
 * No changes to ExportReports.jsx are needed — Open/Closed Principle.
 */

import { CSVExportStrategy } from './CSVExportStrategy';
import { EmailExportStrategy } from './EmailExportStrategy';

export const exportStrategies = {
  csv:   new CSVExportStrategy(),
  email: new EmailExportStrategy(),
};
