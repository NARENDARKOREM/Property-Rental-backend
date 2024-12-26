const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'E-commerce API',
        description: 'API documentation for an E-commerce platform',
    },
    host: 'localhost:5000',
    schemes: ['http'],
};

const outputFile = './swagger/swagger_output.json';
const endpointsFiles = ['./routes/*.js']; 

swaggerAutogen(outputFile, endpointsFiles).then(() => {
    require('../server');  
});
// swaggerAutogen(outputFile, endpointsFiles,doc);