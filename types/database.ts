// Database types based on the schema

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'NT' | 'ACT';
  service_type: 'LDC' | 'FDC' | 'OSHC' | 'Preschool';
  approved_places: number | null;
  current_occupancy: number | null;
  years_operating: number | null;
  last_rating: 'Excellent' | 'Exceeding' | 'Meeting' | 'Working Towards' | 'Significant Improvement' | 'Not Yet Rated' | null;
  last_rating_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Questionnaire {
  id: string;
  name: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface Dimension {
  id: string;
  code: string;
  name: string;
  category: 'QA1' | 'QA2' | 'QA3' | 'QA4' | 'QA5' | 'QA6' | 'QA7';
  description: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  questionnaire_id: string;
  text: string;
  help_text: string | null;
  question_type: 'single' | 'multi' | 'scale' | 'text' | 'number';
  display_order: number;
  is_required: boolean;
  conditional_logic: ConditionalLogic | null;
  created_at: string;
}

export interface ConditionalLogic {
  showIf?: {
    questionId: string;
    operator: 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'lt';
    value: string | string[] | number;
  }[];
  hideIf?: {
    questionId: string;
    operator: 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'lt';
    value: string | string[] | number;
  }[];
}

export interface AnswerOption {
  id: string;
  question_id: string;
  label: string;
  value: string;
  display_order: number;
  created_at: string;
}

export interface Weight {
  id: string;
  questionnaire_id: string;
  question_id: string;
  answer_value: string;
  dimension_id: string;
  weight: number;
  created_at: string;
}

export interface Rule {
  id: string;
  questionnaire_id: string;
  name: string;
  description: string | null;
  priority: number;
  condition_json: RuleCondition;
  effects_json: RuleEffect[];
  is_active: boolean;
  created_at: string;
}

export interface RuleCondition {
  all?: RuleConditionItem[];
  any?: RuleConditionItem[];
  countLessThan?: {
    questionIndex: number;
    count: number;
  };
  countGreaterThan?: {
    questionIndex: number;
    count: number;
  };
}

export interface RuleConditionItem {
  questionIndex: number;
  op: 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'lt';
  value: string | string[] | number;
}

export interface RuleEffect {
  dimension: string;
  delta: number;
}

export interface ScoringRun {
  id: string;
  user_id: string;
  service_id: string;
  questionnaire_id: string;
  questionnaire_version: number;
  responses_json: Response[];
  scores_json: any;
  explanations_json: any;
  confidence_score: number | null;
  created_at: string;
}

export interface Report {
  id: string;
  scoring_run_id: string;
  pdf_url: string | null;
  created_at: string;
}

export interface Response {
  questionId: string;
  value: string | string[] | number;
}

// Extended types with relations
export interface QuestionWithOptions extends Question {
  options?: AnswerOption[];
}

export interface ServiceWithUser extends Service {
  profile?: Profile;
}

export interface ScoringRunWithDetails extends ScoringRun {
  service?: Service;
  questionnaire?: Questionnaire;
}
