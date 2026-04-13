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

### Mobile Password Security & Management
- **What was implemented?** Developed a dedicated "Change Password" sub-screen for staff accounts. Implemented a clean, scrollable form with secured input fields and real-time password visibility toggling. Added a stylized security requirements monitor to guide users on password complexity (8+ characters, numbers, and special characters). Integrated seamless navigation from the Profile tab and built-in form validation logic to ensure data integrity during security updates.

### Mobile Home Integration & Receipt Management
- **What was implemented?** Fully integrated the Mobile Home dashboard with the Spring Boot backend. Staff accounts now dynamically fetch their assigned business location via the new `/my-assignments` API. Implemented real-time income submission with persistent JWT session management (`SessionManager`) and a high-performance multipart receipt upload system (Camera & Gallery support) with automated backend synchronization and HikariCP connection pool optimization.

**IT342 Phase 2 – Home Dashboard Backend Integration for Mobile is successfully completed.**

## Phase 3 Progress

### Web Transaction Management & CRUD
- **What was implemented?** Developed a comprehensive transaction management suite for Business Owners. Implemented secure `PUT` and `DELETE` REST endpoints on the backend with strict ownership authorization checks. On the frontend, created a dynamic dropdown-based Action menu for each transaction, integrated with custom `DashboardEditTxModal` and `DashboardDeleteTxModal` components for authenticated real-time data mutation.

### Real-time Analytics & MoM Growth
- **What was implemented?** Integrated an advanced analytics engine into the Web Dashboard. Implemented real-time **Month-over-Month (MoM) growth calculations** for Total Revenue, Transaction Volume, and Business Acquisition. Designed a stylized "Growth Visualizer" using status badges and trend indicators (emerald for growth, red for decline) to provide immediate financial insights for owners.

### Backend Standardized Error Handling
- **What was implemented?** Implemented a `GlobalExceptionHandler` to centralize and standardize the API's response structure. This ensures that all platform exceptions (Authorization, Persistence, or Validation) are gracefully trapped and returned in a consistent `ApiResponse` envelope, improving the reliability and debuggability of the mobile and web integrations.
**IT342 Phase 3 – Web Main Feature Completed**

### Design Patterns Implemented
* **Strategy Pattern (Export System)**: The `ExportReports.jsx` component delegates report generation to dedicated strategy classes (`CSVExportStrategy`, `EmailExportStrategy`) located in `web/src/services/export/`. This encapsulates specific export algorithms, removing complex conditional logic from the UI and adhering to the Open/Closed Principle for future export formats.

### Mobile Application Deep Integrations
- **What was implemented?** Finalized the Epic integration bridging the Mobile UI to the Spring Boot Backend. Activated the **Log Details** viewer to dynamically fetch historical transactions and render receipt images with an interactive pinch-to-zoom interface. Bound the **Staff Profile** view to live Spring Security user endpoints. Re-engineered the **Change Password** architecture with fortified backend validation (`BCrypt`), live real-time UI password rule validations, and button-locking safeguards to entirely prevent duplicate request flooding.