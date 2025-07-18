import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface LoginResponse {
  id: string;
  email: string;
  name: string;
  token: string;
  role:string;  
}

export interface SignupAuthDto {
  email: string;
  password: string;
  username: string;
  role: string;
}

export interface LoginAuthDto {
  email: string;
  password: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3001/auth/" }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginAuthDto>({
      query: (body) => ({
        url: "login",
        method: "POST",
        body,
      }),
    }),
    signup: builder.mutation<LoginResponse, SignupAuthDto>({
      query: (body) => ({
        url: "signup",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation } = authApi;
