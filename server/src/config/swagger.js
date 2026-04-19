const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Basic manual setup for now as a placeholder
// In a real scenario, we'd use swagger-jsdoc or a separate swagger.yaml
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Restaurant Management System API',
        version: '1.0.0',
        description: 'API for managing a restaurant including menu, orders, inventory, and more.'
    },
    servers: [
        {
            url: 'http://localhost:5000/api',
            description: 'Development server'
        }
    ],
    paths: {
        '/auth/login': {
            post: {
                summary: 'Login user',
                responses: {
                    200: { description: 'Success' }
                }
            }
        }
        // Add more paths as needed or use yamljs to load a full spec
    }
};

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
