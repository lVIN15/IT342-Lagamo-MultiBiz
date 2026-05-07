package com.elvin.multibiz.profile

import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.LayoutInflater
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.elvin.multibiz.common.ApiClient
import com.elvin.multibiz.common.ChangePasswordRequest
import com.elvin.multibiz.common.SessionManager
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject

class ChangePasswordActivity : AppCompatActivity() {

    private lateinit var etCurrentPassword: TextInputEditText
    private lateinit var etNewPassword: TextInputEditText
    private lateinit var etConfirmNewPassword: TextInputEditText

    // Security Rules Indicators
    private lateinit var imgReqLength: ImageView
    private lateinit var imgReqNumber: ImageView
    private lateinit var imgReqSpecial: ImageView

    private lateinit var tvReqLength: TextView
    private lateinit var tvReqNumber: TextView
    private lateinit var tvReqSpecial: TextView

    private var reqLengthMet = false
    private var reqNumberMet = false
    private var reqSpecialMet = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_change_password)

        // Setup Top Toolbar Navigation
        findViewById<MaterialToolbar>(R.id.topToolbar).setNavigationOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }

        etCurrentPassword = findViewById(R.id.etCurrentPassword)
        etNewPassword = findViewById(R.id.etNewPassword)
        etConfirmNewPassword = findViewById(R.id.etConfirmNewPassword)

        imgReqLength = findViewById(R.id.imgReqLength)
        imgReqNumber = findViewById(R.id.imgReqNumber)
        imgReqSpecial = findViewById(R.id.imgReqSpecial)

        tvReqLength = findViewById(R.id.tvReqLength)
        tvReqNumber = findViewById(R.id.tvReqNumber)
        tvReqSpecial = findViewById(R.id.tvReqSpecial)

        setupLiveValidation()

        findViewById<MaterialButton>(R.id.btnUpdatePassword).setOnClickListener {
            attemptPasswordUpdate()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIVE VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    private fun setupLiveValidation() {
        etNewPassword.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                val input = s.toString()

                // Check 1: At least 8 chars
                reqLengthMet = input.length >= 8
                updateRequirementUI(imgReqLength, tvReqLength, reqLengthMet, false)

                // Check 2: Contains number
                reqNumberMet = input.any { it.isDigit() }
                updateRequirementUI(imgReqNumber, tvReqNumber, reqNumberMet, false)

                // Check 3: Contains special char (!@#$%)
                val specialRegex = Regex("[!@#\$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]")
                reqSpecialMet = specialRegex.containsMatchIn(input)
                updateRequirementUI(imgReqSpecial, tvReqSpecial, reqSpecialMet, false)
            }
        })
    }

    private fun updateRequirementUI(imageView: ImageView, textView: TextView, isMet: Boolean, hasError: Boolean) {
        if (isMet) {
            imageView.setImageResource(android.R.drawable.presence_online) // Represents a check/circle
            imageView.setColorFilter(Color.parseColor("#2E7D32")) // Success Green
            textView.setTextColor(Color.parseColor("#2E7D32")) // Success Green text
        } else if (hasError) {
            imageView.setImageResource(android.R.drawable.presence_invisible) // Empty grey circle
            imageView.setColorFilter(Color.parseColor("#D8000C")) // Error Red
            textView.setTextColor(Color.parseColor("#D8000C")) // Error Red text
        } else {
            imageView.setImageResource(android.R.drawable.presence_invisible) // Empty grey circle
            imageView.setColorFilter(Color.parseColor("#9E9E9E")) // Default Grey
            textView.setTextColor(Color.parseColor("#555555")) // Default Dark Grey text
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASSWORD UPDATE SUBMISSION
    // ─────────────────────────────────────────────────────────────────────────

    private fun attemptPasswordUpdate() {
        val current = etCurrentPassword.text.toString()
        val newPass = etNewPassword.text.toString()
        val confirm = etConfirmNewPassword.text.toString()

        if (current.isEmpty() || newPass.isEmpty() || confirm.isEmpty()) {
            showCustomToast("Please fill in all password fields.", isSuccess = false)
            return
        }

        if (current == newPass) {
            showCustomToast("New password cannot be the same as the current password.", isSuccess = false)
            return
        }

        if (!reqLengthMet || !reqNumberMet || !reqSpecialMet) {
            showCustomToast("Please meet all security requirements.", isSuccess = false)
            if (!reqLengthMet) updateRequirementUI(imgReqLength, tvReqLength, isMet = false, hasError = true)
            if (!reqNumberMet) updateRequirementUI(imgReqNumber, tvReqNumber, isMet = false, hasError = true)
            if (!reqSpecialMet) updateRequirementUI(imgReqSpecial, tvReqSpecial, isMet = false, hasError = true)
            return
        }

        if (newPass != confirm) {
            showCustomToast("New passwords do not match.", isSuccess = false)
            return
        }

        val authHeader = SessionManager.getAuthHeader(this) ?: run {
            showCustomToast("Session expired.", isSuccess = false)
            return
        }

        val btnUpdatePassword = findViewById<MaterialButton>(R.id.btnUpdatePassword)
        btnUpdatePassword.isEnabled = false
        btnUpdatePassword.text = "Updating..."

        // Call API
        lifecycleScope.launch {
            try {
                val req = ChangePasswordRequest(currentPassword = current, newPassword = newPass)
                val response = ApiClient.api.changePassword(authHeader, req)

                if (response.isSuccessful) {
                    showCustomToast("Password updated successfully!", isSuccess = true)
                    delay(1500) // Give user time to read the toast
                    finish()
                } else {
                    btnUpdatePassword.isEnabled = true
                    btnUpdatePassword.text = "Update Password"
                    
                    // Parse the error message if the API returns 400 Bad Request
                    val errString = response.errorBody()?.string()
                    val msg = try {
                        val json = errString?.let { JSONObject(it) }
                        json?.getJSONObject("error")?.getString("message") ?: "Update failed."
                    } catch (e: Exception) {
                        "Incorrect current password." // Fallback specifically targeting the most common failure
                    }
                    showCustomToast(msg, isSuccess = false)
                }
            } catch (e: Exception) {
                btnUpdatePassword.isEnabled = true
                btnUpdatePassword.text = "Update Password"
                showCustomToast("Connection error. Could not connect to backend.", isSuccess = false)
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CUSTOM TOAST UI HELPER (Red for error, Green for success)
    // ─────────────────────────────────────────────────────────────────────────

    private fun showCustomToast(message: String, isSuccess: Boolean) {
        val layout = LayoutInflater.from(this).inflate(R.layout.custom_toast, null)
        val toastCard = layout.findViewById<MaterialCardView>(R.id.toast_card)
        val toastIcon = layout.findViewById<ImageView>(R.id.toast_icon)
        val toastText = layout.findViewById<TextView>(R.id.toast_text)

        toastText.text = message

        if (isSuccess) {
            toastCard.setCardBackgroundColor(Color.parseColor("#E8F5E9"))
            toastIcon.setImageResource(android.R.drawable.presence_online) // Checkmark equiv
            toastIcon.setColorFilter(Color.parseColor("#2E7D32"))
            toastText.setTextColor(Color.parseColor("#2E7D32"))
        } else {
            toastCard.setCardBackgroundColor(Color.parseColor("#FFF0F0"))
            toastIcon.setImageResource(android.R.drawable.ic_dialog_alert) // Alert equiv
            toastIcon.setColorFilter(Color.parseColor("#D8000C"))
            toastText.setTextColor(Color.parseColor("#D8000C"))
        }

        with(Toast(applicationContext)) {
            duration = Toast.LENGTH_SHORT
            setGravity(Gravity.TOP or Gravity.CENTER_HORIZONTAL, 0, 150)
            view = layout
            show()
        }
    }
}

