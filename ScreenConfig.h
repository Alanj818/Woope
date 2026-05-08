#pragma once

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "PMSData.h"

#define OLED_SDA 17
#define OLED_SCL 18
#define OLED_RST 21

extern Adafruit_SSD1306 display;
struct PMSData;

void screenBegin();
void drawHello();
void drawStatus(PMSData &latest, int32_t batPercent);