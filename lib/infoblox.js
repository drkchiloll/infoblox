//Load Node Modules
var Promise = require('bluebird'),
    request = require('request');

/**
  * InfoBlox Constructor
  * @param {Object} config
  * @param {String} config.wapiIp (Ip Address of Infoblox Server)
  * @param {String} config.wapiVersion = 2.1
  */
function infoblox(config) {
  this.url = 'https://'+config.ip+'/wapi/v'+config.apiVersion+'/';

  this.reqOptions = {
    uri       : String,
    method    : String,
    strictSSL : false,
    json      : Object,
    auth      : Object,
    headers   : {
      'Content-Type':'application/json',
      'Accept':'application/json'
    }
  };
}

infoblox.prototype._req = function(path, data) {
  var reqData = '';
  this.reqOptions['uri'] = this.url + path;
  this.reqOptions['method'] = data.method;
  this.reqOptions['json'] = data.json;
  var options = this.reqOptions;
  return new Promise(function(resolve, reject) {
    request(options, function(err, res, body) {
      if (err) reject(err);
      if(path === 'grid') {
        //Return response object when performing .login()
        resolve(res);
      } else {
        resolve(body);
      }
    });
  })
};

infoblox.prototype.login = function(user, pwd) {
  var client = this;
  client.reqOptions['auth'] = {
    user : user || creds.user,
    pass : pwd || creds.password
  };
  return client._req('grid', {
    method:'GET'
  }).then(function(res) {
    try {
      var resBody = JSON.parse(res.body);
      client.grid = resBody[0]._ref;
      client.reqOptions.headers['Cookie'] = res.headers['set-cookie'];
      delete client.reqOptions.auth;
      return true;
    } catch(err) {
      return false;
    }
  });
};

infoblox.prototype.logout = function() {
  return this._req('logout', { method : 'POST' });
};

infoblox.prototype.reqServiceStatus = function(opts) {
  var client = this;
  var grid = client.grid;
  var fn = '?_function=requestrestartservicestatus';
  return client._req(grid + fn, {
    method : 'POST',
    json : { 'service_option' : opts.toUpperCase()}
  });
};

infoblox.prototype.restartServices = function() {
  var client = this;
  var grid = client.grid;
  var fn = '?_function=restartservices';
  return client._req(grid + fn, {
    method : 'POST',
    json : {
      'member_order' : 'SIMULTANEOUSLY',
      'service_option' : 'ALL'
    }
  });
};

infoblox.prototype.getNetwork = function(subnet) {
  let query = 'network?network='+subnet+'&_return_fields%2B=extattrs';
  var client = this;
  return client._req(query, { method : 'GET' });
};

infoblox.prototype.getNetworkFromIp = function(ip) {
  var client = this;
  return client.getHost(ip).then(function(data) {
    return client.getNetwork(JSON.parse(data.body)[0].network);
  })
};

infoblox.prototype.getNetworkByAttr = function(vlan) {
  return this._req('network?_return_fields%2B=extattrs&*VLAN=' + vlan, {
    method : 'GET'
  });
};

infoblox.prototype.getIpsFromSubnet = function(subnet) {
  let query = 'ipv4address?network='+ subnet + '&_max_results=10000';
  return this._req(query, { method : 'GET' });
};

infoblox.prototype.getContainer = function(container) {
  var client = this;
  return client._req('networkcontainer?network=' + container, {
    method : 'GET'
  });
};

infoblox.prototype.getNetworksFromContainer = function(container) {
  let query = 'network?network_container='+ container +
    '&_return_fields%2B=extattrs';
  return this._req(query, {
    method : 'GET'
  });
};

infoblox.prototype._containersRecursion = function(container) {
  return this._req('networkcontainer?network_container='+ container, {
    method : 'GET'
  }).then(res => {
    let containers = JSON.parse(res);
    return Promise.each(containers, ({ network }) => {
      this.containers.push(network);
      return this._containersRecursion(network);
    });
  });
};

infoblox.prototype.getContainersFromContainer = function(container) {
  if(this.containers.length > 0) this.containers = [];
  return this._containersRecursion(container).then(() => {
    return this.containers;
  });
};

infoblox.prototype.getNext = function(netId, num) {
  return this._req(netId +'?_function=next_available_ip', {
    json : { num : num },
    method : 'POST'
  }).then(function(data) {
    if(data && data.text) {
      return data.text;
    }
    return data.ips;
  })
};

infoblox.prototype.getNextIps = function(num, refId, subnet) {
  var client = this;
  if (subnet) {
    return client.getNetwork(subnet).then(function(data) {
      return JSON.parse(data)[0]['_ref'];
    }).then(function(ref) {
      return client.getNext(ref, num);
    });
  } else {
    return client.getNext(refId, num).then(function(data) {
      return data.ips;
    });
  }
};

infoblox.prototype.getNextSubnets = function({netId, cidr, num}) {
  return this._req(`${netId}?_function=next_available_network`, {
    json: { num, cidr },
    method: 'POST'
  }).then(data => {
    if(data && data.text) return Promise.reject(data.text);
    return data;
  })
}

infoblox.prototype.getHost = function(ip) {
  return this._req('ipv4address?ip_address='+ ip, {
    method : 'GET'
  });
};

infoblox.prototype.getDomain = function() {
  return this._req('zone_auth', {
    method : 'GET'
  }).then(function(data) {
    var zones = JSON.parse(data);
    return Promise.filter(zones, function(zone) {
      //We don't want Numeric Domain Names
      return !parseInt(zone.fqdn.substring(0,1));
    //MAP and Return New Array - Numeric Domains/Zones
    }).map(function(zone) {
      return zone.fqdn;
    })
  })
};

infoblox.prototype.getAdminGroup = function() {
  return this._req('admingroup', {
    method : 'GET'
  });
};

/**
 * @param {Object} permission - Properties to assign perms to objects
 * @param {String} permission.group - Admin Group Name
 * @param {String} permission.permission - READ | WRITE | DENY
 * @param {String} permission.object - _REFID of Container/Network
 */
infoblox.prototype.addPermission = function(permission) {
  return this._req('permission', {
    method : 'POST',
    json : permission
  });
};

infoblox.prototype.getMemberServers = function() {
  return this._req('member:dns', {
    method: 'GET'
  }).then(function(hosts) {

    return JSON.parse(hosts).map(function(host) {
      return {
        hostname: host['host_name'],
        ip: host['ipv4addr']
      };
    })
  })
}

//Generic Methods You Can Use if You Know the API
infoblox.prototype.list = function(path) {
  return this._req(path, {method : 'GET'});
};
infoblox.prototype.create = function(path, data) {
  var cfg = {};
  cfg = {method : 'POST', json : data};
  return this._req(path, cfg);
};
infoblox.prototype.update = function(path, data) {
  var cfg = {};
  cfg = { method: 'PUT', json: data };
  return this._req(path, cfg);
};
infoblox.prototype.delete = function(id) {
  return this._req(id, {method : 'DELETE'});
};
module.exports = infoblox;
