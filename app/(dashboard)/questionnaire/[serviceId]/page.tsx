'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import type { Question, AnswerOption } from '@/types/database';

export default function QuestionnairePage({ params }: { params: Promise<{ serviceId: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [service, setService] = useState<any>(null);
  const [questions, setQuestions] = useState<(Question & { options?: AnswerOption[] })[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [serviceId, setServiceId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setServiceId(resolvedParams.serviceId);
    };
    init();
  }, [params]);

  useEffect(() => {
    if (!serviceId) return;
    
    const fetchData = async () => {
      try {
        // Get service
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (serviceError) throw serviceError;
        setService(serviceData);

        // Get active questionnaire
        const { data: questionnaire, error: qError } = await supabase
          .from('questionnaires')
          .select('*')
          .eq('is_active', true)
          .single();

        if (qError) throw qError;

        // Get questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('questionnaire_id', questionnaire.id)
          .order('display_order');

        if (questionsError) throw questionsError;

        // Get answer options for each question
        const questionsWithOptions = await Promise.all(
          questionsData.map(async (q) => {
            if (q.question_type === 'single' || q.question_type === 'multi') {
              const { data: options } = await supabase
                .from('answer_options')
                .select('*')
                .eq('question_id', q.id)
                .order('display_order');

              return { ...q, options: options || [] };
            }
            return q;
          })
        );

        setQuestions(questionsWithOptions);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceId, supabase]);

  const handleAnswer = (questionId: string, value: any) => {
    setResponses({
      ...responses,
      [questionId]: value,
    });
  };

  const handleMultiSelect = (questionId: string, optionValue: string) => {
    const current = responses[questionId] || [];
    const newValue = current.includes(optionValue)
      ? current.filter((v: string) => v !== optionValue)
      : [...current, optionValue];
    
    setResponses({
      ...responses,
      [questionId]: newValue,
    });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Convert responses to API format
      const apiResponses = Object.entries(responses).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      // Call scoring API
      const response = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: serviceId,
          responses: apiResponses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit questionnaire');
      }

      // Redirect to results
      router.push(`/results/${data.runId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div>Loading questionnaire...</div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assessment Questionnaire</h1>
        <p className="text-slate-600 mt-2">
          {service?.name} - Step {currentStep + 1} of {questions.length}
        </p>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} />

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle>{currentQuestion?.text}</CardTitle>
          {currentQuestion?.help_text && (
            <CardDescription>{currentQuestion.help_text}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Single Choice */}
          {currentQuestion?.question_type === 'single' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <label key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={responses[currentQuestion.id] === option.value}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Multi Choice */}
          {currentQuestion?.question_type === 'multi' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <label key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={(responses[currentQuestion.id] || []).includes(option.value)}
                    onChange={() => handleMultiSelect(currentQuestion.id, option.value)}
                    className="w-4 h-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Scale */}
          {currentQuestion?.question_type === 'scale' && (
            <div className="space-y-4">
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={value}
                      checked={responses[currentQuestion.id] === value.toString()}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      className="w-5 h-5 mb-2"
                    />
                    <span className="text-sm font-medium">{value}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Not Confident</span>
                <span>Very Confident</span>
              </div>
            </div>
          )}

          {/* Text */}
          {currentQuestion?.question_type === 'text' && (
            <Input
              value={responses[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Your answer..."
            />
          )}

          {/* Number */}
          {currentQuestion?.question_type === 'number' && (
            <Input
              type="number"
              value={responses[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Enter a number..."
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        {currentStep < questions.length - 1 ? (
          <Button onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        )}
      </div>
    </div>
  );
}
