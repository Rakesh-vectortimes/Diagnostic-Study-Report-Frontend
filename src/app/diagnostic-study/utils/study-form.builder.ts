import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

const MARKET_FOCUS_DEFAULTS = ['Export', 'Domestic B2B', 'Retail B2C', 'Online'];

const QUALITY_DEFAULTS = [
  'Customer Complaint',
  'Rework %',
  'Right First Time',
  'Rejection %',
  'Second Grade %',
  'Re screen / Failed shipments',
  'Cut to Ship Ratio',
];

const HEAD_COUNT_DEFAULTS = [
  'Raw material Warehouse',
  'CAD',
  'Cutting Room',
  'Sewing',
  'Finishing',
  'Packing',
  'Quality',
  'Maintenance',
  'Industrial Engineering',
  'Merchandising',
  'HR',
  'Import / Export',
  'IT',
  'General Management / Others',
];

const DELIVERY_DEFAULTS = [
  'Ontime in Full',
  'Order to Ship Ratio',
  'Average Lead Time',
];

export function createStudyForm(fb: FormBuilder): FormGroup {
  const startedAt = new Date();

  return fb.group({
    company_background: fb.group({
      company_id: [null, Validators.required],
      company_name: [''],
      prepared_by: [''],
      report_date: [startedAt, Validators.required],
      analysis_period: [''],
      analysis_period_from: [startedAt, Validators.required],
      analysis_period_to: [null],
      company_introduction: [''],
      location: [''],
      total_workforce: [null, [Validators.min(0)]],
      shift_operation: [''],
      working_hours: [''],
      working_days: [''],
    }),
    product_volume_mix: fb.array([]),
    customer_base: fb.array([]),
    market_focus: fb.array(
      MARKET_FOCUS_DEFAULTS.map((m) => createMarketFocusRow(fb, m))
    ),
    quality_performance: fb.array(
      QUALITY_DEFAULTS.map((d) => createPerformanceRow(fb, d))
    ),
    head_count_data: fb.array(
      HEAD_COUNT_DEFAULTS.map((d) => createHeadCountRow(fb, d))
    ),
    cost_data: fb.group({
      avg_operator_salary: [null, Validators.min(0)],
      total_direct_salary: [null, Validators.min(0)],
      total_indirect_salary: [null, Validators.min(0)],
      total_overheads: [null, Validators.min(0)],
      operating_expenses: [null, Validators.min(0)],
      avg_monthly_output: [null, Validators.min(0)],
      cost_per_pc: [null, Validators.min(0)],
      cost_per_min: [null, Validators.min(0)],
      factory_efficiency: [null, Validators.min(0)],
      productivity_per_person: [null, Validators.min(0)],
    }),
    delivery_performance: fb.array(
      DELIVERY_DEFAULTS.map((d) => createPerformanceRow(fb, d))
    ),
    process_excellence: fb.group({
      measure_standard_time: [''],
      measure_pcd: [''],
      interested_automation: [''],
      ie_department: [''],
      lean_belt_professionals: [''],
      lean_belt_level: [''],
      track_operator_performance: [''],
      training_school: [''],
      five_s_certification: [''],
      five_s_level: [''],
      incentive_system: [''],
      incentive_details: [''],
      one_year_plan: [''],
      improvement_projects: fb.array([]),
      lean_tools_practiced: [''],
      lean_practice_details: [''],
      pain_areas: [''],
      improvements_expected: [''],
      improvement_areas: [''],
    }),
    status: ['draft'],
  });
}

export function createProductVolumeRow(fb: FormBuilder): FormGroup {
  return fb.group({
    product_category: ['', Validators.required],
    annual_volume: ['', Validators.required],
    annual_value: [''],
    volume_percent: [{ value: 0, disabled: true }],
    value_percent: [{ value: 0, disabled: true }],
  });
}

export function createCustomerBaseRow(fb: FormBuilder): FormGroup {
  return fb.group({
    customer_name: ['', Validators.required],
    annual_volume: ['', Validators.required],
    volume_percent: [{ value: 0, disabled: true }],
  });
}

export function createMarketFocusRow(fb: FormBuilder, marketFocus = ''): FormGroup {
  return fb.group({
    market_focus: [marketFocus],
    volume: [''],
    volume_percent: [{ value: 0, disabled: true }],
  });
}

export function createPerformanceRow(fb: FormBuilder, description = ''): FormGroup {
  return fb.group({
    description: [description],
    status: [1],
    value: [''],
    remark: [''],
  });
}

export function createHeadCountRow(fb: FormBuilder, department = ''): FormGroup {
  return fb.group({
    department: [department],
    helpers: [''],
    operators: [''],
    supervisor: [''],
    executive: [''],
    checkers: [''],
    manager: [''],
  });
}

export function createImprovementProjectRow(fb: FormBuilder): FormGroup {
  return fb.group({
    project: [''],
    current_performance: [''],
    goal: [''],
    completion_date: [''],
  });
}

export function getFormArray(form: FormGroup, path: string): FormArray {
  return form.get(path) as FormArray;
}

export function recalcVolumePercents(array: FormArray, volumeKey: string, percentKey: string): void {
  const total = array.controls.reduce((sum, ctrl) => {
    return sum + numericValue(ctrl.get(volumeKey)?.value);
  }, 0);

  array.controls.forEach((ctrl) => {
    const vol = numericValue(ctrl.get(volumeKey)?.value);
    const pct = total > 0 ? Math.round((vol / total) * 10000) / 100 : 0;
    ctrl.get(percentKey)?.setValue(pct, { emitEvent: false });
  });
}

export function numericValue(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function patchStudyForm(form: FormGroup, fb: FormBuilder, study: Record<string, unknown>): void {
  const setArray = (path: string, factory: () => FormGroup, items: unknown[] | undefined) => {
    const arr = getFormArray(form, path);
    arr.clear();
    (items || []).forEach((item) => {
      const row = factory();
      row.patchValue(item as object);
      arr.push(row);
    });
  };

  const companyBackground = sectionDetails(study['company_background']) || study['company_background'];
  if (companyBackground) {
    form.get('company_background')?.patchValue(companyBackground as object);
  }
  const background = form.get('company_background');
  const periodSource = background?.get('analysis_period')?.value || study['analysis_period'];
  if (background && !background.get('analysis_period_from')?.value && periodSource) {
    const period = parseAnalysisPeriod(String(periodSource));
    background.patchValue(
      {
        analysis_period: periodSource,
        analysis_period_from: period.from,
        analysis_period_to: period.to,
      },
      { emitEvent: false }
    );
  }
  if (background) {
    const startedAt = background.get('analysis_period_from')?.value || toDate(study['created_at']) || new Date();
    const publishedAt =
      background.get('analysis_period_to')?.value ||
      (study['status'] === 'published' || study['status'] === 'submitted' ? toDate(study['updated_at']) || new Date() : null);

    background.patchValue(
      {
        report_date: background.get('report_date')?.value || startedAt,
        analysis_period_from: startedAt,
        analysis_period_to: publishedAt,
      },
      { emitEvent: false }
    );
  }
  setArray('product_volume_mix', () => createProductVolumeRow(fb), withoutTotalRows(sectionItems(study['product_volume_mix'])));
  recalcVolumePercents(getFormArray(form, 'product_volume_mix'), 'annual_volume', 'volume_percent');
  recalcVolumePercents(getFormArray(form, 'product_volume_mix'), 'annual_value', 'value_percent');
  setArray('customer_base', () => createCustomerBaseRow(fb), withoutTotalRows(sectionItems(study['customer_base'])));
  recalcVolumePercents(getFormArray(form, 'customer_base'), 'annual_volume', 'volume_percent');

  const marketItems = sectionItems(study['market_focus']);
  if (marketItems?.length) {
    setArray('market_focus', () => createMarketFocusRow(fb), withoutTotalRows(marketItems));
  }
  recalcVolumePercents(getFormArray(form, 'market_focus'), 'volume', 'volume_percent');
  const qualityItems = sectionItems(study['quality_performance']);
  if (qualityItems?.length) {
    setArray('quality_performance', () => createPerformanceRow(fb), normalizePerformanceRows(qualityItems));
  }
  const costPerformance = sectionDetails(study['cost_performance']);
  const headItems = (study['head_count_data'] as unknown[] | undefined) || (costPerformance?.['head_count_data'] as unknown[] | undefined);
  if (headItems?.length) {
    setArray('head_count_data', () => createHeadCountRow(fb), normalizeHeadCountRows(withoutTotalRows(headItems)));
  }
  const costData = study['cost_data'] || costPerformance?.['cost_data'];
  if (costData) {
    form.get('cost_data')?.patchValue(costData as object);
  }
  const deliveryItems = sectionItems(study['delivery_performance']);
  if (deliveryItems?.length) {
    setArray('delivery_performance', () => createPerformanceRow(fb), normalizePerformanceRows(deliveryItems));
  }
  const processExcellence = sectionDetails(study['process_excellence']) || study['process_excellence'];
  if (processExcellence) {
    const normalizedProcessExcellence = normalizeProcessExcellence(processExcellence as Record<string, unknown>);
    form.get('process_excellence')?.patchValue(normalizedProcessExcellence);
    setArray(
      'process_excellence.improvement_projects',
      () => createImprovementProjectRow(fb),
      withoutTotalRows(normalizedProcessExcellence['improvement_projects'] as unknown[] | undefined)
    );
  }
  if (study['status']) {
    form.patchValue({ status: study['status'] === 'published' ? 'submitted' : study['status'] });
  }
}

function sectionDetails(section: unknown): Record<string, unknown> | undefined {
  const record = section as Record<string, unknown> | undefined;
  return record?.['details'] as Record<string, unknown> | undefined;
}

function sectionItems(section: unknown): unknown[] | undefined {
  if (Array.isArray(section)) {
    return section;
  }
  const details = sectionDetails(section);
  const items = details?.['items'];
  return Array.isArray(items) ? items : undefined;
}

function withoutTotalRows(items: unknown[] | undefined): unknown[] | undefined {
  return items?.filter((item) => {
    const row = item as Record<string, unknown>;
    const label = row['product_category'] || row['customer_name'] || row['market_focus'] || row['department'];
    return String(label || '').trim().toLowerCase() !== 'total';
  });
}

function normalizeHeadCountRows(items: unknown[] | undefined): unknown[] | undefined {
  return items?.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      ...row,
      helpers: row['helpers'] || '',
      operators: row['operators'] ?? row['workers'] ?? '',
    };
  });
}

function normalizePerformanceRows(items: unknown[] | undefined): unknown[] | undefined {
  return items?.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      ...row,
      status: enumNumber(row['status'], {
        measured: 1,
        not_measured: 2,
      }) || 1,
    };
  });
}

function normalizeProcessExcellence(process: Record<string, unknown>): Record<string, unknown> {
  return {
    ...process,
    lean_belt_level: enumNumber(process['lean_belt_level'], {
      white: 1,
      yellow: 2,
      green: 3,
      black: 4,
      master_black: 5,
      'master black': 5,
    }) || process['lean_belt_level'],
    five_s_level: enumNumber(process['five_s_level'], {
      excellence: 1,
      sustenance: 2,
      model: 3,
    }) || process['five_s_level'],
    lean_practice_details: enumNumber(process['lean_practice_details'], {
      self_implementation: 1,
      'self implementation': 1,
      hired_coach: 2,
      'hired coach': 2,
    }) || process['lean_practice_details'],
  };
}

function enumNumber(value: unknown, labels: Record<string, number>): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return labels[String(value || '').trim().toLowerCase()];
}

export function formToStudyPayload(form: FormGroup): Record<string, unknown> {
  const raw = form.getRawValue();
  const analysisPeriod =
    buildAnalysisPeriod(
      raw.company_background?.analysis_period_from,
      raw.company_background?.analysis_period_to
    ) || raw.company_background?.analysis_period;
  const companyBackground = {
    ...raw.company_background,
    analysis_period: analysisPeriod,
    report_date: formatDate(raw.company_background?.report_date),
    analysis_period_from: formatDate(raw.company_background?.analysis_period_from),
    analysis_period_to: formatDate(raw.company_background?.analysis_period_to),
  };
  const companyName = raw.company_background?.company_name || 'Diagnostic Study';
  const status = raw.status === 'submitted' ? 'published' : raw.status || 'draft';

  return {
    company_id: raw.company_background?.company_id,
    title: `${companyName} Diagnostic Study`,
    status,
    company_background: {
      details: companyBackground,
    },
    product_volume_mix: {
      details: { items: raw.product_volume_mix || [] },
    },
    customer_base: {
      details: { items: raw.customer_base || [] },
    },
    market_focus: {
      details: { items: raw.market_focus || [] },
    },
    quality_performance: {
      details: { items: raw.quality_performance || [] },
    },
    cost_performance: {
      details: {
        head_count_data: raw.head_count_data || [],
        cost_data: raw.cost_data || {},
      },
    },
    delivery_performance: {
      details: { items: raw.delivery_performance || [] },
    },
    process_excellence: {
      details: raw.process_excellence || {},
    },
  };
}

function formatDate(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return String(value).split('T')[0];
}

function buildAnalysisPeriod(from: unknown, to: unknown): string {
  const fromDate = formatDate(from);
  const toDate = formatDate(to);
  if (!fromDate || !toDate) return '';
  return `${fromDate} to ${toDate}`;
}

function parseAnalysisPeriod(period: string): { from: Date | null; to: Date | null } {
  const parts = period.split(/\s+(?:to|-)\s+/i);
  return {
    from: toDate(parts[0]),
    to: toDate(parts[1]),
  };
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
