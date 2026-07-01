import { Lead } from '@/types';

// Convert leads to CSV string
export function convertToCSV(leads: Lead[]): string {
  const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Expected Revenue (₹)', 'Next Follow-up', 'Created At', 'Updated At'];
  const rows = leads.map(lead => [
    lead.name,
    lead.email,
    lead.phone,
    lead.source,
    lead.status,
    lead.expectedRevenue,
    lead.nextFollowUp || '',
    lead.createdAt,
    lead.updatedAt
  ]);

  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

// Download helper utility
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export to CSV
export function exportToCSV(leads: Lead[], filename = 'crm_leads.csv') {
  const csv = convertToCSV(leads);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

// Export to Excel (with UTF-8 BOM so Excel opens it with correct formatting)
export function exportToExcel(leads: Lead[], filename = 'crm_leads.csv') {
  const csv = '\uFEFF' + convertToCSV(leads);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

// Export to PDF using print page window
export function exportToPDF(leads: Lead[], title = 'Leads Database Report') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; }
          h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
          p { font-size: 11px; color: #64748b; margin-top: 0; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
          th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px; font-weight: bold; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
          tr:nth-child(even) td { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on ${new Date().toLocaleDateString()} | Total Record Count: ${leads.length}</p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Source</th>
              <th>Status</th>
              <th>Expected Revenue</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(lead => `
              <tr>
                <td><strong>${lead.name}</strong></td>
                <td>${lead.email}</td>
                <td>${lead.phone}</td>
                <td>${lead.source}</td>
                <td>${lead.status}</td>
                <td>₹${lead.expectedRevenue.toLocaleString('en-IN')}</td>
                <td>${new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
