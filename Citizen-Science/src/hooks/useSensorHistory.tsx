import { useEffect, useState } from 'react';
import { getPurpleAirDeviceHistory, SensorHistory } from '../api/purpleair';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'partial'; daysCovered: number; history: SensorHistory }
  | { status: 'ready'; history: SensorHistory };

export function useSensorHistory(
  sensorId: number | null,
  setUserToken?: (token: string | null) => void
): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!sensorId) return;

    setState({ status: 'loading' });

    getPurpleAirDeviceHistory(sensorId, setUserToken)
      .then((body: SensorHistory) => {
        if (body.count === 0) {
          setState({ status: 'empty' });
        } else if (body.daysCovered < 30) {
          setState({ status: 'partial', daysCovered: body.daysCovered, history: body });
        } else {
          setState({ status: 'ready', history: body });
        }
      })
      .catch((err) => {
        console.log('sensor history error:', err?.message, err?.status);
        const message = typeof err?.message === 'string' ? err.message : JSON.stringify(err?.message);
        if (message.includes('Data not yet available')) {
          setState({ status: 'empty' });
        } else {
          setState({ status: 'error', message: 'Could not load sensor history' });
        }
      });
  }, [sensorId]);

  return state;
}