const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Baekseok Student Hub API',
    version: '1.0.0',
    description: 'Express API — auth, users, posts, counter',
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Local server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['studentId', 'password'],
        properties: {
          studentId: { type: 'string', example: '20240001' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          studentId: { type: 'string', example: '20240001' },
          name: { type: 'string', example: '김백석' },
          departmentId: { type: 'integer', example: 1 },
          departmentName: { type: 'string', example: '컴퓨터공학과' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/AuthUser' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          fields: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
