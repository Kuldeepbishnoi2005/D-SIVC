import { supabase } from '../lib/supabase';
import { Credential, UserProfile } from '../types';
import * as Crypto from 'expo-crypto';

export const credentialService = {
  async getMyCredentials(): Promise<Credential[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    return this.getStudentCredentials(user.id);
  },

  async getStudentCredentials(studentId: string): Promise<Credential[]> {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student credentials:', error);
      return [];
    }
    return (data as Credential[]) || [];
  },

  async getAllCredentials(): Promise<Credential[]> {
    const { data: creds, error } = await supabase
      .from('credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !creds) {
      console.error('Error fetching all credentials:', error);
      return [];
    }

    const { data: profiles } = await supabase.from('profiles').select('*');
    const profileMap = new Map<string, UserProfile>();
    if (profiles) {
      profiles.forEach((p) => profileMap.set(p.id, p as UserProfile));
    }

    return creds.map((c) => ({
      ...c,
      student: profileMap.get(c.student_id),
    })) as Credential[];
  },

  async getAllStudents(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students list:', error);
      return [];
    }
    return (data as UserProfile[]) || [];
  },

  async getCredentialById(id: string): Promise<Credential | null> {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching credential by ID:', error);
      return null;
    }
    return data as Credential;
  },

  async getCredentialByCredentialId(credentialId: string): Promise<Credential | null> {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('credential_id', credentialId)
      .single();

    if (error) {
      console.error('Error fetching credential by public ID:', error);
      return null;
    }
    return data as Credential;
  },

  async createCredential(
    studentId: string,
    credentialType: string,
    payload: Record<string, any>
  ): Promise<Credential | null> {
    try {
      // 0. Pre-check: Verify student has not already received a credential
      const existingCreds = await this.getStudentCredentials(studentId);
      if (existingCreds && existingCreds.length > 0) {
        throw new Error('This student has already been issued a credential. Each student can be issued a credential only once.');
      }

      // 1. Generate unique readable credential_id
      const publicCredentialId = `DSIVC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 2. Compute SHA-256 Hash of payload using expo-crypto
      const payloadWithId = { ...payload, credential_id: publicCredentialId };
      const payloadString = JSON.stringify(payloadWithId);
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        payloadString
      );
      const credentialHash = `0x${hash}`;

      // 3. Insert into Supabase 'credentials' table with blockchain_status = 'PENDING'
      const { data, error } = await supabase
        .from('credentials')
        .insert([
          {
            credential_id: publicCredentialId,
            student_id: studentId,
            credential_type: credentialType,
            credential_data: payloadWithId,
            credential_hash: credentialHash,
            blockchain_tx_hash: null,
            blockchain_status: 'PENDING',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating credential in database:', error);
        if (error.code === '23505') {
          throw new Error('This student has already been issued a credential.');
        }
        throw new Error(error.message || 'Failed to insert credential record in database.');
      }

      // 4. Trigger Supabase Edge Function to anchor credential to Polygon Amoy Testnet
      try {
        console.log(`[Edge Function] Invoking issue-credential for ${publicCredentialId}...`);
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('issue-credential', {
          body: { credential_id: publicCredentialId, id: data.id },
        });

        if (edgeError) {
          console.error('Edge function anchoring error:', edgeError);
        } else if (edgeData && (edgeData.success || edgeData.blockchain_status === 'ANCHORED')) {
          const txHash = edgeData.blockchain_tx_hash || edgeData.txHash;
          console.log('[Polygon Amoy] Successfully anchored on-chain! Tx:', txHash);
          return {
            ...data,
            blockchain_status: 'ANCHORED',
            blockchain_tx_hash: txHash,
          } as Credential;
        } else if (edgeData && !edgeData.success) {
          console.warn('[Edge Function] Returned non-success response:', edgeData.error);
        }
      } catch (fnErr) {
        console.error('Exception invoking issue-credential Edge Function:', fnErr);
      }

      return data as Credential;
    } catch (err) {
      console.error('Exception creating credential:', err);
      return null;
    }
  },

  async anchorCredentialOnChain(credentialId: string): Promise<Credential | null> {
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('issue-credential', {
        body: { credential_id: credentialId },
      });

      if (edgeError) {
        console.error('Error anchoring credential via Edge Function:', edgeError);
        return null;
      }

      if (edgeData && (edgeData.success || edgeData.blockchain_status === 'ANCHORED')) {
        return await this.getCredentialByCredentialId(credentialId) || await this.getCredentialById(credentialId);
      }
      return null;
    } catch (err) {
      console.error('Exception anchoring credential on-chain:', err);
      return null;
    }
  },

  async revokeCredential(idOrCredentialId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`[Edge Function] Invoking revoke-credential for ${idOrCredentialId}...`);
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('revoke-credential', {
        body: { credential_id: idOrCredentialId, id: idOrCredentialId },
      });

      if (edgeError) {
        console.error('Edge function revocation error:', edgeError);
        return { success: false, error: edgeError.message || 'Edge function call failed.' };
      }

      if (edgeData && (edgeData.success || edgeData.blockchain_status === 'REVOKED')) {
        const txHash = edgeData.blockchain_tx_hash || edgeData.txHash;
        console.log('[Polygon Amoy] Successfully revoked on-chain! Tx:', txHash);
        return { success: true, txHash };
      }

      return { success: false, error: edgeData?.error || 'Failed to revoke credential.' };
    } catch (err: any) {
      console.error('Exception revoking credential:', err);
      return { success: false, error: err.message || 'An unexpected error occurred during revocation.' };
    }
  },
};

