'use client';

import { useEffect, useState } from 'react';
import { Lead, LeadNote } from '@/types';
import { subscribeToLead, updateLead, addLeadNote, deleteLead } from '@/services/leadService';
import { toast } from 'sonner';

export function useLead(leadId: string) {
  const [currentId, setCurrentId] = useState(leadId);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  if (leadId !== currentId) {
    setCurrentId(leadId);
    setLead(null);
    setIsLoading(true);
  }

  useEffect(() => {
    if (!leadId) return;

    const unsubscribe = subscribeToLead(leadId, (fetchedLead) => {
      setLead(fetchedLead);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [leadId]);

  const updateLeadProfile = async (updates: Partial<Omit<Lead, 'id' | 'createdAt'>>) => {
    try {
      await updateLead(leadId, updates);
      toast.success('Lead profile updated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile.');
      throw error;
    }
  };

  const addNote = async (content: string): Promise<LeadNote> => {
    try {
      const newNote = await addLeadNote(leadId, content);
      toast.success('Follow-up note added.');
      return newNote;
    } catch (error) {
      console.error(error);
      toast.error('Failed to add note.');
      throw error;
    }
  };

  const removeLeadById = async () => {
    try {
      await deleteLead(leadId);
      toast.success('Lead deleted successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete lead.');
      throw error;
    }
  };

  return {
    lead,
    isLoading,
    updateLeadProfile,
    addNote,
    removeLeadById,
  };
}
