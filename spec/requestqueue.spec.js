var RequestQueue = require("../src/requestqueue");

describe("RequestQueue", function() {

    var qq, dfd, Query;

    beforeEach(function() {
        qq = new RequestQueue();
        dfd = Query = null;
    })

    it("Executes Query.run", function() {

        Query = function() {
            this.run = function(deferred) {
                deferred.resolve();
            }
        }

        runs(function() {
            dfd = qq.queueRequest(new Query());
        });

        waitsFor(function() {
            return dfd.state() == "resolved";
        }, "Deferred should be resolved", 100);
        
    });

    it("Rejects stale requests", function() {

        Query = function() {
            this.run = function(deferred) {
                setTimeout(function() {
                    deferred.resolve();
                }, 500);
            }
        }

        runs(function() {
            dfd = qq.queueRequest(new Query());
            qq.queueRequest(new Query());
        });

        waitsFor(function() {
            return dfd.state() == "rejected";
        }, "Deferred should be rejected", 100);

    })

});