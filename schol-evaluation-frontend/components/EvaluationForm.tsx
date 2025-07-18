import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  type: "rating" | "text";
}

interface EvaluationFormProps {
  questions: Question[];
  onSubmit: (
    responses: Record<string, { rating?: number; textResponse?: string }>,
  ) => void;
  existingData?: Record<string, { rating?: number; textResponse?: string }>;
  skip: (id: string) => void;
}

const ratingDescriptions = {
  0: { label: "None", description: "Not applicable or no performance" },
  1: { label: "Poor", description: "Significantly below expectations" },
  2: { label: "Fair", description: "Below expectations, needs improvement" },
  3: { label: "Good", description: "Meets expectations" },
  4: { label: "Very Good", description: "Exceeds expectations" },
  5: { label: "Excellent", description: "Outstanding performance" },
};

const EvaluationForm = ({ questions, onSubmit, existingData, skip }: EvaluationFormProps) => {
  const [responses, setResponses] = useState<
    Record<string, { rating?: number; textResponse?: string }>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (existingData) {
      setResponses(existingData);
      setIsSubmitted(true);
    }
  }, [existingData]);

  const handleRatingChange = (questionId: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating: value },
    }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], textResponse: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    onSubmit(responses);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id} className="border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center mb-3">
                <Badge className="mr-2">{idx + 1}</Badge>
                <Label className="text-base font-medium leading-relaxed">{q.text}</Label>
              </div>
              {q.type === "rating" && (
                <RadioGroup
                  value={responses[q.id]?.rating?.toString() || ""}
                  onValueChange={(val) => handleRatingChange(q.id, parseInt(val))}
                  className="flex flex-wrap gap-4 sm:gap-6 mt-3"
                  required
                >
                  {[0, 1, 2, 3, 4, 5].map((score) => (
                    <div
                      key={score}
                      className="flex items-center space-x-2 bg-blue-100 rounded-md px-3 py-2"
                    >
                      <RadioGroupItem
                        value={score.toString()}
                        id={`${q.id}-score-${score}`}
                        className="text-blue-600"
                        disabled={isSubmitted}
                      />
                      <Label
                        htmlFor={`${q.id}-score-${score}`}
                        className="text-sm font-medium text-blue-800 flex flex-col"
                      >
                        <span>{score} - {ratingDescriptions[score].label}</span>
                        {/* <span className="text-xs text-blue-600">{ratingDescriptions[score].description}</span> */}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.type === "text" && (
                <Textarea
                  value={responses[q.id]?.textResponse || ""}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder="Your response"
                  rows={4}
                  className="mt-2 w-full resize-none"
                  disabled={isSubmitted}
                />
              )}
            </CardContent>
          </Card>
        ))}
        <Button
          type="submit"
          disabled={isSubmitted}
          className="w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitted ? "Submitted" : "Submit Evaluation"}
        </Button>
      </form>
    </div>
  );
};

export default EvaluationForm;