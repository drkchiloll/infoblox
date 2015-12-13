# Infoblox API

This project implements a subset of the Infoblox API via REST API using NodeJS

#### Installation

```
npm install infoblox
```

#### Usage

Example:

```javascript
var Infoblox = require('infoblox');

var ipam = new Infoblox({
  ip: 'ip/hostname',
  apiVersion: '2.1'  
});

ipam.login('username', 'password').then(function(res) {
  if(res) {
    ipam.getAdminGroup().then(function(admGrps) {
      console.log(admGrps);
    })
  }
})
```
