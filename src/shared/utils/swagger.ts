export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GearUp API Documentation',
    version: '1.0.0',
    description: 'REST API documentation for GearUp (Sports & Outdoor Gear Rental Service).',
  },
  servers: [
    {
      url: 'https://gearup-sigma.vercel.app',
      description: 'GearUp Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token to access authenticated routes.',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Creates a new CUSTOMER or PROVIDER account.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'role'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                  name: { type: 'string', example: 'John Doe' },
                  role: { type: 'string', enum: ['CUSTOMER', 'PROVIDER'], example: 'CUSTOMER' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
          },
          400: {
            description: 'Bad Request / Email already exists',
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        description: 'Authenticates user and returns access token + sets authentication cookies.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
          },
          401: {
            description: 'Unauthorized / Invalid credentials',
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Returns profile details of the logged-in user.',
        responses: {
          200: {
            description: 'User profile retrieved successfully',
          },
          401: {
            description: 'Unauthorized / Missing or invalid token',
          },
        },
      },
    },
    '/api/categories': {
      post: {
        tags: ['Categories'],
        summary: 'Create category (Admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Camping' },
                  description: { type: 'string', example: 'Tents, backpacks, sleeping bags.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Category created successfully' },
          403: { description: 'Forbidden / Admin privileges required' },
        },
      },
      get: {
        tags: ['Categories'],
        summary: 'Get all categories (Public)',
        responses: {
          200: { description: 'Categories retrieved successfully' },
        },
      },
    },
    '/api/gear': {
      get: {
        tags: ['Gear'],
        summary: 'Get all active gear (Public)',
        description: 'Browse available gear listings. Supports search, filters, and pagination.',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category name or UUID' },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term in title/description' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Gear items retrieved successfully' },
        },
      },
    },
    '/api/gear/{id}': {
      get: {
        tags: ['Gear'],
        summary: 'Get gear details (Public)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Gear item details retrieved successfully' },
          404: { description: 'Gear item not found' },
        },
      },
    },
    '/api/provider/gear': {
      post: {
        tags: ['Provider Gear Management'],
        summary: 'Add gear to inventory (Provider only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'pricePerDay', 'brand', 'stock', 'categoryId'],
                properties: {
                  title: { type: 'string', example: 'Mountain Bike' },
                  description: { type: 'string', example: 'High-performance offroad bicycle.' },
                  pricePerDay: { type: 'number', example: 25 },
                  brand: { type: 'string', example: 'Trek' },
                  stock: { type: 'integer', example: 5 },
                  categoryId: { type: 'string', format: 'uuid', example: 'uuid-here' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Gear listing created' },
          403: { description: 'Forbidden / Provider role required' },
        },
      },
    },
    '/api/provider/gear/{id}': {
      put: {
        tags: ['Provider Gear Management'],
        summary: 'Update gear listing (Provider only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  pricePerDay: { type: 'number' },
                  brand: { type: 'string' },
                  stock: { type: 'integer' },
                  categoryId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Gear listing updated' },
          403: { description: 'Forbidden / Ownership required' },
        },
      },
      delete: {
        tags: ['Provider Gear Management'],
        summary: 'Remove gear listing (Provider only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Gear listing deleted' },
          400: { description: 'Cannot delete linked gear items' },
        },
      },
    },
    '/api/rentals': {
      post: {
        tags: ['Rentals'],
        summary: 'Create rental order (Customer only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['startDate', 'endDate', 'items'],
                properties: {
                  startDate: { type: 'string', format: 'date-time', example: '2026-07-15T12:00:00Z' },
                  endDate: { type: 'string', format: 'date-time', example: '2026-07-20T12:00:00Z' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['gearItemId', 'quantity'],
                      properties: {
                        gearItemId: { type: 'string', format: 'uuid', example: 'uuid-here' },
                        quantity: { type: 'integer', example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Rental order placed successfully' },
          400: { description: 'Insufficient stock or invalid dates' },
        },
      },
      get: {
        tags: ['Rentals'],
        summary: 'Get customer rentals history (Customer only)',
        responses: {
          200: { description: 'Rental orders retrieved' },
        },
      },
    },
    '/api/rentals/{id}': {
      get: {
        tags: ['Rentals'],
        summary: 'Get rental order details',
        description: 'Returns details. Accessible by the customer or the owner provider.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Order details retrieved' },
        },
      },
    },
    '/api/provider/orders': {
      get: {
        tags: ['Provider Order Management'],
        summary: 'Get provider incoming orders (Provider only)',
        responses: {
          200: { description: 'Provider orders retrieved' },
        },
      },
    },
    '/api/provider/orders/{id}': {
      patch: {
        tags: ['Provider Order Management'],
        summary: 'Update order status (Provider only)',
        description: 'Updates booking state (PLACED ➔ CONFIRMED/CANCELLED, etc.)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED'], example: 'CONFIRMED' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order status updated' },
        },
      },
    },
    '/api/payments/create': {
      post: {
        tags: ['Payments'],
        summary: 'Create payment intent (Customer only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rentalOrderId'],
                properties: {
                  rentalOrderId: { type: 'string', format: 'uuid', example: 'uuid-here' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Stripe PaymentIntent generated' },
        },
      },
    },
    '/api/payments/confirm': {
      post: {
        tags: ['Payments'],
        summary: 'Confirm Stripe payment (Public webhook / Direct mock)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rentalOrderId: { type: 'string', format: 'uuid' },
                  transactionId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment confirmed successfully' },
        },
      },
    },
    '/api/payments/{id}': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment details by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Payment details retrieved' },
        },
      },
    },
    '/api/payments': {
      get: {
        tags: ['Payments'],
        summary: 'Get billing records history (Customer only)',
        responses: {
          200: { description: 'Billing history retrieved' },
        },
      },
    },
    '/api/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Create review (Customer only)',
        description: 'Customer can leave a review after returning the gear.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rentalOrderId', 'gearItemId', 'rating'],
                properties: {
                  rentalOrderId: { type: 'string', format: 'uuid', example: 'uuid-here' },
                  gearItemId: { type: 'string', format: 'uuid', example: 'uuid-here' },
                  rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  comment: { type: 'string', example: 'Great equipment!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Review posted' },
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin Panel'],
        summary: 'Get all customers & providers (Admin only)',
        responses: {
          200: { description: 'Users list retrieved' },
        },
      },
    },
    '/api/admin/users/{id}': {
      patch: {
        tags: ['Admin Panel'],
        summary: 'Update user account status (Admin only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'], example: 'SUSPENDED' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User account status updated' },
        },
      },
    },
    '/api/admin/gear': {
      get: {
        tags: ['Admin Panel'],
        summary: 'Get all gear listings on platform (Admin only)',
        responses: {
          200: { description: 'All gear listings retrieved' },
        },
      },
    },
    '/api/admin/rentals': {
      get: {
        tags: ['Admin Panel'],
        summary: 'Get all rentals placed on platform (Admin only)',
        responses: {
          200: { description: 'All platform rentals retrieved' },
        },
      },
    },
  },
};
