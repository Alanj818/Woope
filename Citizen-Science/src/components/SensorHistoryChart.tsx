import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSensorHistory } from '../hooks/useSensorHistory';

type Props = {
  sensorId: number;
  setUserToken?: (token: string | null) => void;
};

export function SensorHistoryChart({ sensorId, setUserToken }: Props) {
  const state = useSensorHistory(sensorId, setUserToken);

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" />
        <Text style={styles.hint}>Loading 30 day history...</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return <Text style={styles.error}>{state.message}</Text>;
  }

  if (state.status === 'empty') {
    return <Text style={styles.hint}>No history available for this sensor yet.</Text>;
  }

  const history = state.history;

  const makeChartData = (values: number[], hours: string[]) => {
    return values.map((value) => ({ value }));
  };

  const getDateLabels = (hours: string[]) => {
    if (hours.length === 0) return [];
    const indices = [
      0,
      Math.floor(hours.length / 4),
      Math.floor(hours.length / 2),
      Math.floor(hours.length * 3 / 4),
      hours.length - 1,
    ];
    return indices.map(i => {
      const d = new Date(hours[i]);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
  };

  const hours = history.data.map(d => d.hour);

  const pm25Data = makeChartData(
    history.data.map(d => parseFloat(d.pm25) || 0),
    hours
  );

  const tempData = makeChartData(
    history.data.map(d => parseFloat(d.temp_c) || 0),
    hours
  );

  const humidityData = makeChartData(
    history.data.map(d => parseFloat(d.humidity) || 0),
    hours
  );

  const dateLabels = getDateLabels(hours);

  const chartWidth = 300;
  const spacing = Math.floor(chartWidth / (history.data.length + 1));

  const commonProps = {
    width: chartWidth,
    height: 160,
    curved: true,
    hideDataPoints: true,
    yAxisTextStyle: { color: '#888', fontSize: 9 },
    xAxisLabelTextStyle: { color: '#888', fontSize: 9 },
    rulesType: 'solid' as const,
    rulesColor: '#f5f5f5',
    yAxisThickness: 0,
    xAxisThickness: 0,
    noOfSections: 4,
    scrollToEnd: false,
    spacing,
    initialSpacing: 0,
    scrollEnabled: false,
  };

  return (
    <View>
      {state.status === 'partial' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Showing {state.daysCovered} day{state.daysCovered !== 1 ? 's' : ''} of data — full 30 day history not yet available
          </Text>
        </View>
      )}

      <Text style={styles.label}>PM2.5 (μg/m³)</Text>
      <LineChart
        {...commonProps}
        data={pm25Data}
        color="#639922"
      />
      <View style={styles.dateRow}>
        {dateLabels.map((label, i) => (
          <Text key={i} style={styles.dateLabel}>{label}</Text>
        ))}
      </View>

      <Text style={styles.label}>Temperature (°F)</Text>
      <LineChart
        {...commonProps}
        data={tempData}
        color="#D85A30"
      />
      <View style={styles.dateRow}>
        {dateLabels.map((label, i) => (
          <Text key={i} style={styles.dateLabel}>{label}</Text>
        ))}
      </View>

      <Text style={styles.label}>Humidity (%)</Text>
      <LineChart
        {...commonProps}
        data={humidityData}
        color="#185FA5"
      />
      <View style={styles.dateRow}>
        {dateLabels.map((label, i) => (
          <Text key={i} style={styles.dateLabel}>{label}</Text>
        ))}
      </View>

      <Text style={styles.computedAt}>
        Last updated: {new Date(history.computedAt).toLocaleTimeString()}
      </Text>
      <Text style={styles.computedAt}>
        {history.count} readings · {history.daysCovered} days covered
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', padding: 20 },
  hint: { fontSize: 13, color: '#888', marginTop: 8, textAlign: 'center' },
  error: { fontSize: 13, color: '#E24B4A', textAlign: 'center', padding: 16 },
  label: { fontSize: 13, fontWeight: '500', marginLeft: 16, marginTop: 12, color: '#333' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 50, marginRight: 8, marginTop: 2, marginBottom: 8 },
  dateLabel: { fontSize: 9, color: '#888' },
  banner: { backgroundColor: '#FAEEDA', borderRadius: 8, padding: 10, margin: 12 },
  bannerText: { fontSize: 12, color: '#633806' },
});