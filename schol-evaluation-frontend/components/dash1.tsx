"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  FileText,
  Table,
  BarChart3,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useGetSchoolsQuery } from "@/lib/api/schoolsApi";
import { fetchEvaluations } from "@/lib/api/evaluationApi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

// Rwanda administrative data (simplified, replace with API calls in production)
const rwandaDistricts = [
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Gakenke",
  "Gicumbi",
  "Kayonza",
  "Kirehe",
  "Ngoma",
  "Nyagatare",
  "Rubavu",
  "Nyabihu",
];
const sectorsByDistrict: { [key: string]: string[] } = {
  Gasabo: ["Jali", "Gisozi", "Kinyinya"],
  Kicukiro: ["Kagarama", "Nyarugunga", "Kicukiro"],
  Nyarugenge: ["Gitega", "Kanyinya", "Kigali"],
  Gakenke: ["Busengo", "Coko", "Gakenke"],
  Gicumbi: ["Byumba", "Kageyo", "Rukomo"],
  Kayonza: ["Gahini", "Kabare", "Mukarange"],
  Kirehe: ["Gahara", "Kigarama", "Musaza"],
  Ngoma: ["Jarama", "Kazo", "Mutenderi"],
  Nyagatare: ["Gatunda", "Karangazi", "Rwimiyaga"],
  Rubavu: ["Bugeshi", "Busasamana", "Cyanzarwe"],
  Nyabihu: ["Gahara", "Kigarama", "Musaza", "Mukamira"],
};
const cellsBySector: { [key: string]: string[] } = {
  Jali: ["Agakomeye", "Akumunigo"],
  Gisozi: ["Amajyambere", "Bwerankori"],
  Gahara: ["Agakomeye", "Akumunigo"],
};
const villagesByCell: { [key: string]: string[] } = {
  Agakomeye: ["Bugarama", "Kinyana"],
  Akumunigo: ["Bisizi", "Rukoko"],
};

interface Evaluation {
  id: string;
  date: string;
  teacherCode: string;
  school: {
    id: string;
    schoolName: string;
    schoolCode: string;
    headTeacherName: string;
    dosName: string;
    dodName: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    status: string;
    levels: {
      nursery: boolean;
      primary: boolean;
      secondary: boolean;
      tvet: boolean;
    };
    category: string;
    dateOfEvaluation: string;
  };
  evaluationType: {
    id: string;
    name: "Headteacher" | "DOS" | "DOD";
  };
  responses: {
    id: string;
    questionText: string;
    responseType: string;
    rating: number;
    textResponse: string | null;
  }[];
}

interface TeacherStats {
  schoolCode: string;
  schoolName: string;
  sector: string;
  totalTeachers: number;
  teachersEvaluated: number;
  teachersNotEvaluated: number;
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    district: "",
    sector: "",
    cell: "",
    village: "",
    schoolCode: "",
    month: new Date().toISOString().slice(0, 7), // Default to current month (YYYY-MM)
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStats[]>([]);
  const { data: schools = [], isLoading: loadingSchools } = useGetSchoolsQuery();

  // Dynamic filter options
  const availableSectors = useMemo(
    () => (filters.district ? sectorsByDistrict[filters.district] || [] : []),
    [filters.district]
  );
  const availableCells = useMemo(
    () => (filters.sector ? cellsBySector[filters.sector] || [] : []),
    [filters.sector]
  );
  const availableVillages = useMemo(
    () => (filters.cell ? villagesByCell[filters.cell] || [] : []),
    [filters.cell]
  );
  const availableSchools = useMemo(
    () =>
      schools.filter(
        (school) =>
          (!filters.district || school.district === filters.district) &&
          (!filters.sector || school.sector === filters.sector) &&
          (!filters.cell || school.cell === filters.cell) &&
          (!filters.village || school.village === filters.village)
      ),
    [schools, filters.district, filters.sector, filters.cell, filters.village]
  );

  // Fetch evaluations and teacher stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch evaluations
        const evalFilters = { ...filters };
        if (filters.district && !filters.schoolCode && !filters.sector && !filters.cell && !filters.village) {
          evalFilters.schoolCode = ""; // Ensure all schools in district are fetched
        }
        const evalData = await fetchEvaluations(evalFilters);
        setEvaluations(evalData);

        // Fetch teacher stats only if a district or school is selected
        if (filters.district && !filters.schoolCode && !filters.sector && !filters.cell && !filters.village) {
          const districtSchools = schools.filter((school) => school.district === filters.district);
          const statsPromises = districtSchools.map(async (school) => {
            const response = await fetch(`http://localhost:3001/evaluations/teacher-evaluation-stats?schoolCode=${school.schoolCode}`);
            const data = await response.json();
            return {
              schoolCode: school.schoolCode,
              schoolName: school.schoolName,
              sector: school.sector,
              totalTeachers: data.totalTeachers,
              teachersEvaluated: data.teachersEvaluated,
              teachersNotEvaluated: data.teachersNotEvaluated,
            };
          });
          const stats = await Promise.all(statsPromises);
          setTeacherStats(stats);
        } else if (filters.schoolCode && filters.schoolCode !== "all-schools") {
          const response = await fetch(`http://localhost:3001/evaluations/teacher-evaluation-stats?schoolCode=${filters.schoolCode}`);
          const data = await response.json();
          setTeacherStats([
            {
              schoolCode: filters.schoolCode,
              schoolName: schools.find((s) => s.schoolCode === filters.schoolCode)?.schoolName || "Unknown",
              sector: schools.find((s) => s.schoolCode === filters.schoolCode)?.sector || "Unknown",
              totalTeachers: data.totalTeachers,
              teachersEvaluated: data.teachersEvaluated,
              teachersNotEvaluated: data.teachersNotEvaluated,
            },
          ]);
        } else {
          setTeacherStats([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch evaluations or teacher stats");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, schools]);

  // Aggregate evaluations by district and role (for all districts) or by school and role
  const aggregatedEvaluationData = useMemo(() => {
    if (!filters.district) {
      // Aggregate by district and role for all Rwanda
      const result: {
        [district: string]: {
          [role: string]: {
            responses: number[];
            teacherCodes: Set<string>;
          };
        };
      } = {};

      const currentMonth = filters.month;
      evaluations
        .filter((evalItem) => {
          const evalMonth = new Date(evalItem.date).toISOString().slice(0, 7);
          return evalMonth === currentMonth;
        })
        .forEach((evalItem) => {
          const district = evalItem.school.district;
          const role = evalItem.evaluationType.name.toLowerCase();
          if (!result[district]) {
            result[district] = {
              headteacher: { responses: [], teacherCodes: new Set() },
              dos: { responses: [], teacherCodes: new Set() },
              dod: { responses: [], teacherCodes: new Set() },
            };
          }
          result[district][role].teacherCodes.add(evalItem.teacherCode);
          const avgRating =
            evalItem.responses.reduce((sum, r) => sum + r.rating, 0) / evalItem.responses.length;
          result[district][role].responses.push(avgRating);
        });

      return result;
    } else {
      // Aggregate by school and role
      const result: {
        [schoolCode: string]: {
          [role: string]: {
            responses: { [question: string]: number[] };
            teacherCodes: Set<string>;
            schoolName: string;
            sector: string;
          };
        };
      } = {};

      const currentMonth = filters.month;
      evaluations
        .filter((evalItem) => {
          const evalMonth = new Date(evalItem.date).toISOString().slice(0, 7);
          return (
            evalMonth === currentMonth &&
            (!filters.district || evalItem.school.district === filters.district) &&
            (!filters.schoolCode || evalItem.school.schoolCode === filters.schoolCode)
          );
        })
        .forEach((evalItem) => {
          const schoolCode = evalItem.school.schoolCode;
          const role = evalItem.evaluationType.name.toLowerCase();
          if (!result[schoolCode]) {
            result[schoolCode] = {
              headteacher: { responses: {}, teacherCodes: new Set(), schoolName: evalItem.school.schoolName, sector: evalItem.school.sector },
              dos: { responses: {}, teacherCodes: new Set(), schoolName: evalItem.school.schoolName, sector: evalItem.school.sector },
              dod: { responses: {}, teacherCodes: new Set(), schoolName: evalItem.school.schoolName, sector: evalItem.school.sector },
            };
          }
          result[schoolCode][role].teacherCodes.add(evalItem.teacherCode);
          evalItem.responses.forEach((response, index) => {
            const question = `q${index + 1}`;
            result[schoolCode][role].responses[question] = result[schoolCode][role].responses[question] || [];
            result[schoolCode][role].responses[question].push(response.rating);
          });
        });

      // Average the ratings for each question
      Object.keys(result).forEach((schoolCode) => {
        Object.keys(result[schoolCode]).forEach((role) => {
          Object.keys(result[schoolCode][role].responses).forEach((question) => {
            const ratings = result[schoolCode][role].responses[question];
            result[schoolCode][role].responses[question] = ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;
          });
        });
      });

      return result;
    }
  }, [evaluations, filters.district, filters.schoolCode, filters.month]);

  // Calculate metrics
  const calculateMetrics = () => {
    if (!filters.district) {
      // Metrics for all Rwanda districts
      const metrics: {
        [district: string]: {
          [role: string]: {
            averageScore: number;
            percentage: number;
            responseCount: number;
            evaluationPercentage: number;
            teacherCount: number;
          };
        };
      } = {};
      let totalTeachers = 0;
      let teachersEvaluated = 0;

      Object.keys(aggregatedEvaluationData).forEach((district) => {
        const districtData = aggregatedEvaluationData[district];
        metrics[district] = {};

        ["headteacher", "dos", "dod"].forEach((role) => {
          const data = districtData[role];
          if (data && data.responses.length > 0) {
            const total = data.responses.reduce((sum, score) => sum + score, 0);
            const average = data.responses.length > 0 ? total / data.responses.length : 0;
            const teacherCount = data.teacherCodes.size;
            // Note: evaluationPercentage is not available without teacher stats
            metrics[district][role] = {
              averageScore: average,
              percentage: average * 20, // Convert to percentage (rating 0-5 to 0-100)
              responseCount: data.responses.length,
              evaluationPercentage: 0, // Not calculated for all districts
              teacherCount,
            };
          }
        });
      });

      // Role averages for footer
      const roleAverages = {
        headteacher: { total: 0, count: 0 },
        dos: { total: 0, count: 0 },
        dod: { total: 0, count: 0 },
      };

      Object.values(metrics).forEach((districtMetrics) => {
        ["headteacher", "dos", "dod"].forEach((role) => {
          if (districtMetrics[role] && districtMetrics[role].responseCount > 0) {
            roleAverages[role].total += districtMetrics[role].percentage;
            roleAverages[role].count += 1;
          }
        });
      });

      const districtMetrics = {
        averageScore: Object.values(metrics)
          .flatMap((district) => Object.values(district).map((role) => role.averageScore))
          .reduce((sum, score) => sum + (score || 0), 0) /
          Object.values(metrics).flatMap((district) => Object.keys(district)).length || 0,
        evaluationPercentage: 0, // Not calculated for all districts
        totalTeachers,
        teachersEvaluated,
        teachersNotEvaluated: totalTeachers - teachersEvaluated,
        roleAverages: {
          headteacher: roleAverages.headteacher.count > 0 ? roleAverages.headteacher.total / roleAverages.headteacher.count : 0,
          dos: roleAverages.dos.count > 0 ? roleAverages.dos.total / roleAverages.dos.count : 0,
          dod: roleAverages.dod.count > 0 ? roleAverages.dod.total / roleAverages.dod.count : 0,
        },
      };

      return { metrics, districtMetrics };
    } else {
      // Metrics for specific district or school
      const metrics: {
        [schoolCode: string]: {
          [role: string]: {
            totalScore: number;
            averageScore: number;
            maxPossible: number;
            percentage: number;
            responseCount: number;
            evaluationPercentage: number;
            teacherCount: number;
            distribution: { [score: number]: number };
            schoolName: string;
            sector: string;
          };
        };
      } = {};
      let totalTeachers = 0;
      let teachersEvaluated = 0;

      Object.keys(aggregatedEvaluationData).forEach((schoolCode) => {
        const schoolData = aggregatedEvaluationData[schoolCode];
        const schoolStats = teacherStats.find((stat) => stat.schoolCode === schoolCode);
        metrics[schoolCode] = {};
        totalTeachers += schoolStats?.totalTeachers || 0;
        teachersEvaluated += schoolStats?.teachersEvaluated || 0;

        ["headteacher", "dos", "dod"].forEach((role) => {
          const data = schoolData[role];
          if (data && Object.keys(data.responses).length > 0) {
            const scores = Object.values(data.responses) as number[];
            const total = scores.reduce((sum, score) => sum + score, 0);
            const average = scores.length > 0 ? total / scores.length : 0;
            const teacherCount = data.teacherCodes.size;
            const evaluationPercentage = schoolStats?.totalTeachers
              ? (teacherCount / schoolStats.totalTeachers) * 100
              : 0;

            metrics[schoolCode][role] = {
              totalScore: scores.length > 0 ? total : 0,
              averageScore: scores.length > 0 ? average : 0,
              maxPossible: scores.length * 5,
              percentage: scores.length > 0 ? (average / 5) * 100 : 0,
              responseCount: scores.length,
              evaluationPercentage: evaluationPercentage,
              teacherCount,
              distribution: scores.reduce((acc: { [score: number]: number }, score) => {
                acc[score] = (acc[score] || 0) + 1;
                return acc;
              }, {}),
              schoolName: data.schoolName,
              sector: data.sector,
            };
          }
        });
      });

      // Role averages for footer
      const roleAverages = {
        headteacher: { total: 0, count: 0 },
        dos: { total: 0, count: 0 },
        dod: { total: 0, count: 0 },
      };

      Object.values(metrics).forEach((schoolMetrics) => {
        ["headteacher", "dos", "dod"].forEach((role) => {
          if (schoolMetrics[role] && schoolMetrics[role].responseCount > 0) {
            roleAverages[role].total += schoolMetrics[role].percentage;
            roleAverages[role].count += 1;
          }
        });
      });

      const districtMetrics = {
        averageScore: Object.values(metrics)
          .flatMap((school) => Object.values(school).map((role) => role.averageScore))
          .reduce((sum, score) => sum + (score || 0), 0) /
          Object.values(metrics).flatMap((school) => Object.keys(school)).length || 0,
        evaluationPercentage: totalTeachers > 0 ? (teachersEvaluated / totalTeachers) * 100 : 0,
        totalTeachers,
        teachersEvaluated,
        teachersNotEvaluated: totalTeachers - teachersEvaluated,
        roleAverages: {
          headteacher: roleAverages.headteacher.count > 0 ? roleAverages.headteacher.total / roleAverages.headteacher.count : 0,
          dos: roleAverages.dos.count > 0 ? roleAverages.dos.total / roleAverages.dos.count : 0,
          dod: roleAverages.dod.count > 0 ? roleAverages.dod.total / roleAverages.dod.count : 0,
        },
      };

      return { metrics, districtMetrics };
    }
  };

  const { metrics, districtMetrics } = calculateMetrics();

  // Chart data (country-wide role averages for all districts)
  const overviewData = useMemo(() => {
    if (!filters.district) {
      return [
        { role: "Headteacher", percentage: districtMetrics.roleAverages.headteacher },
        { role: "DOS", percentage: districtMetrics.roleAverages.dos },
        { role: "DOD", percentage: districtMetrics.roleAverages.dod },
      ].filter((item) => item.percentage > 0);
    } else {
      const data: any[] = [];
      Object.keys(metrics).forEach((schoolCode) => {
        ["headteacher", "dos", "dod"].forEach((role) => {
          const roleData = metrics[schoolCode][role];
          if (roleData && roleData.responseCount > 0) {
            data.push({
              schoolCode,
              schoolName: roleData.schoolName,
              sector: roleData.sector,
              role: role.charAt(0).toUpperCase() + role.slice(1),
              score: roleData.averageScore.toFixed(1),
              percentage: roleData.percentage,
              evaluationPercentage: roleData.evaluationPercentage,
            });
          }
        });
      });
      return data.sort((a, b) => Number(b.evaluationPercentage) - Number(a.evaluationPercentage));
    }
  }, [metrics, filters.district, districtMetrics]);

  const pieChartData = useMemo(
    () =>
      overviewData.map((item, index) => ({
        name: item.role,
        value: item.percentage,
        color: ["#3B82F6", "#10B981", "#8B5CF6"][index % 3],
      })),
    [overviewData]
  );

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: "Excellent", color: "bg-green-500", textColor: "text-green-700" };
    if (percentage >= 60) return { level: "Good", color: "bg-blue-500", textColor: "text-blue-700" };
    if (percentage >= 40) return { level: "Fair", color: "bg-yellow-500", textColor: "text-yellow-700" };
    return { level: "Needs Improvement", color: "bg-red-500", textColor: "text-red-700" };
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!filters.district) {
      const evaluationData = Object.keys(metrics).flatMap((district) =>
        ["headteacher", "dos", "dod"].map((role) => {
          const roleData = metrics[district][role];
          if (!roleData || roleData.responseCount === 0) return null;
          return {
            District: district,
            "Leader Role": role.charAt(0).toUpperCase() + role.slice(1),
            Month: new Date(`${filters.month}-01`).toLocaleString("default", { month: "long", year: "numeric" }),
            Score: roleData.percentage.toFixed(1),
          };
        }).filter(Boolean)
      );

      const worksheet = XLSX.utils.json_to_sheet(evaluationData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluations");
      XLSX.writeFile(workbook, `Evaluations_Rwanda_${filters.month}.xlsx`);
    } else {
      const evaluationData = Object.keys(metrics).flatMap((schoolCode) =>
        ["headteacher", "dos", "dod"].map((role) => {
          const roleData = metrics[schoolCode][role];
          if (!roleData || roleData.responseCount === 0) return null;
          return {
            District: filters.district,
            Sector: roleData.sector,
            School: roleData.schoolName,
            Role: role.charAt(0).toUpperCase() + role.slice(1),
            Score: roleData.percentage.toFixed(1),
            "Evaluated by": roleData.evaluationPercentage.toFixed(1),
            Date: `${filters.month}-01`,
          };
        }).filter(Boolean)
      ).sort((a, b) => Number(b["Evaluated by"]) - Number(a["Evaluated by"]));

      const teacherStatsData = teacherStats.map((stat) => ({
        District: filters.district,
        Sector: stat.sector,
        School: stat.schoolName,
        TotalTeachers: stat.totalTeachers,
        TeachersEvaluated: stat.teachersEvaluated,
        TeachersNotEvaluated: stat.teachersNotEvaluated,
        EvaluationPercentage: stat.totalTeachers > 0 ? ((stat.teachersEvaluated / stat.totalTeachers) * 100).toFixed(1) : 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(evaluationData);
      const teacherStatsSheet = XLSX.utils.json_to_sheet(teacherStatsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluations");
      XLSX.utils.book_append_sheet(workbook, teacherStatsSheet, "Teacher Stats");
      XLSX.writeFile(workbook, `Evaluations_${filters.district}_${filters.month}.xlsx`);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Leadership Evaluation Report - ${filters.district || "Rwanda"} - ${filters.month}`, 20, 20);

    if (!filters.district) {
      const evaluationData = Object.keys(metrics).flatMap((district) =>
        ["headteacher", "dos", "dod"].map((role) => {
          const roleData = metrics[district][role];
          if (!roleData || roleData.responseCount === 0) return null;
          return [
            district,
            role.charAt(0).toUpperCase() + role.slice(1),
            new Date(`${filters.month}-01`).toLocaleString("default", { month: "long", year: "numeric" }),
            roleData.percentage.toFixed(1),
          ];
        }).filter(Boolean)
      );

      autoTable(doc, {
        head: [["District", "Leader Role", "Month", "Score (%)"]],
        body: evaluationData,
        startY: 30,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 89, 152] },
      });
    } else {
      const evaluationData = Object.keys(metrics).flatMap((schoolCode) =>
        ["headteacher", "dos", "dod"].map((role) => {
          const roleData = metrics[schoolCode][role];
          if (!roleData || roleData.responseCount === 0) return null;
          return [
            filters.district,
            roleData.sector,
            roleData.schoolName,
            role.charAt(0).toUpperCase() + role.slice(1),
            roleData.percentage.toFixed(1),
            roleData.evaluationPercentage.toFixed(1),
            `${filters.month}-01`,
          ];
        }).filter(Boolean)
      ).sort((a, b) => Number(b[5]) - Number(a[5]));

      autoTable(doc, {
        head: [["District", "Sector", "School", "Role", "Score (%)", "Evaluated by (%)", "Date"]],
        body: evaluationData,
        startY: 30,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 89, 152] },
      });

      doc.addPage();
      doc.text("Teacher Evaluation Stats", 20, 20);
      const teacherStatsTable = teacherStats.map((stat) => [
        filters.district,
        stat.sector,
        stat.schoolName,
        stat.totalTeachers,
        stat.teachersEvaluated,
        stat.teachersNotEvaluated,
        stat.totalTeachers > 0 ? ((stat.teachersEvaluated / stat.totalTeachers) * 100).toFixed(1) : 0,
      ]);
      autoTable(doc, {
        head: [["District", "Sector", "School", "Total Teachers", "Teachers Evaluated", "Teachers Not Evaluated", "Evaluation %"]],
        body: teacherStatsTable,
        startY: 30,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 89, 152] },
      });
    }

    doc.save(`Evaluations_${filters.district || "Rwanda"}_${filters.month}.pdf`);
  };

  return (
    <div className="space-y-6 xl:px-12 xl:py-12 px-2">
      <div>
        <h2 className="text-2xl font-bold mb-4">Leaders Evaluation Dashboard</h2>
        <p className="text-gray-600">Monitor and evaluate school leaders across Rwanda.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Select
              value={filters.district}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  district: value === "all-districts" ? "" : value,
                  sector: "",
                  cell: "",
                  village: "",
                  schoolCode: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                <SelectItem value="all-districts">All Districts</SelectItem>
                {rwandaDistricts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sector}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  sector: value === "all-sectors" ? "" : value,
                  cell: "",
                  village: "",
                  schoolCode: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Sector" />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                <SelectItem value="all-sectors">All Sectors</SelectItem>
                {availableSectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.cell}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  cell: value === "all-cells" ? "" : value,
                  village: "",
                  schoolCode: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Cell" />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                <SelectItem value="all-cells">All Cells</SelectItem>
                {availableCells.map((cell) => (
                  <SelectItem key={cell} value={cell}>
                    {cell}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.village}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  village: value === "all-villages" ? "" : value,
                  schoolCode: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Village" />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                <SelectItem value="all-villages">All Villages</SelectItem>
                {availableVillages.map((village) => (
                  <SelectItem key={village} value={village}>
                    {village}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.schoolCode}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  schoolCode: value === "all-schools" ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select School" />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                <SelectItem value="all-schools">All Schools</SelectItem>
                {availableSchools.map((school) => (
                  <SelectItem key={school.schoolCode} value={school.schoolCode}>
                    {school.schoolName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.month}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, month: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                {Array.from({ length: 12 }, (_, i) => {
                  const year = new Date().getFullYear();
                  const month = String(i + 1).padStart(2, "0");
                  return (
                    <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                      {new Date(`${year}-${month}-01`).toLocaleString("default", { month: "long", year: "numeric" })}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading || loadingSchools ? (
        <Card>
          <CardContent className="flex justify-center items-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex-col md:flex-row flex items-start md:items-center justify-between gap-4 md:gap-12">
                <div>
                  <h1 className="text-2xl font-bold">{filters.district || "Rwanda"} Leadership Evaluation</h1>
                  <p className="opacity-90">
                    {filters.schoolCode && metrics[filters.schoolCode]?.headteacher?.schoolName
                      ? metrics[filters.schoolCode].headteacher.schoolName
                      : "All Schools"} Results - {new Date(`${filters.month}-01`).toLocaleString("default", { month: "long", year: "numeric" })}
                  </p>
                  {!filters.district ? (
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span>All Districts</span>
                      <span>•</span>
                      <span>{new Date(`${filters.month}-01`).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span>{filters.sector || "All Sectors"}</span>
                      <span>•</span>
                      <span>{metrics[Object.keys(metrics)[0]]?.headteacher?.sector || "N/A"}</span>
                      <span>•</span>
                      <span>{new Date(`${filters.month}-01`).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={exportToPDF} className="bg-white/20 hover:bg-white/30">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={exportToExcel} className="bg-white/20 hover:bg-white/30">
                    <Table className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {districtMetrics.averageScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-blue-700">Overall Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {Math.max(...overviewData.map((item) => item.percentage), 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-700">Highest Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filters.district && (
              <>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-purple-900">
                          {districtMetrics.evaluationPercentage.toFixed(0)}%
                        </div>
                        <div className="text-sm text-purple-700">Teacher Participation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold text-orange-900">
                          {districtMetrics.teachersEvaluated}
                        </div>
                        <div className="text-sm text-orange-700">Teachers Evaluated</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-900">
                          {districtMetrics.teachersNotEvaluated}
                        </div>
                        <div className="text-sm text-red-700">Teachers Not Evaluated</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-1 w-full xl:grid-cols-4 md:grid-cols-2 h-[36vh] md:h-[24vh] shadow-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="recommendations">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Leadership Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={overviewData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="role" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                        <Bar dataKey="percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Score" />
                        {filters.district && (
                          <Bar dataKey="evaluationPercentage" fill="#10B981" radius={[4, 4, 0, 0]} name="Evaluated by" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {overviewData.slice(0, 3).map((item) => {
                  const performance = getPerformanceLevel(item.percentage);
                  return (
                    <Card key={`${filters.district ? item.schoolCode : item.role}-${item.role}`} className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {item.percentage.toFixed(1)}%
                          </div>
                          <div className="text-lg font-semibold text-gray-700 mb-2">
                            {filters.district ? `${item.role} - ${item.schoolName}` : item.role}
                          </div>
                          <Badge className={`${performance.color} text-white`}>
                            {performance.level}
                          </Badge>
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${performance.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Score: {item.percentage.toFixed(0)}%
                            </div>
                            {filters.district && (
                              <div className="text-sm text-gray-600 mt-1">
                                Evaluated by: {item.evaluationPercentage}%
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {filters.district ? (
                  Object.keys(metrics).flatMap((schoolCode) =>
                    ["headteacher", "dos", "dod"].map((role) => {
                      const roleData = metrics[schoolCode][role];
                      if (!roleData || roleData.responseCount === 0) return null;
                      const roleLabels = {
                        headteacher: schools.find((s) => s.schoolCode === schoolCode)?.headTeacherName || "Headteacher",
                        dos: schools.find((s) => s.schoolCode === schoolCode)?.dosName || "Deputy Head (Studies)",
                        dod: schools.find((s) => s.schoolCode === schoolCode)?.dodName || "Deputy Head (Discipline)",
                      };
                      return (
                        <Card key={`${schoolCode}-${role}`} className="shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <CardTitle className="flex items-center justify-between">
                              <span>{roleLabels[role as keyof typeof roleLabels]} - {roleData.schoolName}</span>
                              <Badge variant="outline">
                                {roleData.averageScore.toFixed(2)}/5.0
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {roleData.totalScore}
                                </div>
                                <div className="text-sm text-gray-600">Total Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {roleData.averageScore.toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Average</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {roleData.responseCount}
                                </div>
                                <div className="text-sm text-gray-600">Questions</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                  {roleData.percentage.toFixed(0)}%
                                </div>
                                <div className="text-sm text-gray-600">Score %</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                  {roleData.evaluationPercentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">Evaluated by</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">Response Distribution:</h4>
                              {[0, 1, 2, 3, 4, 5].map((score) => (
                                <div key={score} className="flex items-center space-x-3">
                                  <span className="w-16 text-sm">{score} points:</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                      style={{
                                        width: `${((roleData.distribution[score] || 0) / roleData.responseCount) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-12 text-sm text-gray-600">
                                    {roleData.distribution[score] || 0}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )
                ) : (
                  Object.keys(metrics).flatMap((district) =>
                    ["headteacher", "dos", "dod"].map((role) => {
                      const roleData = metrics[district][role];
                      if (!roleData || roleData.responseCount === 0) return null;
                      return (
                        <Card key={`${district}-${role}`} className="shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <CardTitle className="flex items-center justify-between">
                              <span>{district} - {role.charAt(0).toUpperCase() + role.slice(1)}</span>
                              <Badge variant="outline">
                                {roleData.averageScore.toFixed(2)}/5.0
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {roleData.averageScore.toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Average Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {roleData.percentage.toFixed(0)}%
                                </div>
                                <div className="text-sm text-gray-600">Score %</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {roleData.responseCount}
                                </div>
                                <div className="text-sm text-gray-600">Responses</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Leadership Roles Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={overviewData} layout={filters.district ? "horizontal" : "vertical"}>
                      <CartesianGrid strokeDasharray="3 3" />
                      {filters.district ? (
                        <>
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="schoolName" type="category" width={150} />
                        </>
                      ) : (
                        <>
                          <XAxis dataKey="role" />
                          <YAxis type="number" domain={[0, 100]} />
                        </>
                      )}
                      <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                      <Bar dataKey="percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Score" />
                      {filters.district && (
                        <Bar dataKey="evaluationPercentage" fill="#10B981" radius={[4, 4, 0, 0]} name="Evaluated by" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Performance Benchmarks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {overviewData.map((item) => {
                      const performance = getPerformanceLevel(item.percentage);
                      return (
                        <div
                          key={`${filters.district ? item.schoolCode : item.role}-${item.role}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium">
                            {filters.district ? `${item.role} - ${item.schoolName}` : item.role}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">{item.percentage.toFixed(1)}%</span>
                            <Badge className={`${performance.color} text-white text-xs`}>
                              {performance.level}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Areas for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {overviewData
                        .sort((a, b) => a.percentage - b.percentage)
                        .map((item) => (
                          <div
                            key={`${filters.district ? item.schoolCode : item.role}-${item.role}`}
                            className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
                          >
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <div>
                              <div className="font-medium text-yellow-800">
                                {filters.district ? `${item.role} - ${item.schoolName}` : item.role}
                              </div>
                              <div className="text-sm text-yellow-700">
                                Current: {item.percentage.toFixed(0)}%
                                {filters.district && `, Evaluated by: ${item.evaluationPercentage}%`}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-green-800">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {overviewData
                        .filter((item) => item.percentage >= 70)
                        .map((item) => (
                          <div
                            key={`${filters.district ? item.schoolCode : item.role}-${item.role}`}
                            className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                          >
                            <Award className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium text-green-800">
                                {filters.district ? `${item.role} - ${item.schoolName}` : item.role}
                              </div>
                              <div className="text-sm text-green-700">
                                Strong performance at {item.percentage.toFixed(0)}%
                                {filters.district && `, Evaluated by: ${item.evaluationPercentage}%`}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="text-orange-800">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Professional Development</h4>
                        <p className="text-sm text-blue-700">
                          Focus on leadership training for roles with scores below 50%.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">Teacher Engagement</h4>
                        <p className="text-sm text-purple-700">
                          Increase teacher participation in evaluations to improve data reliability.
                        </p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2">Policy Review</h4>
                        <p className="text-sm text-indigo-700">
                          Review school policies based on feedback from low-scoring leaders.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leaders Evaluation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    {filters.district ? (
                      <tr className="bg-gray-100">
                        <th className="p-3 border border-gray-300 text-left font-semibold">Sector</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">School</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Role</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Status</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Score (%)</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Evaluated by (%)</th>
                      </tr>
                    ) : (
                      <tr className="bg-gray-100">
                        <th className="p-3 border border-gray-300 text-left font-semibold">District</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Leader Role</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Month</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Score (%)</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {filters.district ? (
                      overviewData.map((item) => {
                        const status = getPerformanceLevel(item.percentage).level;
                        return (
                          <tr key={`${item.schoolCode}-${item.role}`} className="hover:bg-gray-50">
                            <td className="p-3 border border-gray-300">{item.sector}</td>
                            <td className="p-3 border border-gray-300">{item.schoolName}</td>
                            <td className="p-3 border border-gray-300">{item.role}</td>
                            <td className="p-3 border border-gray-300">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  status === "Excellent"
                                    ? "bg-green-100 text-green-800"
                                    : status === "Good"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="p-3 border border-gray-300">{item.percentage.toFixed(1)}</td>
                            <td className="p-3 border border-gray-300">{item.evaluationPercentage}</td>
                          </tr>
                        );
                      })
                    ) : (
                      Object.keys(metrics).flatMap((district) =>
                        ["headteacher", "dos", "dod"].map((role) => {
                          const roleData = metrics[district][role];
                          if (!roleData || roleData.responseCount === 0) return null;
                          return (
                            <tr key={`${district}-${role}`} className="hover:bg-gray-50">
                              <td className="p-3 border border-gray-300">{district}</td>
                              <td className="p-3 border border-gray-300">
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </td>
                              <td className="p-3 border border-gray-300">
                                {new Date(`${filters.month}-01`).toLocaleString("default", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="p-3 border border-gray-300">{roleData.percentage.toFixed(1)}</td>
                            </tr>
                          );
                        })
                      ).filter(Boolean)
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      {filters.district ? (
                        <>
                          <td className="p-3 border border-gray-300">Average</td>
                          <td className="p-3 border border-gray-300"></td>
                          <td className="p-3 border border-gray-300"></td>
                          <td className="p-3 border border-gray-300"></td>
                          <td className="p-3 border border-gray-300">
                            {districtMetrics.roleAverages.headteacher.toFixed(1)}% (Headteacher)
                            <br />
                            {districtMetrics.roleAverages.dos.toFixed(1)}% (DOS)
                            <br />
                            {districtMetrics.roleAverages.dod.toFixed(1)}% (DOD)
                          </td>
                          <td className="p-3 border border-gray-300"></td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border border-gray-300">Average</td>
                          <td className="p-3 border border-gray-300"></td>
                          <td className="p-3 border border-gray-300"></td>
                          <td className="p-3 border border-gray-300">
                            {districtMetrics.roleAverages.headteacher.toFixed(1)}% (Headteacher)
                            <br />
                            {districtMetrics.roleAverages.dos.toFixed(1)}% (DOS)
                            <br />
                            {districtMetrics.roleAverages.dod.toFixed(1)}% (DOD)
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Stats Table (only when district is selected) */}
          {filters.district && (
            <Card>
              <CardHeader>
                <CardTitle>Teacher Participation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 border border-gray-300 text-left font-semibold">Sector</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">School</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Total Teachers</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Teachers Evaluated</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Teachers Not Evaluated</th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">Evaluation %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherStats.map((stat) => (
                        <tr key={stat.schoolCode} className="hover:bg-gray-50">
                          <td className="p-3 border border-gray-300">{stat.sector}</td>
                          <td className="p-3 border border-gray-300">{stat.schoolName}</td>
                          <td className="p-3 border border-gray-300">{stat.totalTeachers}</td>
                          <td className="p-3 border border-gray-300">{stat.teachersEvaluated}</td>
                          <td className="p-3 border border-gray-300">{stat.teachersNotEvaluated}</td>
                          <td className="p-3 border border-gray-300">
                            {stat.totalTeachers > 0 ? ((stat.teachersEvaluated / stat.totalTeachers) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-start gap-2 sm:gap-6">
            <Button onClick={exportToPDF} size="lg" className="bg-red-600 hover:bg-red-700">
              <Download className="h-4 w-4 mr-2" />
              Export PDF Report
            </Button>
            <Button onClick={exportToExcel} size="lg" className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export Excel Data
            </Button>
          </div>
        </>
      )}
    </div>
  );
}