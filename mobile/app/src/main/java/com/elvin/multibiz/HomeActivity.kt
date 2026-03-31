package com.elvin.multibiz

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.elvin.multibiz.utils.setupBottomNav

class HomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        // Wire up the reusable bottom navigation, highlight Home as active
        val bottomNav = findViewById<android.view.View>(R.id.bottomNav)
        setupBottomNav(this, bottomNav, R.id.nav_tab_home)
    }
}
