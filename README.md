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
- **What was implemented?** Implemented a robust authentication "kill-switch" via the `is_active` attribute in the `User` entity, ensuring data integrity while allowing for soft-deletes. Enforced platform-aware Role-Based Access Control (RBAC) on the backend; mobile application access is restricted exclusively to `STAFF` roles using a custom `X-Platform` header verification, ensuring `OWNER` accounts can login to the Web Dashboard without restriction while being blocked from mobile tools.

### Mobile Infrastructure & Shared Assets
- **What was implemented?** Integrated Retrofit2, Gson, and Kotlin Coroutines for backend communication. Created custom vector assets for the login banner and income upload area. Designed a custom Material-based Toast system for professional success and error notifications.

### Mobile Login & Dashboard
- **What was implemented?** Finalized the Login workflow with top-positioned Toasts, descriptive error parsing, and a 1.5s delay before navigating to the home screen. Implemented the Home dashboard Activity with an assigned location view and income logging layout.

### Mobile Navigation & Transaction Logs
- **What was implemented?** Transitioned the Android app to a Modular Navigation Architecture by creating a reusable Bottom Navigation component and centralized routing utility (`BottomNavUtils`). Implemented the Transaction Logs feature, complete with a custom RecyclerView adapter (`LogsAdapter`) to display transaction history, fully integrated with the new modular navigation logic.

### Mobile Staff Profile & Account Management
- **What was implemented?** Designed and implemented the comprehensive Staff Profile screen. Features include a circular identity avatar, real-time assignment monitoring (non-editable with lock indication), and detailed employee attribute tracking. Integrated functional account actions such as a secure Log Out workflow (clearing activity stacks) and persistent navigation state management for the "Profile" tab.

**IT342 Phase 2 – Staff Profile and Log Management for Mobile is successfully completed.**