// swagger.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'My API',
    description: 'Description of my API',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json'; // File to save generated Swagger documentation
const endpointsFiles = ['./index.js']; // Entry file for API routes

// Generate Swagger documentation
swaggerAutogen(outputFile, endpointsFiles).then(() => {
  console.log('Swagger documentation generated successfully');
});
