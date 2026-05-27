export type StudyStatus = 'draft' | 'submitted' | 'published' | 'completed' | 'archived';

export interface ProductVolumeRow {
  product_category: string;
  annual_volume: number | string;
  annual_value: number | string;
  volume_percent: number;
  value_percent?: number;
}

export interface CustomerBaseRow {
  customer_name: string;
  annual_volume: number | string;
  volume_percent: number;
}

export interface MarketFocusRow {
  market_focus: string;
  volume: number | string;
  volume_percent: number;
}

export interface PerformanceRow {
  description: string;
  status?: number | 'measured' | 'not_measured';
  value: string;
  remark?: string;
}

export interface HeadCountRow {
  department: string;
  helpers: number | string;
  operators: number | string;
  supervisor: number | string;
  executive: number | string;
  checkers: number | string;
  manager: number | string;
}

export interface CostData {
  avg_operator_salary: number;
  total_direct_salary: number;
  total_indirect_salary: number;
  total_overheads: number;
  operating_expenses: number;
  avg_monthly_output: number;
  cost_per_pc: number;
  cost_per_min: number;
  factory_efficiency: number;
  productivity_per_person: number;
}

export interface ProcessExcellence {
  measure_standard_time?: string;
  measure_pcd?: string;
  interested_automation?: string;
  ie_department?: string;
  lean_belt_professionals?: string;
  lean_belt_level?: number | string;
  track_operator_performance?: string;
  training_school?: string;
  five_s_certification?: string;
  five_s_level?: number | string;
  incentive_system?: string;
  incentive_details?: string;
  one_year_plan?: string;
  improvement_projects?: {
    project?: string;
    current_performance?: string;
    goal?: string;
    completion_date?: string;
  }[];
  lean_tools_practiced?: string;
  lean_practice_details?: number | string;
  pain_areas?: string;
  improvements_expected?: string;
  improvement_areas?: string;
}

export interface DiagnosticStudy {
  id?: number | string;
  study_id?: number | string;
  _id?: number | string;
  company_id: number | string;
  title?: string;
  company_name?: string;
  report_date: string;
  analysis_period: string;
  prepared_by?: string;
  status: StudyStatus;
  company_background?: Record<string, unknown>;
  product_volume_mix?: ProductVolumeRow[];
  customer_base?: CustomerBaseRow[];
  market_focus?: MarketFocusRow[];
  quality_performance?: PerformanceRow[];
  head_count_data?: HeadCountRow[];
  cost_data?: CostData;
  delivery_performance?: PerformanceRow[];
  process_excellence?: ProcessExcellence;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_companies: number;
  total_studies: number;
  draft_reports: number;
  completed_reports: number;
  recent_studies: DiagnosticStudy[];
}
