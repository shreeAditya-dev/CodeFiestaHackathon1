import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const analyzeSowing = async (data) => {
  const response = await api.post("/sowing/analyze", data);

  return response.data;
};