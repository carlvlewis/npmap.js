/* global L */

'use strict';

var base64,
    corsLite = require('corslite'),
    json3 = require('json3'),
    lazyLoader;

//
base64=(function(){return{encode:function(a){var b="",c,d,f,g,h,e,k=0;do c=a.charCodeAt(k++),d=a.charCodeAt(k++),f=a.charCodeAt(k++),g=c>>2,c=(c&3)<<4|d>>4,h=(d&15)<<2|f>>6,e=f&63,isNaN(d)?h=e=64:isNaN(f)&&(e=64),b=b+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(g)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(e);while(k<a.length);return b},decode:function(a){var b="",c,d,f,g,h,e=0;a=a.replace(/[^A-Za-z0-9\+\/\=]/g,"");do c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++)),d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++)),g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++)),h="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++)),c=c<<2|d>>4,d=(d&15)<<4|g>>2,f=(g&3)<<6|h,b+=String.fromCharCode(c),64!=g&&(b+=String.fromCharCode(d)),64!=h&&(b+=String.fromCharCode(f));while(e<a.length);return b}}})();
// https://github.com/LukeTheDuke/Lazyloader
lazyLoader=function(i,j){function k(a){var a=a.toLowerCase(),b=a.indexOf("js"),a=a.indexOf("css");return-1==b&&-1==a?!1:b>a?"js":"css"}function m(a){var b=document.createElement("link");b.href=a;b.rel="stylesheet";b.type="text/css";b.onload=c;b.onreadystatechange=function(){("loaded"==this.readyState||"complete"==this.readyState)&&c()};document.getElementsByTagName("head")[0].appendChild(b)}function f(a){try{document.styleSheets[a].cssRules?c():document.styleSheets[a].rules&&document.styleSheets[a].rules.length?c():setTimeout(function(){f(a)},250)}catch(b){setTimeout(function(){f(a)},250)}}function c(){g--;0==g&&j&&j()}for(var g=0,d,l=document.styleSheets.length-1,h=0;h<i.length;h++)if(g++,d=i[h],"css"==k(d)&&(m(d),l++,!window.opera&&-1==navigator.userAgent.indexOf("MSIE")&&f(l)),"js"==k(d)){var e=document.createElement("script");e.type="text/javascript";e.src=d;e.onload=c;document.getElementsByTagName("head")[0].appendChild(e)}};

module.exports = {
  appendCssFile: function(urls, callback) {
    if (typeof urls === 'string') {
      urls = [
        urls
      ];
    }

    lazyLoader(urls, callback);
  },
  base64: base64,
  getChildElementsByClassName: function(parentNode, className) {
    var children = parentNode.childNodes,
        matches = [];

    function recurse(el) {
      var grandChildren = el.children;

      if (typeof el.className === 'string' && el.className.indexOf(className) !== -1) {
        var classNames = el.className.split(' ');

        for (var k = 0; k < classNames.length; k++) {
          if (classNames[k] === className) {
            matches.push(el);
            break;
          }
        }
      }

      for (var j = 0; j < grandChildren.length; j++) {
        recurse(grandChildren[j]);
      }
    }

    for (var i = 0; i < children.length; i++) {
      recurse(children[i]);
    }

    return matches;
  },
  getElementsByClassName: function(className) {
    var elArray = [],
        regex = new RegExp('(^|\\s)' + className + '(\\s|$)'),
        tmp = document.getElementsByTagName('*');
    
    for (var i = 0; i < tmp.length; i++) {
      if (regex.test(tmp[i].className)) {
        elArray.push(tmp[i]);
      }
    }

    return elArray;
  },
  log: function(_) {
    if (console && typeof console.error === 'function') {
      console.error(_);
    }
  },
  mapbox: {
    toLeafletBounds: function(_) {
      return new L.LatLngBounds([[_[1], _[0]], [_[3], _[2]]]);
    },
    url: {
      base: function(hash) {
        var me = this,
            urls = (function() {
              var endpoints = [
                'http://a.tiles.mapbox.com/v3/',
                'http://b.tiles.mapbox.com/v3/',
                'http://c.tiles.mapbox.com/v3/',
                'http://d.tiles.mapbox.com/v3/'
              ];

              if (me.isSsl()) {
                for (var i = 0; i < endpoints.length; i++) {
                  endpoints[i] = endpoints[i].replace('http', 'https');
                }
              }

              return endpoints;
            })();

        if (hash === undefined || typeof hash !== 'number') {
          return urls[0];
        } else {
          return urls[hash % urls.length];
        }
      },
      isSsl: function() {
        return 'https:' === document.location.protocol || false;
      },
      jsonify: function(url) {
        return url.replace(/\.(geo)?jsonp(?=$|\?)/, '.$1json');
      },
      secureFlag: function(url) {
        if (!this.isSsl()) {
          return url;
        } else if (url.match(/(\?|&)secure/)) {
          return url;
        } else if (url.indexOf('?') !== -1) {
          return url + '&secure';
        } else {
          return url + '?secure';
        }
      }
    }
  },
  request: function(url, callback) {
    this.strict(url, 'string');
    this.strict(callback, 'function');
    corsLite(url, function(error, response) {
      if (!error && response) {
        if (response.responseText[0] === 'g') {
          response = json3.parse(response.responseText.substring(5, response.responseText.length - 2));
        } else {
          response = json3.parse(response.responseText);
        }
      }

      callback(error, response);
    });
  },
  strict: function(_, type) {
    if (typeof _ !== type) {
      throw new Error('Invalid argument: ' + type + ' expected');
    }
  },
  strictInstance: function(_, klass, name) {
    if (!(_ instanceof klass)) {
      throw new Error('Invalid argument: ' + name + ' expected');
    }
  },
  strictOneOf: function(_, values) {
    if (values.indexOf(_) === -1) {
      throw new Error('Invalid argument: ' + _ + ' given, valid values are ' + values.join(', '));
    }
  }
};