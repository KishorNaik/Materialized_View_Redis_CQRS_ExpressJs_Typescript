# 🎯 Materialized View Pattern with CQRS and Redis

## 📌 Overview
This repository demonstrates the use of the Materialized View pattern within a CQRS architecture, leveraging Redis for high-speed access to denormalized user data. By separating read and write models, we preserve normalized relational structures in the database (User, Credentials, Communication, Keys, Settings) while optimizing query performance using Redis-backed materialized views. This pattern significantly reduces the overhead of joins and round trips to the database, especially in read-heavy environments. The approach ensures scalable, responsive, and maintainable data access, with seamless fallback and refresh strategies for consistency.

## 🚀 Use Case: Real-Time Access to User Profiles
In this system, the user domain is modeled through multiple normalized tables—User, Credentials, Communication, Keys, and Settings. This separation ensures modularity and clarity in the write model, enabling focused updates and better schema evolution.

However, querying comprehensive user profiles from these normalized tables requires costly joins and multiple database round-trips. To address this, we implement a Materialized View pattern using Redis as a dedicated read model.

Each user profile is denormalized into a single, cohesive view that aggregates identity, authentication details, communication preferences, access keys, and configuration settings. This composite snapshot is published to Redis, allowing consumer services and APIs to retrieve user data instantly without touching the relational database.

Benefits of this approach include:
- ⚡ High-performance read operations with minimal latency
- 🛠️ Improved scalability for read-heavy workloads
- 🔄 Eventual consistency between write model and view state
- 📦 Isolation of concerns between read and write domains
- 🧹 Reduced operational complexity in downstream services

## ❌ Problems
- 🔁 Expensive Join Operations: Querying user profiles requires multiple joins across relational tables, degrading performance.
- 🐌 High Latency in Reads: Each request incurs full round-trips to the database, slowing down user-facing features.
- 📈 Scalability Bottlenecks: Read-heavy workloads put pressure on the primary database, risking reliability under load.
- 🧩 Tightly Coupled Models: Consumer services become dependent on relational schema, increasing fragility and coupling.
- 🔍 Limited Query Flexibility: Ad hoc queries or filtered views require complex SQL or additional indexes, slowing iteration.

## ✅ Benefits
- ⚡ Instant Reads: Redis delivers sub-millisecond access to denormalized user snapshots, ideal for real-time applications.
- 🚀 Improved Scalability: Offloading reads to Redis reduces load on the relational store and improves system resilience.
- 🔄 Decoupled Architecture: Consumer services interact with a consistent read model, insulated from relational schema changes.
- 🧠 Simplified Data Access: No joins, no complex logic—just a single key lookup for full user profile access.
🌐 Ready for Distribution: Redis views can be easily sharded or replicated for geo-distributed, low-latency delivery.

## 🚀 Installation

### 🐳 Install Docker Desktop
- Download and install Docker: [Docker Desktop](https://www.docker.com/products/docker-desktop/)


### 💾 Setup Redis Using Docker

```bash
docker pull redis
docker run --name my-redis -d -p 6379:6379 redis
```

#### 📦 Project Setup
- Clone the Repository
```bash
git clone <your-repo-url>
cd <your-project-directory>
``` 
- 🧰 Setup `util` Service
    - Move into the util solution and create an .env file:
    ```bash
    NODE_ENV=development

    # Redis
    REDIS_HOST = 127.0.0.1
    #Local Docker
    #DB_HOST=host.docker.internal
    #REDIS_USERNAME = username
    #REDIS_PASSWORD = password
    REDIS_DB = 0
    REDIS_PORT = 6379

    ```
    - Install dependencies:
    ```bash
    npm i
    ```
    - Build the utility package:
    ```bash
    npm run build
    ```
    - Link the package:
    ```bash
    npm link
    ```
- 🗄️ Setup `db` service
    - Move into the db solution and create an .env file:
    ```bash
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=root
    DB_DATABASE=mv
    ```
    - Install dependencies:
    ```bash
    npm i
    ```
    - Build the utility package:
    ```bash
    npm run build
    ```
    - Generate TypeORM Entities
    ```bash
    npm run typeorm:generate
    ```
    - Apply Migrations
    ```bash
    npm run typeorm:migrate
    ```
     - Link the package:
    ```bash
    npm link
    ```
- 🌐 Setup `api` Service
    - Move into the api solution and create an .env file:
    ```bash
        # PORT
        NODE_ENV="development"
        PORT = 3000

        # TOKEN
        SECRET_KEY = secretKey
        REFRESH_SECRET_KEY = refreshSecretKey

        # LOG
        LOG_FORMAT = dev
        LOG_DIR = logs


        # CORS
        ORIGIN = *
        CREDENTIALS = true

        # Database
        DB_HOST = localhost
        #Local Docker
        #DB_HOST=host.docker.internal
        DB_PORT = 5432
        DB_USERNAME = postgres
        DB_PASSWORD = root
        DB_DATABASE = mv

        # Redis
        REDIS_HOST = 127.0.0.1
        #Local Docker
        #DB_HOST=host.docker.internal
        #REDIS_USERNAME = username
        #REDIS_PASSWORD = password
        REDIS_DB = 0
        REDIS_PORT = 6379

        #AES
        ENCRYPTION_KEY=RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6

        #Rate Limit and Throttle
        GLOBAL_WINDOW_MINUTES=15
        RATE_LIMITER=150
        SLOW_DOWN_DELAY_AFTER_HITS =75
        SLOW_DOWN_INITIAL_DELAY_MS=300
        SLOW_DOWN_MAX_DELAY_MS=3000
    ```
    - Install dependencies:
    ```bash
    npm i
    ```
    - Link the `util` and `db` package:
    ```bash
    npm link <utilurl> <dburl>
    ```
    - Build the Api service:
    ```bash
    npm run build
    ```
    - Run the API in development mode:
    ```bash
    npm run dev:api
    ```
    - Run the Cron Job Worker
    ```bash
    npm run dev:cron
    ```
    - Run the BullMq Consumer Worker
    ```bash
    npm run dev:bullmq
    ```
📌 Note: 
- Execute the following script step by step, ensuring that each service runs in its own separate process
```
npm run dev:api
npm run dev:cron
npm run dev:bullmq
```

- This demo uses [Pipeline Workflow](https://github.com/KishorNaik/Sol_pipeline_workflow_expressJs) provides a structured approach to executing sequential operations, ensuring safe execution flow, error resilience, and efficient logging.
- This demo uses [Outbox Pattern](https://github.com/KishorNaik/Outbox_Pattern_ExpressJs_Typescript) to ensure reliable event publishing in distributed systems.

#### Source Code
- DB
    - User
        https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/tree/main/db/src/core/modules/users
    - Outbox
        https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/tree/main/db/src/core/modules/outbox
- API
    - User Module
        - Create User Feature
            - Contracts
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/users/apps/features/v1/createUsers/contracts/index.ts
            - Command and Command Handlers
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/users/apps/features/v1/createUsers/commands/index.ts
            - Command Services
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/tree/main/api/src/modules/users/apps/features/v1/createUsers/commands/services
            - EndPoint
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/users/apps/features/v1/createUsers/endpoints/index.ts
            - Cron Job
                - Job Runner
                https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/users/apps/features/v1/createUsers/job/index.ts
                - Publish Event
                https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/tree/main/api/src/modules/users/apps/features/v1/createUsers/job/event
        - Get User By Id Feature
            - Contract
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/users/apps/features/v1/getUserByIdentifier/contracts/index.ts
            - Query and Query Handler
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/users/apps/features/v1/getUserByIdentifier/query/index.ts
            - Query Services
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/tree/main/api/src/modules/users/apps/features/v1/getUserByIdentifier/query/services
        - Shared Cache
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/tree/main/api/src/modules/users/shared/cache
        - user.Module
            https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/users/users.Module.ts
    - Notification Module
        - Contract
          https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/notifications/apps/features/v1/welcomeUserEmail/contracts/index.ts
        - Integration Event Subscribe
          https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/notifications/apps/features/v1/welcomeUserEmail/events/index.ts
        - Integration Service
          https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/tree/main/api/src/modules/notifications/apps/features/v1/welcomeUserEmail/events/services
        - notification.Module.ts
        https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/notifications/notification.Module.ts
    - app.Module.ts
      https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/modules/app.Module.ts
    - server.ts
      https://github.com/KishorNaik/Materialized_View_Redis_CQRS_ExpressJs_Typescript/blob/main/api/src/server.ts

        





