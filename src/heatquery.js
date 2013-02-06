/**
 * Copyright 2013 MIT Libraries.
 */
(function(root, factory) {
    if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else if (typeof define === "function" && define.amd) {
        define(['jquery'], factory);
    } else {
        root.HeatQuery = factory(jQuery);
    }
}(this, function($) {

    /**
     * Creates an instance of HeatQuery. A HeatQuery object will query a Solr
     * index for polygons intersecting an overlaying grid.
     * 
     * @constructor
     * @param {object} opts An object of options. Supported options include:
     *                      url - location of Solr server,
     *                      bounds - bounding box for query,
     *                      gridSize - size of grid along axis,
     *                      reader - an object with a read method capable of
     *                          parsing a Solr response
     */
    var HeatQuery = function(opts) {

        if (!(this instanceof HeatQuery)) {
            return new HeatQuery(opts);
        }

        var options = {};

        $.extend(options, opts);

        this.options = options;

    }

    var methods = {
        
        /**
         * Turns a bounds object into a Solr group query clause.
         *
         * @private
         * @param  {object} bounds Bounds object containing left, right, top
         *                         and bottom properties.
         * @return {string}        Solr group query clause.
         */
        getGroupQuery: function(bounds) {

            var bdsCenterLon, bdsCenterLat, bdsHalfWidth, bdsHalfHeight,
                centerDistX, centerDistY, sepAxisX, sepAxisY, sepAxisFlagX,
                sepAxisFlagY, sepAxisExists, sepAxisExistsFlag, query;

            bdsHalfHeight = (bounds.top - bounds.bottom) / 2;
            bdsHalfWidth = (bounds.right - bounds.left) / 2;

            bdsCenterLon = bounds.left + bdsHalfWidth;
            bdsCenterLat = bounds.bottom + bdsHalfHeight;

            centerDistX = "abs(sub(" + bdsCenterLon + ",CenterX))";
            centerDistY = "abs(sub(" + bdsCenterLat + ",CenterY))";

            sepAxisX = "sub(" + centerDistX + ",sum(" + bdsHalfWidth + ",HalfWidth))";
            sepAxisY = "sub(" + centerDistY + ",sum(" + bdsHalfHeight + ",HalfHeight))";

            sepAxisFlagX = "map(" + sepAxisX + ",0,400000,1,0)";
            sepAxisFlagY = "map(" + sepAxisY + ",0,400000,1,0)";

            sepAxisExists = "sum(" + sepAxisFlagX + "," + sepAxisFlagY + ")";
            
            sepAxisExistsFlag = "map(" + sepAxisExists + ",0,0,1,0)";

            query = "group.query={!frange l=1 u=2}" + sepAxisExistsFlag;

            return query;

        },

        /**
         * Assembles group queries for each sector of a grid.
         *
         * @private
         * @return {string} Group queries string for the HeatQuery's bounds.
         */
        getQuery: function() {

            var i, j, stepx, stepy,
                groupQueries = [],
                sector = {},
                bounds = this.options.bounds,
                gridSize = this.options.gridSize;

            stepx = Math.abs(bounds.right - bounds.left) / gridSize;
            stepy = Math.abs(bounds.top - bounds.bottom) / gridSize;

            for (i = 0; i < gridSize; i++) {
                sector.left = bounds.left + stepx * i;
                sector.right = sector.left + stepx;
                for (j = 0; j < gridSize; j++) {
                    sector.bottom = bounds.bottom + stepy * j;
                    sector.top = sector.bottom + stepy;

                    groupQueries.push(this.getGroupQuery(sector));
                }
            }

            return groupQueries.join("&");

        },

        /**
         * Execute the Solr query.
         *
         * @private
         * @return {object} jQuery deferred object representing Solr AJAX
         *                  request
         */
        doPost: function() {

            var query = this.getQuery();

            return $.ajax({
                url: this.options.url,
                data: "q=*:*&group=true&wt=json&fl=LayerID&"+query,
                type: "POST",
                context: this
            });

        },

        /**
         * Runs the HeatQuery.
         *
         * @public
         * @param  {object} dfd jQuery deferred - used by RequestQueue to 
         *                      manage multiple requests
         */
        run: function(dfd) {

            var ajax = this.doPost();

            ajax.done(function(data) {
                this.options.reader.read(dfd, data);
            });

            return ajax;

        }
    }

    HeatQuery.prototype = methods;

    return HeatQuery;

}));