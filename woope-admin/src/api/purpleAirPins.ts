import { fetchAPI } from "./fetch";

// Fetch all PurpleAir pins
export const getPurpleAirPins = async () => {
  return fetchAPI("/purpleair/pins");
};

// Create a new PurpleAir pin
export const createPurpleAirPin = async (
  name: string,
  purple_air_sensor_id: string
) => {
  return fetchAPI("/purpleair/pins", "POST", {
    name,
    purpleAirSensorId: purple_air_sensor_id,
  });
};

// Update an existing PurpleAir pin
export const updatePurpleAirPin = async (
  id: number,
  name: string,
  purple_air_sensor_id: string
) => {
  return fetchAPI(`/purpleair/pins/${id}`, "PUT", {
    name,
    purpleAirSensorId: purple_air_sensor_id,
  });
};

// Delete a PurpleAir pin
export const deletePurpleAirPin = async (id: number) => {
  return fetchAPI(`/purpleair/pins/${id}`, "DELETE");
};
