export interface Employee {
  id: string;
  loginId: string;
  password?: string;
  name: string;
  active: boolean;
  leadCount: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  assignedTo: string | null;
  status: 'New' | 'Contacted' | 'Closed';
  notes?: string;
  followUpDate?: string; // ISO String or datetime string
  timeline?: {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    notes?: string;
  }[];
  updatedAt?: string;
  createdAt: string;
}

export interface AdminProfile {
  name: string;
  loginId: string;
  password?: string;
}

export interface AppState {
  employees: Employee[];
  leads: Lead[];
  adminProfile?: AdminProfile;
}
