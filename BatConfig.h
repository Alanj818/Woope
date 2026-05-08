
//Formula to get VBAT is: VBAT = 100 / (100+390) * VADC_IN1

//Naturally, VADC_IN1 = (VBAT * 100) / (100 + 390) 

float adcValue(uint16_t raw){
  return (raw * 3.3) / 4095.0;
}

float batValue(float adc){
  return adc * (490.0 / 100.0); 
}

int32_t batPercentage(float VBAT){



  if(VBAT >= 4.2) {
    return 100; 
  }
  if(VBAT <= 3.3){
    return 0; 
  }

  //split the percentage into 5 pieces. 0 - 20, 20 - 40, 40 - 60, 60 - 80, 80 - 100, so around .18v every step 
  if(VBAT > 4.02){
    return 100;
  }
  if(VBAT > 3.84){
    return 80;
  }
  if(VBAT > 3.66){
    return 60; 
  }
  if(VBAT > 3.48){
    return 40;
  }
  if(VBAT > 3.39){
    return 20;
  }
  if(VBAT > 3.345){
    return 10;
  }

  return 5;
}