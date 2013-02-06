/**
 * Copyright 2013 MIT Libraries.
 */

var HeatReader = require("../src/heatreader.js");
var $ = require("jquery");

describe("HeatReader", function() {

    var hr, resp;

    beforeEach(function(){

        hr = new HeatReader();

        resp = {
            grouped: {
                "{!frange l=1 u=2}map(sum(map(sub(abs(sub(0,CenterX)),sum(0,HalfWidth)),0,400000,1,0),map(sub(abs(sub(0,CenterY)),sum(0,HalfHeight)),0,400000,1,0)),0,0,1,0)": {
                    matches: 100,
                    doclist: {
                        numFound: 100
                    }
                }
            }
        };

        resp = JSON.stringify(resp);

    });

    it("Sets options upon object creation", function() {

        hr = new HeatReader({
            radius: "radius",
            intensity: "intensity"
        });

        expect(hr.options).toEqual({
            radius: "radius",
            intensity: "intensity"
        });

    });

    it("Parses response", function() {

        spyOn(hr, "makeFeature");

        hr.read($.Deferred(), resp);

        expect(hr.makeFeature).toHaveBeenCalledWith(0, 0, {
            radius: 100,
            intensity: 0.5
        });

    });

    it("Calls user-defined callbacks when setting feature attributes", function() {

        hr.options.radius = hr.options.intensity = function(){};

        spyOn(hr.options, "radius");
        spyOn(hr.options, "intensity");

        hr.read($.Deferred(), resp);

        expect(hr.options.radius).toHaveBeenCalled();
        expect(hr.options.intensity).toHaveBeenCalled();

    });

    it("Uses user-defined numbers when setting feature attributes", function() {

        hr.options.radius = hr.options.intensity = 1;

        spyOn(hr, "makeFeature");

        hr.read($.Deferred(), resp);

        expect(hr.makeFeature).toHaveBeenCalledWith(0, 0, {
            radius: 1,
            intensity: 1
        });

    });

});