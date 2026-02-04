
import { useEffect } from 'react';

const API_KEY = "CEFE17E9-BE6A-11F0-BDE5-4201AC1DC121";
const SENSOR_ID = ["228143","128333","294503"];

export const fetchPurpleAirData = async () => {
  try { 
      const allSensorData = [];
      for(let i =0;i < SENSOR_ID.length;i++) {
      const url = `https://api.purpleair.com/v1/sensors/${SENSOR_ID[i]}?fields=latitude,longitude,pm2.5,temperature`;
      
      const response = await fetch(url, {
        headers: {
          "X-API-Key": API_KEY
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      allSensorData.push(jsonData);
    }

    console.log('PurpleAir Data:', allSensorData);
    return allSensorData;
  } catch (error) {
    console.error('Error fetching PurpleAir data:', error);
    throw error;
  }
};