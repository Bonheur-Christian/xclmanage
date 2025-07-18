"use client";
import React, { useState } from "react";
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
  useAddEvaluationTypeMutation,
  useUpdateEvaluationTypeMutation,
} from "@/lib/api/evaluationApi";

export function AddEvaluationTypeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedType, setSelectedType] = useState<EvaluationTypeName | "">("");
  const [addEvaluationType, { isLoading }] = useAddEvaluationTypeMutation();

  const handleAdd = async () => {
    if (!selectedType) return;
    await addEvaluationType({ name: selectedType as EvaluationTypeName });
    setSelectedType("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Evaluation Type</DialogTitle>
        </DialogHeader>
        <select
          title="select evaluation type"
          value={selectedType}
          onChange={(e) =>
            setSelectedType(e.target.value as EvaluationTypeName)
          }
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            Select evaluation type
          </option>
          {Object.values(EvaluationTypeName).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!selectedType || isLoading}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditEvaluationTypeDialog({
  open,
  onOpenChange,
  evaluationType,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationType: { id: string; name: EvaluationTypeName } | null;
  onSave: () => void;
}) {
  const [selectedType, setSelectedType] = useState<EvaluationTypeName | "">(
    evaluationType?.name || "",
  );
  const [updateEvaluationType, { isLoading }] =
    useUpdateEvaluationTypeMutation();

  const handleUpdate = async () => {
    if (!evaluationType || !selectedType) return;
    await updateEvaluationType({
      id: evaluationType.id,
      body: { name: selectedType as EvaluationTypeName },
    });
    setSelectedType("");
    onSave();
    onOpenChange(false);
  };

  React.useEffect(() => {
    setSelectedType(evaluationType?.name || "");
  }, [evaluationType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Evaluation Type</DialogTitle>
        </DialogHeader>
        <select
          title="select evaluation type"
          value={selectedType}
          onChange={(e) =>
            setSelectedType(e.target.value as EvaluationTypeName)
          }
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            Select evaluation type
          </option>
          {Object.values(EvaluationTypeName).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <DialogFooter>
          <Button onClick={handleUpdate} disabled={!selectedType || isLoading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
