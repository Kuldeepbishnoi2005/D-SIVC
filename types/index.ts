export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  roll_number: string | null;
  course: string | null;
  department: string | null;
  institution: string;
  role: UserRole;
  created_at: string;
}

export type UserProfile = Profile;

export type BlockchainStatus = 'PENDING' | 'VERIFIED' | 'ANCHORED' | 'REVOKED' | 'FAILED';

export interface CredentialData {
  credentialId?: string;
  studentName?: string;
  rollNumber?: string;
  course?: string;
  department?: string;
  institution?: string;
  credentialType?: string;
  issueDate?: string;
  [key: string]: any;
}

export interface Credential {
  id: string;
  credential_id: string;
  student_id: string;
  credential_type: string;
  credential_data: CredentialData;
  credential_hash: string;
  blockchain_tx_hash: string | null;
  blockchain_status: BlockchainStatus;
  issued_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface AuthState {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole | null;
}
