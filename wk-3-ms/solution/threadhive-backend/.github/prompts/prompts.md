### Step 2.1: Design API endpoints (Plan Mode in a NEW PROJECT)

```
You are an expert Backend architect. Help me design complete REST API endpoints for a Reddit-style social platform.

CONTEXT:
- The models/ directory contains MongoDB collections for Users, Subreddits and Threads in the application.

YOUR TASK:
1. Analyze the existing Mongoose models to understand data relationships
2. Design a complete API architecture that includes:
    - All necessary endpoints grouped by resource
    - HTTP methods and paths
    - Request/response formats
    - Query parameters for filtering, sorting, pagination
    - Relationship handling (nested resources vs separate endpoints)

3. Consider RESTful best practices in your design
4. Present the design in a structured format with:
    - Endpoint inventory (table format)
    - Detailed endpoint specifications

Show me two different architectural approaches and compare them. Then recommend the best approach with justification.
```

---
### Step 2.3: Implement the Subreddit Detail and Thread APIs (Plan & Agent Mode)

#### Generate Implementation Plan (Plan Mode)

```
Create a 3-phase implementation plan for the endpoints in #file:resources/finalized-apis.md

Split by http-methods:
- Phase 1: GET endpoints, including `GET /api/subreddits/:id`
- Phase 2: POST and PUT endpoints
- Phase 3: DELETE endpoint

For each phase, list: endpoints to implement, required files, and key considerations.
```


#### Phase 1: GET Endpoints (Agent Mode)

```
Implement Phase 1 of the plan
```

#### Phase 2: POST and PUT Endpoints (Agent Mode)

```
Implement Phase 2 of the plan
```

#### Phase 3: DELETE Endpoint (Agent Mode)

```
Implement Phase 3 of the plan
```

### Step 2.4: Generate the OpenAPI Spec

```
Generate an OpenAPI 3.2 spec (openapi.yaml) documenting all the API endpoints — include request/response schemas derived from the Mongoose models, status codes, and example payloads. Install swagger-ui-express (and a YAML loader such as yamljs if needed) and wire it up in src/app.js so the spec is served at /api-docs.
```

### Step 2.6 (Optional): Visualize the API Request Flow

```
Generate a Mermaid sequence diagram showing the full request flow for POST /api/threads and GET /api/threads/:id — from the Express route, through the controller and service layers, to the Mongoose model and MongoDB, and back to the client response.
```