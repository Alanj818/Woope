import { useEffect } from 'react';

const API_KEY = "CEFE17E9-BE6A-11F0-BDE5-4201AC1DC121";
//const SENSOR_ID = ["228143","128333","294503"];
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

export const fetchPurpleAirData = async () => {
  try { 
      //get pins from backend
      const pinsResponce = await fetch(BACKEND_URL);
      if(!pinsResponce.ok){
        throw new Error("Yeah the pins are not being found");
      }

      const pins = await pinsResponce.json();
      const allSensorData = [];

      //loop through pins in db
      for(const pin of pins){
        const sensorID = pin.purple_air_sensor_id;
        const url = `https://api.purpleair.com/v1/sensors/${sensorID}?fields=latitude,longitude,pm2.5_atm,temperature`;

        const responce = await fetch (url , {
          headers: {
            "X-API-Key" : API_KEY,
          },
        });

        const jsonData = await responce.json();

        allSensorData.push({
          ...jsonData,
          name: pin.name,
          pinId: pin.id

        });

      }
      
      return allSensorData;
     
      
    

  
  } catch (error) {
    console.error("Error fetching PurpleAir data:", error);
    throw error;

  }
};