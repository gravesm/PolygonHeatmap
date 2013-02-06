({
    baseUrl: "src",
    out: "target/polygonheatmap.js",
    include: ['heatquery', 'heatreader', 'heatrenderer', 'requestqueue'],
    paths: {
        jquery: "empty:",
        openlayers: "empty:"
    }
})