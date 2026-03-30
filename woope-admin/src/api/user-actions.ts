import { fetchAPI } from "./fetch";

// Fetch all logs
export const getLogs = async () => {
  return fetchAPI("/logs");
};