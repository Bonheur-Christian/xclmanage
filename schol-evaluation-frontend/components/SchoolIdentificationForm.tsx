"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { setTeacherCode } from "@/features/common/evaluationUtil";

interface SchoolIdentificationFormProps {
  onSubmit: (data: any) => void;
  schoolData?: any;
  editable?: boolean;
  role: string | null;
  isAddOrEdit?: boolean;
}

const SchoolIdentificationForm = ({
  onSubmit,
  schoolData,
  editable,
  role,
  isAddOrEdit
}: SchoolIdentificationFormProps) => {

  const [formData, setFormData] = useState({
    schoolName: "",
    schoolCode: "",
    teacherCode: "",
    headTeacherName: "",
    dosName: "",
    dodName: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    status: "",
    levels: {
      nursery: false,
      primary: false,
      secondary: false,
      tvet: false,
    },
    category: "",
    dateOfEvaluation: new Date(),
  });
  const [teacherCodeError, setTeacherCodeError] = useState<string | null>(null);

  // Auto-fill formData from schoolData when it changes
  useEffect(() => {
    if (schoolData) {
      setFormData((prev) => ({
        ...prev,
        ...schoolData,
        dateOfEvaluation: schoolData.dateOfEvaluation
          ? new Date(schoolData.dateOfEvaluation)
          : new Date(),
      }));
    }
  }, [schoolData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "teacherCode") {
      setTeacherCodeError(null);
    }
  };

  const handleLevelChange = (level: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      levels: {
        ...prev.levels,
        [level]: checked,
      },
    }));
  };

  const validateTeacherCode = () => {
    if (!schoolData) return role !== "Admin"; // Allow empty teacherCode for new schools (admins only)
    if (role !== "Admin" && !formData.teacherCode) {
      return false; // Non-admins must provide a teacherCode
    }
    if (!formData.teacherCode) return true; // TeacherCode is optional for admins
    return schoolData.teachers?.some(
      (teacher: any) => teacher.teacherCode === formData.teacherCode
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherCodeError(null);

    if (!validateTeacherCode()) {
      const errorMessage = role !== "Admin" && !formData.teacherCode
        ? "Teacher's Code is required."
        : "This school does not have a teacher with that code.";
      setTeacherCodeError(errorMessage);
      toast.error(errorMessage + role);
      return;
    }

    setTeacherCode(formData.teacherCode);
    onSubmit(formData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Basic Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                value={formData.schoolName}
                onChange={(e) => handleInputChange("schoolName", e.target.value)}
                placeholder="Enter school name"
                className="bg-white"
                required
                disabled={!editable}
              />
            </div>
          
              <div className="space-y-2">
                <Label htmlFor="schoolCode">School Code *</Label>
                <Input
                  id="schoolCode"
                  value={formData.schoolCode}
                  onChange={(e) => handleInputChange("schoolCode", e.target.value)}
                  placeholder="Enter school code"
                  className="bg-white"
                  required
                  disabled={!editable}
                />
              </div>
            {!isAddOrEdit && (
              <>
            <div className="space-y-2">
              <Label htmlFor="teacherCode">Teacher's Code {role !== "Admin" ? "*" : ""}</Label>
              <Input
                id="teacherCode"
                value={formData.teacherCode}
                onChange={(e) => handleInputChange("teacherCode", e.target.value)}
                placeholder="Enter teacher's code"
                className={`bg-white ${teacherCodeError ? "border-red-500" : ""}`}
                required={role !== "Admin"} // Required for non-admins
              />
              {teacherCodeError && (
                <p className="text-red-500 text-sm mt-1">{teacherCodeError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfEvaluation">Evaluation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white"
                    disabled={!editable}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.dateOfEvaluation, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfEvaluation}
                    onSelect={(date) =>
                      handleInputChange("dateOfEvaluation", date || new Date())
                    }
                    initialFocus
                    disabled={!editable}
                  />
                </PopoverContent>
              </Popover>
            </div>
            </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leadership Information */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Leadership Team
          </h3>
          <div className={`grid grid-cols-1 ${isAddOrEdit ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
            <div className="space-y-2">
              <Label htmlFor="headTeacherName">Headteacher Name *</Label>
              <Input
                id="headTeacherName"
                value={formData.headTeacherName}
                onChange={(e) => handleInputChange("headTeacherName", e.target.value)}
                placeholder="Enter headteacher name"
                className="bg-white"
                required
                disabled={!editable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosName">DOS Name</Label>
              <Input
                id="dosName"
                value={formData.dosName}
                onChange={(e) => handleInputChange("dosName", e.target.value)}
                placeholder="Deputy Head of Studies"
                className="bg-white"
                disabled={!editable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dodName">DOD Name</Label>
              <Input
                id="dodName"
                value={formData.dodName}
                onChange={(e) => handleInputChange("dodName", e.target.value)}
                placeholder="Deputy Head of Discipline"
                className="bg-white"
                disabled={!editable}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">
            Location & Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                placeholder="Enter district"
                className="bg-white"
                required
                disabled={!editable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => handleInputChange("sector", e.target.value)}
                placeholder="Enter sector"
                className="bg-white"
                disabled={!editable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cell">Cell</Label>
              <Input
                id="cell"
                value={formData.cell}
                onChange={(e) => handleInputChange("cell", e.target.value)}
                placeholder="Enter cell"
                className="bg-white"
                disabled={!editable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="village">Village</Label>
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => handleInputChange("village", e.target.value)}
                placeholder="Enter village"
                className="bg-white"
                disabled={!editable}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">School Status *</Label>
              <select
                title="select status"
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={!editable}
              >
                <option value="" disabled>
                  Select school status
                </option>
                <option value="Public">Public</option>
                <option value="GovAided">Government Aided</option>
                <option value="Private">Private</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                title="select category"
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!editable}
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="Day">Day School</option>
                <option value="Boarding">Boarding School</option>
                <option value="Day_Boarding">Day & Boarding</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-base font-medium">Education Levels *</Label>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
              {Object.entries(formData.levels).map(([level, checked]) => (
                <div key={level} className="flex items-center space-x-2">
                  <input
                    title="check"
                    type="checkbox"
                    id={level}
                    checked={checked}
                    onChange={(e) => handleLevelChange(level, e.target.checked)}
                    className="h-4 w-4 rounded-sm border border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground"
                    disabled={!editable}
                  />
                  <Label htmlFor={level} className="capitalize cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!isAddOrEdit && (

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r text-white from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
          >
            Continue to Evaluation
          </Button>
        </div>
      )}
    </form>
  );
};

export default SchoolIdentificationForm;