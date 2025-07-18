import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface SchoolIdentification {
  id?: string;
  schoolName: string;
  schoolCode: string;
  teacherCode: string;
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
  dateOfEvaluation: string; // ISO date string (e.g., "2024-07-01")
}

export interface QueryType {
  page: number
  limit: number;
}

// Interface for paginated response
export interface PaginatedSchoolsResponse {
  data: SchoolIdentification[];
  total: number;
  page: number;
  limit: number;
}


export const schoolsApi = createApi({
  reducerPath: "schoolsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3001/" }),
  tagTypes: ["School"],
  endpoints: (builder) => ({
    // Get all schools
    getSchoolsPaginated: builder.query<PaginatedSchoolsResponse, QueryType>({
      query: ({page, limit}) =>`schools-identifications/paginated?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "School" as const, id })),
              { type: "School", id: "LIST" },
            ]
          : [{ type: "School", id: "LIST" }],
    }),
    getSchools: builder.query<SchoolIdentification[],void>({
      query: () => 'schools-identifications',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "School" as const, id })),
              { type: "School", id: "LIST" },
            ]
          : [{ type: "School", id: "LIST" }],
    }),
    // Get single school by id
    getSchool: builder.query<SchoolIdentification, string>({
      query: (id) => `schools-identifications/${id}`,
      providesTags: (result, error, id) => [{ type: "School", id }],
    }),
    // Add new school
    addSchool: builder.mutation<
      SchoolIdentification,
      Partial<SchoolIdentification>
    >({
      query: (body) => ({
        url: "schools-identifications",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "School", id: "LIST" }],
    }),
    // Update school by id
    updateSchool: builder.mutation<
      SchoolIdentification,
      { id: string; data: Partial<SchoolIdentification> }
    >({
      query: ({ id, data }) => ({
        url: `schools-identifications/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "School", id }],
    }),
    // Delete school by id
    deleteSchool: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `schools-identifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "School", id },
        { type: "School", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetSchoolsPaginatedQuery,
  useGetSchoolsQuery,
  useAddSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
} = schoolsApi;
