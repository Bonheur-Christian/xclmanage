"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useGetEvaluationTypesQuery,
  useDeleteEvaluationTypeMutation,
  useGetQuestionsQuery,
  useDeleteQuestionMutation,
  EvaluationTypeName,
  EvaluationType,
  Question,
  useAddEvaluationTypeMutation,
  useAddQuestionMutation,
} from "@/lib/api/evaluationApi";
import { AddEvaluationTypeDialog, EditEvaluationTypeDialog } from "@/components/dialogs/EvaluationTypeDialogs";
import { AddQuestionDialog, EditQuestionDialog } from "@/components/dialogs/QuestionDialogs";


export default function EvaluationOptionsPage() {
  // API hooks
  const {
    data: types = [],
    isLoading: loadingTypes,
    refetch: refetchTypes,
  } = useGetEvaluationTypesQuery();
  const [deleteEvaluationType] = useDeleteEvaluationTypeMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  // Dialog state
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EvaluationType | null>(null);
  const [addQuestionOpen, setAddQuestionOpen] =
    useState<EvaluationTypeName | null>(null);
  const [editQuestionOpen, setEditQuestionOpen] = useState<{
    type: EvaluationTypeName;
    question: Question;
  } | null>(null);

  // Handler for deleting evaluation type
  const handleDeleteType = async (id: string) => {
    await deleteEvaluationType(id);
    refetchTypes();
  };

  return (
    <div className="space-y-6 lg:px-12 lg:py-12">
      <div className="flex justify-between items-start md:items-center md:flex-row flex-col gap-2 sm:gap-0">
        <div>
          <h2 className="sm:text-2xl text-xl font-bold mb-2">
            Evaluation Types
          </h2>
          <p className="text-gray-600">
            Manage evaluation types and their questions.
          </p>
        </div>
        <Button
          className="flex items-center gap-2 p-0 sm:p-2"
          onClick={() => setAddTypeOpen(true)}
        >
          <Plus size={16} className="text-blue-500 font-bold" /> Add Evaluation
          Type
        </Button>
      </div>
      {loadingTypes ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {types.map((type) => (
            <TypeCard
              key={type.id}
              type={type}
              onEdit={() => {
                setSelectedType(type);
                setEditTypeOpen(true);
              }}
              onDelete={() => handleDeleteType(type.id)}
              onAddQuestion={() => setAddQuestionOpen(type.name)}
              onEditQuestion={(question) =>
                setEditQuestionOpen({ type: type.name, question })
              }
              onDeleteQuestion={async (question) => {
                await deleteQuestion({
                  id: question.id,
                  evaluationTypeName: type.name,
                });
              }}
            />
          ))}
        </div>
      )}
      <AddEvaluationTypeDialog
        open={addTypeOpen}
        onOpenChange={(open) => {
          setAddTypeOpen(open);
          if (!open) refetchTypes();
        }}
      />
      <EditEvaluationTypeDialog
        open={editTypeOpen}
        onOpenChange={(open) => {
          setEditTypeOpen(open);
          if (!open) refetchTypes();
        }}
        evaluationType={selectedType}
        onSave={refetchTypes}
      />
      <AddQuestionDialog
        open={!!addQuestionOpen}
        onOpenChange={(open) =>
          setAddQuestionOpen(open ? addQuestionOpen : null)
        }
        evaluationTypeName={addQuestionOpen as EvaluationTypeName}
      />
      <EditQuestionDialog
        open={!!editQuestionOpen}
        onOpenChange={(open) =>
          setEditQuestionOpen(open ? editQuestionOpen : null)
        }
        question={editQuestionOpen?.question || null}
        onSave={refetchTypes}
      />
    </div>
  );
}

function TypeCard({
  type,
  onEdit,
  onDelete,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: {
  type: EvaluationType;
  onEdit: () => void;
  onDelete: () => void;
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (question: Question) => void;
}) {
  const { data: questions = [], isLoading } = useGetQuestionsQuery(type.name);
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start flex-col sm:flex-row gap-2 lg:gap-0">
          <CardTitle className="text-lg">{type.name}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onEdit}
            >
              <Edit size={14} /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onDelete}
            >
              <Trash2 size={14} className="text-red-600" /> Del
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="">
        <div className="mb-2 flex sm:justify-between sm:items-center sm:flex-row flex-col gap-1 items-start">
          <h4 className="font-medium mb-2 ">Questions</h4>
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddQuestion}
            className="flex items-center justify-start pl-1 gap-1"
          >
            <Plus size={16} className="font-bold text-blue-600" /> Add Question
          </Button>
        </div>
        {isLoading ? (
          <div>Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-gray-500 text-sm">
            No questions for this type.
          </div>
        ) : (
          <ul className="space-y-2">
            {questions.map((q) => (
              <li
                key={q.id}
                className="flex justify-between items-center border rounded px-2 py-1"
              >
                <div>
                  <span className="font-medium">{q.text}</span>
                  <span className="ml-2 text-xs text-gray-500">[{q.type}]</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditQuestion(q)}
                  >
                    <Edit size={12} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteQuestion(q)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
