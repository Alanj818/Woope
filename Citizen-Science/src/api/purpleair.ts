const API_KEY = "CEFE17E9-BE6A-11F0-BDE5-4201AC1DC121";

export const fetchPurpleAirData = async () => {
  try {
    const pinRes = await fetch(`${process.env.EXPO_PUBLIC_API_UR}/purpleair/pins`);
    const pins = await pinRes.json();

    const allSensorData = [];

    for (let pin of pins) {
      const url = `https://api.purpleair.com/v1/sensors/${pin.purple_air_sensor_id}?fields=latitude,longitude,pm2.5,temperature`;

      const response = await fetch(url, {
        headers: {
          "X-API-Key": API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      allSensorData.push(jsonData);
    }

    return allSensorData;

  } catch (error) {
    console.error("Error fetching PurpleAir data:", error);
    throw error;
  }
};
