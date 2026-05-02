const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DC Loans API",
      version: "1.0.0",
      description: "DC Loans Backend API — US and South African loan applications",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            user: { $ref: "#/components/schemas/UserProfile" },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id:             { type: "string" },
            name:           { type: "string" },
            email:          { type: "string" },
            initials:       { type: "string" },
            role:           { type: "string" },
            country:        { type: "string" },
            memberSince:    { type: "string" },
            accountBalance: { type: "number" },
            loanApproved:   { type: "number" },
            monthlyPayback: { type: "number" },
            totalWithdrawn: { type: "number" },
            totalPaid:      { type: "number" },
            loanStatus:     { type: "string", enum: ["active", "pending", "none"] },
            nextPaymentDate:  { type: "string", nullable: true },
            daysUntilPayment: { type: "number" },
            repaidPercent:    { type: "number" },
            interestRate:     { type: "string" },
            termRemaining:    { type: "string" },
            creditUtil:       { type: "number" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field:   { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: "Validation errors",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError" },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./controllers/*.js", "./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
