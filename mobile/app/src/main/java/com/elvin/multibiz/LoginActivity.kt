package com.elvin.multibiz

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.graphics.toColorInt
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import retrofit2.Response

class LoginActivity : AppCompatActivity() {

    private lateinit var etEmail: TextInputEditText
    private lateinit var etPassword: TextInputEditText
    private lateinit var btnLogin: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)

        btnLogin.setOnClickListener {
            performLogin()
        }
    }

    @SuppressLint("SetTextI18n")
    private fun performLogin() {
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString()

        if (email.isEmpty() || password.isEmpty()) {
            showCustomToast("Please enter both email and password.", false)
            return
        }

        btnLogin.isEnabled = false
        btnLogin.text = "Logging in..."

        lifecycleScope.launch {
            try {
                val request = LoginRequest(email, password)
                val response: Response<ApiResponse<ContentData>> = ApiClient.api.login("android", request)

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true && body.data != null) {
                        showCustomToast("Welcome back, ${body.data.user.firstname}!", true)
                        // Wait for 1.5 seconds so the user can see the success popup
                        delay(1500)
                        val intent = Intent(this@LoginActivity, HomeActivity::class.java)
                        startActivity(intent)
                        finish()
                    } else {
                        val errMsg = body?.error?.message ?: "Invalid credentials. Please check your email and password and try again."
                        showCustomToast(errMsg, false)
                        resetButton()
                    }
                } else {
                    var errorMsg = "Invalid credentials. Please check your email and password and try again."
                    try {
                        val errorJson = response.errorBody()?.string()
                        if (!errorJson.isNullOrEmpty()) {
                            // Convert the JSON error body to our model using Gson
                            val errorBody = Gson().fromJson(errorJson, ApiResponse::class.java)
                            if (errorBody?.error?.message != null) {
                                errorMsg = errorBody.error.message.toString()
                            }
                        }
                    } catch (_: Exception) {
                        // Fallback message persists
                    }
                    showCustomToast(errorMsg, false)
                    resetButton()
                }
            } catch (_: Exception) {
                showCustomToast("Could not connect to the server. Please check your connection.", false)
                resetButton()
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun showCustomToast(message: String, isSuccess: Boolean) {
        @SuppressLint("InflateParams")
        val layout: View = layoutInflater.inflate(R.layout.custom_toast, null)
        val card = layout.findViewById<MaterialCardView>(R.id.toast_card)
        val text = layout.findViewById<TextView>(R.id.toast_text)
        val icon = layout.findViewById<ImageView>(R.id.toast_icon)

        text.text = message

        if (isSuccess) {
            card.setCardBackgroundColor("#E8F5E9".toColorInt()) // Light Green
            text.setTextColor("#2E7D32".toColorInt()) // Dark Green
            icon.setImageResource(android.R.drawable.checkbox_on_background)
            icon.setColorFilter("#2E7D32".toColorInt())
        } else {
            card.setCardBackgroundColor("#FFEBEE".toColorInt()) // Light Red
            text.setTextColor("#C62828".toColorInt()) // Dark Red
            icon.setImageResource(android.R.drawable.ic_dialog_info)
            icon.setColorFilter("#C62828".toColorInt())
        }

        val toast = Toast(this@LoginActivity)
        // Position at the VERY top (yOffset 100) to ensure visibility above all UI cards
        toast.setGravity(Gravity.TOP or Gravity.CENTER_HORIZONTAL, 0, 100)
        toast.duration = Toast.LENGTH_LONG
        toast.view = layout
        toast.show()
    }

    @SuppressLint("SetTextI18n")
    private fun resetButton() {
        btnLogin.isEnabled = true
        btnLogin.text = "Staff Login"
    }
}