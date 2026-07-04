# Backend Payments Architecture (InecoBank Integration)

This document provides a comprehensive server-side reference for the payment gateway integration built for the Art Center platform.

## 1. System Architecture
The backend integrates with InecoBank's E-commerce API (PG 1.0) via server-to-server HTTP requests. The authentication flow uses the merchant `userName` and `password` variables passed directly into each request payload. 

**Important Note:** The InecoBank gateway operates using the legacy TSYS/BPC protocol, requiring payloads to be formatted strictly as `application/x-www-form-urlencoded`. The backend utilizes the `URLSearchParams` object to safely encode all variables.

## 2. Data Models

### A. Payment Model (`models/paymentModel.ts`)
The `Payment` collection serves as the central ledger and audit trail for all transactional attempts.
*   **`applicationId`** (ObjectId, optional): Reference to the `CoursesApplication` collection (for auto-calculated lessons).
*   **`serviceApplicationId`** (ObjectId, optional): Reference to the `ServicesApplication` collection (for manually generated admin invoices).
*   **`orderNumber`** (String, required): The internal human-readable tracking ID. Limited to 24 characters (`APP-XXXXXXXXX` or `SRV-XXXXXXXXX`) to comply with InecoBank limitations.
*   **`bankOrderId`** (String, optional): The UUID returned by InecoBank upon registration (`mdOrder`).
*   **`amountAMD`** (Number, required): The total checkout amount. (Multiplied by 100 before transmitting to the bank to represent Luma/cents).
*   **`currency`** (String): Defaults to `'051'` (Armenian Dram code).
*   **`status`** (Enum): The lifecycle state (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`).
*   **`bankErrorCode` / `bankErrorMessage`**: Audit fields that capture any rejection reasons from the bank.

*The schema implements a `toJSON` transformer to map `_id` to `id` to ensure compatibility with the React Admin CMS `GET_ONE` requirement.*

### B. Application Models
Both the `CoursesApplication` and `ServicesApplication` models were updated to include a **`paymentStatus`** field (Enum: `'PENDING' | 'PAID' | 'FAILED'`). This field natively reflects the payment state directly on the primary request documents.

## 3. API Endpoints Reference

### `POST /api/payments/checkout`
*   **Purpose:** Automatically registers a new payment session for an online lesson application.
*   **Payload:** `{ "applicationId": "mongo-object-id" }`
*   **Flow:** Finds the application, parses `totalPriceAMD`, creates a `Payment` document, and calls `register.do` at InecoBank.
*   **Response:** `{ "formUrl": "https://pg.inecoecom.am/..." }`

### `POST /api/payments/create-service-invoice`
*   **Purpose:** Invoked by administrators in the CRM to generate a manual invoice for a custom service.
*   **Payload:** `{ "serviceApplicationId": "mongo-object-id", "amountAMD": 10000 }`
*   **Flow:** Creates a `Payment` document in a `PENDING` state linked to the service application. Does *not* immediately hit the bank API (to prevent the URL from expiring).
*   **Response:** `{ "paymentUrl": "http://localhost:3000/checkout/service?id=paymentId", "paymentId": "paymentId" }`

### `POST /api/payments/initiate-service`
*   **Purpose:** Client-triggered registration to begin the hosted payment flow for a manual invoice.
*   **Payload:** `{ "paymentId": "mongo-object-id" }`
*   **Flow:** Validates the existing `PENDING` invoice, calls `register.do`, maps the returned `orderId`, and returns the redirect URL.
*   **Response:** `{ "formUrl": "https://pg.inecoecom.am/..." }`

### `GET /api/payments/verify/:bankOrderId`
*   **Purpose:** Bank callback/status validation endpoint.
*   **Path Parameter:** The `bankOrderId` (also referred to as `mdOrder` or `paymentID` by the frontend).
*   **Flow:** Performs a server-to-server call to InecoBank's `getOrderStatusExtended.do`. Parses the returned `orderStatus` (2 = Success, 4 = Refunded, 6 = Declined). Updates the `Payment` document. Dynamically detects if it is linked to `CoursesApplication` or `ServicesApplication` and updates the respective `paymentStatus` to `PAID`.
*   **Response:** `{ "status": "COMPLETED" | "FAILED" }`

### `GET /api/payments/:id`
*   **Purpose:** Protected endpoint for the React Admin CMS to fetch single payment audit trails.
*   **Protection:** Requires JWT + ADMIN Role.
*   **Note:** Returns the raw JSON representation of the payment without wrapping it in an arbitrary `data` object, adhering strictly to the `ra-data-simple-rest` data provider specification.

## 4. Background Tasks

### CronService (`services/cronService.ts`)
A `node-cron` scheduled worker runs at an interval of `*/15 * * * *` (every 15 minutes).
*   **Objective:** Prevents users from getting "stuck" if they abandon the bank gateway without clicking "Return to Merchant."
*   **Condition:** Scans the database for any `Payment` records where `status = PENDING` and the `createdAt` timestamp is older than 30 minutes.
*   **Action:** Triggers the `verify` flow on the orphaned transactions. If the bank returns an unpaid/expired status, the transaction is forcefully marked as `FAILED`, releasing the lock on the application.
