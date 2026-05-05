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
         // ── Loan Document (uploaded file) ──────────────────────────────────
        LoanDocument: {
          type: "object",
          properties: {
            label:      { type: "string", example: "National ID" },
            url:        { type: "string", example: "https://res.cloudinary.com/..." },
            publicId:   { type: "string", example: "loan-documents/abc123" },
            uploadedAt: { type: "string", format: "date-time" },
          },
        },

         // ── Loan Application ───────────────────────────────────────────────
        LoanApplication: {
          type: "object",
          properties: {
            id:          { type: "string" },
            userId:      { type: "string" },
            country:     { type: "string", enum: ["US", "ZA"] },
            userName:    { type: "string" },
            userEmail:   { type: "string" },
            amount:      { type: "number" },
            purpose:     { type: "string" },
            duration:    { type: "string" },
            payDate:     { type: "string", format: "date", nullable: true },
            employment:  { type: "string" },
            jobTitle:    { type: "string" },
            income:      { type: "number" },
            creditScore: { type: "number", nullable: true },
            notes:       { type: "string" },
            bankName:    { type: "string" },
            cashAppTag:  { type: "string", nullable: true },
            cashAppPhone:{ type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["pending", "active", "rejected", "completed", "defaulted"],
            },
            disbursedAmount:      { type: "number" },
            approvedInterestRate: { type: "string" },
            approvedTerm:         { type: "string" },
            startedAt:            { type: "string", format: "date-time", nullable: true },
            nextDueDate:          { type: "string", format: "date-time", nullable: true },
            documents: {
              type: "array",
              items: { $ref: "#/components/schemas/LoanDocument" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Apply for Loan request body ────────────────────────────────────
        LoanApplicationRequest: {
          type: "object",
          required: [
            "amount", "purpose", "duration", "employment",
            "jobTitle", "income", "bankName", "accountNumber",
          ],
          properties: {
            amount:        { type: "number",  example: 5000 },
            purpose:       { type: "string",  example: "Medical expenses" },
            duration:      { type: "string",  example: "6 months" },
            payDate:       { type: "string",  format: "date", example: "2025-08-01" },
            employment:    { type: "string",  example: "Full-time" },
            jobTitle:      { type: "string",  example: "Software Engineer" },
            income:        { type: "number",  example: 8000 },
            creditScore:   { type: "number",  example: 720 },
            notes:         { type: "string",  example: "Urgent" },
            bankName:      { type: "string",  example: "First National Bank" },
            accountNumber: { type: "string",  example: "123456789" },
            routingNumber: { type: "string",  example: "021000021" },
            cashAppTag:    { type: "string",  example: "$johndoe" },
            cashAppPhone:  { type: "string",  example: "+1234567890" },
            // File upload fields
            "documents":          { type: "array", items: { type: "string", format: "binary" } },
            "documentLabels[0]":  { type: "string", example: "National ID" },
            "documentLabels[1]":  { type: "string", example: "Proof of Income" },
            "documentLabels[2]":  { type: "string", example: "Bank Statement" },
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
        Unauthorized: {
          description: "Missing or invalid token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
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
