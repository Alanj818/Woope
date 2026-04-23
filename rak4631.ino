/**
 * LoRaWAN_OTAA_ABP_fixed_US915_FSB2_with_ENV1906_GPS_GAS_payload_FIXED.ino
 *
 * Payload (11 bytes total):
 *  byte0  : flags
 *           bit0 = BME680 valid
 *           bit1 = GPS fix valid
 *  byte1-2: temperature int16 (°C * 100)
 *  byte3-4: humidity   uint16 (% * 100)
 *  byte5-6: latitude   int16 (deg * 100)  // 2 decimals
 *  byte7-8: longitude  int16 (deg * 100)  // 2 decimals
 *  byte9-10: gas resistance uint16 (ohms / 10)
 */

#include <Arduino.h>
#include <LoRaWan-RAK4630.h>
#include <SPI.h>

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME680.h>
#include <TinyGPSPlus.h>

#ifndef LED_BUILTIN
#define LED_BUILTIN 35
#endif

#ifndef LED_BUILTIN2
#define LED_BUILTIN2 36
#endif

// ---------- Sensors ----------
Adafruit_BME680 bme;      // ENV1906 on I2C
TinyGPSPlus gps;          // GPS parser
static const uint32_t GPS_BAUD = 9600;
static bool g_bme_ok = false;

// ---------- LoRaWAN Configuration ----------
bool doOTAA = true;

#define LORAWAN_DATERATE DR_0
#define LORAWAN_TX_POWER TX_POWER_5
#define JOINREQ_NBTRIALS 3

DeviceClass_t g_CurrentClass = CLASS_A;
LoRaMacRegion_t g_CurrentRegion = LORAMAC_REGION_US915;
lmh_confirm g_CurrentConfirm = LMH_UNCONFIRMED_MSG;
uint8_t gAppPort = LORAWAN_APP_PORT;

static lmh_param_t g_lora_param_init = {
  LORAWAN_ADR_ON,
  LORAWAN_DATERATE,
  LORAWAN_PUBLIC_NETWORK,
  JOINREQ_NBTRIALS,
  LORAWAN_TX_POWER,
  LORAWAN_DUTYCYCLE_OFF
};

// Forward declarations
static void lorawan_has_joined_handler(void);
static void lorawan_join_failed_handler(void);
static void lorawan_rx_handler(lmh_app_data_t *app_data);
static void lorawan_confirm_class_handler(DeviceClass_t Class);
static void send_lora_frame(void);

// LoRaWAN callbacks
static lmh_callback_t g_lora_callbacks = {
  BoardGetBatteryLevel,
  BoardGetUniqueId,
  BoardGetRandomSeed,
  lorawan_rx_handler,
  lorawan_has_joined_handler,
  lorawan_confirm_class_handler,
  lorawan_join_failed_handler
};

// ---------- OTAA keys (MSB order) ----------
uint8_t nodeDeviceEUI[8] = { 0xAC, 0x1F, 0x09, 0xFF, 0xFE, 0x21, 0x2B, 0x74 };
uint8_t nodeAppEUI[8]    = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }; // JoinEUI
uint8_t nodeAppKey[16]   = {
  0x95, 0x69, 0x3C, 0x12,
  0xAC, 0xB6, 0x63, 0xCF,
  0x17, 0xC8, 0x06, 0xEC,
  0x31, 0xBB, 0x93, 0x24
};

// ---------- ABP keys (unused when doOTAA=true) ----------
uint32_t nodeDevAddr = 0x260116F8;
uint8_t nodeNwsKey[16] = {0};
uint8_t nodeAppsKey[16] = {0};

// ---------- App payload ----------
#define LORAWAN_APP_DATA_BUFF_SIZE 64
#define LORAWAN_APP_INTERVAL 20000

static uint8_t m_lora_app_data_buffer[LORAWAN_APP_DATA_BUFF_SIZE];
static lmh_app_data_t m_lora_app_data = { m_lora_app_data_buffer, 0, 0, 0, 0 };

TimerEvent_t appTimer;
static uint32_t count = 0;
static uint32_t count_fail = 0;

// ---------- Payload helpers ----------
static void putI16(uint8_t* buf, int idx, int16_t v) {
  buf[idx + 0] = (uint8_t)((v >> 8) & 0xFF);
  buf[idx + 1] = (uint8_t)(v & 0xFF);
}
static void putU16(uint8_t* buf, int idx, uint16_t v) {
  buf[idx + 0] = (uint8_t)((v >> 8) & 0xFF);
  buf[idx + 1] = (uint8_t)(v & 0xFF);
}

// 11-byte payload with flags + gas
static uint8_t buildPayload11(uint8_t* out) {
  uint8_t flags = 0;

  float tempC = NAN, humPct = NAN;
  bool gpsFix = false;
  float lat = 0.0f, lon = 0.0f;
  float gasOhms = NAN;

  // ENV1906 (BME680)
  if (g_bme_ok && bme.performReading()) {
    tempC = bme.temperature;
    humPct = bme.humidity;
    gasOhms = bme.gas_resistance; // ohms
    flags |= (1 << 0); // BME valid
  }

  // GPS
  if (gps.location.isValid()) {
    gpsFix = true;
    lat = gps.location.lat();
    lon = gps.location.lng();
    flags |= (1 << 1); // GPS valid
  }

  int16_t t = 0;
  uint16_t h = 0;
  int16_t la = 0;
  int16_t lo = 0;
  uint16_t gas10 = 0; // ohms/10

  if (!isnan(tempC)) {
    float tv = tempC * 100.0f;
    if (tv > 32767) tv = 32767;
    if (tv < -32768) tv = -32768;
    t = (int16_t)lroundf(tv);
  }

  if (!isnan(humPct)) {
    float hv = humPct * 100.0f;
    if (hv < 0) hv = 0;
    if (hv > 65535) hv = 65535;
    h = (uint16_t)lroundf(hv);
  }

  if (gpsFix) {
    float lav = lat * 100.0f;
    float lov = lon * 100.0f;
    if (lav > 32767) lav = 32767;
    if (lav < -32768) lav = -32768;
    if (lov > 32767) lov = 32767;
    if (lov < -32768) lov = -32768;
    la = (int16_t)lroundf(lav);
    lo = (int16_t)lroundf(lov);
  }

  if (!isnan(gasOhms)) {
    // compress: store as ohms/10 to fit in uint16
    float gv = gasOhms / 10.0f;
    if (gv < 0) gv = 0;
    if (gv > 65535) gv = 65535;
    gas10 = (uint16_t)lroundf(gv);
  }

  out[0] = flags;
  putI16(out, 1, t);
  putU16(out, 3, h);
  putI16(out, 5, la);
  putI16(out, 7, lo);
  putU16(out, 9, gas10);

  return 11;
}

void tx_lora_periodic_handler(void);

uint32_t timers_init(void)
{
  TimerInit(&appTimer, tx_lora_periodic_handler);
  return 0;
}

void setup()
{
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  Serial.begin(115200);
  unsigned long start = millis();
  while (!Serial && (millis() - start < 5000)) delay(10);
  delay(2000);

  lora_rak4630_init();

  Serial.println("=====================================");
  Serial.println("Welcome to RAK4630 LoRaWAN (TTN US915 FSB2)!");
  Serial.println(doOTAA ? "Type: OTAA" : "Type: ABP");
  Serial.println("Region: US915");
  Serial.println("=====================================");

  // --- Power rail for WisBlock sensors (RAK19007) ---
  pinMode(WB_IO2, OUTPUT);
  digitalWrite(WB_IO2, HIGH);
  delay(100);

  // --- I2C + BME680 ---
  Wire.begin();
  if (!bme.begin(0x76)) {
    Serial.println("BME680 not found at 0x76 (try 0x77). Sending with BME flag=0.");
    g_bme_ok = false;
  } else {
    bme.setTemperatureOversampling(BME680_OS_8X);
    bme.setHumidityOversampling(BME680_OS_2X);
    bme.setPressureOversampling(BME680_OS_4X);
    bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
    bme.setGasHeater(320, 150);
    g_bme_ok = true;
    Serial.println("BME680 OK (temp/hum/gas)");
  }

  // --- GPS UART ---
  Serial1.begin(GPS_BAUD);
  Serial.println("GPS started (go outside for fix)");

  // Timer init
  uint32_t err_code = timers_init();
  if (err_code != 0) {
    Serial.printf("timers_init failed - %lu\n", (unsigned long)err_code);
    return;
  }

  // Set EUIs/Keys
  if (doOTAA) {
    lmh_setDevEui(nodeDeviceEUI);
    lmh_setAppEui(nodeAppEUI);
    lmh_setAppKey(nodeAppKey);
  } else {
    lmh_setNwkSKey(nodeNwsKey);
    lmh_setAppSKey(nodeAppsKey);
    lmh_setDevAddr(nodeDevAddr);
  }

  // Init LoRaWAN stack
  err_code = lmh_init(&g_lora_callbacks, g_lora_param_init, doOTAA, g_CurrentClass, g_CurrentRegion);
  if (err_code != 0) {
    Serial.printf("lmh_init failed - %lu\n", (unsigned long)err_code);
    return;
  }

  // US915 SubBand 2 for TTN FSB2
  lmh_setSubBandChannels(2);

  // Start Join procedure
  lmh_join();
}

// ✅ keep loop short so LoRaWAN timing isn’t starved
void loop()
{
  for (int n = 0; n < 32 && Serial1.available(); n++) {
    gps.encode((char)Serial1.read());
  }
  delay(5);
}

void lorawan_has_joined_handler(void)
{
  Serial.println("OTAA Mode, Network Joined!");

  lmh_error_status ret = lmh_class_request(g_CurrentClass);
  if (ret == LMH_SUCCESS)
  {
    delay(200);
    Serial.println("Sending first frame after join...");
    send_lora_frame();

    TimerSetValue(&appTimer, LORAWAN_APP_INTERVAL);
    TimerStart(&appTimer);
  }
}

static void lorawan_join_failed_handler(void)
{
  Serial.println("OTAA join failed!");
  Serial.println("Check DevEUI / JoinEUI / AppKey!");
  Serial.println("Check region/subband + gateway coverage!");
}

void lorawan_rx_handler(lmh_app_data_t *app_data)
{
  Serial.printf("LoRa Packet received on port %d, size:%d, rssi:%d, snr:%d\n",
                app_data->port, app_data->buffsize, app_data->rssi, app_data->snr);
}

void lorawan_confirm_class_handler(DeviceClass_t Class)
{
  Serial.printf("switch to class %c done\n", "ABC"[Class]);

  m_lora_app_data.buffsize = 0;
  m_lora_app_data.port = gAppPort;
  lmh_send(&m_lora_app_data, g_CurrentConfirm);
}

void send_lora_frame(void)
{
  if (lmh_join_status_get() != LMH_SET) {
    Serial.println("Not joined yet, skip uplink");
    return;
  }

  memset(m_lora_app_data.buffer, 0, LORAWAN_APP_DATA_BUFF_SIZE);
  m_lora_app_data.port = gAppPort;

  uint8_t len = buildPayload11(m_lora_app_data.buffer);
  m_lora_app_data.buffsize = len;

  Serial.print("Uplink payload (hex): ");
  for (int k = 0; k < len; k++) {
    if (m_lora_app_data.buffer[k] < 16) Serial.print("0");
    Serial.print(m_lora_app_data.buffer[k], HEX);
    Serial.print(" ");
  }
  Serial.println();

  lmh_error_status error = lmh_send(&m_lora_app_data, g_CurrentConfirm);
  if (error == LMH_SUCCESS) {
    count++;
    Serial.printf("lmh_send ok count %lu\n", (unsigned long)count);
  } else {
    count_fail++;
    Serial.printf("lmh_send fail count %lu\n", (unsigned long)count_fail);
  }
}

void tx_lora_periodic_handler(void)
{
  TimerSetValue(&appTimer, LORAWAN_APP_INTERVAL);
  TimerStart(&appTimer);
  Serial.println("Sending frame now...");
  send_lora_frame();
}