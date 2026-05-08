#include "ScreenConfig.h"

Adafruit_SSD1306 display(128, 64, &Wire, OLED_RST);

void screenBegin() {
  pinMode(36, OUTPUT);       // Vext on Heltec V3
  digitalWrite(36, LOW);     // LOW = ON
  delay(100);

  pinMode(OLED_RST, OUTPUT);
  digitalWrite(OLED_RST, LOW);
  delay(20);
  digitalWrite(OLED_RST, HIGH);
  delay(20);

  Wire.begin(OLED_SDA, OLED_SCL);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
    return;
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("OLED OK");
  display.display();
}

void drawHello() {
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Hello world");
}

void drawStatus(PMSData &latest, int32_t batPercent) {
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Air Quality");

  display.setCursor(0, 12);
  display.print("PM1: ");
  display.println(latest.pm1_atm);

  display.setCursor(0, 24);
  display.print("PM2.5: ");
  display.println(latest.pm25_atm);

  display.setCursor(0, 36);
  display.print("PM10: ");
  display.println(latest.pm10_atm);

  display.setCursor(0, 52);
  display.print("BAT: ");
  display.print(batPercent);
  display.println("%");
}