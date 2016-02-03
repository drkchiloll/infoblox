var Infoblox = require('../lib/infoblox'),
    config = require('./config');

var ipam = new Infoblox({
  ip: config.ip,
  apiVersion: config.apiVersion
});

ipam.login(config.user, config.password).then(() => {
  return;
}).then(() => {
  return ipam.getAdminGroupDetails('admingroup/b25lLmFkbWluX2dyb3VwJC5JQl9IYWxjb21i:IB_Halcomb');
}).then((resp) => {
  console.log(JSON.parse(resp));
})
