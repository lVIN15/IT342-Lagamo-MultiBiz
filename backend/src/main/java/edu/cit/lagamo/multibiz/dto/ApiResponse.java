package edu.cit.lagamo.multibiz.dto;

import java.time.Instant;

/**
 * Generic SDD response envelope.
 *
 * <pre>
 * {
 *   "success": boolean,
 *   "data": T | null,
 *   "error": { "code": string, "message": string, "details": object|null } | null,
 *   "timestamp": "ISO-8601"
 * }
 * </pre>
 */
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorPayload error;
    private String timestamp;

    // ── Constructors ──────────────────────────────────────────────────────────

    private ApiResponse() {
        this.timestamp = Instant.now().toString();
    }

    // ── Static factory methods ────────────────────────────────────────────────

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.success = true;
        r.data    = data;
        r.error   = null;
        return r;
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        ApiResponse<T> r = new ApiResponse<>();
        r.success = false;
        r.data    = null;
        r.error   = new ErrorPayload(code, message, null);
        return r;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public boolean isSuccess()      { return success; }
    public T getData()              { return data; }
    public ErrorPayload getError()  { return error; }
    public String getTimestamp()    { return timestamp; }

    // ── Inner class ───────────────────────────────────────────────────────────

    public static class ErrorPayload {
        private String code;
        private String message;
        private Object details;

        public ErrorPayload(String code, String message, Object details) {
            this.code    = code;
            this.message = message;
            this.details = details;
        }

        public String getCode()    { return code; }
        public String getMessage() { return message; }
        public Object getDetails() { return details; }
    }
}
