package com.elvin.multibiz

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.elvin.multibiz.utils.setupBottomNav
import com.google.android.material.button.MaterialButton

class ProfileActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        // Initialize reusable bottom navigation
        val bottomNav: View = findViewById(R.id.bottomNav)
        setupBottomNav(this, bottomNav, R.id.nav_tab_profile)

        // Find Buttons
        val btnChangePassword = findViewById<MaterialButton>(R.id.btnChangePassword)
        val btnLogout = findViewById<MaterialButton>(R.id.btnLogout)

        // Implement Change Password Listener
        btnChangePassword.setOnClickListener {
            val intent = Intent(this, ChangePasswordActivity::class.java)
            startActivity(intent)
        }

        // Implement Log Out Listener
        btnLogout.setOnClickListener {
            performLogout()
        }
    }

    /**
     * Clears all session related data and returns the user to the Login screen.
     * It clears the activity stack to prevent the user from going back to the profile.
     */
    private fun performLogout() {
        Toast.makeText(this, "Logging out...", Toast.LENGTH_SHORT).show()

        val intent = Intent(this, LoginActivity::class.java)
        // Clear all previous activities from the back stack
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
