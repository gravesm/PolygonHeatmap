/**
 * Copyright 2013 MIT Libraries.
 */

var HeatQuery = require("../src/heatquery");
var $ = require("jquery");

describe("HeatQuery", function() {

    var hq, bounds;

    beforeEach(function() {
        hq = new HeatQuery();
    });

    it("Sets options upon object creation", function() {

        hq = new HeatQuery({
            url: "url",
            bounds: "bounds",
            gridSize: "gridSize",
            reader: "reader"
        });

        expect(hq.options).toEqual({
            url: "url",
            bounds: "bounds",
            gridSize: "gridSize",
            reader: "reader"
        });

    });

    it("Returns a group query", function() {

        var q = hq.getGroupQuery({
            left: -10,
            right: 10,
            top: 30,
            bottom: -10
        });

        expect(q).toEqual("group.query={!frange l=1 u=2}map(sum(map(sub(abs(sub(0,CenterX)),sum(10,HalfWidth)),0,400000,1,0),map(sub(abs(sub(10,CenterY)),sum(20,HalfHeight)),0,400000,1,0)),0,0,1,0)");
    });

    it("Calls getGroupQuery for each grid sector", function() {

        hq.options.gridSize = 5;
        hq.options.bounds = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };

        spyOn(hq, "getGroupQuery");

        hq.getQuery();

        expect(hq.getGroupQuery.calls.length).toEqual(25);
    });

    it("Calls getGroupQuery with correct sector", function() {

        hq.options.gridSize = 10;
        hq.options.bounds = {
            left: 0,
            right: 100,
            top: 100,
            bottom: 0,
        }

        spyOn(hq, "getGroupQuery");

        hq.getQuery();

        expect(hq.getGroupQuery.mostRecentCall.args[0]).toEqual({
            left: 90,
            bottom: 90,
            top: 100,
            right: 100
        });
    });

    it("Makes ajax request when run", function() {
        spyOn(hq, "doPost").andCallFake(function() {
            return $.Deferred();
        });

        hq.run();

        expect(hq.doPost).toHaveBeenCalled();
    });

    it("Calls reader when ajax request completes", function() {

        var reader = createSpyObj('reader', ['read']);

        hq.options.reader = reader;

        spyOn(hq, "doPost").andCallFake(function() {
            var dfd = $.Deferred().resolveWith(hq);
            return dfd;
        });

        hq.run();

        expect(reader.read).toHaveBeenCalled();

    });

});