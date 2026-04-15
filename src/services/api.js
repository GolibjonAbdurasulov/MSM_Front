export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
  };
}

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/Auth/Login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Login xato");
  }

  const data = await response.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
  }

  return data;
}

export async function getTasks() {
  const response = await fetch(`${BASE_URL}/ServiceTask/getall`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Tasklarni olishda xato");
  }

  return await response.json();
}

export async function createTask(task) {
  const response = await fetch(`${BASE_URL}/ServiceTask`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error("Task yaratishda xato");
  }

  return await response.json();
}

export async function updateTask(id, task) {
  const response = await fetch(`${BASE_URL}/ServiceTask/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error("Task yangilashda xato");
  }

  return await response.json();
}

export async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/ServiceTask/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Task o‘chirishda xato");
  }

  return true;
}