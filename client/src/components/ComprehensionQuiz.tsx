import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface ComprehensionQuizProps {
  questions: string[];
  storyTitle: string;
  onComplete?: (score: number, totalQuestions: number) => void;
}

export function ComprehensionQuiz({ questions, storyTitle, onComplete }: ComprehensionQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex] || "";
  const answeredCount = Object.keys(answers).filter(k => answers[parseInt(k)]?.trim()).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  // Calculate score: 1 point per non-empty answer
  const score = Object.values(answers).filter(a => a?.trim()).length;

  const handleAnswerChange = useCallback((text: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: text,
    }));
  }, [currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(() => {
    setShowResults(true);
    onComplete?.(score, questions.length);
  }, [score, questions.length, onComplete]);

  const handleRetake = useCallback(() => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
  }, []);

  if (!questions.length) return null;

  if (showResults) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="p-6 space-y-6">
            {/* Score Summary */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-3">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Quiz Complete!</h3>
              <p className="text-3xl font-bold text-green-600">
                {score} / {questions.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round((score / questions.length) * 100)}% of questions answered
              </p>
            </div>

            {/* Review Answers */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((q, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-border/50">
                  <p className="text-xs font-medium text-brand mb-1">Question {i + 1}</p>
                  <p className="text-sm font-medium text-foreground mb-2">{q}</p>
                  <p className="text-sm text-muted-foreground">
                    {answers[i]?.trim() ? (
                      <span className="text-green-700 dark:text-green-400">✓ Answered</span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">○ Not answered</span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-border/50">
              <Button onClick={handleRetake} variant="outline" className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-brand">Comprehension Quiz</p>
            <h3 className="text-sm font-semibold text-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h3>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Question */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {currentQuestion}
            </p>

            {/* Answer Input */}
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-24 resize-none"
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="outline"
                size="sm"
                className="gap-1 ml-auto"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="ml-auto gap-1 bg-brand hover:bg-brand/90"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Quiz
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          <p className="text-xs text-muted-foreground text-center">
            {answeredCount} of {questions.length} questions answered
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
