const sensorHistory: Record<string, any[]> = {};
const computedAt: Record<string, Date> = {};

export function storeSensorHistory(sensorId: string, data: any[]) {
  sensorHistory[sensorId] = data;
  computedAt[sensorId] = new Date();
}

export function readSensorHistory(sensorId: string) {
  return sensorHistory[sensorId] ?? null;
}

export function getComputedAt(sensorId: string) {
  return computedAt[sensorId] ?? null;
}