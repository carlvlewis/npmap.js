/* global document, L */
/* jshint camelcase: false */

'use strict';

var reqwest = require('reqwest'),
  util = require('../util/util');

var CartoDbLayer = L.TileLayer.extend({
  includes: [
    require('../mixin/grid')
  ],
  options: {
    errorTileUrl: L.Util.emptyImageUrl,
    format: 'png',
    subdomains: [
      0,
      1,
      2,
      3
    ]
  },
  _update: function() {
    if (this._urlTile) {
      L.TileLayer.prototype._update.call(this);
    }
  },
  initialize: function(options) {
    if (!L.Browser.retina || !options.detectRetina) {
      options.detectRetina = false;
    }

    L.Util.setOptions(this, options);
    util.strict(this.options.table, 'string');
    util.strict(this.options.user, 'string');
    L.TileLayer.prototype.initialize.call(this, undefined, this.options);
    this._build();
  },
  _build: function() {
    var me = this;

    this._urlApi = 'https://' + this.options.user + '.cartodb.com/api/v2/sql';
    reqwest({
      success: function(response) {
        var cartocss;

        me._hasInteractivity = false;
        me._interactivity = null;

        if (me.options.interactivity) {
          me._interactivity = me.options.interactivity.split(',');
        } else if (me.options.clickable !== false && response.fields) {
          me._interactivity = [];

          for (var field in response.fields) {
            if (response.fields[field].type !== 'geometry') {
              me._interactivity.push(field);
            }
          }
        }

        if (L.Util.isArray(me._interactivity) && me._interactivity.length) {
          me._hasInteractivity = true;
        }

        if (me.options.cartocss) {
          cartocss = me.options.cartocss;
        } else if (me.options.styles) {
          cartocss = me._stylesToCartoCss(me.options.styles);
        } else {
          cartocss = '#layer{line-color:#d39800;line-opacity:0.8;line-width:3;marker-fill:#d39800;marker-height:8;polygon-fill:#d39800;polygon-opacity:0.2;}';
        }

        me._cartocss = cartocss;
        me._sql = (me.options.sql || ('SELECT * FROM ' + me.options.table + ';'));

        reqwest({
          success: function(response) {
            var root = 'http://{s}.api.cartocdn.com/' + me.options.user + '/tiles/layergroup/' + response.layergroupid,
              template = '{z}/{x}/{y}';

            if (me._hasInteractivity && me._interactivity.length) {
              me._urlGrid = root + '/0/' + template + '.grid.json';
            }

            me._urlTile = root + '/' + template + '.png';
            me.setUrl(me._urlTile);
            me.redraw();
            return me;
          },
          type: 'jsonp',
          url: util.buildUrl('https://' + me.options.user + '.cartodb.com/tiles/layergroup', {
            config: JSON.stringify({
              layers: [{
                options: {
                  cartocss: me._cartocss,
                  cartocss_version: '2.1.0',
                  interactivity: me._interactivity,
                  sql: me._sql
                },
                stat_tag: 'API',
                type: 'cartodb'
              }],
              version: '1.0.0'
            })
          })
        });
      },
      type: 'jsonp',
      url: util.buildUrl(this._urlApi, {
        q: 'select * from ' + this.options.table + ' limit 1;'
      })
    });
  },
  _getGridData: function(latLng, callback) {
    var me = this;

    if (this._urlGrid) {
      this._getTileGrid(L.Util.template(this._urlGrid, L.Util.extend({
        s: this.options.subdomains[Math.floor(Math.random() * this.options.subdomains.length)]
      }, this._getTileCoords(latLng))), latLng, function(resultData, gridData) {
        if (resultData === 'loading') {
          callback({
            layer: me,
            results: 'loading'
          });
        } else {
          if (gridData) {
            callback({
              layer: me,
              results: [
                gridData
              ]
            });
          } else {
            callback({
              layer: me,
              results: null
            });
          }
        }
      });
    } else {
      callback({
        layer: me,
        results: null
      });
    }
  },
  _stylesToCartoCss: function(styles) {
    var cartoCss = {},
      match = {
        'fill': 'polygon-fill',
        'fill-opacity': 'polygon-opacity',
        'marker-color': 'marker-fill',
        'marker-size': function(value) {
          var size = 8;

          if (value === 'large') {
            size = 16;
          } else if (value === 'medium') {
            size = 12;
          }

          cartoCss['marker-height'] = size;
          cartoCss['marker-width'] = size;
        },
        'stroke': 'line-color',
        'stroke-opacity': 'line-opacity',
        'stroke-width': 'line-width'
      };

    for (var property in styles) {
      var value = styles[property];

      if (typeof match[property] === 'function') {
        match[property](value);
      } else if (typeof match[property] === 'string') {
        cartoCss[match[property]] = value;
      }
    }

    return '#layer' + JSON.stringify(cartoCss).replace(/"/g, '').replace(/,/g, ';');
  }
});

module.exports = function(config) {
  return new CartoDbLayer(config);
};
