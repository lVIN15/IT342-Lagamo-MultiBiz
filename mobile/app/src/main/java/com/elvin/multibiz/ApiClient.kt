package com.elvin.multibiz

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

// 1. Data Classes for request/response
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

data class ApiError(
    val code: String,
    val message: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiError?
)

// 2. Api Interface
interface MultiBizApi {
    @POST("api/auth/login")
    suspend fun login(
        @Header("X-Platform") platform: String,
        @Body request: LoginRequest
    ): retrofit2.Response<ApiResponse<ContentData>>
}

// 3. Retrofit Singleton
object ApiClient {
    // Replaced 10.0.2.2 with local network IP for physical device testing
    private const val BASE_URL = "http://192.168.1.99:8080/"

    val api: MultiBizApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(MultiBizApi::class.java)
    }
}
