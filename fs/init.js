load('api_aws.js');
load('api_config.js');
load('api_gpio.js');
load('api_shadow.js');
load('api_timer.js');
load('api_sys.js');
load('api_mqtt.js');
load('api_events.js');
load("api_esp32.js");
load('api_esp32_touchpad.js');



/*load("api_timer.js");
load("api_esp32.js");
load('api_esp32_touchpad.js'); */

// Touch sensors are numbered from 0 to 9.
// For convenience, TouchPad.GPIO map translates from GPIO number to sensor number.
let state = {on: false}; 
let ts = TouchPad.GPIO[15];

TouchPad.init();
TouchPad.setVoltage(TouchPad.HVOLT_2V4, TouchPad.LVOLT_0V8, TouchPad.HVOLT_ATTEN_1V5);
TouchPad.config(ts, 0);
GPIO.set_mode(2, GPIO.MODE_OUTPUT);

Timer.set(5000, Timer.REPEAT, function() {
  //let tv = TouchPad.read(ts);
  let h = ESP32.hall();
  let temp = ESP32.temp();
  /*if(tv < 3000) {
    state.on = true;
    GPIO.write(2, state.on)
  } else {
    state.on = false;
    GPIO.write(2, state.on)
  } */
  reportState() 
  publishData(temp, h);
}, null);

let reportState = function() {
  Shadow.update(0, state);
};


/* Set up Shadow handler to synchronise device state with the shadow state */
Shadow.addHandler(function(event, obj) {
  if (event === 'UPDATE_DELTA') {
    print('GOT DELTA:', JSON.stringify(obj));
    for (let key in obj) {  
      if (key === 'on') {   
        state.on = obj.on;  
        GPIO.write(2, state.on)
      } else if (key === 'reboot') {
        state.reboot = obj.reboot;      
        Timer.set(750, 0, function() {  
          Sys.reboot(500);             
        }, null);
      }
    }
    reportState();
  }
});

function publishData(tem, mag){
  let topic = '/sensor/' + Cfg.get('device.id') + '/events';
  let message = JSON.stringify({
    sensor_id: Cfg.get('device.id'),
    total_ram: Sys.total_ram(),
    free_ram: Sys.free_ram(),
    ambient_temperature: tem,
    magnet: mag,
    timestamp: (Timer.now() * 5000) | 0
  });
  let ok = MQTT.pub(topic, message, 0) ? true : false;
  print('Published:', ok, 'topic:', topic, ', message:', message);
}


