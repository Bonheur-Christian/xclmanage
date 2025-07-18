"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EvaluationTypeName,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
} from "@/lib/api/evaluationApi";

export function AddQuestionDialog({
  open,
  onOpenChange,
  evaluationTypeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationTypeName: EvaluationTypeName;
}) {
  const [text, setText] = useState("");
  const [type, setType] = useState<"rating" | "text">("rating");
  const [addQuestion, { isLoading }] = useAddQuestionMutation();

  const handleAdd = async () => {
    if (!text) return;
    await addQuestion({ evaluationTypeName, text, type });
    setText("");
    setType("rating");
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setText("");
      setType("rating");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Enter question text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-4"
        />
        <Select
          value={type}
          onValueChange={(v) => setType(v as "rating" | "text")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="text">Text</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!text || isLoading}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditQuestionDialog({
  open,
  onOpenChange,
  question,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: { id: string; text: string; type: "rating" | "text" } | null;
  onSave: () => void;
}) {
  const [text, setText] = useState(question?.text || "");
  const [type, setType] = useState<"rating" | "text">(
    question?.type || "rating",
  );
  const [updateQuestion, { isLoading }] = useUpdateQuestionMutation();

  useEffect(() => {
    setText(question?.text || "");
    setType(question?.type || "rating");
  }, [question]);

  const handleUpdate = async () => {
    if (!question || !text) return;
    await updateQuestion({ id: question.id, body: { text, type } });
    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Enter question text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-4"
        />
        <Select
          value={type}
          onValueChange={(v) => setType(v as "rating" | "text")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="text">Text</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleUpdate} disabled={!text || isLoading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
