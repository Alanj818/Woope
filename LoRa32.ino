#include <Arduino.h>
#include "RadioConfig.h"


#define RX_PIN 47
#define PMS_BAUD_RATE 9600

HardwareSerial PMS(2);

struct PMSData {
  uint16_t pm1_atm;
  uint16_t pm25_atm;
  uint16_t pm10_atm;
  bool     valid;
  uint32_t lastUpdateMs;
};

// ------------ Helpers ------------
static inline uint16_t u16(uint8_t hi, uint8_t lo) {
  return (uint16_t(hi) << 8) | lo;
}

// ------------ PMS parser (state machine) ------------
bool pollPMSAndUpdate(PMSData &out) {
  static uint8_t frame[32];
  static uint8_t idx = 0;
  static uint8_t state = 0; // 0=want 0x42, 1=want 0x4D, 2=collect to 32

  while (PMS.available() > 0) {
    int r = PMS.read();
    if (r < 0) break;
    uint8_t b = (uint8_t)r;

    if (state == 0) {
      if (b == 0x42) {
        frame[0] = 0x42;
        state = 1;
      }
    } 
    else if (state == 1) {
      if (b == 0x4D) {
        frame[1] = 0x4D;
        idx = 2;
        state = 2;
      } else {
        state = 0; // resync
      }
    } 
    else { // state == 2
      frame[idx++] = b;

      if (idx == 32) {
        // Validate payload length (0x001C)
        if (u16(frame[2], frame[3]) != 0x001C) {
          state = 0;
          return false;
        }

        // Checksum: sum bytes 0..29
        uint16_t sum = 0;
        for (int i = 0; i < 30; i++) sum += frame[i];
        uint16_t chk = u16(frame[30], frame[31]);

        state = 0; // reset for next frame

        if (sum != chk) return false;

        // Atmospheric values
        out.pm1_atm  = u16(frame[10], frame[11]);
        out.pm25_atm = u16(frame[12], frame[13]);
        out.pm10_atm = u16(frame[14], frame[15]);

        out.valid = true;
        out.lastUpdateMs = millis();
        return true;
      }
    }
  }
  return false;
}

void setup() {
  //Initialize Serial Communication
  Serial.begin(115200);
  while(!Serial); 
  delay(300);

  //Initialize PMS UART (RX only)
  PMS.begin(PMS_BAUD_RATE, SERIAL_8N1, RX_PIN, -1);
  delay(300);
  Serial.println("ESP32 PMS parser ready.");

  //Initialize LoRaWAN Protocol//
  int16_t state = Radio.begin();
  debug(state != RADIOLIB_ERR_NONE, F("Initialise radio failed"), state, true);

  //OTAA Initialization and Parameters
  state = node.beginOTAA(appEUI, devEUI, nwkKey, appKey);
  debug(state != RADIOLIB_ERR_NONE, F("Initialise node failed"), state, true);

  //Activate OTAA
  state = node.activateOTAA();
  debug(state != RADIOLIB_LORAWAN_NEW_SESSION, F("Join failed"), state, true);
  delay(300); 

  Serial.println("LoRaWAN connection SET.\n"); 
  
}

void loop() {
  Serial.println("Sending data ...\n");
  PMSData latest;
  if(pollPMSAndUpdate(latest)){
  //16 bits of data, requires 2 Bytes, a highByte and a lowByte
  //We Use PM1, PM2.5, PM10, so 2 + 2 + 2 = 6 Bytes Total + Other Bytes Packages for TTN (Still need decoder)
  //Structure: highByte first, then lowByte
    uint8_t buffer[6];
    uint8_t downBuffer[16];
    size_t downBufferSize = 0;

    //EX: 1111 1111 0000 0000 (HighByte), 0000 0000 1111 1111 (lowByte), full 16bits looks like 1111 1111 1111 1111
    //bitWise operation OR, uint16 fullBits = (highByte << 8) | lowByte; 
    buffer[0] = highByte(latest.pm1_atm);
    buffer[1] = lowByte(latest.pm1_atm); 
    buffer[2] = highByte(latest.pm25_atm);
    buffer[3] = lowByte(latest.pm25_atm);
    buffer[4] = highByte(latest.pm10_atm); 
    buffer[5] = lowByte(latest.pm10_atm);

    //Sending the Payload via LoRaWAN
    //sendReceive(
    //   const uint8_t * 	dataUp,
    //   size_t 	lenUp,
    //   uint8_t 	fPort,
    //   uint8_t * 	dataDown,
    //   size_t * 	lenDown,
    // )
    int16_t state = node.sendReceive(buffer, sizeof(buffer),10, downBuffer, &downBufferSize);
    debug(state < RADIOLIB_ERR_NONE, F("Error in sendReceive"), state, false);

    //Checking if Downlink (Data From ADMIN WEBSITE) was received
    if(state > 0) {
      Serial.println(F("Received a downlink"));
      //Store it in a buffer here using node.sendReceive()
      //For documentation check here https://jgromes.github.io/RadioLib/class_lo_ra_w_a_n_node.html#a85cf006ffd97ece3b2d2974b715540cb
      for(size_t i = 0; i < downBufferSize; i++){
        Serial.print("BYTE: " + i);
        Serial.println(downBuffer[i], HEX);

      }
    } else {
      Serial.println(F("No downlink received"));
    }

  // if (pollPMSAndUpdate(latest)) {
  //   Serial.print("PM1=");
  //   Serial.print(latest.pm1_atm);
  //   Serial.print(" PM2.5=");
  //   Serial.print(latest.pm25_atm);
  //   Serial.print(" PM10=");
  //   Serial.println(latest.pm10_atm);
  // }
  }
  delay(500);
}