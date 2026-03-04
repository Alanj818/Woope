import { fetchAPI } from "./fetch";

export type TtnDevice = {
  device_id: string;
  last_received_at: string;
  latitude: number;
  longitude: number;
  temperature_c: number | null;
  humidity_pct: number | null;
  gas_ohms: number | null;
  is_online: boolean;
};

export const getAllTtnDevices = async (
  setUserToken?: (token: string | null) => void
) => {
  return fetchAPI("/ttn/devices", "GET", null, setUserToken);
};