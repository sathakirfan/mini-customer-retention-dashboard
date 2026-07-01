import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Lead, LeadNote } from '@/types';
import { getLocalLeads, saveLocalLeads, MOCK_LEADS } from '@/lib/mockData';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';

const COLLECTION_NAME = 'leads';

// Real-time listener for Leads
export function subscribeToLeads(callback: (leads: Lead[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed in the background to provide a great initial experience
          seedFirestoreDatabase().catch((err) => {
            console.error('Database auto-seed failed:', err);
          });
        }
        const leads: Lead[] = [];
        snapshot.forEach((docSnap) => {
          leads.push({ id: docSnap.id, ...docSnap.data() } as Lead);
        });
        callback(leads);
      },
      (error) => {
        console.error('Firestore subscription error, falling back to localStorage:', error);
        // Fallback to local storage in case of permissions or connectivity errors
        const local = getLocalLeads();
        callback(local);
      }
    );
  } else {
    // LocalStorage / Mock Mode
    const local = getLocalLeads();
    callback(local);

    // Set up a custom window event dispatch to sync between tabs in localStorage mode
    const handleStorageChange = () => {
      callback(getLocalLeads());
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event listener for same-tab updates
    window.addEventListener('local-leads-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-leads-updated', handleStorageChange);
    };
  }
}

// Trigger same-tab updates in local storage mode
const notifyLocalUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('local-leads-updated'));
  }
};

// Create a Lead
export async function createLead(
  leadInput: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & { initialNote?: string }
): Promise<Lead> {
  const id = isFirebaseConfigured ? doc(collection(db!, COLLECTION_NAME)).id : `lead-${Date.now()}`;
  const now = new Date().toISOString();

  const initialNotes = leadInput.initialNote 
    ? [{ id: `note-${Date.now()}`, content: leadInput.initialNote, createdAt: now }]
    : [];

  const { initialNote, ...savePayload } = leadInput;

  const newLead: Lead = {
    ...savePayload,
    id,
    notes: initialNotes,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION_NAME, id), newLead);
  } else {
    const leads = getLocalLeads();
    leads.unshift(newLead);
    saveLocalLeads(leads);
    notifyLocalUpdate();
  }

  return newLead;
}

// Update a Lead
export async function updateLead(id: string, updates: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<void> {
  const now = new Date().toISOString();
  const leadUpdates = {
    ...updates,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, leadUpdates);
  } else {
    const leads = getLocalLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...leadUpdates };
      saveLocalLeads(leads);
      notifyLocalUpdate();
    } else {
      throw new Error(`Lead with ID ${id} not found.`);
    }
  }
}

// Delete a Lead
export async function deleteLead(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } else {
    const leads = getLocalLeads();
    const filtered = leads.filter((l) => l.id !== id);
    saveLocalLeads(filtered);
    notifyLocalUpdate();
  }
}

// Add a Follow-up Note to a Lead
export async function addLeadNote(leadId: string, content: string): Promise<LeadNote> {
  const now = new Date().toISOString();
  const newNote: LeadNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    createdAt: now,
  };

  if (isFirebaseConfigured && db) {
    // For Firestore, we fetch, update the notes array, and save back
    // (This keeps the schema simple and identical to local storage model)
    const docRef = doc(db, COLLECTION_NAME, leadId);
    
    // In production we should use arrayUnion but since we also update updatedAt,
    // we will fetch first or perform a direct write if we have the current notes.
    // Let's get the document
    const docSnap = await getDocs(query(collection(db, COLLECTION_NAME)));
    let currentLead: Lead | undefined;
    docSnap.forEach((d) => {
      if (d.id === leadId) {
        currentLead = d.data() as Lead;
      }
    });

    if (currentLead) {
      const updatedNotes = [...(currentLead.notes || []), newNote];
      await updateDoc(docRef, {
        notes: updatedNotes,
        updatedAt: now,
      });
    } else {
      throw new Error(`Lead with ID ${leadId} not found.`);
    }
  } else {
    const leads = getLocalLeads();
    const index = leads.findIndex((l) => l.id === leadId);
    if (index !== -1) {
      leads[index].notes = [...(leads[index].notes || []), newNote];
      leads[index].updatedAt = now;
      saveLocalLeads(leads);
      notifyLocalUpdate();
    } else {
      throw new Error(`Lead with ID ${leadId} not found.`);
    }
  }

  return newNote;
}

// Subscribe to a Single Lead's updates in Real-time
export function subscribeToLead(id: string, callback: (lead: Lead | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as Lead);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`Error listening to lead ${id}:`, error);
        callback(null);
      }
    );
  } else {
    const handler = () => {
      const leads = getLocalLeads();
      const lead = leads.find((l) => l.id === id) || null;
      callback(lead);
    };
    // Run once
    handler();
    window.addEventListener('local-leads-updated', handler);
    return () => {
      window.removeEventListener('local-leads-updated', handler);
    };
  }
}

// Seed Database Utility (Admin/Dev only)
export async function seedFirestoreDatabase(): Promise<boolean> {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase is not configured. Seeding is only available for Firestore mode.');
    return false;
  }

  const firestoreDb = db;

  try {
    const querySnapshot = await getDocs(collection(firestoreDb, COLLECTION_NAME));
    if (!querySnapshot.empty) {
      console.log('Database already has data. Skipping seed.');
      return false; // Already seeded
    }

    const batch = writeBatch(firestoreDb);
    MOCK_LEADS.forEach((lead) => {
      const docRef = doc(firestoreDb, COLLECTION_NAME, lead.id);
      batch.set(docRef, lead);
    });

    await batch.commit();
    console.log('Database seeded successfully with mock data.');
    return true;
  } catch (error) {
    console.error('Failed to seed database:', error);
    return false;
  }
}

// Unified Database Seeding function (handles both Firebase and LocalStorage modes)
export async function seedDatabase(force = false): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    const firestoreDb = db;
    try {
      if (!force) {
        const querySnapshot = await getDocs(collection(firestoreDb, COLLECTION_NAME));
        if (!querySnapshot.empty) {
          console.log('Database already has data. Skipping seed.');
          return false;
        }
      }
      const batch = writeBatch(firestoreDb);
      MOCK_LEADS.forEach((lead) => {
        const docRef = doc(firestoreDb, COLLECTION_NAME, lead.id);
        batch.set(docRef, lead);
      });
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Failed to seed firestore database:', error);
      return false;
    }
  } else {
    saveLocalLeads(MOCK_LEADS);
    notifyLocalUpdate();
    return true;
  }
}
