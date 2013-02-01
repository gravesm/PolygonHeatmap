Polygon Heatmap
===============

This provides functionality for adding a heatmap to OpenLayers based on polygon
data stored in a Solr index. This was designed for the `OpenGeoportal <https://github.com/OpenGeoportal/OGP>`_
but should be usable in any project with a properly constructed Solr index. The
HeatRenderer.js script is a modified version of HeatmapLayer.js from 
https://github.com/hoehrmann/openlayers-heatmap.

Usage
-----

This is intended to work roughly as an OpenLayers strategy, requesting data from
Solr when it is needed. In order to minimize unnecessary Solr requests and
rendering operations a request for data goes into a queue that holds only the
most recent request. A request will be executed after a configurable delay (in
ms)::

    var req = new RequestQueue(300);

Configure a reader that will parse the Solr response and create an array of
features to be rendered. A reader accepts an object of options with two
properties: ``intensity`` and ``radius``. These can be either numbers or
callbacks that return numbers. The intensity should be between 0 and 1 and
controls how hot the feature is rendered as. The radius is the radius of the
feature. The context for both callbacks is the Solr group query object from the
response. Generally, the most interesting property will be ``doclist.numFound``
which reports the number of documents matching that query::

    var reader = new HeatReader({
        intensity: 0.8,
        radius: function() {
            var num = this.doclist.numFound;
            return num / 1000 * 20;
        }
    });

Queue up a new Solr request. The idea here is that you would queue a request for
more data whenever the user zooms or pans the map. The return value of the
``queueRequest`` call is a jQuery deferred object which will be resolved once
the Solr response has been parsed. The context for the ``done`` handler is an
object with a ``features`` property containing an array of features created from
the Solr request by the configured HeatReader.

A Solr request is configured by creating a new instance of HeatQuery. This takes
an options object that supports four properties: the url for the Solr server,
the size of the grid along one axis, the geographic extent for the query as a
bounding box, and a configured instance of a HeatReader::

    new OpenLayers.Layer.Vector("Heatmap", {
        renderers: ["HeatRenderer"],
        projection: "EPSG:4326",
        eventListeners: {
            moveend: function(ev) {
                var layer = this;
                layer.destroyFeatures();
                var res = req.queueRequest(
                    new HeatQuery({
                        url: "http://localhost/solr/ogp/select/",
                        gridSize: 5,
                        bounds: map.getExtent().transform(
                            "EPSG:900913", "EPSG:4326"),
                        reader: reader
                    })
                ).done(function() {
                    layer.addFeatures(this.features);
                });
            }
        }
    });

Tests
-----

The tests are designed to be run using jasmine-node::

    npm install
    jasmine-node spec/