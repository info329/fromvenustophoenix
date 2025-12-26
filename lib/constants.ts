export const STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' },
] as const;

export const SERVICE_TYPES = [
  { value: 'LDC', label: 'Long Day Care' },
  { value: 'FDC', label: 'Family Day Care' },
  { value: 'OSHC', label: 'Outside School Hours Care' },
  { value: 'Preschool', label: 'Preschool' },
] as const;

export const RATINGS = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Exceeding', label: 'Exceeding NQS' },
  { value: 'Meeting', label: 'Meeting NQS' },
  { value: 'Working Towards', label: 'Working Towards NQS' },
  { value: 'Significant Improvement', label: 'Significant Improvement Required' },
  { value: 'Not Yet Rated', label: 'Not Yet Rated' },
] as const;

export const QUALITY_AREAS = [
  { code: 'QA1', name: 'Educational Program and Practice' },
  { code: 'QA2', name: "Children's Health and Safety" },
  { code: 'QA3', name: 'Physical Environment' },
  { code: 'QA4', name: 'Staffing Arrangements' },
  { code: 'QA5', name: 'Relationships with Children' },
  { code: 'QA6', name: 'Collaborative Partnerships with Families' },
  { code: 'QA7', name: 'Governance and Leadership' },
] as const;
