process.on('uncaughtException', function (err) {
    console.log(err);
});

process.on("unhandledRejection", (err, promise) => {
    console.log(err);
});