## Project Context

This is a social media application where users can create communities, post discussion topics, and interact with content. The backend is built with Node.js, Express.js, and MongoDB.

### General Coding Guidelines

- Use modern ES6+ syntax (async/await, arrow functions, destructuring)
- Use ESM modules (import/export) instead of CommonJS
- Write clean, readable code with meaningful variable names
- Follow RESTful API design principles
- Use proper HTTP status codes

### Error Handling

- Log errors to console with sufficient context
- Never expose internal error details to clients in production

### Security

- Validate all user inputs
- Sanitize data before database operations
- Use environment variables for sensitive data
- Never commit secrets or API keys

### API Response Format

All successful API responses should follow this structure:
{
"success": true,
"data": { ... },
"message": "Optional success message"
}

For errors:
{
"success": false,
"message": "Error message"
}

### File Organization

- Controllers in `/controllers` directory
- Routes in `/routes` directory
- Models in `/models` directory
- Services in `/services` directory

## What to Prefer

- async/await over callbacks or raw promises
- Modular, single-responsibility functions
- Route handlers that delegate to controller functions

## What to Avoid

- Global variables
- Overly complex nested logic
- Hardcoded values (use constants or env variables)
- Missing error handling
