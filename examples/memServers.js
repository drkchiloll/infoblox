var Infoblox = require('../lib/infoblox'),
    config = require('./config');

var ipam = new Infoblox({
  ip: config.ip,
  apiVersion: config.apiVersion
});

ipam.login(config.user, config.password).then(() => {
  return;
}).then(() => {
  return ipam.getMemberServers();
}).then((members) => {
  console.log(members);
})
