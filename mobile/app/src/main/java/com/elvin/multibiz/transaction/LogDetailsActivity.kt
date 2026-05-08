package com.elvin.multibiz.transaction

import com.elvin.multibiz.R

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class LogDetailsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_log_details)

        setupToolbar()
        bindDataFromIntent()
    }

    private fun setupToolbar() {
        val btnBack = findViewById<android.widget.ImageView>(R.id.btnBack)
        btnBack.setOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }
    }

    private fun bindDataFromIntent() {
        val location    = intent.getStringExtra("EXTRA_LOCATION")    ?: "Unknown Location"
        val amount      = intent.getStringExtra("EXTRA_AMOUNT")      ?: "₱0.00"
        val description = intent.getStringExtra("EXTRA_DESCRIPTION") ?: "No description provided."
        val date        = intent.getStringExtra("EXTRA_DATE")        ?: "Unknown Date"
        val time        = intent.getStringExtra("EXTRA_TIME")        ?: ""
        val receiptUrl  = intent.getStringExtra("EXTRA_RECEIPT_URL") ?: ""

        val tvLocationValue = findViewById<android.widget.TextView>(R.id.tvLocationValue)
        val tvIncomeAmount  = findViewById<android.widget.TextView>(R.id.tvIncomeAmount)
        val tvDescription   = findViewById<android.widget.TextView>(R.id.tvDescription)
        val tvLoggedDate    = findViewById<android.widget.TextView>(R.id.tvLoggedDate)

        tvLocationValue.text = location
        tvIncomeAmount.text  = amount
        tvDescription.text   = description

        val displayDate = if (time.isNotEmpty()) "$date $time" else date
        tvLoggedDate.text = displayDate

        val cardProofOfIncome = findViewById<android.view.View>(R.id.cardProofOfIncome)
        cardProofOfIncome.setOnClickListener {
            if (receiptUrl.isNotEmpty() && receiptUrl.startsWith("http")) {
                ImagePreviewDialog.newInstance(receiptUrl)
                    .show(supportFragmentManager, ImagePreviewDialog.TAG)
            } else {
                android.widget.Toast.makeText(this, "No receipt image uploaded.", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
    }
}
