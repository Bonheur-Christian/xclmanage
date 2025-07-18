"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Download, Calendar as CalendarIcon, X, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { fetchEvaluationsPaginated } from "@/lib/api/evaluationApi";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Evaluation {
  id: string;
  date: string;
  responses: Array<{ rating: number }>;
  evaluationType: { name: string };
  school: {
    id: string;
    schoolName: string;
    district: string;
    sector: string;
  };
}

interface SchoolGroup {
  schoolName: string;
  district: string;
  sector: string;
  evaluations: Evaluation[];
}

interface PaginatedResponse {
  data: Evaluation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function EvaluationsPage() {
  const router = useRouter();

  // State management
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    evaluationTypeName: "",
  });

  // Filter states
  const [district, setDistrict] = useState<string>("");
  const [sector, setSector] = useState<string>("");
  const [school, setSchool] = useState<string>("");
  const [evaluationType, setEvaluationType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce(async (filters: any) => {
      setLoading(true);
      try {
        const response: PaginatedResponse = await fetchEvaluationsPaginated(filters);
        setEvaluations(response.data);
        setPagination({
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: response.totalPages,
        });
        setError(null);
      } catch (err) {
        setError("Failed to load evaluations");
        setEvaluations([]);
        setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Effect to fetch data when filters or pagination change
  useEffect(() => {
    const filters = {
      district: district || undefined,
      sector: sector || undefined,
      schoolCode: school || undefined,
      evaluationTypeName: evaluationType || undefined,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
    debouncedFetch(filters);
  }, [district, sector, school, evaluationType, selectedDate, pagination.page, pagination.pageSize, debouncedFetch]);

  // Extract unique values for dropdowns
  const allDistricts = Array.from(new Set(evaluations.map((e) => e.school?.district).filter(Boolean)));
  const allSectors = Array.from(
    new Set(evaluations.filter((e) => !district || e.school?.district === district).map((e) => e.school?.sector).filter(Boolean))
  );
  const allSchools = Array.from(
    new Set(
      evaluations
        .filter((e) => (!district || e.school?.district === district) && (!sector || e.school?.sector === sector))
        .map((e) => e.school?.schoolName)
        .filter(Boolean)
    )
  );
  const allEvaluationTypes = Array.from(
    new Set(
      evaluations
        .filter((e) =>
          (!district || e.school?.district === district) &&
          (!sector || e.school?.sector === sector) &&
          (!school || e.school?.schoolName === school)
        )
        .map((e) => e.evaluationType?.name)
        .filter(Boolean)
    )
  );

  // Group evaluations by school
  const schoolMap: Record<string, SchoolGroup> = {};
  evaluations.forEach((evalItem) => {
    const schoolId = evalItem.school?.id;
    if (!schoolId) return;
    if (!schoolMap[schoolId]) {
      schoolMap[schoolId] = {
        schoolName: evalItem.school.schoolName,
        district: evalItem.school.district,
        sector: evalItem.school.sector,
        evaluations: [],
      };
    }
    schoolMap[schoolId].evaluations.push(evalItem);
  });

  console.log("all evaluations are: ", evaluations, "school map be :=", Object.values(schoolMap))

  // Helper functions
  function getEvaluationScore(evaluation: Evaluation): number | null {
    const ratings = evaluation.responses?.map((r) => r.rating).filter((r) => typeof r === "number");
    if (!ratings || ratings.length === 0) return null;
    const total = ratings.reduce((a, b) => a + b, 0);
    const max = ratings.length * 5;
    return Math.round((total / max) * 100);
  }

  function getSchoolAverage(evals: Evaluation[]): number | null {
    const scores = evals.map(getEvaluationScore).filter((s): s is number => typeof s === "number");
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Edit handlers
  const handleEditClick = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setEditFormData({
      date: evaluation.date.split("T")[0],
      evaluationTypeName: evaluation.evaluationType?.name || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvaluation) return;
    try {
      // Assuming an API call to update evaluation (not provided in original code)
      // await updateEvaluation({ id: editingEvaluation.id, data: editFormData }).unwrap();
      toast.success("Evaluation updated successfully");
      setIsEditDialogOpen(false);
      setEditingEvaluation(null);
      // Refetch data to update table
      debouncedFetch({
        district: district || undefined,
        sector: sector || undefined,
        schoolCode: school || undefined,
        evaluationTypeName: evaluationType || undefined,
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
    } catch (error) {
      console.error("Failed to update evaluation:", error);
      toast.error("Failed to update evaluation. Please try again.");
    }
  };

  // Export functions
  async function fetchExportData(limit?: number) {
    const filters = {
      district: district || undefined,
      sector: sector || undefined,
      schoolCode: school || undefined,
      evaluationTypeName: evaluationType || undefined,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      page: 1,
      pageSize: limit || 10000, // Large number for "Export All"
    };
    const response: PaginatedResponse = await fetchEvaluationsPaginated(filters);
    
    return response.data;
  }

  function organizeExportData(data: Evaluation[]) {
    const schoolMap: Record<string, SchoolGroup> = {};
    data.forEach((evalItem) => {
      const schoolId = evalItem.school?.id;
      if (!schoolId) return;
      if (!schoolMap[schoolId]) {
        schoolMap[schoolId] = {
          schoolName: evalItem.school.schoolName,
          district: evalItem.school.district,
          sector: evalItem.school.sector,
          evaluations: [],
        };
      }
      schoolMap[schoolId].evaluations.push(evalItem);
    });

    const exportData: any[] = [];
    Object.values(schoolMap).forEach((school) => {
      const evalTypes: Record<string, Evaluation[]> = {};
      school.evaluations.forEach((ev) => {
        const type = ev.evaluationType?.name || "Unknown";
        if (!evalTypes[type]) evalTypes[type] = [];
        evalTypes[type].push(ev);
      });
      Object.entries(evalTypes).forEach(([type, evals]) => {
        const scores = evals.map(getEvaluationScore).filter((s): s is number => typeof s === "number");
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        exportData.push({
          District: school.district,
          Sector: school.sector,
          School: school.schoolName,
          EvaluationType: type,
          Evaluations: evals.length,
          AverageScore: avg !== null ? `${avg}%` : "-",
          Date: evals[0]?.date ? evals[0].date.split("T")[0] : "-",
        });
      });
    });
    return exportData;
  }

  async function handleExportExcel(limit?: number) {
    const data = await fetchExportData(limit);
    const exportData = organizeExportData(data);
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Evaluations");
    XLSX.writeFile(wb, `evaluations_export_${limit || "all"}.xlsx`);
  }

  async function handleExportPDF(limit?: number) {
    const data = await fetchExportData(limit);
    const exportData = organizeExportData(data);
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["District", "Sector", "School", "Evaluation Type", "# Evaluations", "Average Score", "Date"]],
      body: exportData.map((row) => [row.District, row.Sector, row.School, row.EvaluationType, row.Evaluations, row.AverageScore, row.Date]),
    });
    doc.save(`evaluations_export_${limit || "all"}.pdf`);
  }

  // Clear all filters
  function clearAllFilters() {
    setDistrict("");
    setSector("");
    setSchool("");
    setEvaluationType("");
    setSelectedDate(undefined);
    setPagination({ ...pagination, page: 1 });
  }

  // Check if any filters are active
  const hasActiveFilters = district || sector || school || evaluationType || selectedDate;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPagination((prev) => ({ ...prev, pageSize: parseInt(newPageSize), page: 1 }));
  };

  return (
    <>
      <div className="space-y-6 lg:px-12 lg:py-12">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row">
            <div>
              <h2 className="text-2xl font-bold mb-2">Evaluations</h2>
              <p className="text-gray-600">
                Manage and track school leader evaluations.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-6 md:mt-0">
              <Button
                className="flex items-center gap-2"
                onClick={() => router.push("/dashboard/evaluate")}
              >
                <Plus size={16} />
                New Evaluation
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loading || Object.keys(schoolMap).length === 0}
                  >
                    <Download size={16} />
                    Export
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem onClick={() => handleExportExcel()}>
                    Export All (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(10)}>
                    Export First 10 (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(20)}>
                    Export First 20 (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF()}>
                    Export All (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF(10)}>
                    Export First 10 (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF(20)}>
                    Export First 20 (PDF)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">District</Label>
                <Select
                  value={district || "all"}
                  onValueChange={(v) => {
                    setDistrict(v === "all" ? "" : v);
                    setSector("");
                    setSchool("");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-50">
                    <SelectItem value="all">All Districts</SelectItem>
                    {allDistricts.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">Sector</Label>
                <Select
                  value={sector || "all"}
                  onValueChange={(v) => {
                    setSector(v === "all" ? "" : v);
                    setSchool("");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  disabled={!district}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {allSectors.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">School</Label>
                <Select
                  value={school || "all"}
                  onValueChange={(v) => {
                    setSchool(v === "all" ? "" : v);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  disabled={!sector && !district}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {allSchools.map((sc) => (
                      <SelectItem key={sc} value={sc}>
                        {sc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">Evaluation Type</Label>
                <Select
                  value={evaluationType || "all"}
                  onValueChange={(v) => {
                    setEvaluationType(v === "all" ? "" : v);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-50">
                    <SelectItem value="all">All Types</SelectItem>
                    {allEvaluationTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">Date</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-48 justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-50" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setIsDatePickerOpen(false);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      initialFocus
                    />
                    {selectedDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDate(undefined);
                            setIsDatePickerOpen(false);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                          }}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">Items per page</Label>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-50">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-transparent">Actions</Label>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear All
                  </Button>
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {district && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    District: {district}
                  </span>
                )}
                {sector && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Sector: {sector}
                  </span>
                )}
                {school && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    School: {school}
                  </span>
                )}
                {evaluationType && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    Type: {evaluationType}
                  </span>
                )}
                {selectedDate && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                    Date: {format(selectedDate, "MMM dd, yyyy")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Card */}

      
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <CardTitle>Evaluation Results</CardTitle>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    Loading...
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {error ? (
                <div className="p-6 text-center text-red-500">{error}</div>
              ) : (
                <>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 border border-gray-300 text-left font-semibold">
                          School
                        </th>
                        <th className="p-3 border border-gray-300 text-left font-semibold hidden sm:table-cell">
                          District
                        </th>
                        <th className="p-3 border border-gray-300 text-left font-semibold hidden md:table-cell">
                          # Evaluations
                        </th>
                        <th className="p-3 border border-gray-300 text-left font-semibold hidden md:table-cell">
                          Avg. Score (%)
                        </th>
                        <th className="p-3 border border-gray-300 text-left font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(schoolMap).length > 0 ? (
                        Object.values(schoolMap).map((school, idx) => (
                          <tr
                            key={school.schoolName + idx}
                            className="hover:bg-gray-50"
                          >
                            <td className="p-3 border border-gray-300">
                              <div>
                                <div className="font-medium">{school.schoolName}</div>
                                <div className="text-sm text-gray-500 sm:hidden">
                                  {school.district} • {school.evaluations.length} evaluations
                                </div>
                              </div>
                            </td>
                            <td className="p-3 border border-gray-300 hidden sm:table-cell">
                              {school.district}
                            </td>
                            <td className="p-3 border border-gray-300 hidden md:table-cell">
                              {school.evaluations.length}
                            </td>
                            <td className="p-3 border border-gray-300 hidden md:table-cell">
                              {getSchoolAverage(school.evaluations) !== null
                                ? `${getSchoolAverage(school.evaluations)}%`
                                : "-"}
                            </td>
                            <td className="p-3 border border-gray-300">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/evaluations/${school.evaluations[0]?.id}`)}
                                  disabled={!school.evaluations[0]?.id}
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(school.evaluations[0])}
                                  disabled={!school.evaluations[0]}
                                >
                                  <Edit size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : loading ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              Loading evaluations...
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            {hasActiveFilters
                              ? "No evaluations found matching your filters."
                              : "No evaluations found."
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {pagination.totalPages > 1 && (
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                          {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} evaluations
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          <ChevronLeft size={16} />
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          Next
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Evaluation Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Edit Evaluation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="date" className="text-gray-700">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => handleEditInputChange("date", e.target.value)}
                    required
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="evaluationTypeName" className="text-gray-700">Evaluation Type *</Label>
                  <Input
                    id="evaluationTypeName"
                    value={editFormData.evaluationTypeName}
                    onChange={(e) => handleEditInputChange("evaluationTypeName", e.target.value)}
                    placeholder="Enter evaluation type"
                    required
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingEvaluation(null);
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}