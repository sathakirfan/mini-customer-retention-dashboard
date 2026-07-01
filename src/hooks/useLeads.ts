'use client';

import { useEffect, useState, useMemo } from 'react';
import { Lead, LeadStatus, LeadSource } from '@/types';
import { subscribeToLeads, createLead, updateLead, deleteLead, addLeadNote } from '@/services/leadService';
import { toast } from 'sonner';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter and Sort states
  const [searchQuery, setSearchQueryState] = useState('');
  const [statusFilter, setStatusFilterState] = useState<LeadStatus | 'All'>('All');
  const [sourceFilter, setSourceFilterState] = useState<LeadSource | 'All'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'expectedRevenue' | 'createdAt' | 'nextFollowUp'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Custom setters to auto-reset to page 1
  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    setCurrentPage(1);
  };

  const setStatusFilter = (status: LeadStatus | 'All') => {
    setStatusFilterState(status);
    setCurrentPage(1);
  };

  const setSourceFilter = (source: LeadSource | 'All') => {
    setStatusFilterState('All'); // Reset status if source changes? No, just keep standard behavior
    setSourceFilterState(source);
    setCurrentPage(1);
  };
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Subscribe to realtime database updates
  useEffect(() => {
    const unsubscribe = subscribeToLeads((fetchedLeads) => {
      setLeads(fetchedLeads);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter, sort and paginated operations memoized
  const processedLeads = useMemo(() => {
    // 1. Filter
    const result = leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery);

      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });

    // 2. Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'expectedRevenue') {
        comparison = a.expectedRevenue - b.expectedRevenue;
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'nextFollowUp') {
        const dateA = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : 0;
        const dateB = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [leads, searchQuery, statusFilter, sourceFilter, sortBy, sortOrder]);

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedLeads.slice(startIndex, startIndex + pageSize);
  }, [processedLeads, currentPage, pageSize]);

  const totalPages = Math.ceil(processedLeads.length / pageSize) || 1;

  // Operations
  const addLead = async (leadInput: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
    try {
      const newLead = await createLead(leadInput);
      toast.success(`Lead "${newLead.name}" created successfully.`);
      return newLead;
    } catch (error) {
      console.error(error);
      toast.error('Failed to create lead.');
      throw error;
    }
  };

  const editLead = async (id: string, updates: Partial<Omit<Lead, 'id' | 'createdAt'>>) => {
    try {
      await updateLead(id, updates);
      toast.success('Lead updated successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update lead.');
      throw error;
    }
  };

  const removeLead = async (id: string) => {
    try {
      await deleteLead(id);
      toast.success('Lead deleted successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete lead.');
      throw error;
    }
  };

  const addNoteToLead = async (leadId: string, content: string) => {
    try {
      const note = await addLeadNote(leadId, content);
      toast.success('Note added successfully.');
      return note;
    } catch (error) {
      console.error(error);
      toast.error('Failed to add follow-up note.');
      throw error;
    }
  };

  const duplicateLead = async (leadId: string) => {
    const original = leads.find((l) => l.id === leadId);
    if (!original) {
      toast.error('Lead not found.');
      return;
    }
    try {
      const { id, createdAt, updatedAt, notes, ...rest } = original;
      const copy = { ...rest, name: `${rest.name} (Copy)` };
      const newLead = await createLead(copy);
      toast.success(`"${newLead.name}" duplicated successfully.`);
      return newLead;
    } catch (error) {
      console.error(error);
      toast.error('Failed to duplicate lead.');
      throw error;
    }
  };

  return {
    leads: processedLeads,
    paginatedLeads,
    isLoading,
    // Filter and Sort states/setters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    // Pagination states/setters
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    // Operations
    addLead,
    editLead,
    removeLead,
    addNoteToLead,
    duplicateLead,
  };
}

