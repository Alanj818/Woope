import { fetchAPI } from "./fetch";

// Fetch all PurpleAir sensors
export const getPurpleAirPins = async () => {
  return fetchAPI("/purpleair/sensors");
};

// Create a new PurpleAir sensor
export const createPurpleAirPin = async (
  name: string,
  purple_air_sensor_id: string
) => {
  return fetchAPI("/purpleair/sensors", "POST", {
    name,
    purpleAirSensorId: purple_air_sensor_id,
  });
};

// Update an existing PurpleAir sensor
export const updatePurpleAirPin = async (
  id: number,
  name: string,
  purple_air_sensor_id: string
) => {
  return fetchAPI(`/purpleair/sensors/${id}`, "PUT", {
    name,
    purpleAirSensorId: purple_air_sensor_id,
  });
};

// Delete a PurpleAir sensor
export const deletePurpleAirPin = async (id: number) => {
  return fetchAPI(`/purpleair/sensors/${id}`, "DELETE");
};