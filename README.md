# IT342-Lagamo-MultiBiz
## Phase 1 Completed

## Phase 2 Progress

### Infrastructure & Security Core
- **What was implemented?** Updated Maven dependencies for security and web features. Configured Spring Security with stateless JWT authentication, added dynamic Data Source properties, and set up a custom `JwtAuthenticationFilter` for robust token-based endpoint protection. Also enabled required base packages on the core Application class.

### Authentication & User Management
- **What was implemented?** Created Registration and Login REST endpoints (`AuthController`), updated the `User` entity to map correctly with the frontend DTO (`RegisterRequest`), and designed generic `ApiResponse` wrapping. Built dynamic HTML templates in `EmailService`. On the frontend, created pixel-perfect `LoginForm` and `RegisterForm` components per Figma designs, integrating Axios API calls, validation, and dynamic toast notifications, all orchestrated inside `Login.jsx`.

### Business & Transaction Features
- **What was implemented?** Built out the REST APIs and Services for Business Management and Billing (`BusinessController`, `TransactionController`, `BusinessService`, `TransactionService`). Designed scalable entities mapped with JPA/Hibernate (`Business`, `BusinessStaff`, `Transaction`), and structured incoming payload DTOs like `TransactionRequest`.

### Web UI & Dashboard
- **What was implemented?** Designed and implemented the primary frontend structure, including the `Sidebar` and `TopBar` layout components. Created dynamic views for `Dashboard`, `Businesses`, `BusinessDetail`, `Billing`, and `ExportReports`. Also centralized shared UI components like `Button`, `Input`, `Modal` (`AddBusinessModal`, `AddStaffModal`, `EditBusinessModal`, etc.), and `Toast` for a consistent, responsive, and reusable design system.

### Google OAuth Login 
- Done Requirement 4.2: Google OAuth Login (Decoupled JWT Flow).

### Mobile Security & Staff Restrictions
- **What was implemented?** Implemented a robust authentication "kill-switch" via the `is_active` attribute in the `User` entity, ensuring data integrity while allowing for soft-deletes. Enforced strict Role-Based Access Control (RBAC) on the backend to restrict mobile application access exclusively to `STAFF` roles, rejecting `OWNER` logins with descriptive errors.

### Mobile Infrastructure & Shared Assets
- **What was implemented?** Integrated Retrofit2, Gson, and Kotlin Coroutines for backend communication. Created custom vector assets for the login banner and income upload area. Designed a custom Material-based Toast system for professional success and error notifications.

### Mobile Login & Dashboard
- **What was implemented?** Finalized the Login workflow with top-positioned Toasts, descriptive error parsing, and a 1.5s delay before navigating to the home screen. Implemented the Home dashboard Activity with an assigned location view and income logging layout.


