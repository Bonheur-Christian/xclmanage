"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SchoolIdentificationForm from "@/components/SchoolIdentificationForm";
import EvaluationTabs from "@/components/EvaluationTabs";
import { GraduationCap, Users } from "lucide-react";
import {
  SchoolIdentification,
  useAddSchoolMutation,
  useGetSchoolsQuery,
  useUpdateSchoolMutation,
} from "@/lib/api/schoolsApi";
import { getUserRole } from "@/features/common/authUtil";
type Step = "identification" | "evaluation";

const EvaluatePage = () => {
  const { data: schools = [], isLoading: isLoadingSchools } = useGetSchoolsQuery();
  const [updateSchool] = useUpdateSchoolMutation();
  const [addSchool] = useAddSchoolMutation();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(undefined);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<Step>("identification");
  const [typedQuery, setTypedQuery] = useState("");
  const router = useRouter();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userRole = getUserRole(); // Get user role

  // Filter schools based on typed query
  const filteredSchools = useMemo(() => {
    if (!typedQuery.trim()) return schools;
    const query = typedQuery.toLowerCase().trim();
    return schools.filter(
      (school: SchoolIdentification) =>
        school.schoolName.toLowerCase().includes(query) ||
        school.schoolCode.toLowerCase().includes(query)
    ).sort((a: SchoolIdentification, b: SchoolIdentification) => a.schoolName.localeCompare(b.schoolName));
  }, [schools, typedQuery]);

  // Update schoolData when a school is selected
  useEffect(() => {
    if (selectedSchoolId && schools.length > 0) {
      const found = schools.find((s) => s.id === selectedSchoolId);
      if (found) {
        setSchoolData(found);
        if (userRole !== "Admin") {
          setCurrentStep("identification"); // Ensure non-admins stay on identification until teacherCode is entered
        }
      }
    } else {
      setSchoolData(null);
    }
  }, [selectedSchoolId, schools, userRole]);

  // Handle evaluation completion
  const handleEvaluationComplete = (data: any) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("evaluationData", JSON.stringify(data));
    }
    if (userRole == 'Admin') {
      router.push('/admin/dashboard')
    } else {
      router.push("/teacher/done-evaluation")
    }

  };

  // Handle school form submission (add or update)
  const handleSchoolSubmit = async (data: SchoolIdentification) => {
    try {
      let result;
      if (data.id) {
        result = await updateSchool({ id: data.id, data }).unwrap();
      } else {
        result = await addSchool(data).unwrap();
      }
      setSchoolData(result);
      setSelectedSchoolId(result.id);
      setCurrentStep("evaluation");
    } catch (error) {
    }
  };

  // Handle keyboard input for filtering
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (/^[a-zA-Z0-9 ]$/.test(e.key)) {
      e.preventDefault();
      const newQuery = typedQuery + e.key;
      setTypedQuery(newQuery);

      const matchedSchool = schools.find(
        (school: SchoolIdentification) =>
          school.schoolName.toLowerCase().startsWith(newQuery.toLowerCase()) ||
          school.schoolCode.toLowerCase().startsWith(newQuery.toLowerCase())
      );

      setSelectedSchoolId(matchedSchool ? matchedSchool.id : undefined);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypedQuery("");
      }, 1000);
    }
  };

  // Handle select change
  const handleSchoolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSchoolId(value || undefined);
    setTypedQuery("");
  };

  const steps = [
    { id: "identification", label: "School Information", icon: GraduationCap },
    { id: "evaluation", label: "Leadership Evaluation", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 px-2 sm:px-4 md:px-8 flex flex-col items-center w-full">
      {/* School Select Dropdown */}
      <div className="w-full max-w-3xl mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select or type to filter a school
        </label>
        <select
          title="select school id"
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          value={selectedSchoolId || ""}
          onChange={handleSchoolSelect}
          onKeyDown={handleKeyDown}
          disabled={isLoadingSchools}
        >
          {userRole === "Admin" && <option value="">-- New School --</option>}
          {isLoadingSchools ? (
            <option disabled>Loading schools...</option>
          ) : filteredSchools.length === 0 && typedQuery ? (
            <option disabled>No schools found</option>
          ) : (
            filteredSchools.map((school: SchoolIdentification) => (
              <option key={school.id} value={school.id}>
                {school.schoolName} ({school.schoolCode})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Progress Steps */}
      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="flex flex-wrap justify-center mb-8 gap-2 w-full">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted =
              (step.id === "identification" && schoolData) ||
              (step.id === "evaluation" && schoolData);
            return (
              <div
                key={step.id}
                className="flex flex-1 min-w-[120px] items-center justify-center"
              >
                <div
                  className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : isCompleted
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 justify-center ${isCompleted ? "bg-green-300" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Content */}
        <div className="w-full max-w-3xl flex flex-col gap-6">
          {currentStep === "identification" && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm w-full">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle>School Identification</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {userRole !== "Admin" && !schoolData ? (
                  <p className="text-gray-700">
                    Please select a school from the dropdown to proceed.
                  </p>
                ) : (
                  <SchoolIdentificationForm
                    schoolData={schoolData}
                    onSubmit={handleSchoolSubmit}
                    editable={userRole === "Admin"} // Only admins can edit
                    role={userRole}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === "evaluation" && schoolData && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm w-full">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-6 w-6" />
                  <span>Leadership Evaluation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <EvaluationTabs schoolData={schoolData} onComplete={handleEvaluationComplete} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluatePage;