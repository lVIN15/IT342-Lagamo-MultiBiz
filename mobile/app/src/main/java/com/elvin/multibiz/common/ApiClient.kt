package com.elvin.multibiz.common

import com.elvin.multibiz.R

import okhttp3.Interceptor
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

// ═══════════════════════════════════════════════════════════════════════════
// 1. DATA CLASSES — Request / Response Models (aligned with SDD contracts)
// ═══════════════════════════════════════════════════════════════════════════

// ── Auth ────────────────────────────────────────────────────────────────────

data class LoginRequest(
    val email: String,
    val password: String
)

data class User(
    val id: String,
    val email: String,
    val firstname: String?,
    val lastname: String?,
    val role: String
)

data class ContentData(
    val user: User,
    val accessToken: String,
    val refreshToken: String
)

// ── Generic Envelope ────────────────────────────────────────────────────────

data class ApiError(
    val code: String,
    val message: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiError?
)

// ── Transaction ─────────────────────────────────────────────────────────────

data class TransactionRequest(
    val businessId: String,
    val amount: Double,
    val description: String
)

data class TransactionResponse(
    val transactionId: String,
    val status: String
)

data class ReceiptUploadResponse(
    val transactionId: String,
    val receiptUrl: String,
    val status: String
)

// ── Business (assigned to staff) ────────────────────────────────────────────

data class AssignedBusiness(
    val id: String,
    val name: String,
    val category: String?,
    val description: String?
)

// ── Transaction Log (for Logs page) ─────────────────────────────────────────

data class TransactionStaff(
    val id: String,
    val firstname: String?,
    val lastname: String?
)

data class TransactionLog(
    val id: String,
    val amount: Double,
    val description: String?,
    val status: String?,
    val receiptUrl: String?,
    val createdAt: String,
    val staff: TransactionStaff?
)

// ── User Profile ───────────────────────────────────────────────────

data class UserProfile(
    val id: String,
    val firstname: String?,
    val lastname: String?,
    val email: String,
    val role: String,
    val createdAt: String,
    val assignedBusiness: String?,
    val profilePictureUrl: String?
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

// ═══════════════════════════════════════════════════════════════════════════
// 2. API INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface MultiBizApi {

    // ── Auth ─────────────────────────────────────────────────────────────────

    @POST("api/auth/login")
    suspend fun login(
        @Header("X-Platform") platform: String,
        @Body request: LoginRequest
    ): retrofit2.Response<ApiResponse<ContentData>>

    // ── Businesses (Staff Assignments) ───────────────────────────────────────

    @GET("api/v1/businesses/my-assignments")
    suspend fun getMyAssignments(
        @Header("Authorization") auth: String
    ): retrofit2.Response<ApiResponse<List<AssignedBusiness>>>

    @GET("api/v1/users/me")
    suspend fun getUserProfile(
        @Header("Authorization") auth: String
    ): retrofit2.Response<ApiResponse<UserProfile>>

    @Multipart
    @POST("api/v1/users/me/profile-picture")
    suspend fun uploadProfilePicture(
        @Header("Authorization") auth: String,
        @Part file: okhttp3.MultipartBody.Part
    ): retrofit2.Response<ApiResponse<Map<String, String>>>

    @PUT("api/v1/users/me/password")
    suspend fun changePassword(
        @Header("Authorization") auth: String,
        @Body request: ChangePasswordRequest
    ): retrofit2.Response<ApiResponse<Void>>

    @GET("api/v1/transactions/business/{businessId}")
    suspend fun getTransactionsByBusiness(
        @Header("Authorization") auth: String,
        @Path("businessId") businessId: String
    ): retrofit2.Response<ApiResponse<List<TransactionLog>>>

    // ── Transactions ─────────────────────────────────────────────────────────

    @POST("api/v1/transactions")
    suspend fun logTransaction(
        @Header("Authorization") auth: String,
        @Body request: TransactionRequest
    ): retrofit2.Response<ApiResponse<TransactionResponse>>

    @Multipart
    @POST("api/v1/transactions/{id}/upload")
    suspend fun uploadReceipt(
        @Header("Authorization") auth: String,
        @Path("id") transactionId: String,
        @Part file: MultipartBody.Part
    ): retrofit2.Response<ApiResponse<ReceiptUploadResponse>>
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. RETROFIT SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

object ApiClient {
    // Replace with your backend's actual host/IP
    private const val BASE_URL = "http://192.168.1.99:8080/"

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(Interceptor { chain ->
                val original = chain.request()
                // Add X-Platform header to every request for mobile identification
                val request = original.newBuilder()
                    .header("X-Platform", "android")
                    .build()
                chain.proceed(request)
            })
            .build()
    }

    val api: MultiBizApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(MultiBizApi::class.java)
    }
}
