export const saveUser = (user: any) => {
  if (typeof window == "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
};
export const saveUserRole = (role: string) => {
  if (typeof window == "undefined"){
    console.warn("Cannot save user role, window is undefined");
    return;
  }else {
  localStorage.setItem("role", role);
  }
};

export const getUserRole = () => {
  if (typeof window == "undefined") return null;
  return localStorage.getItem("role");
};

export const getUser = () => {
  if (typeof window == "undefined") return null;
  const user = localStorage.getItem("user");
  return JSON.parse(user || "");
};
