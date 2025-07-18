"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import EvaluationForm from "@/components/EvaluationForm";
import { User, GraduationCap, Shield, CheckCircle } from "lucide-react";
import {
  useGetQuestionsQuery,
  useCreateEvaluationMutation,
  EvaluationTypeName,
  fetchEvaluations,
} from "@/lib/api/evaluationApi";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/features/common/authUtil";
import { getTeacherCode } from "@/features/common/evaluationUtil";
import { toast } from "sonner";

interface EvaluationTabsProps {
  schoolData: any;
  onComplete: (data: any) => void;
}

const colorGradients: Record<string, string> = {
  green: "from-green-600 to-green-300",
  blue: "from-blue-600 to-blue-300",
  purple: "from-purple-600 to-purple-300",
};

const EvaluationTabs = ({ schoolData, onComplete }: EvaluationTabsProps) => {
  const role = getUserRole();
  const teacherCode = getTeacherCode();
  const router = useRouter();

  // State for evaluations data and evaluated leaders
  const [evaluationsData, setEvaluationsData] = useState<any[]>([]);
  const [evaluatedLeaders, setEvaluatedLeaders] = useState<{
    headteacher: boolean;
    dos: boolean;
    dod: boolean;
  }>({
    headteacher: false,
    dos: false,
    dod: false,
  });
  const [evaluations, setEvaluations] = useState<{
    headteacher?: Record<string, { rating?: number; textResponse?: string }>;
    dos?: Record<string, { rating?: number; textResponse?: string }>;
    dod?: Record<string, { rating?: number; textResponse?: string }>;
  }>({
    headteacher: undefined,
    dos: undefined,
    dod: undefined,
  });
  const [activeTab, setActiveTab] = useState<"headteacher" | "dos" | "dod">("headteacher");

  const tabConfig = [
    {
      id: "headteacher",
      label: "Headteacher",
      icon: User,
      color: "green",
      evaluationTypeName: EvaluationTypeName.Headteacher,
      description: `Evaluate the school headteacher's leadership and management`,
      getTeacherCode: () => getTeacherCode(),
      disabled: !schoolData?.headTeacherName,
    },
    {
      id: "dos",
      label: "Deputy Head (Studies)",
      icon: GraduationCap,
      color: "blue",
      evaluationTypeName: EvaluationTypeName.DOS,
      description: "Evaluate the Deputy Head in charge of Studies",
      getTeacherCode: () => getTeacherCode(),
      disabled: !schoolData?.dosName,
    },
    {
      id: "dod",
      label: "Deputy Head (Discipline)",
      icon: Shield,
      color: "purple",
      evaluationTypeName: EvaluationTypeName.DOD,
      description: "Evaluate the Deputy Head in charge of Discipline",
      getTeacherCode: () => getTeacherCode(),
      disabled: !schoolData?.dodName,
    },
  ];


  // Filter enabled tabs
  const enabledTabs = tabConfig.filter((tab) => !tab.disabled);

  // Fetch questions for all tabs
  const questionsByType = {
    headteacher: useGetQuestionsQuery(EvaluationTypeName.Headteacher),
    dos: useGetQuestionsQuery(EvaluationTypeName.DOS),
    dod: useGetQuestionsQuery(EvaluationTypeName.DOD),
  };
  const [createEvaluation, { isLoading: isSubmitting }] = useCreateEvaluationMutation();

  // Fetch evaluations data
  useEffect(() => {
    const fetchEvaluationsData = async () => {
      try {
        const query = {
          schoolCode: schoolData.schoolCode,
          teacherCode: teacherCode,
        };
        const data = await fetchEvaluations(query);
        setEvaluationsData(data || []);

        // Process evaluations to determine which leaders have been evaluated
        const evaluated = {
          headteacher: false,
          dos: false,
          dod: false,
        };
        data?.forEach((evaluation: any) => {
          if (evaluation.evaluationType?.name === EvaluationTypeName.Headteacher) {
            evaluated.headteacher = true;
          } else if (evaluation.evaluationType?.name === EvaluationTypeName.DOS) {
            evaluated.dos = true;
          } else if (evaluation.evaluationType?.name === EvaluationTypeName.DOD) {
            evaluated.dod = true;
          }
        });
        setEvaluatedLeaders(evaluated);

        // Set initial active tab to the first enabled tab
        const firstEnabledTab = enabledTabs.find((tab) => !evaluatedLeaders[tab.id as keyof typeof evaluatedLeaders]);
        if (firstEnabledTab) {
          setActiveTab(firstEnabledTab.id as "headteacher" | "dos" | "dod");
        }
      } catch (error) {
        toast.error("Failed to fetch evaluation data");
      }
    };
    if (schoolData?.schoolCode && teacherCode) {
      fetchEvaluationsData();
    }
  }, [schoolData, teacherCode, enabledTabs]);

  // Submission logic
  const handleEvaluationSubmit = async (tabId: string, formData: any) => {
    const tab = tabConfig.find((t) => t.id === tabId);
    if (!tab || !schoolData) return;

    const questions = questionsByType[tabId as keyof typeof questionsByType].data || [];
    const responses = questions.map((q: any) => ({
      questionText: q.text,
      rating: q.type === "rating" ? formData[q.id]?.rating : undefined,
      textResponse: q.type === "text" ? formData[q.id]?.textResponse : undefined,
    }));

    const payload = {
      schoolId: schoolData.id,
      evaluationTypeName: tab.evaluationTypeName,
      teacherCode: tab.getTeacherCode() || "",
      responses,
    };

    try {
      await createEvaluation(payload).unwrap();
      setEvaluatedLeaders((prev) => ({ ...prev, [tabId]: true }));
      const updatedEvaluations = { ...evaluations, [tabId]: formData };
      setEvaluations(updatedEvaluations);

      if (tabId === enabledTabs[enabledTabs.length - 1]?.id) {
        onComplete({
          ...updatedEvaluations,
          completedAt: new Date(),
          schoolInfo: schoolData,
        });
        return;
      }

      const currentIndex = enabledTabs.findIndex((t) => t.id === tabId);
      if (currentIndex < enabledTabs.length - 1) {
        setActiveTab(enabledTabs[currentIndex + 1].id as "headteacher" | "dos" | "dod");
      }
    } catch (error) {
      toast.error("Failed to submit evaluation");
    }
  };

  const skip = (tabId: string) => {
    const currentTab = tabConfig.find((tab) => tab.id === tabId);
    if (!currentTab) return;

    if (currentTab.disabled) {
      toast.info(`Your school has no ${currentTab.label}. Please evaluate the next available leader.`);
    }

    const currentIndex = enabledTabs.findIndex((tab) => tab.id === tabId);
    if (currentIndex < enabledTabs.length - 1) {
      setActiveTab(enabledTabs[currentIndex + 1].id as "headteacher" | "dos" | "dod");
    } else {
      if (role === "Admin") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard/done-evaluation");
      }
    }
  };

  const completedCount = Object.entries(evaluatedLeaders)
    .filter(([key, value]) => value && !tabConfig.find((tab) => tab.id === key)?.disabled)
    .length;
  const progressPercentage = enabledTabs.length > 0 ? (completedCount / enabledTabs.length) * 100 : 0;
  const isAllCompleted = completedCount === enabledTabs.length && enabledTabs.length > 0;

  const handleCompleteEvaluation = () => {
    onComplete({
      ...evaluations,
      completedAt: new Date(),
      schoolInfo: schoolData,
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">Evaluation Progress1</h3>
              <p className="text-sm text-indigo-700">
                {completedCount} of {enabledTabs.length} evaluations completed
              </p>
            </div>
            <Badge variant={isAllCompleted ? "default" : "secondary"} className="text-sm">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isCompleted = evaluatedLeaders[tab.id as keyof typeof evaluatedLeaders];
              const isDisabled = tab.disabled;

              return (
                <div
                  key={tab.id}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ${isDisabled
                    ? "bg-gray-100 border-gray-200 opacity-50"
                    : isCompleted
                      ? "bg-green-50 border-green-200"
                      : activeTab === tab.id
                        ? `bg-${tab.color}-50 border-${tab.color}-200`
                        : "bg-gray-50 border-gray-200"
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon
                      className={`h-5 w-5 ${isCompleted ? "text-green-600" : isDisabled ? "text-gray-400" : `text-${tab.color}-600`}`}
                    />
                    <span className="font-medium text-sm">{tab.label}</span>
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {isDisabled && <span className="text-xs text-gray-500">(No {tab.label})</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => {
          if (value === "headteacher" || value === "dos" || value === "dod") {
            const tab = tabConfig.find((t) => t.id === value);
            if (!tab?.disabled) {
              setActiveTab(value);
            }
          }
        }}
        className="w-full"
      >
        <TabsList className="grid md:items-center items-start w-full grid-cols-1 h-[34vh] lg:h-[24vh] xl:h-[20vh] lg:grid-cols-2 xl:grid-cols-3">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`flex md:flex-col items-start py-4 flex-row md:items-center data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed`}
                disabled={tab.disabled}
              >
                <Icon className={`h-5 w-5 mb-1 text-${tab.color}-600`} />
                <div className="ml-2">{tab.label}</div>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {tabConfig.map((tab) => {
          const questions = questionsByType[tab.id as keyof typeof questionsByType].data || [];
          const loading = questionsByType[tab.id as keyof typeof questionsByType].isLoading;
          const hasEvaluated = evaluatedLeaders[tab.id as keyof typeof evaluatedLeaders];

          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <Card className="shadow-md border-0">
                <CardHeader className={`bg-gradient-to-r ${colorGradients[tab.color]} text-white rounded-t-lg`}>
                  <CardTitle>{tab.label} Evaluation</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4 text-gray-700 text-sm">{tab.description}</div>
                  {tab.disabled ? (
                    <div className="text-center text-gray-700">
                      This school has no {tab.label}. Please skip to evaluate the next available leader.
                    </div>
                  ) : hasEvaluated ? (
                    <div className="text-center text-gray-700">
                      You have already evaluated the {tab.label}. Please proceed to the next tab or skip.
                    </div>
                  ) : loading ? (
                    <div>Loading questions...</div>
                  ) : (
                    <>
                      <Button
                        onClick={() => skip(tab.id)}
                        className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-4"
                      >
                        Skip
                      </Button>
                      <EvaluationForm
                        questions={questions}
                        onSubmit={(data) => handleEvaluationSubmit(tab.id, data)}
                        skip={() => skip(tab.id)}
                        existingData={evaluations[tab.id as keyof typeof evaluations]}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Complete Button */}
      {isAllCompleted && (
        <div className="flex justify-center">
          <Button
            onClick={handleCompleteEvaluation}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
          >
            View Results & Analytics
          </Button>
        </div>
      )}
    </div>
  );
};

export default EvaluationTabs;