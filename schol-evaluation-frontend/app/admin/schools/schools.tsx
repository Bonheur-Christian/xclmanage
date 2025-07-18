"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useGetSchoolsQuery } from "@/lib/api/schoolsApi";

// Placeholder data - replace with actual API calls


export default function SchoolsPage() {
  const { data: schools, isLoading, isError } = useGetSchoolsQuery();

  return (
    <div className="space-y-6 space-x-12 px-12 py-12">
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row ">
        <div>
          <h2 className="text-2xl font-bold mb-2">Schools Identified</h2>
          <p className="text-gray-600">
            Manage and track identified schools in the system.
          </p>
        </div>
        <Button className="flex items-center gap-2 md:p-2 p-0 mt-6 md:mt-0">
          <Plus size={16} className="text-xl text-blue-500 font-bold" />
          Add School
        </Button>
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
                    schools.map((school) => (
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
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">
                        No schools found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
