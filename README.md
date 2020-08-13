# Express Mqtt

```js
const mqtt = require('mqtt');
const expressMqtt = require('@sansitech/express-mqtt');

const client  = mqtt.connect('mqtt://test.mosquitto.org')
 
client.on('connect', function () {
  client.subscribe('test/hello', function (err) {
    if (!err) {
      client.publish('test/hello', 'Hello mqtt')
    }
  })
});


const app = expressMqtt(client);
// use it as express, support 
app.get('test/hello',(req,next)=>{
  console.log(`url:${req.url}`);
  req.ok = 'ok';
  next();
},(req)=>{
  console.log(`ok: ${req.ok}`)
});

```