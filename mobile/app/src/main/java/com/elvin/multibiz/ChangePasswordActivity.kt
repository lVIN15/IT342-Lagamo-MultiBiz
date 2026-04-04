package com.elvin.multibiz

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText

class ChangePasswordActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_change_password)

        // Setup Top Toolbar Back Navigation
        val topToolbar = findViewById<MaterialToolbar>(R.id.topToolbar)
        topToolbar.setNavigationOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }

        val etCurrentPassword = findViewById<TextInputEditText>(R.id.etCurrentPassword)
        val etNewPassword = findViewById<TextInputEditText>(R.id.etNewPassword)
        val etConfirmNewPassword = findViewById<TextInputEditText>(R.id.etConfirmNewPassword)
        val btnUpdatePassword = findViewById<MaterialButton>(R.id.btnUpdatePassword)

        btnUpdatePassword.setOnClickListener {
            val current = etCurrentPassword.text.toString()
            val newPass = etNewPassword.text.toString()
            val confirm = etConfirmNewPassword.text.toString()

            if (current.isEmpty() || newPass.isEmpty() || confirm.isEmpty()) {
                Toast.makeText(this, "Please fill in all password fields.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (newPass != confirm) {
                Toast.makeText(this, "New passwords do not match.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Placeholder for API Call
            Toast.makeText(this, "Password updated successfully!", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}
