"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import {
  useGetSchoolsPaginatedQuery,
  useAddSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
} from "@/lib/api/schoolsApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SchoolIdentification } from "@/lib/api/schoolsApi";
import SchoolIdentificationForm from "@/components/SchoolIdentificationForm";
import { getUserRole } from "@/features/common/authUtil";

export default function SchoolsPage() {
  const role = getUserRole();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] =
    useState<SchoolIdentification | null>(null);
  const [editingSchool, setEditingSchool] =
    useState<SchoolIdentification | null>(null);
  const [formData, setFormData] = useState<Partial<SchoolIdentification>>({
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
    levels: { nursery: false, primary: false, secondary: false, tvet: false },
    category: "",
    dateOfEvaluation: new Date().toISOString(),
  });
  ` `;
  const {
    data: schoolData,
    isLoading,
    isError,
  } = useGetSchoolsPaginatedQuery({ page, limit });
  const [addSchool] = useAddSchoolMutation();
  const [updateSchool] = useUpdateSchoolMutation();
  const [deleteSchool] = useDeleteSchoolMutation();

  const schools = schoolData?.data || [];
  const total = schoolData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLevelChange = (level: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      levels: { ...prev.levels, [level]: checked },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      if (editingSchool?.id) {
        result = await updateSchool({
          id: editingSchool.id,
          data: formData,
        }).unwrap();
        toast.success("School updated successfully");
      } else {
        result = await addSchool(formData).unwrap();
        toast.success("School added successfully");
      }
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingSchool(null);
      setFormData({
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
        dateOfEvaluation: new Date().toISOString(),
      });
    } catch (error) {
      toast.error("Failed to save school. Please try again.");
    }
  };

  const handleEditClick = (school: SchoolIdentification) => {
    setEditingSchool(school);
    setFormData(school);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (school: SchoolIdentification) => {
    setSchoolToDelete(school);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (schoolToDelete?.id) {
      try {
        await deleteSchool(schoolToDelete.id).unwrap();
        toast.success(
          `School ${schoolToDelete.schoolName} deleted successfully`
        );
        setIsDeleteDialogOpen(false);
        setSchoolToDelete(null);
      } catch (error) {
        toast.error("Failed to delete school. Please try again.");
        toast.error(
          "May be you can't delete it, because it has been evaluated🤔🤔"
        );
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-6 px-12 py-12">
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row">
        <div>
          <h2 className="text-2xl font-bold mb-2">Schools Identified</h2>
          <p className="text-gray-600">
            Manage and track identified schools in the system.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 mt-6 md:mt-0 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-full sm:max-w-[500px] py-4 overflow-y-auto max-h-[90vh] bg-white mt-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Add New School
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 sm:p-6  ">
              <SchoolIdentificationForm
                onSubmit={async (data) => {
                  try {
                    await addSchool(data).unwrap();
                    toast.success("School added successfully");
                    setIsAddDialogOpen(false);
                  } catch (error) {
                    toast.error("Failed to add school. Please try again.");
                  }
                }}
                schoolData={null}
                editable={true}
                role={role}
                isAddOrEdit={true}
              />
            </div>
            <DialogFooter className="flex justify-end gap-2 p-4 border-t bg-white sticky bottom-0 z-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                form="school-identification-form"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // trigger form submit programmatically if needed
                  const form = document.querySelector("form");
                  form &&
                    form.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true })
                    );
                }}
              >
                Add School
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schools List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                Loading schools...
              </div>
            ) : isError ? (
              <div className="p-6 text-center text-red-500">
                Failed to load schools. Please try again.
              </div>
            ) : (
              <>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 border border-gray-300 text-left font-semibold">
                        School Name
                      </th>
                      <th className="p-3 border border-gray-300 text-left font-semibold hidden sm:table-cell">
                        District
                      </th>
                      <th className="p-3 border border-gray-300 text-left font-semibold hidden md:table-cell">
                        Sector
                      </th>
                      <th className="p-3 border border-gray-300 text-left font-semibold hidden md:table-cell">
                        Status
                      </th>
                      <th className="p-3 border border-gray-300 text-left font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools && schools.length > 0 ? (
                      schools.map((school: SchoolIdentification) => (
                        <tr key={school.id} className="hover:bg-gray-50">
                          <td className="p-3 border border-gray-300">
                            {school.schoolName}
                          </td>
                          <td className="p-3 border border-gray-300 hidden sm:table-cell">
                            {school.district}
                          </td>
                          <td className="p-3 border border-gray-300 hidden md:table-cell">
                            {school.sector}
                          </td>
                          <td className="p-3 border border-gray-300 hidden md:table-cell">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                school.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {school.status}
                            </span>
                          </td>
                          <td className="p-3 border border-gray-300">
                            <div className="flex gap-2">
                              <Dialog
                                open={
                                  isEditDialogOpen &&
                                  editingSchool?.id === school.id
                                }
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setIsEditDialogOpen(false);
                                    setEditingSchool(null);
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(school)}
                                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                  >
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-full max-w-full sm:max-w-[700px] py-4 mt-10 overflow-y-auto max-h-[90vh] bg-white">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold text-gray-900">
                                      Edit School
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="p-4 sm:p-6">
                                    <SchoolIdentificationForm
                                      onSubmit={async (data) => {
                                        try {
                                          await updateSchool({
                                            id: editingSchool?.id,
                                            data,
                                          }).unwrap();
                                          toast.success(
                                            "School updated successfully"
                                          );
                                          setIsEditDialogOpen(false);
                                          setEditingSchool(null);
                                        } catch (error) {
                                          toast.error(
                                            "Failed to update school. Please try again."
                                          );
                                        }
                                      }}
                                      schoolData={editingSchool}
                                      editable={true}
                                      role={role}
                                      isAddOrEdit={true}
                                    />
                                  </div>
                                  <DialogFooter className="flex justify-end gap-2 p-4 border-t bg-white sticky bottom-0 z-10">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setEditingSchool(null);
                                      }}
                                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      form="school-identification-form"
                                      type="submit"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={() => {
                                        // trigger form submit programmatically if needed
                                        const form =
                                          document.querySelector("form");
                                        form &&
                                          form.dispatchEvent(
                                            new Event("submit", {
                                              cancelable: true,
                                              bubbles: true,
                                            })
                                          );
                                      }}
                                    >
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              {/* <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                                View
                              </Button> */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(school)}
                                className="border-red-500 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-gray-500"
                        >
                          No schools found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, total)} of {total} schools
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Do you really want to delete {schoolToDelete?.schoolName}?
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSchoolToDelete(null);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
