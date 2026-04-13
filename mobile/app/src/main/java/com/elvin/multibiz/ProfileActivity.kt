package com.elvin.multibiz

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import coil.load
import coil.transform.CircleCropTransformation
import com.elvin.multibiz.utils.SessionManager
import com.elvin.multibiz.utils.setupBottomNav
import com.google.android.material.button.MaterialButton
import com.google.android.material.imageview.ShapeableImageView
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class ProfileActivity : AppCompatActivity() {

    private lateinit var ivProfilePicture: ShapeableImageView

    // ── Gallery Picker ────────────────────────────────────────────────────────
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            uploadProfilePicture(uri)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        // Bottom navigation
        setupBottomNav(this, findViewById(R.id.bottomNav), R.id.nav_tab_profile)

        // Avatar view
        ivProfilePicture = findViewById(R.id.ivProfilePicture)

        // Edit avatar button — open native gallery
        findViewById<View>(R.id.btnEditAvatar).setOnClickListener {
            pickImageLauncher.launch("image/*")
        }

        // Action buttons
        findViewById<MaterialButton>(R.id.btnChangePassword).setOnClickListener {
            startActivity(Intent(this, ChangePasswordActivity::class.java))
        }
        findViewById<MaterialButton>(R.id.btnLogout).setOnClickListener {
            performLogout()
        }

        fetchProfile()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    private fun fetchProfile() {
        val authHeader = SessionManager.getAuthHeader(this) ?: run {
            showToast("Session expired. Please log in again.")
            performLogout()
            return
        }

        lifecycleScope.launch {
            try {
                val response = ApiClient.api.getUserProfile(authHeader)
                if (response.isSuccessful && response.body()?.success == true) {
                    val profile = response.body()?.data ?: return@launch
                    bindProfile(profile)
                } else {
                    showToast("Failed to load profile. Please try again.")
                }
            } catch (e: Exception) {
                showToast("Connection error. Could not load profile.")
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BIND DATA TO VIEWS
    // ─────────────────────────────────────────────────────────────────────────

    private fun bindProfile(profile: UserProfile) {
        // Profile picture — load via Coil with circle crop, fallback to orange icon
        val picUrl = profile.profilePictureUrl
        if (!picUrl.isNullOrEmpty()) {
            ivProfilePicture.load(picUrl) {
                crossfade(true)
                transformations(CircleCropTransformation())
                error(android.R.drawable.ic_menu_gallery)
            }
            // Remove the orange tint once a real image is loaded
            ivProfilePicture.imageTintList = null
            
            // Set click listener to open full-screen zoomable viewer
            ivProfilePicture.setOnClickListener {
                ImagePreviewDialog.newInstance(picUrl)
                    .show(supportFragmentManager, ImagePreviewDialog.TAG)
            }
        } else {
            ivProfilePicture.setOnClickListener {
                showToast("No profile picture uploaded.")
            }
        }

        // Text fields
        val fullName = "${profile.firstname.orEmpty()} ${profile.lastname.orEmpty()}".trim()
        findViewById<TextView>(R.id.tvProfileName).text =
            if (fullName.isNotEmpty()) fullName else "Unknown Staff"
        findViewById<TextView>(R.id.tvProfileEmail).text = profile.email
        findViewById<TextView>(R.id.tvEmployeeId).text = formatEmployeeId(profile.id)
        findViewById<TextView>(R.id.tvRole).text = profile.role
            .lowercase()
            .replaceFirstChar { it.uppercase() }
        findViewById<TextView>(R.id.tvDateJoined).text = formatDate(profile.createdAt)
        findViewById<TextView>(R.id.tvAssignedBusiness).text =
            profile.assignedBusiness ?: "Not Assigned"
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPLOAD PROFILE PICTURE
    // ─────────────────────────────────────────────────────────────────────────

    private fun uploadProfilePicture(uri: Uri) {
        val authHeader = SessionManager.getAuthHeader(this) ?: return

        lifecycleScope.launch {
            try {
                showToast("Uploading profile picture...")

                // Read bytes from the selected image URI
                val inputStream = contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes()
                inputStream?.close()

                if (bytes == null) {
                    showToast("Could not read image. Please try again.")
                    return@launch
                }

                // Determine MIME type
                val mimeType = contentResolver.getType(uri) ?: "image/jpeg"
                val extension = mimeType.substringAfter("/")
                val fileName = "profile_${System.currentTimeMillis()}.$extension"

                // Build the multipart part
                val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
                val part = MultipartBody.Part.createFormData("file", fileName, requestBody)

                val response = ApiClient.api.uploadProfilePicture(authHeader, part)

                if (response.isSuccessful && response.body()?.success == true) {
                    showToast("Profile picture updated!")
                    // Re-fetch full profile to refresh the avatar with the new URL
                    fetchProfile()
                } else {
                    showToast("Upload failed. Please try again.")
                }
            } catch (e: Exception) {
                showToast("Connection error. Upload failed.")
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORMATTING HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Formats a full UUID into "MB-XXXX" display format.
     * Example: "83ecfcfb-941a-481c-a07c-f7bfa8a53e9e" → "MB-941A"
     */
    private fun formatEmployeeId(uuid: String): String {
        return try {
            "MB-${uuid.split("-")[1].uppercase()}"
        } catch (e: Exception) {
            "MB-N/A"
        }
    }

    /**
     * Parses ISO datetime → "Oct 24, 2023" using legacy SimpleDateFormat logic 
     * to support API levels below 26 without core library desugaring.
     */
    private fun formatDate(raw: String): String {
        return try {
            val formatInput = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
            val formatOutput = java.text.SimpleDateFormat("MMM d, yyyy", java.util.Locale.getDefault())
            val date = formatInput.parse(raw.substring(0, 19))
            if (date != null) formatOutput.format(date) else raw
        } catch (e: Exception) {
            raw
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────────────────────────────────

    private fun performLogout() {
        SessionManager.clearSession(this)
        Toast.makeText(this, "Logging out...", Toast.LENGTH_SHORT).show()
        startActivity(Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }

    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
