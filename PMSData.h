struct PMSData {
  uint16_t pm1_atm;
  uint16_t pm25_atm;
  uint16_t pm10_atm;
  bool valid;
  uint32_t lastUpdateMs;
};