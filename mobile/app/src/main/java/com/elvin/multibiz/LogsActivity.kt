package com.elvin.multibiz

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.elvin.multibiz.utils.setupBottomNav

class LogsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_logs)

        // Wire up the reusable bottom navigation, highlight Logs as active
        val bottomNav = findViewById<android.view.View>(R.id.bottomNav)
        setupBottomNav(this, bottomNav, R.id.nav_tab_logs)

        // Set up Mock Data for the Logs List
        val recyclerView = findViewById<RecyclerView>(R.id.recyclerViewLogs)
        recyclerView.layoutManager = LinearLayoutManager(this)

        val mockData = listOf(
            LogItem("Speedy Carwash", "10:30 AM", "+ ₱450.00"),
            LogItem("Speedy Carwash", "10:15 AM", "+ ₱1,200.00"),
            LogItem("Speedy Carwash", "09:45 AM", "+ ₱350.00"),
            LogItem("Speedy Carwash", "09:12 AM", "+ ₱2,500.00"),
            LogItem("Speedy Carwash", "08:55 AM", "+ ₱150.00"),
            LogItem("Speedy Carwash", "08:30 AM", "+ ₱890.00"),
            LogItem("Speedy Carwash", "08:15 AM", "+ ₱450.00"),
            LogItem("Speedy Carwash", "08:05 AM", "+ ₱600.00")
        )

        val adapter = LogsAdapter(mockData)
        recyclerView.adapter = adapter
    }
}

