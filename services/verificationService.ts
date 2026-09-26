import { supabase } from '../lib/supabase';

export interface VerificationResult {
  credential_id: string;
  credential_type: string;
  credential_hash: string;
  blockchain_tx_hash: string | null;
  blockchain_status: string;
  issued_at: string;
  revoked_at: string | null;
  credential_data?: Record<string, any>;
  is_valid: boolean;
  is_revoked: boolean;
}

export const verificationService = {
  async verifyCredential(credentialIdOrHash: string): Promise<VerificationResult | null> {
    try {
      const { data, error } = await supabase.rpc('verify_public_credential', {
        p_credential_id: credentialIdOrHash,
      });

      if (error) {
        console.error('Error in verification RPC call:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0] as VerificationResult;
      }
      return null;
    } catch (err) {
      console.error('Unexpected error verifying credential:', err);
      return null;
    }
  },
};
