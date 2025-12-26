import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Starting seed process...');

  try {
    // 1. Create dimensions
    console.log('Creating dimensions...');
    const dimensions = [
      // QA1: Educational Program and Practice
      { code: 'QA1.1', name: 'Program', category: 'QA1', description: 'Curriculum decision making' },
      { code: 'QA1.2', name: 'Practice', category: 'QA1', description: 'Educators practice' },
      { code: 'QA1.3', name: 'Assessment and planning', category: 'QA1', description: 'Assessment and planning cycle' },
      
      // QA2: Children's Health and Safety
      { code: 'QA2.1', name: 'Health', category: 'QA2', description: 'Health practices and procedures' },
      { code: 'QA2.2', name: 'Safety', category: 'QA2', description: 'Physical environment safety' },
      
      // QA3: Physical Environment
      { code: 'QA3.1', name: 'Design', category: 'QA3', description: 'Fit for purpose' },
      { code: 'QA3.2', name: 'Use', category: 'QA3', description: 'Resources and environments' },
      
      // QA4: Staffing Arrangements
      { code: 'QA4.1', name: 'Staffing arrangements', category: 'QA4', description: 'Organisation of educators' },
      { code: 'QA4.2', name: 'Professionalism', category: 'QA4', description: 'Professional standards' },
      
      // QA5: Relationships with Children
      { code: 'QA5.1', name: 'Relationships between educators and children', category: 'QA5', description: 'Respectful relationships' },
      { code: 'QA5.2', name: 'Relationships between children', category: 'QA5', description: 'Peer relationships' },
      
      // QA6: Collaborative Partnerships
      { code: 'QA6.1', name: 'Supportive relationships with families', category: 'QA6', description: 'Engagement with families' },
      { code: 'QA6.2', name: 'Collaborative partnerships', category: 'QA6', description: 'Community partnerships' },
      
      // QA7: Governance and Leadership
      { code: 'QA7.1', name: 'Governance', category: 'QA7', description: 'Governance structures' },
      { code: 'QA7.2', name: 'Leadership', category: 'QA7', description: 'Leadership and service culture' },
    ];

    const { data: insertedDimensions, error: dimError } = await supabase
      .from('dimensions')
      .upsert(dimensions, { onConflict: 'code' })
      .select();

    if (dimError) throw dimError;
    console.log(`Created ${insertedDimensions.length} dimensions`);

    // Create a map of dimension codes to IDs
    const dimMap = new Map(insertedDimensions.map(d => [d.code, d.id]));

    // 2. Create questionnaire
    console.log('Creating questionnaire...');
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .upsert({
        name: 'A&R Focus Forecast v1',
        version: 1,
        is_active: true
      }, { onConflict: 'name,version' })
      .select()
      .single();

    if (qError) throw qError;
    console.log('Created questionnaire:', questionnaire.id);

    // 3. Create questions with options
    console.log('Creating questions...');
    const questions = [
      {
        text: 'How often do educators document children\'s learning through observations?',
        help_text: 'Consider formal and informal documentation methods',
        question_type: 'single',
        display_order: 1,
        is_required: true,
        options: [
          { label: 'Daily for all children', value: 'daily_all', display_order: 1 },
          { label: 'Weekly for all children', value: 'weekly_all', display_order: 2 },
          { label: 'Fortnightly or less frequently', value: 'fortnightly', display_order: 3 },
          { label: 'Only when required for compliance', value: 'compliance_only', display_order: 4 },
        ]
      },
      {
        text: 'How are children\'s individual interests incorporated into programming?',
        help_text: null,
        question_type: 'single',
        display_order: 2,
        is_required: true,
        options: [
          { label: 'Systematically tracked and regularly updated in programs', value: 'systematic', display_order: 1 },
          { label: 'Sometimes incorporated when obvious', value: 'sometimes', display_order: 2 },
          { label: 'Rarely or inconsistently', value: 'rarely', display_order: 3 },
        ]
      },
      {
        text: 'What health and hygiene practices are consistently followed?',
        help_text: 'Select all that apply',
        question_type: 'multi',
        display_order: 3,
        is_required: true,
        options: [
          { label: 'Hand washing before meals and after toileting', value: 'handwashing', display_order: 1 },
          { label: 'Documented illness procedures', value: 'illness_docs', display_order: 2 },
          { label: 'Medication administration records', value: 'med_records', display_order: 3 },
          { label: 'Regular cleaning schedules', value: 'cleaning', display_order: 4 },
          { label: 'Food safety compliance', value: 'food_safety', display_order: 5 },
        ]
      },
      {
        text: 'How would you rate staff turnover in the past 12 months?',
        help_text: null,
        question_type: 'single',
        display_order: 4,
        is_required: true,
        options: [
          { label: 'Very stable (0-10% turnover)', value: 'stable', display_order: 1 },
          { label: 'Moderate (10-25% turnover)', value: 'moderate', display_order: 2 },
          { label: 'High (25-50% turnover)', value: 'high', display_order: 3 },
          { label: 'Very high (50%+ turnover)', value: 'very_high', display_order: 4 },
        ]
      },
      {
        text: 'Have there been any serious incidents or complaints in the past 12 months?',
        help_text: null,
        question_type: 'single',
        display_order: 5,
        is_required: true,
        options: [
          { label: 'No incidents or complaints', value: 'none', display_order: 1 },
          { label: 'Minor incidents, all resolved', value: 'minor_resolved', display_order: 2 },
          { label: 'Some significant incidents or complaints', value: 'significant', display_order: 3 },
          { label: 'Ongoing investigations or unresolved matters', value: 'ongoing', display_order: 4 },
        ]
      },
      {
        text: 'How are families engaged in their children\'s learning?',
        help_text: 'Select all that apply',
        question_type: 'multi',
        display_order: 6,
        is_required: true,
        options: [
          { label: 'Regular portfolio updates shared', value: 'portfolios', display_order: 1 },
          { label: 'Parent-teacher meetings scheduled', value: 'meetings', display_order: 2 },
          { label: 'Digital communication platform used', value: 'digital', display_order: 3 },
          { label: 'Families contribute to programming', value: 'contribute', display_order: 4 },
          { label: 'Cultural perspectives actively sought', value: 'cultural', display_order: 5 },
        ]
      },
      {
        text: 'What is your current rating or previous assessment outcome?',
        help_text: null,
        question_type: 'single',
        display_order: 7,
        is_required: true,
        options: [
          { label: 'Excellent', value: 'excellent', display_order: 1 },
          { label: 'Exceeding NQS', value: 'exceeding', display_order: 2 },
          { label: 'Meeting NQS', value: 'meeting', display_order: 3 },
          { label: 'Working Towards NQS', value: 'working_towards', display_order: 4 },
          { label: 'Not yet rated', value: 'not_rated', display_order: 5 },
        ]
      },
      {
        text: 'How long has the current director/educational leader been in the role?',
        help_text: null,
        question_type: 'single',
        display_order: 8,
        is_required: true,
        options: [
          { label: 'More than 3 years', value: 'over_3_years', display_order: 1 },
          { label: '1-3 years', value: '1_to_3_years', display_order: 2 },
          { label: '6 months to 1 year', value: '6mo_to_1yr', display_order: 3 },
          { label: 'Less than 6 months', value: 'under_6mo', display_order: 4 },
        ]
      },
      {
        text: 'Rate your confidence in your Quality Improvement Plan (QIP)',
        help_text: '1 = Not confident, needs significant work. 5 = Very confident, comprehensive and current',
        question_type: 'scale',
        display_order: 9,
        is_required: true,
        options: []
      },
      {
        text: 'Which areas have you focused on improving since your last assessment?',
        help_text: 'Select all that apply',
        question_type: 'multi',
        display_order: 10,
        is_required: true,
        options: [
          { label: 'Documentation and programming', value: 'documentation', display_order: 1 },
          { label: 'Physical environment', value: 'environment', display_order: 2 },
          { label: 'Staff qualifications and training', value: 'staff_training', display_order: 3 },
          { label: 'Family engagement', value: 'family', display_order: 4 },
          { label: 'Governance and policies', value: 'governance', display_order: 5 },
          { label: 'None specifically', value: 'none', display_order: 6 },
        ]
      },
    ];

    const questionIds: string[] = [];
    for (const q of questions) {
      const { options, ...questionData } = q;
      const { data: question, error: qErr } = await supabase
        .from('questions')
        .insert({
          ...questionData,
          questionnaire_id: questionnaire.id,
        })
        .select()
        .single();

      if (qErr) throw qErr;
      questionIds.push(question.id);

      // Insert options for this question
      if (options.length > 0) {
        const optionsToInsert = options.map(opt => ({
          question_id: question.id,
          ...opt
        }));
        
        const { error: optErr } = await supabase
          .from('answer_options')
          .insert(optionsToInsert);

        if (optErr) throw optErr;
      }
    }
    console.log(`Created ${questionIds.length} questions`);

    // 4. Create weights
    console.log('Creating weights...');
    const weights = [
      // Documentation frequency affects QA1
      { question_index: 0, answer_value: 'compliance_only', dimension: 'QA1.1', weight: 25 },
      { question_index: 0, answer_value: 'fortnightly', dimension: 'QA1.1', weight: 15 },
      { question_index: 0, answer_value: 'weekly_all', dimension: 'QA1.1', weight: 5 },
      { question_index: 0, answer_value: 'daily_all', dimension: 'QA1.1', weight: 0 },
      { question_index: 0, answer_value: 'compliance_only', dimension: 'QA1.3', weight: 20 },
      
      // Programming affects QA1
      { question_index: 1, answer_value: 'rarely', dimension: 'QA1.1', weight: 20 },
      { question_index: 1, answer_value: 'sometimes', dimension: 'QA1.1', weight: 10 },
      { question_index: 1, answer_value: 'systematic', dimension: 'QA1.1', weight: 0 },
      
      // Health and hygiene affects QA2
      { question_index: 2, answer_value: 'handwashing', dimension: 'QA2.1', weight: -5 },
      { question_index: 2, answer_value: 'illness_docs', dimension: 'QA2.1', weight: -5 },
      { question_index: 2, answer_value: 'med_records', dimension: 'QA2.1', weight: -5 },
      { question_index: 2, answer_value: 'cleaning', dimension: 'QA2.1', weight: -3 },
      { question_index: 2, answer_value: 'food_safety', dimension: 'QA2.1', weight: -3 },
      
      // Staff turnover affects QA4 and QA7
      { question_index: 3, answer_value: 'very_high', dimension: 'QA4.1', weight: 30 },
      { question_index: 3, answer_value: 'very_high', dimension: 'QA7.2', weight: 20 },
      { question_index: 3, answer_value: 'high', dimension: 'QA4.1', weight: 20 },
      { question_index: 3, answer_value: 'high', dimension: 'QA7.2', weight: 10 },
      { question_index: 3, answer_value: 'moderate', dimension: 'QA4.1', weight: 5 },
      { question_index: 3, answer_value: 'stable', dimension: 'QA4.1', weight: 0 },
      
      // Incidents affect QA2
      { question_index: 4, answer_value: 'ongoing', dimension: 'QA2.1', weight: 35 },
      { question_index: 4, answer_value: 'ongoing', dimension: 'QA2.2', weight: 35 },
      { question_index: 4, answer_value: 'significant', dimension: 'QA2.1', weight: 20 },
      { question_index: 4, answer_value: 'significant', dimension: 'QA2.2', weight: 20 },
      { question_index: 4, answer_value: 'minor_resolved', dimension: 'QA2.1', weight: 5 },
      { question_index: 4, answer_value: 'none', dimension: 'QA2.1', weight: 0 },
      
      // Family engagement affects QA6
      { question_index: 5, answer_value: 'portfolios', dimension: 'QA6.1', weight: -5 },
      { question_index: 5, answer_value: 'meetings', dimension: 'QA6.1', weight: -5 },
      { question_index: 5, answer_value: 'digital', dimension: 'QA6.1', weight: -3 },
      { question_index: 5, answer_value: 'contribute', dimension: 'QA6.1', weight: -5 },
      { question_index: 5, answer_value: 'cultural', dimension: 'QA6.1', weight: -3 },
      
      // Previous rating affects all areas
      { question_index: 6, answer_value: 'working_towards', dimension: 'QA1.1', weight: 15 },
      { question_index: 6, answer_value: 'working_towards', dimension: 'QA2.1', weight: 15 },
      { question_index: 6, answer_value: 'working_towards', dimension: 'QA4.1', weight: 15 },
      { question_index: 6, answer_value: 'working_towards', dimension: 'QA7.1', weight: 15 },
      { question_index: 6, answer_value: 'meeting', dimension: 'QA1.1', weight: 5 },
      { question_index: 6, answer_value: 'exceeding', dimension: 'QA1.1', weight: 0 },
      { question_index: 6, answer_value: 'excellent', dimension: 'QA1.1', weight: 0 },
      
      // Director tenure affects QA7
      { question_index: 7, answer_value: 'under_6mo', dimension: 'QA7.2', weight: 20 },
      { question_index: 7, answer_value: '6mo_to_1yr', dimension: 'QA7.2', weight: 10 },
      { question_index: 7, answer_value: '1_to_3_years', dimension: 'QA7.2', weight: 3 },
      { question_index: 7, answer_value: 'over_3_years', dimension: 'QA7.2', weight: 0 },
      
      // QIP confidence affects QA7
      { question_index: 8, answer_value: '1', dimension: 'QA7.1', weight: 25 },
      { question_index: 8, answer_value: '2', dimension: 'QA7.1', weight: 15 },
      { question_index: 8, answer_value: '3', dimension: 'QA7.1', weight: 8 },
      { question_index: 8, answer_value: '4', dimension: 'QA7.1', weight: 3 },
      { question_index: 8, answer_value: '5', dimension: 'QA7.1', weight: 0 },
      
      // Improvement focus affects respective areas
      { question_index: 9, answer_value: 'documentation', dimension: 'QA1.3', weight: -5 },
      { question_index: 9, answer_value: 'environment', dimension: 'QA3.1', weight: -5 },
      { question_index: 9, answer_value: 'staff_training', dimension: 'QA4.2', weight: -5 },
      { question_index: 9, answer_value: 'family', dimension: 'QA6.1', weight: -5 },
      { question_index: 9, answer_value: 'governance', dimension: 'QA7.1', weight: -5 },
      { question_index: 9, answer_value: 'none', dimension: 'QA7.1', weight: 10 },
    ];

    const weightsToInsert = weights.map(w => ({
      questionnaire_id: questionnaire.id,
      question_id: questionIds[w.question_index],
      answer_value: w.answer_value,
      dimension_id: dimMap.get(w.dimension)!,
      weight: w.weight,
    }));

    const { error: wErr } = await supabase
      .from('weights')
      .insert(weightsToInsert);

    if (wErr) throw wErr;
    console.log(`Created ${weightsToInsert.length} weights`);

    // 5. Create rules
    console.log('Creating rules...');
    const rules = [
      {
        name: 'New Leadership Red Flag',
        description: 'New directors with previous Working Towards rating triggers governance focus',
        priority: 10,
        condition_json: {
          all: [
            { questionIndex: 7, op: 'in', value: ['under_6mo', '6mo_to_1yr'] },
            { questionIndex: 6, op: 'eq', value: 'working_towards' }
          ]
        },
        effects_json: [
          { dimension: 'QA7.1', delta: 25 },
          { dimension: 'QA7.2', delta: 20 }
        ]
      },
      {
        name: 'Documentation Gap with Incidents',
        description: 'Poor documentation combined with incidents raises QA1 and QA2 significantly',
        priority: 15,
        condition_json: {
          all: [
            { questionIndex: 0, op: 'in', value: ['fortnightly', 'compliance_only'] },
            { questionIndex: 4, op: 'in', value: ['significant', 'ongoing'] }
          ]
        },
        effects_json: [
          { dimension: 'QA1.3', delta: 30 },
          { dimension: 'QA2.1', delta: 25 }
        ]
      },
      {
        name: 'Low Family Engagement',
        description: 'Minimal family engagement options selected',
        priority: 5,
        condition_json: {
          countLessThan: { questionIndex: 5, count: 2 }
        },
        effects_json: [
          { dimension: 'QA6.1', delta: 20 }
        ]
      },
      {
        name: 'Minimal Health Practices',
        description: 'Few health and hygiene practices followed',
        priority: 8,
        condition_json: {
          countLessThan: { questionIndex: 2, count: 3 }
        },
        effects_json: [
          { dimension: 'QA2.1', delta: 25 }
        ]
      },
    ];

    const { error: rErr } = await supabase
      .from('rules')
      .insert(rules.map(r => ({
        questionnaire_id: questionnaire.id,
        ...r,
      })));

    if (rErr) throw rErr;
    console.log(`Created ${rules.length} rules`);

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seed();
