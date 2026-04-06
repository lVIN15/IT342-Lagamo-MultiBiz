package com.elvin.multibiz.utils

import android.content.Context
import android.content.SharedPreferences

/**
 * Centralized session manager using SharedPreferences.
 * Persists JWT tokens and basic user data across Activities.
 */
object SessionManager {

    private const val PREF_NAME = "multibiz_session"

    // Keys
    private const val KEY_ACCESS_TOKEN  = "access_token"
    private const val KEY_REFRESH_TOKEN = "refresh_token"
    private const val KEY_USER_ID       = "user_id"
    private const val KEY_EMAIL         = "email"
    private const val KEY_FIRSTNAME     = "firstname"
    private const val KEY_LASTNAME      = "lastname"
    private const val KEY_ROLE          = "role"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    // ── Save Login Data ─────────────────────────────────────────────────────

    fun saveSession(
        context: Context,
        accessToken: String,
        refreshToken: String,
        userId: String,
        email: String,
        firstname: String?,
        lastname: String?,
        role: String
    ) {
        prefs(context).edit()
            .putString(KEY_ACCESS_TOKEN,  accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .putString(KEY_USER_ID,       userId)
            .putString(KEY_EMAIL,         email)
            .putString(KEY_FIRSTNAME,     firstname ?: "")
            .putString(KEY_LASTNAME,      lastname ?: "")
            .putString(KEY_ROLE,          role)
            .apply()
    }

    // ── Getters ─────────────────────────────────────────────────────────────

    fun getAccessToken(context: Context): String? =
        prefs(context).getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(context: Context): String? =
        prefs(context).getString(KEY_REFRESH_TOKEN, null)

    /** Returns the Authorization header value: "Bearer <token>" */
    fun getAuthHeader(context: Context): String? {
        val token = getAccessToken(context) ?: return null
        return "Bearer $token"
    }

    fun getUserId(context: Context): String? =
        prefs(context).getString(KEY_USER_ID, null)

    fun getEmail(context: Context): String? =
        prefs(context).getString(KEY_EMAIL, null)

    fun getFirstname(context: Context): String? =
        prefs(context).getString(KEY_FIRSTNAME, null)

    fun getLastname(context: Context): String? =
        prefs(context).getString(KEY_LASTNAME, null)

    fun getRole(context: Context): String? =
        prefs(context).getString(KEY_ROLE, null)

    // ── Session State ───────────────────────────────────────────────────────

    fun isLoggedIn(context: Context): Boolean =
        getAccessToken(context) != null

    fun clearSession(context: Context) {
        prefs(context).edit().clear().apply()
    }
}
