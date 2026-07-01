/**
 * Formats an ISO date string or YYYY-MM-DD string into a clean, human-readable format.
 * Example: '2026-06-30' -> 'Jun 30, 2026'
 */
export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'N/A';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Formats an ISO string to show both date and time.
 * Example: '2026-06-30T13:30:00Z' -> 'Jun 30, 2026, 1:30 PM'
 */
export function formatDateTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'N/A';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Determines whether a follow-up date is overdue, today, or upcoming.
 * Compares only the YYYY-MM-DD portion.
 */
export function getFollowUpStatus(nextFollowUp: string | undefined): 'overdue' | 'today' | 'upcoming' | 'none' {
  if (!nextFollowUp) return 'none';

  // Normalize inputs to YYYY-MM-DD
  const targetDateStr = nextFollowUp.split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) return 'none';

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (targetDateStr === todayStr) {
    return 'today';
  } else if (targetDateStr < todayStr) {
    return 'overdue';
  } else {
    return 'upcoming';
  }
}
