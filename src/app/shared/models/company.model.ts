export type CompanyStatus = 'active' | 'inactive';
export type EntityId = number | string;

export interface Company {
  id?: EntityId;
  company_id?: EntityId;
  _id?: EntityId;
  companyId?: EntityId;
  company_name: string;
  location: string;
  address?: string;
  contact_person?: string;
  mail_id?: string;
  contact_phone_number?: string;
  whatsapp_number?: string;
  currency?: string;
  total_workforce: number;
  shift_operation: number;
  working_hours?: string;
  working_days?: number;
  sewing_lines?: number;
  production_system?: number | string;
  inventory_type?: number | string;
  workstation_type?: number | string;
  line_configuration?: number | string;
  status: CompanyStatus;
  created_at?: string;
  created_on?: string;
  updated_at?: string;
  updated_on?: string;
}

export interface Country {
  id?: EntityId;
  _id?: EntityId;
  country_name?: string;
  currency?: string;
}
