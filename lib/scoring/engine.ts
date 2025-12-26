import type { 
  Response, 
  Weight, 
  Rule, 
  Dimension, 
  Question,
  Questionnaire 
} from '@/types/database';
import type {
  DimensionScore,
  ScoringResult,
  RankedFocusArea,
  Contribution,
  ConfidenceFactor,
} from '@/types/scoring';

export function calculateScores(
  responses: Response[],
  weights: Weight[],
  rules: Rule[],
  dimensions: Dimension[],
  questions: Question[],
  questionnaire: Questionnaire
): ScoringResult {
  // 1. Initialize all dimension scores to 0
  const scoreMap = new Map<string, number>();
  const contributionsMap = new Map<string, Contribution[]>();
  
  dimensions.forEach(d => {
    scoreMap.set(d.id, 0);
    contributionsMap.set(d.id, []);
  });

  // 2. Apply weights from responses
  responses.forEach(response => {
    const applicableWeights = weights.filter(w => 
      w.question_id === response.questionId &&
      matchesValue(w.answer_value, response.value)
    );
    
    applicableWeights.forEach(weight => {
      const current = scoreMap.get(weight.dimension_id) || 0;
      scoreMap.set(weight.dimension_id, current + weight.weight);
      
      const question = questions.find(q => q.id === weight.question_id);
      contributionsMap.get(weight.dimension_id)?.push({
        type: 'weight',
        sourceId: weight.id,
        sourceName: `Response to question`,
        questionId: weight.question_id,
        questionText: question?.text,
        answerValue: String(response.value),
        delta: weight.weight,
        explanation: `Selected "${response.value}" added ${weight.weight} points`
      });
    });
  });

  // 3. Apply rules (sorted by priority)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  
  sortedRules.forEach(rule => {
    if (evaluateCondition(rule.condition_json, responses, questions)) {
      rule.effects_json.forEach(effect => {
        const dimension = dimensions.find(d => d.code === effect.dimension);
        if (dimension) {
          const current = scoreMap.get(dimension.id) || 0;
          scoreMap.set(dimension.id, current + effect.delta);
          
          contributionsMap.get(dimension.id)?.push({
            type: 'rule',
            sourceId: rule.id,
            sourceName: rule.name,
            delta: effect.delta,
            explanation: rule.description || `Rule "${rule.name}" triggered`
          });
        }
      });
    }
  });

  // 4. Normalize scores (0-100)
  const maxPossibleScore = calculateMaxScore(weights, rules, dimensions);
  const dimensionScores: DimensionScore[] = dimensions.map(d => ({
    dimensionId: d.id,
    code: d.code,
    name: d.name,
    category: d.category,
    rawScore: scoreMap.get(d.id) || 0,
    normalizedScore: normalize(scoreMap.get(d.id) || 0, maxPossibleScore),
    contributions: contributionsMap.get(d.id) || []
  }));

  // 5. Rank and categorize
  const sorted = [...dimensionScores].sort((a, b) => b.normalizedScore - a.normalizedScore);
  const rankedFocusAreas = createRankedFocusAreas(sorted);

  // 6. Calculate confidence
  const { confidenceScore, confidenceFactors } = calculateConfidence(
    responses,
    dimensionScores,
    weights,
    questions
  );

  return {
    rankedFocusAreas,
    confidenceScore,
    confidenceFactors,
    allDimensionScores: dimensionScores,
    modelVersion: `v${questionnaire.version}`,
    timestamp: new Date().toISOString()
  };
}

function matchesValue(answerValue: string, responseValue: string | string[] | number): boolean {
  if (Array.isArray(responseValue)) {
    return responseValue.includes(answerValue);
  }
  return String(responseValue) === answerValue;
}

function evaluateCondition(
  condition: any,
  responses: Response[],
  questions: Question[]
): boolean {
  // Handle 'all' conditions (AND logic)
  if (condition.all) {
    return condition.all.every((c: any) => evaluateSingleCondition(c, responses, questions));
  }
  
  // Handle 'any' conditions (OR logic)
  if (condition.any) {
    return condition.any.some((c: any) => evaluateSingleCondition(c, responses, questions));
  }
  
  // Handle count conditions
  if (condition.countLessThan) {
    const question = questions[condition.countLessThan.questionIndex];
    const response = responses.find(r => r.questionId === question?.id);
    if (Array.isArray(response?.value)) {
      return response.value.length < condition.countLessThan.count;
    }
    return false;
  }
  
  if (condition.countGreaterThan) {
    const question = questions[condition.countGreaterThan.questionIndex];
    const response = responses.find(r => r.questionId === question?.id);
    if (Array.isArray(response?.value)) {
      return response.value.length > condition.countGreaterThan.count;
    }
    return false;
  }
  
  return false;
}

function evaluateSingleCondition(
  condition: any,
  responses: Response[],
  questions: Question[]
): boolean {
  const question = questions[condition.questionIndex];
  if (!question) return false;
  
  const response = responses.find(r => r.questionId === question.id);
  if (!response) return false;
  
  const responseValue = response.value;
  const conditionValue = condition.value;
  
  switch (condition.op) {
    case 'eq':
      return responseValue === conditionValue;
    case 'neq':
      return responseValue !== conditionValue;
    case 'in':
      if (Array.isArray(conditionValue)) {
        return conditionValue.includes(String(responseValue));
      }
      return false;
    case 'notIn':
      if (Array.isArray(conditionValue)) {
        return !conditionValue.includes(String(responseValue));
      }
      return false;
    case 'gt':
      return Number(responseValue) > Number(conditionValue);
    case 'lt':
      return Number(responseValue) < Number(conditionValue);
    default:
      return false;
  }
}

function calculateMaxScore(weights: Weight[], rules: Rule[], dimensions: Dimension[]): number {
  // Calculate the maximum possible score across all dimensions
  // For simplicity, we'll use the sum of all positive weights and rule effects
  const maxFromWeights = weights.reduce((sum, w) => sum + Math.max(0, w.weight), 0);
  const maxFromRules = rules.reduce((sum, r) => {
    const ruleMax = r.effects_json.reduce((s: number, e: any) => s + Math.max(0, e.delta), 0);
    return sum + ruleMax;
  }, 0);
  
  return Math.max(100, maxFromWeights + maxFromRules); // Ensure at least 100 for normalization
}

function normalize(score: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.max(0, (score / max) * 100));
}

function calculateConfidence(
  responses: Response[],
  scores: DimensionScore[],
  weights: Weight[],
  questions: Question[]
): { confidenceScore: number; confidenceFactors: ConfidenceFactor[] } {
  const factors: ConfidenceFactor[] = [];
  
  // Factor 1: Response completeness
  const requiredQuestions = questions.filter(q => q.is_required).length;
  const answeredQuestions = responses.length;
  const completeness = requiredQuestions > 0 ? answeredQuestions / requiredQuestions : 1;
  factors.push({
    factor: 'Response completeness',
    impact: completeness > 0.8 ? 'positive' : 'negative',
    value: completeness * 100
  });

  // Factor 2: Score differentiation (clear gaps = higher confidence)
  const sortedScores = [...scores].sort((a, b) => b.normalizedScore - a.normalizedScore);
  const topScore = sortedScores[0]?.normalizedScore || 0;
  const secondScore = sortedScores[1]?.normalizedScore || 0;
  const differentiation = topScore - secondScore;
  factors.push({
    factor: 'Score differentiation',
    impact: differentiation > 15 ? 'positive' : 'negative',
    value: differentiation
  });

  // Factor 3: Response distribution (not too many zero scores)
  const nonZeroScores = scores.filter(s => s.normalizedScore > 0).length;
  const distribution = nonZeroScores / scores.length;
  factors.push({
    factor: 'Score distribution',
    impact: distribution > 0.5 ? 'positive' : 'negative',
    value: distribution * 100
  });

  const confidenceScore = Math.round(
    (completeness * 40) + (Math.min(differentiation, 30) * 1.5) + (distribution * 20)
  );

  return { 
    confidenceScore: Math.min(100, Math.max(0, confidenceScore)), 
    confidenceFactors: factors 
  };
}

function createRankedFocusAreas(sorted: DimensionScore[]): RankedFocusArea[] {
  const total = sorted.reduce((sum, d) => sum + Math.max(d.normalizedScore, 0), 0);
  
  return sorted.slice(0, 7).map((dimension, index) => ({
    rank: index + 1,
    dimension,
    probability: 
      dimension.normalizedScore >= 70 ? 'High' as const :
      dimension.normalizedScore >= 40 ? 'Medium' as const : 'Low' as const,
    prepTimeAllocation: total > 0 
      ? Math.round((dimension.normalizedScore / total) * 100)
      : Math.round(100 / sorted.length),
    likelyQuestions: generateLikelyQuestions(dimension),
    redFlags: generateRedFlags(dimension)
  }));
}

function generateLikelyQuestions(dimension: DimensionScore): string[] {
  // Generate likely questions based on dimension code
  const questionMap: Record<string, string[]> = {
    'QA1.1': [
      'How do you track individual children\'s progress?',
      'Show me your planning cycle documentation',
      'How are learning outcomes incorporated into programs?'
    ],
    'QA1.2': [
      'Describe your approach to intentional teaching',
      'How do educators extend children\'s learning?',
      'What strategies support diverse learners?'
    ],
    'QA1.3': [
      'Walk me through your assessment and planning cycle',
      'How do you use observations to inform programming?',
      'Show me examples of documented learning'
    ],
    'QA2.1': [
      'Describe your health and hygiene procedures',
      'How do you manage illness and medication?',
      'Show me your incident reporting process'
    ],
    'QA2.2': [
      'How do you conduct risk assessments?',
      'Describe your supervision strategies',
      'How is the physical environment maintained for safety?'
    ],
    'QA3.1': [
      'How does the environment support the program?',
      'Describe how spaces are designed for different age groups',
      'How do you ensure accessibility?'
    ],
    'QA3.2': [
      'How are resources selected and maintained?',
      'Describe how children access materials independently',
      'How does the environment support exploration?'
    ],
    'QA4.1': [
      'How do you maintain required ratios?',
      'Describe your staff deployment strategies',
      'How do you handle staff absences?'
    ],
    'QA4.2': [
      'Describe professional development opportunities',
      'How do you support educator qualifications?',
      'What systems support professional practice?'
    ],
    'QA5.1': [
      'How do educators build relationships with children?',
      'Describe your approach to positive guidance',
      'How do you support children\'s emotional wellbeing?'
    ],
    'QA5.2': [
      'How do you support peer relationships?',
      'Describe strategies for conflict resolution',
      'How do you promote inclusion?'
    ],
    'QA6.1': [
      'How do you engage families in their children\'s learning?',
      'Describe your communication strategies with families',
      'How do you support diverse family structures?'
    ],
    'QA6.2': [
      'Describe your community partnerships',
      'How do you support transitions?',
      'What connections exist with local services?'
    ],
    'QA7.1': [
      'Describe your governance structure',
      'How do you ensure compliance with regulations?',
      'What systems support quality improvement?'
    ],
    'QA7.2': [
      'Describe the educational leader\'s role',
      'How do you build a positive service culture?',
      'What is your approach to continuous improvement?'
    ]
  };
  
  return questionMap[dimension.code] || [
    'Describe your approach in this area',
    'Show me relevant documentation',
    'How do you ensure quality in this area?'
  ];
}

function generateRedFlags(dimension: DimensionScore): string[] {
  // Generate red flags based on contributions
  const redFlags: string[] = [];
  
  // Look for high-value negative contributions
  const significantContributions = dimension.contributions
    .filter(c => c.delta >= 15)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
  
  if (significantContributions.length > 0) {
    significantContributions.forEach(c => {
      if (c.type === 'rule') {
        redFlags.push(`⚠️ ${c.sourceName}`);
      } else if (c.questionText) {
        redFlags.push(`⚠️ Response to: "${c.questionText}"`);
      }
    });
  }
  
  // Add generic red flags based on score level
  if (dimension.normalizedScore >= 70) {
    redFlags.push('⚠️ High priority area - expect detailed questioning');
  } else if (dimension.normalizedScore >= 40) {
    redFlags.push('⚠️ Moderate focus expected');
  }
  
  return redFlags.length > 0 ? redFlags : ['No specific red flags identified'];
}
