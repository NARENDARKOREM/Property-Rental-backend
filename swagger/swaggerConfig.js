const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "ServoStay API Test",
        description: "API documentation for ServoStay",
    },
    host: "localhost:5000/", // Update if deploying to a production server
    schemes: ["http"],      // Update to "https" if required
};

const outputFile = "./swagger/swagger_output.json"; // Path to save generated JSON
const endpointsFiles = ["./routes/**/*.js", "./userRoutes/**/*.js"]; // All routes

console.log("Executing swaggerConfig.js...");
console.log("Expected outputFile path:", outputFile);
console.log("Scanning these files for endpoints:", endpointsFiles);


// Generate Swagger output
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log("Swagger documentation successfully generated!");
    require("../index.js"); // Ensure this points to your main entry file
});
