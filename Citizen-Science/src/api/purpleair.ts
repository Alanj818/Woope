import { fetchAPI } from "./fetch";

export type PurpleAirSensor = {
  sensor_id: number;
  source_id: string;
  name: string;
  received_at: string;
  latitude_deg: number | null;
  longitude_deg: number | null;
  temperature_c: number | null;
  humidity_pct: number | null;
  pressure_mb: number | null;
  pm1_0: number | null;
  pm2_5_atm: number | null;
  pm2_5_cf1: number | null;
  pm10_0: number | null;
  voc: number | null;
};

export const getAllPurpleAirDevices = async (
  setUserToken?: (token: string | null) => void
) => {
  return fetchAPI("/purpleair/devices", "GET", null, setUserToken);
};

export const getPurpleAirDevice = async (
  sensorId: number,
  setUserToken?: (token: string | null) => void
) => {
  return fetchAPI(`/purpleair/devices/${sensorId}`, "GET", null, setUserToken);
};