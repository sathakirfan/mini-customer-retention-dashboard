import { Lead } from '@/types';

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Sarah Jenkins',
    phone: '+1 (555) 234-5678',
    email: 'sarah.jenkins@gmail.com',
    source: 'Instagram',
    status: 'Negotiation',
    expectedRevenue: 1800,
    nextFollowUp: '2026-07-02',
    notes: [
      {
        id: 'note-1-1',
        content: 'Responded to wedding photography package inquiry. Sent custom quote.',
        createdAt: '2026-06-28T10:30:00Z',
      },
      {
        id: 'note-1-2',
        content: 'Had a discovery call. She loves the portolio but is checking budget with partner.',
        createdAt: '2026-06-29T14:15:00Z',
      },
    ],
    createdAt: '2026-06-27T08:00:00Z',
    updatedAt: '2026-06-29T14:15:00Z',
  },
  {
    id: 'lead-2',
    name: 'Marcus Vance',
    phone: '+1 (555) 345-6789',
    email: 'marcus.vance@yahoo.com',
    source: 'WhatsApp',
    status: 'New',
    expectedRevenue: 1200,
    nextFollowUp: '2026-07-01',
    notes: [
      {
        id: 'note-2-1',
        content: 'Inquired about the 3-month personal training transformation package.',
        createdAt: '2026-06-30T09:00:00Z',
      },
    ],
    createdAt: '2026-06-30T09:00:00Z',
    updatedAt: '2026-06-30T09:00:00Z',
  },
  {
    id: 'lead-3',
    name: 'Elena Rostova',
    phone: '+1 (555) 456-7890',
    email: 'elena.rostova@outlook.com',
    source: 'Referral',
    status: 'Won',
    expectedRevenue: 2500,
    nextFollowUp: '2026-07-15',
    notes: [
      {
        id: 'note-3-1',
        content: 'Referred by past client Julian. Inquired about full brand design suite.',
        createdAt: '2026-06-20T11:00:00Z',
      },
      {
        id: 'note-3-2',
        content: 'Proposal sent and approved! Invoice 50% deposit paid.',
        createdAt: '2026-06-24T16:30:00Z',
      },
    ],
    createdAt: '2026-06-20T11:00:00Z',
    updatedAt: '2026-06-24T16:30:00Z',
  },
  {
    id: 'lead-4',
    name: 'David Kim',
    phone: '+1 (555) 567-8901',
    email: 'd.kim@techcorp.com',
    source: 'Google',
    status: 'Contacted',
    expectedRevenue: 850,
    nextFollowUp: '2026-06-28', // OVERDUE
    notes: [
      {
        id: 'note-4-1',
        content: 'Submitted form for commercial window cleaning service.',
        createdAt: '2026-06-25T13:00:00Z',
      },
      {
        id: 'note-4-2',
        content: 'Left voicemail. Called to schedule on-site walkthrough.',
        createdAt: '2026-06-26T15:00:00Z',
      },
    ],
    createdAt: '2026-06-25T13:00:00Z',
    updatedAt: '2026-06-26T15:00:00Z',
  },
  {
    id: 'lead-5',
    name: 'Olivia Martinez',
    phone: '+1 (555) 678-9012',
    email: 'olivia.m@designstudio.io',
    source: 'Facebook',
    status: 'Lost',
    expectedRevenue: 3000,
    nextFollowUp: '',
    notes: [
      {
        id: 'note-5-1',
        content: 'Requested quote for storefront floral installation.',
        createdAt: '2026-06-10T10:00:00Z',
      },
      {
        id: 'note-5-2',
        content: 'Sent proposal. Followed up twice. Client went with a cheaper local competitor.',
        createdAt: '2026-06-18T09:45:00Z',
      },
    ],
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-18T09:45:00Z',
  },
  {
    id: 'lead-6',
    name: 'Robert Taylor',
    phone: '+1 (555) 789-0123',
    email: 'rtaylor@buildwell.net',
    source: 'Walk-in',
    status: 'Negotiation',
    expectedRevenue: 4500,
    nextFollowUp: '2026-07-05',
    notes: [
      {
        id: 'note-6-1',
        content: 'Walked in to discuss office renovation consulting.',
        createdAt: '2026-06-22T14:00:00Z',
      },
      {
        id: 'note-6-2',
        content: 'Sent detailed project timeline and layout mockups. Client requested edits.',
        createdAt: '2026-06-26T11:20:00Z',
      },
    ],
    createdAt: '2026-06-22T14:00:00Z',
    updatedAt: '2026-06-26T11:20:00Z',
  },
  {
    id: 'lead-7',
    name: 'Chloe Dubois',
    phone: '+1 (555) 890-1234',
    email: 'chloe.dubois@fashionweek.fr',
    source: 'Instagram',
    status: 'Won',
    expectedRevenue: 1500,
    nextFollowUp: '2026-07-10',
    notes: [
      {
        id: 'note-7-1',
        content: 'DM inquiry for custom gown tailoring.',
        createdAt: '2026-06-15T18:30:00Z',
      },
      {
        id: 'note-7-2',
        content: 'Fitting scheduled and completed. Full payment received.',
        createdAt: '2026-06-19T17:00:00Z',
      },
    ],
    createdAt: '2026-06-15T18:30:00Z',
    updatedAt: '2026-06-19T17:00:00Z',
  },
  {
    id: 'lead-8',
    name: 'Thomas Anderson',
    phone: '+1 (555) 901-2345',
    email: 'neo@metacortex.com',
    source: 'Google',
    status: 'New',
    expectedRevenue: 600,
    nextFollowUp: '2026-06-29', // OVERDUE
    notes: [
      {
        id: 'note-8-1',
        content: 'Inquired about cyber security awareness workshop for small teams.',
        createdAt: '2026-06-28T09:15:00Z',
      },
    ],
    createdAt: '2026-06-28T09:15:00Z',
    updatedAt: '2026-06-28T09:15:00Z',
  },
  {
    id: 'lead-9',
    name: 'Sophia Loren',
    phone: '+1 (555) 012-3456',
    email: 'sophia@lorenclassics.it',
    source: 'Other',
    status: 'Contacted',
    expectedRevenue: 3200,
    nextFollowUp: '2026-07-03',
    notes: [
      {
        id: 'note-9-1',
        content: 'Emailed inquiring about private catering for 30 guests.',
        createdAt: '2026-06-26T12:00:00Z',
      },
      {
        id: 'note-9-2',
        content: 'Sent sample menus (Classic Italian). Waiting for menu selection.',
        createdAt: '2026-06-28T15:40:00Z',
      },
    ],
    createdAt: '2026-06-26T12:00:00Z',
    updatedAt: '2026-06-28T15:40:00Z',
  },
  {
    id: 'lead-10',
    name: 'Julian Alvarez',
    phone: '+1 (555) 123-4560',
    email: 'julian.a@mancity.com',
    source: 'Referral',
    status: 'Won',
    expectedRevenue: 950,
    nextFollowUp: '2026-07-12',
    notes: [
      {
        id: 'note-10-1',
        content: 'Inquired about custom leather goods gifting.',
        createdAt: '2026-06-12T10:00:00Z',
      },
      {
        id: 'note-10-2',
        content: 'Order placed, products crafted and shipped.',
        createdAt: '2026-06-18T14:30:00Z',
      },
    ],
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-06-18T14:30:00Z',
  },
];

const STORAGE_KEY = 'hyperlocal_crm_leads';

export function getLocalLeads(): Lead[] {
  if (typeof window === 'undefined') return MOCK_LEADS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_LEADS));
    return MOCK_LEADS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse leads from local storage', e);
    return MOCK_LEADS;
  }
}

export function saveLocalLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}
