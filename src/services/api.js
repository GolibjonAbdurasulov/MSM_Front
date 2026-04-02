const BASE_URL = "http://localhost:5166/api";

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/Auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error("Login xato");
  }

  return await response.json();
}

export async function getTasks() {
  const response = await fetch(`${BASE_URL}/ServiceTask/getall`);
  return await response.json();
}

export async function createTask(task) {
  const response = await fetch(`${BASE_URL}/ServiceTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(task)
  });

  return await response.json();
}