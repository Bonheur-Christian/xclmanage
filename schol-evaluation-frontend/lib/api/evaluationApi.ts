import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export enum EvaluationTypeName {
  Headteacher = "Headteacher",
  DOS = "DOS",
  DOD = "DOD",
}

export interface EvaluationType {
  id: string;
  name: EvaluationTypeName;
}

export interface CreateEvaluationTypeDto {
  name: EvaluationTypeName;
}

export interface Question {
  id: string;
  evaluationTypeName: EvaluationTypeName;
  text: string;
  type: "rating" | "text";
}

export interface CreateQuestionDto {
  evaluationTypeName: EvaluationTypeName;
  text: string;
  type: "rating" | "text";
}

export interface UpdateQuestionDto {
  text: string;
  type: "rating" | "text";
}

export interface ResponseDto {
  questionText: string;
  rating?: number;
  textResponse?: string;
}

export interface CreateEvaluationDto {
  schoolId: string;
  evaluationTypeName: EvaluationTypeName;
  teacherCode: string;
  responses: ResponseDto[];
}

export interface Evaluation {
  id: string;
  schoolId: string;
  evaluationTypeName: EvaluationTypeName;
  teacherCode: string;
  responses: ResponseDto[];
}

export async function fetchEvaluations(query: {
  district?: string;
  sector?: string;
  village?: string;
  schoolCode?: string;
  teacherCode?: string | null;
  evaluationTypeName?: string;
}) {
  const params = new URLSearchParams(query as any).toString();
  // console.log("query is: ", params);
  const res = await fetch(`http://localhost:3001/evaluations?${params}`);
  if (!res.ok) throw new Error("Failed to fetch evaluations");
  return res.json();
}


export async function fetchEvaluationsPaginated(query: {
  district?: string;
  sector?: string;
  village?: string;
  schoolCode?: string;
  teacherCode?: string | null;
  evaluationTypeName?: string;
}) {
  const params = new URLSearchParams(query as any).toString();
  // console.log("query is: ", params);
  const res = await fetch(`http://localhost:3001/evaluations/paginated?${params}`);
  if (!res.ok) throw new Error("Failed to fetch evaluations");
  return res.json();
}

export const evaluationApi = createApi({
  reducerPath: "evaluationApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3001/evaluations/" }),
  tagTypes: ["EvaluationType", "Question", "Evaluation"],
  endpoints: (builder) => ({
    // --- Existing endpoints ---
    // Evaluation Types
    getEvaluationTypes: builder.query<EvaluationType[], void>({
      query: () => "type",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "EvaluationType" as const,
                id,
              })),
              { type: "EvaluationType", id: "LIST" },
            ]
          : [{ type: "EvaluationType", id: "LIST" }],
    }),
    addEvaluationType: builder.mutation<
      EvaluationType,
      CreateEvaluationTypeDto
    >({
      query: (body) => ({
        url: "type",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "EvaluationType", id: "LIST" }],
    }),
    updateEvaluationType: builder.mutation<
      EvaluationType,
      { id: string; body: CreateEvaluationTypeDto }
    >({
      query: ({ id, body }) => ({
        url: `type/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "EvaluationType", id },
        { type: "EvaluationType", id: "LIST" },
      ],
    }),
    deleteEvaluationType: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `type/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "EvaluationType", id },
        { type: "EvaluationType", id: "LIST" },
      ],
    }),

    // Questions
    getQuestions: builder.query<Question[], EvaluationTypeName>({
      query: (evaluationTypeName) => `${evaluationTypeName}/questions`,
      providesTags: (result, error, evaluationTypeName) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Question" as const, id })),
              { type: "Question", id: `LIST-${evaluationTypeName}` },
            ]
          : [{ type: "Question", id: `LIST-${evaluationTypeName}` }],
    }),
    addQuestion: builder.mutation<Question, CreateQuestionDto>({
      query: (body) => ({
        url: `questions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, body) => [
        { type: "Question", id: `LIST-${body.evaluationTypeName}` },
      ],
    }),
    updateQuestion: builder.mutation<
      Question,
      { id: string; body: UpdateQuestionDto }
    >({
      query: ({ id, body }) => ({
        url: `questions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Question", id }],
    }),
    deleteQuestion: builder.mutation<
      { success: boolean },
      { id: string; evaluationTypeName: EvaluationTypeName }
    >({
      query: ({ id }) => ({
        url: `questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id, evaluationTypeName }) => [
        { type: "Question", id },
        { type: "Question", id: `LIST-${evaluationTypeName}` },
      ],
    }),
    // --- Evaluation CRUD endpoints ---
    createEvaluation: builder.mutation<Evaluation, CreateEvaluationDto>({
      query: (body) => ({
        url: ``, // POST /evaluations
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Evaluation", id: "LIST" }],
    }),
    getEvaluationsByType: builder.query<Evaluation[], EvaluationTypeName>({
      query: (type) => `${type}`,
      providesTags: (result, error, type) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Evaluation" as const, id })),
              { type: "Evaluation", id: `LIST-${type}` },
            ]
          : [{ type: "Evaluation", id: `LIST-${type}` }],
    }),
    getEvaluationsBySchool: builder.query<Evaluation[], string>({
      query: (schoolId) => `school/${schoolId}`,
      providesTags: (result, error, schoolId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Evaluation" as const, id })),
              { type: "Evaluation", id: `LIST-SCHOOL-${schoolId}` },
            ]
          : [{ type: "Evaluation", id: `LIST-SCHOOL-${schoolId}` }],
    }),
  }),
});

export const {
  useGetEvaluationTypesQuery,
  useAddEvaluationTypeMutation,
  useUpdateEvaluationTypeMutation,
  useDeleteEvaluationTypeMutation,
  useGetQuestionsQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useCreateEvaluationMutation,
  useGetEvaluationsByTypeQuery,
  useGetEvaluationsBySchoolQuery,
} = evaluationApi;
