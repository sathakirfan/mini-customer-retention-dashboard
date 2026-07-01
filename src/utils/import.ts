import { LeadSource, LeadStatus } from '@/types';

export interface ParsedCSVRow {
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  expectedRevenue: number;
  nextFollowUp?: string;
  notes?: string;
}

export interface CSVParseResult {
  data: ParsedCSVRow[];
  errors: string[];
  warnings: string[];
}

// Client-side parser for uploaded CSV lead lists
export function parseCSV(text: string): CSVParseResult {
  const result: CSVParseResult = { data: [], errors: [], warnings: [] };
  if (!text || text.trim() === '') {
    result.errors.push('Uploaded file is empty.');
    return result;
  }

  // Split lines while keeping quoted text intact
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim() !== '') {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r' && text[i + 1] === '\n') {
        i++; // skip standard \n following \r
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim() !== '') {
    lines.push(currentLine);
  }

  if (lines.length < 2) {
    result.errors.push('CSV must contain a header row and at least one data row.');
    return result;
  }

  // Helper to split row by commas, ignoring commas in double-quoted strings
  const splitLine = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inside = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inside = !inside;
      } else if (char === ',' && !inside) {
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headers = splitLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Header matching indexes
  const nameIdx = headers.findIndex(h => h === 'name' || h === 'fullname' || h === 'clientname');
  const emailIdx = headers.findIndex(h => h === 'email' || h === 'emailaddress');
  const phoneIdx = headers.findIndex(h => h === 'phone' || h === 'phonenumber' || h === 'mobile');
  
  // Optional indexes
  const sourceIdx = headers.findIndex(h => h === 'source' || h === 'leadsource' || h === 'channels');
  const statusIdx = headers.findIndex(h => h === 'status' || h === 'pipelinestatus' || h === 'stage');
  const revenueIdx = headers.findIndex(h => h === 'expectedrevenue' || h === 'revenue' || h === 'budget' || h === 'dealvalue');
  const followUpIdx = headers.findIndex(h => h === 'nextfollowup' || h === 'followupdate' || h === 'reminddate');
  const notesIdx = headers.findIndex(h => h === 'notes' || h === 'note' || h === 'comments');

  // Verify headers exist
  if (nameIdx === -1) result.errors.push('Missing required column header: "Name"');
  if (emailIdx === -1) result.errors.push('Missing required column header: "Email"');
  if (phoneIdx === -1) result.errors.push('Missing required column header: "Phone"');

  if (result.errors.length > 0) {
    return result;
  }

  // Parse lines
  for (let r = 1; r < lines.length; r++) {
    const fields = splitLine(lines[r]);
    if (fields.length === 1 && fields[0] === '') continue; // ignore blank spacing

    const name = fields[nameIdx] || '';
    const email = fields[emailIdx] || '';
    const phone = fields[phoneIdx] || '';

    if (!name || name.trim() === '') {
      result.warnings.push(`Row ${r + 1}: Skipped. Client Name field is empty.`);
      continue;
    }
    if (!email || !email.includes('@')) {
      result.warnings.push(`Row ${r + 1}: Skipped. Email is invalid or missing.`);
      continue;
    }

    // Source mapping match
    let source: LeadSource = 'Other';
    if (sourceIdx !== -1 && fields[sourceIdx]) {
      const rawSrc = fields[sourceIdx].trim();
      const validSources: LeadSource[] = ['Instagram', 'Facebook', 'WhatsApp', 'Google', 'Walk-in', 'Referral', 'Other'];
      const matched = validSources.find(s => s.toLowerCase() === rawSrc.toLowerCase());
      if (matched) source = matched;
    }

    // Status stage mapping match
    let status: LeadStatus = 'New';
    if (statusIdx !== -1 && fields[statusIdx]) {
      const rawStatus = fields[statusIdx].trim();
      const validStatuses: LeadStatus[] = ['New', 'Contacted', 'Negotiation', 'Won', 'Lost'];
      const matched = validStatuses.find(s => s.toLowerCase() === rawStatus.toLowerCase());
      if (matched) status = matched;
    }

    // Revenue value match
    let expectedRevenue = 0;
    if (revenueIdx !== -1 && fields[revenueIdx]) {
      const parsedRev = parseFloat(fields[revenueIdx].replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedRev)) expectedRevenue = parsedRev;
    }

    // Follow-up date match
    let nextFollowUp = '';
    if (followUpIdx !== -1 && fields[followUpIdx]) {
      const rawDate = fields[followUpIdx].trim();
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          nextFollowUp = d.toISOString().split('T')[0];
        }
      }
    }

    const notes = notesIdx !== -1 ? fields[notesIdx] : '';

    result.data.push({
      name,
      email,
      phone,
      source,
      status,
      expectedRevenue,
      nextFollowUp,
      notes
    });
  }

  return result;
}
