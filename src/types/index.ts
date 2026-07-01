export type LeadStatus = 'New' | 'Contacted' | 'Negotiation' | 'Won' | 'Lost';

export type LeadSource =
  | 'Instagram'
  | 'Facebook'
  | 'WhatsApp'
  | 'Google'
  | 'Walk-in'
  | 'Referral'
  | 'Other';

export interface LeadNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  expectedRevenue: number;
  nextFollowUp: string; // Format: YYYY-MM-DD
  notes: LeadNote[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  counterOffer?: number;
  counterOfferStatus?: 'Pending' | 'Accepted' | 'Rejected';
}

export interface DashboardStats {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  revenuePipeline: number;
  overdueFollowUps: number;
  upcomingFollowUps: number;
  sourcePerformance: Record<LeadSource, number>;
  statusBreakdown: Record<LeadStatus, number>;
}
