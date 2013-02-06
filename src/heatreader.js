(function(root, factory) {
    if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else if (typeof define === "function" && define.amd) {
        define(['jquery'], factory);
    } else {
        root.HeatReader = factory(jQuery);
    }
}(this, function($) {

    /**
     * Creates an instance of HeatReader. A HeatReader reads a Solr response and
     * creates an array of features suitable for being rendered by a heatmap
     * renderer in OpenLayers.
     * 
     * @param {object} options An object of options. Supported options include:
     *                         radius - A number, or a callback that returns a
     *                             number, used to set the radius of each
     *                             feature. The context for a callback is a Solr
     *                             group object.
     *                         intensity - A number, or a callback that returns
     *                             a number, between 0 and 1 used to set the
     *                             intensity of each feature. The context for a
     *                             callback is a Solr group object.
     */
    function HeatReader(opts) {

        if (!(this instanceof HeatReader)) {
            return new HeatReader(opts);
        }

        var options = {};

        $.extend(options, opts);

        this.options = options;
        
    }

    var methods = {

        /**
         * Reads a Solr response and creates an array of features.
         *
         * Upon completion, this method should resolve the passed in deferred
         * with a context containing the array of features set as the value of a
         * "features" property.
         *
         * @public
         * @param  {object} dfd  jQuery deferred object
         * @param  {object} data Solr response
         */
        read: function(dfd, data) {

            var response, patternLon, patternLat, prop, lon, lat, group,
                innerprop, point, attributes,
                results = [];

            response = $.parseJSON(data);
            patternLon = /\(([-+eE0-9.]*),CenterX/;
            patternLat = /\(([-+eE0-9.]*),CenterY/;

            for (prop in response.grouped) {

                if (response.grouped.hasOwnProperty(prop)) {
                    
                    attributes = {};
                    
                    group = response.grouped[prop];
                    
                    for (innerprop in group) {

                        if (innerprop == "doclist") {
                            if (typeof this.options.radius === "function") {
                                attributes.radius = this.options.radius.call(group);
                            } else if (typeof this.options.radius === "number") {
                                attributes.radius = this.options.radius;
                            } else {
                                attributes.radius =
                                    (group[innerprop].numFound / group.matches || 0) * 100;
                            }

                            if (typeof this.options.intensity === "function") {
                                attributes.intensity = this.options.intensity
                                    .call(group);
                            } else if (typeof this.options.intensity === "number") {
                                attributes.intensity = this.options.intensity;
                            } else {
                                attributes.intensity = 0.5;
                            }
                        }
                    }
                    
                    if (!attributes.radius)
                        continue;

                    lon = parseFloat(prop.match(patternLon)[1]);
                    lat = parseFloat(prop.match(patternLat)[1]);

                    point = this.makeFeature(lon, lat, attributes);

                    results.push(point);
                    
                }
            }

            dfd.resolveWith({
                features: results
            });

        },

        /**
         * Creates an OpenLayers feature.
         *
         * @private
         * @param  {number} lon  Longitude of feature
         * @param  {number} lat  Latitude of feature
         * @param  {object} attr Attributes to attach to feature
         * @return {OpenLayers.Feature.Vector}      Created feature
         */
        makeFeature: function(lon, lat, attr) {

            var point = new OpenLayers.Geometry.Point(lon, lat)
                .transform("EPSG:4326", "EPSG:900913");

            return new OpenLayers.Feature.Vector(point, attr);

        }

    }

    HeatReader.prototype = methods;

    return HeatReader;

}));