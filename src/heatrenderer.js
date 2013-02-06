/*
 * Copyright (c) 2010 Bjoern Hoehrmann <http://bjoern.hoehrmann.de/>.
 * This module is licensed under the same terms as OpenLayers itself.
 *
 */

(function(root, factory) {
    if (typeof exports === "object") {
        module.exports = factory(require("openlayers"));
    } else if (typeof define === "function" && define.amd) {
        define(['openlayers'], factory);
    } else {
        root.HeatRenderer = factory(OpenLayers);
    }
}(this, function(OpenLayers) {

    OpenLayers.Renderer.HeatRenderer = OpenLayers.Class(OpenLayers.Renderer.Canvas, {

        initialize: function(containerID, options) {
            this.hitDetection = false;
            OpenLayers.Renderer.Canvas.prototype.initialize.apply(this, arguments);

            this.cache = {};
            this.defaultRadius = 20;
            this.defaultIntensity = 0.2;
            this.setGradientStops({
                0.00: 0xffffff00,
                0.10: 0x006837ff,
                0.20: 0x1a9850ff,
                0.30: 0x66bd63ff,
                0.30: 0xa6d96aff,
                0.40: 0xd9ef8bff,
                0.50: 0xfee08bff,
                0.60: 0xfdae61ff,
                0.70: 0xf46d43ff,
                0.80: 0xd73027ff,
                0.90: 0xa50026ff,
                0.99: 0xaa0000ff,
                1.00: 0x000000ff
            });
        },

        setGradientStops: function(stops) {
            var ctx = document.createElement('canvas').getContext('2d');
            var grd = ctx.createLinearGradient(0, 0, 256, 0);

            for (var i in stops) {
                grd.addColorStop(i, 'rgba(' +
                    ((stops[i] >> 24) & 0xFF) + ',' +
                    ((stops[i] >> 16) & 0xFF) + ',' +
                    ((stops[i] >>  8) & 0xFF) + ',' +
                    ((stops[i] >>  0) & 0xFF) + ')');
            }

            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 256, 1);
            this.gradient = ctx.getImageData(0, 0, 256, 1).data;
        },

        redraw: function() {
            if (!this.locked) {
                var someLoc = new OpenLayers.LonLat(0,0);
                var offsetX = this.map.getViewPortPxFromLonLat(someLoc).x -
                              this.map.getLayerPxFromLonLat(someLoc).x;
                var offsetY = this.map.getViewPortPxFromLonLat(someLoc).y -
                              this.map.getLayerPxFromLonLat(someLoc).y;

                var width = this.root.width;
                var height = this.root.height;

                var ctx = this.canvas;
                ctx.clearRect(0,0,width,height);

                for (var i in this.features) {

                    var src = this.features[i][0];
                    var rad = src.data.radius || this.defaultRadius;
                    var int = src.data.intensity || this.defaultIntensity;
                    var pos = this.map.getLayerPxFromLonLat(new OpenLayers.LonLat(
                          src.geometry.x, src.geometry.y));
                    var x = pos.x - rad + offsetX;
                    var y = pos.y - rad + offsetY;

                    if (!this.cache[int]) {
                        this.cache[int] = {};
                    }

                    if (!this.cache[int][rad]) {
                        var grd = ctx.createRadialGradient(rad, rad, 0, rad, rad, rad);
                        grd.addColorStop(0.0, 'rgba(0, 0, 0, ' + int + ')');
                        grd.addColorStop(1.0, 'transparent');
                        this.cache[int][rad] = grd;
                    }

                    ctx.fillStyle = this.cache[int][rad];
                    ctx.translate(x, y);
                    ctx.fillRect(0, 0, 2 * rad, 2 * rad);
                    ctx.translate(-x, -y);
                }

                var dat = ctx.getImageData(0, 0, width, height);
                var dim = width * height * 4;
                var pix = dat.data;

                for (var p = 0; p < dim; /* */) {
                    var a = pix[ p + 3 ] * 4;
                    pix[ p++ ] = this.gradient[ a++ ];
                    pix[ p++ ] = this.gradient[ a++ ];
                    pix[ p++ ] = this.gradient[ a++ ];
                    pix[ p++ ] = this.gradient[ a++ ];
                }

                ctx.putImageData(dat, 0, 0);
            }
        }
    });

}));