import { fetchAPI } from "./fetch";

export const getPollInterval = async () => {
  return fetchAPI("/settings/poll-interval");
};

export const updatePollInterval = async (pollIntervalMinutes: number) => {
  return fetchAPI("/settings/poll-interval", "PUT", {
    pollIntervalMinutes,
  });
};