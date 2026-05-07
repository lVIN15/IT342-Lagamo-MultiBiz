package com.elvin.multibiz.home

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.graphics.toColorInt
import androidx.lifecycle.lifecycleScope
import com.elvin.multibiz.auth.LoginActivity
import com.elvin.multibiz.common.ApiClient
import com.elvin.multibiz.common.ApiResponse
import com.elvin.multibiz.common.TransactionRequest
import com.elvin.multibiz.common.SessionManager
import com.elvin.multibiz.common.setupBottomNav
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class HomeActivity : AppCompatActivity() {

    // ── Views ────────────────────────────────────────────────────────────────
    private lateinit var tvAssignedBusiness: TextView
    private lateinit var etIncomeAmount: TextInputEditText
    private lateinit var etDescription: TextInputEditText
    private lateinit var uploadArea: FrameLayout
    private lateinit var uploadPlaceholder: LinearLayout
    private lateinit var imgPreview: ImageView
    private lateinit var btnSaveIncome: MaterialButton

    // ── State ────────────────────────────────────────────────────────────────
    private var assignedBusinessId: String? = null
    private var selectedImageUri: Uri? = null
    private var cameraImageUri: Uri? = null
    private var currentPhotoFile: File? = null

    // ── Activity Result Launchers ────────────────────────────────────────────

    /** Handles gallery image selection result */
    private val galleryLauncher =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
            uri?.let {
                selectedImageUri = it
                currentPhotoFile = null // Reset camera file since gallery is used
                showImagePreview(it)
            }
        }

    /** Handles camera capture result */
    private val cameraLauncher =
        registerForActivityResult(ActivityResultContracts.TakePicture()) { success: Boolean ->
            if (success && cameraImageUri != null) {
                selectedImageUri = cameraImageUri
                showImagePreview(cameraImageUri!!)
            } else {
                currentPhotoFile = null
            }
        }

    /** Handles camera permission request result */
    private val cameraPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted: Boolean ->
            if (granted) {
                launchCamera()
            } else {
                showCustomToast("Camera permission is required to take photos.", false)
            }
        }

    // ═════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═════════════════════════════════════════════════════════════════════════

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        // Wire up the reusable bottom navigation, highlight Home as active
        val bottomNav = findViewById<View>(R.id.bottomNav)
        setupBottomNav(this, bottomNav, R.id.nav_tab_home)

        // ── Bind Views ──────────────────────────────────────────────────────
        tvAssignedBusiness = findViewById(R.id.tvAssignedBusiness)
        etIncomeAmount     = findViewById(R.id.etIncomeAmount)
        etDescription      = findViewById(R.id.etDescription)
        uploadArea         = findViewById(R.id.uploadArea)
        uploadPlaceholder  = findViewById(R.id.uploadPlaceholder)
        imgPreview         = findViewById(R.id.imgPreview)
        btnSaveIncome      = findViewById(R.id.btnSaveIncome)

        // ── Setup Listeners ─────────────────────────────────────────────────
        uploadArea.setOnClickListener { showImagePickerDialog() }
        btnSaveIncome.setOnClickListener { saveIncomeRecord() }

        // ── Fetch Assigned Business ─────────────────────────────────────────
        fetchAssignedBusiness()
    }

    // ═════════════════════════════════════════════════════════════════════════
    // NETWORK — Fetch assigned business
    // ═════════════════════════════════════════════════════════════════════════

    private fun fetchAssignedBusiness() {
        val authHeader = SessionManager.getAuthHeader(this)
        if (authHeader == null) {
            redirectToLogin()
            return
        }

        lifecycleScope.launch {
            try {
                val response = ApiClient.api.getMyAssignments(authHeader)

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true && !body.data.isNullOrEmpty()) {
                        // Single assignment per staff — take the first
                        val business = body.data[0]
                        assignedBusinessId = business.id
                        tvAssignedBusiness.text = business.name
                    } else {
                        tvAssignedBusiness.text = "No business assigned"
                    }
                } else if (response.code() == 401) {
                    redirectToLogin()
                } else {
                    tvAssignedBusiness.text = "Unable to load"
                }
            } catch (_: Exception) {
                tvAssignedBusiness.text = "Connection error"
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // NETWORK — Save Income Record (two-step: transaction + receipt upload)
    // ═════════════════════════════════════════════════════════════════════════

    @SuppressLint("SetTextI18n")
    private fun saveIncomeRecord() {
        // ── Validate fields ─────────────────────────────────────────────────
        val amountText = etIncomeAmount.text.toString().trim()
        val description = etDescription.text.toString().trim()

        if (amountText.isEmpty()) {
            showCustomToast("Please enter an income amount.", false)
            return
        }

        val amount = amountText.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            showCustomToast("Amount must be a positive number.", false)
            return
        }

        if (description.isEmpty()) {
            showCustomToast("Please add a description.", false)
            return
        }

        if (assignedBusinessId == null) {
            showCustomToast("No business assigned. Contact your administrator.", false)
            return
        }

        val authHeader = SessionManager.getAuthHeader(this)
        if (authHeader == null) {
            redirectToLogin()
            return
        }

        // ── Disable button while processing ─────────────────────────────────
        btnSaveIncome.isEnabled = false
        btnSaveIncome.text = "Saving..."

        lifecycleScope.launch {
            try {
                // ── STEP 1: Log Transaction ─────────────────────────────────
                val txRequest = TransactionRequest(
                    businessId  = assignedBusinessId!!,
                    amount      = amount,
                    description = description
                )

                val txResponse = ApiClient.api.logTransaction(authHeader, txRequest)

                if (!txResponse.isSuccessful) {
                    handleErrorResponse(txResponse.code(), txResponse.errorBody()?.string())
                    resetSaveButton()
                    return@launch
                }

                val txBody = txResponse.body()
                if (txBody?.success != true || txBody.data == null) {
                    showCustomToast(txBody?.error?.message ?: "Failed to log transaction.", false)
                    resetSaveButton()
                    return@launch
                }

                val transactionId = txBody.data.transactionId

                // ── STEP 2: Upload Receipt (if image selected) ──────────────
                if (selectedImageUri != null) {
                    val uploadSuccess = uploadReceiptImage(authHeader, transactionId)
                    if (!uploadSuccess) {
                        // Transaction was saved but receipt failed —
                        // still show partial success
                        showCustomToast("Income saved, but receipt upload failed. You can retry later.", false)
                        clearForm()
                        resetSaveButton()
                        return@launch
                    }
                }

                // ── SUCCESS ─────────────────────────────────────────────────
                showCustomToast("Income record saved successfully!", true)
                clearForm()
                resetSaveButton()

            } catch (_: Exception) {
                showCustomToast("Could not connect to the server. Please check your connection.", false)
                resetSaveButton()
            }
        }
    }

    private suspend fun uploadReceiptImage(authHeader: String, transactionId: String): Boolean {
        return try {
            val imageFile = if (selectedImageUri == cameraImageUri && currentPhotoFile != null) {
                currentPhotoFile!! // Use the explicit literal file if taken from camera
            } else {
                getFileFromUri(selectedImageUri!!) ?: return false // Fallback for gallery resolver
            }

            val requestBody = imageFile.asRequestBody(
                contentResolver.getType(selectedImageUri!!)?.toMediaTypeOrNull()
                    ?: "image/jpeg".toMediaTypeOrNull()
            )
            val filePart = MultipartBody.Part.createFormData("file", imageFile.name, requestBody)

            val response = ApiClient.api.uploadReceipt(authHeader, transactionId, filePart)
            response.isSuccessful && response.body()?.success == true
        } catch (_: Exception) {
            false
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // IMAGE PICKER — Camera + Gallery Dialog
    // ═════════════════════════════════════════════════════════════════════════

    private fun showImagePickerDialog() {
        val options = arrayOf("Take Photo", "Choose from Gallery")
        AlertDialog.Builder(this)
            .setTitle("Upload Receipt")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> checkCameraPermissionAndLaunch()
                    1 -> galleryLauncher.launch("image/*")
                }
            }
            .show()
    }

    private fun checkCameraPermissionAndLaunch() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            launchCamera()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun launchCamera() {
        currentPhotoFile = File(cacheDir, "receipt_${System.currentTimeMillis()}.jpg")
        cameraImageUri = FileProvider.getUriForFile(
            this,
            "${applicationContext.packageName}.fileprovider",
            currentPhotoFile!!
        )
        cameraLauncher.launch(cameraImageUri!!)
    }

    private fun showImagePreview(uri: Uri) {
        uploadPlaceholder.visibility = View.GONE
        imgPreview.visibility = View.VISIBLE
        imgPreview.setImageURI(uri)
    }

    // ═════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Copies the content URI to a temporary file in the cache directory
     * so Retrofit can read it as a File for multipart upload.
     */
    private fun getFileFromUri(uri: Uri): File? {
        return try {
            val inputStream = contentResolver.openInputStream(uri) ?: return null
            val tempFile = File(cacheDir, "upload_${System.currentTimeMillis()}.jpg")
            tempFile.outputStream().use { output ->
                inputStream.copyTo(output)
            }
            inputStream.close()
            tempFile
        } catch (_: Exception) {
            null
        }
    }

    private fun handleErrorResponse(code: Int, errorJson: String?) {
        when (code) {
            401 -> {
                showCustomToast("Session expired. Please log in again.", false)
                redirectToLogin()
            }
            403 -> {
                var msg = "You are not authorized for this action."
                try {
                    if (!errorJson.isNullOrEmpty()) {
                        val errorBody = Gson().fromJson(errorJson, ApiResponse::class.java)
                        if (errorBody?.error?.message != null) {
                            msg = errorBody.error.message
                        }
                    }
                } catch (_: Exception) { /* fallback */ }
                showCustomToast(msg, false)
            }
            else -> {
                var msg = "An error occurred. Please try again."
                try {
                    if (!errorJson.isNullOrEmpty()) {
                        val errorBody = Gson().fromJson(errorJson, ApiResponse::class.java)
                        if (errorBody?.error?.message != null) {
                            msg = errorBody.error.message
                        }
                    }
                } catch (_: Exception) { /* fallback */ }
                showCustomToast(msg, false)
            }
        }
    }

    private fun clearForm() {
        etIncomeAmount.text?.clear()
        etDescription.text?.clear()
        selectedImageUri = null
        cameraImageUri = null
        imgPreview.visibility = View.GONE
        imgPreview.setImageDrawable(null)
        uploadPlaceholder.visibility = View.VISIBLE
    }

    @SuppressLint("SetTextI18n")
    private fun resetSaveButton() {
        btnSaveIncome.isEnabled = true
        btnSaveIncome.text = "Save Income Record"
    }

    private fun redirectToLogin() {
        SessionManager.clearSession(this)
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    // ═════════════════════════════════════════════════════════════════════════
    // CUSTOM TOAST (matching LoginActivity style)
    // ═════════════════════════════════════════════════════════════════════════

    @Suppress("DEPRECATION")
    private fun showCustomToast(message: String, isSuccess: Boolean) {
        @SuppressLint("InflateParams")
        val layout: View = layoutInflater.inflate(R.layout.custom_toast, null)
        val card = layout.findViewById<MaterialCardView>(R.id.toast_card)
        val text = layout.findViewById<TextView>(R.id.toast_text)
        val icon = layout.findViewById<ImageView>(R.id.toast_icon)

        text.text = message

        if (isSuccess) {
            card.setCardBackgroundColor("#E8F5E9".toColorInt())
            text.setTextColor("#2E7D32".toColorInt())
            icon.setImageResource(android.R.drawable.checkbox_on_background)
            icon.setColorFilter("#2E7D32".toColorInt())
        } else {
            card.setCardBackgroundColor("#FFEBEE".toColorInt())
            text.setTextColor("#C62828".toColorInt())
            icon.setImageResource(android.R.drawable.ic_dialog_info)
            icon.setColorFilter("#C62828".toColorInt())
        }

        val toast = Toast(this@HomeActivity)
        toast.setGravity(Gravity.TOP or Gravity.CENTER_HORIZONTAL, 0, 100)
        toast.duration = Toast.LENGTH_LONG
        toast.view = layout
        toast.show()
    }
}
