package com.elvin.multibiz.transaction

import com.elvin.multibiz.R

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SearchView
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.elvin.multibiz.common.ApiClient
import com.elvin.multibiz.common.SessionManager
import com.elvin.multibiz.common.setupBottomNav
import com.google.android.material.appbar.MaterialToolbar
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class LogsActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var adapter: LogsAdapter

    // Master list — never mutated after fetch (used as source for filtering)
    private var masterList: List<LogItem> = emptyList()

    // Currently displayed filtered list
    private var filteredList: List<LogItem> = emptyList()

    // Active filter label: null = All, "Today", "This Week", "This Month"
    private var activeFilter: String? = null

    // Current search query
    private var activeQuery: String = ""

    // ─────────────────────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_logs)

        // Bottom nav
        setupBottomNav(this, findViewById(R.id.bottomNav), R.id.nav_tab_logs)

        // RecyclerView
        recyclerView = findViewById(R.id.recyclerViewLogs)
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = LogsAdapter(emptyList())
        recyclerView.adapter = adapter

        // SwipeRefreshLayout — manual pull-to-refresh
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.setOnRefreshListener { fetchLogs() }

        // Toolbar menu — Search + Filter
        val toolbar = findViewById<MaterialToolbar>(R.id.topToolbar)
        toolbar.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                R.id.action_search -> false // Handled by SearchView listener below
                R.id.action_filter -> { showFilterDialog(); true }
                else -> false
            }
        }

        // Wire up the native SearchView
        val searchItem = toolbar.menu.findItem(R.id.action_search)
        val searchView = searchItem?.actionView as? SearchView
        searchView?.apply {
            queryHint = "Search by description or amount..."
            setOnQueryTextListener(object : SearchView.OnQueryTextListener {
                override fun onQueryTextSubmit(query: String?) = false
                override fun onQueryTextChange(newText: String?): Boolean {
                    activeQuery = newText?.trim() ?: ""
                    applyFilters()
                    return true
                }
            })
            setOnCloseListener {
                activeQuery = ""
                applyFilters()
                false
            }
        }

        // Initial load
        fetchLogs()
    }

    override fun onResume() {
        super.onResume()
        fetchLogs()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Resolve assigned business, STEP 2: Fetch transactions
    // ─────────────────────────────────────────────────────────────────────────

    private fun fetchLogs() {
        val authHeader = SessionManager.getAuthHeader(this) ?: run {
            swipeRefreshLayout.isRefreshing = false
            return
        }
        val userId = SessionManager.getUserId(this) ?: run {
            swipeRefreshLayout.isRefreshing = false
            return
        }

        swipeRefreshLayout.isRefreshing = true

        lifecycleScope.launch {
            try {
                // Step 1: Get the assigned business ID
                val assignmentResponse = ApiClient.api.getMyAssignments(authHeader)
                if (!assignmentResponse.isSuccessful || assignmentResponse.body()?.success != true) {
                    showToast("Could not load your assigned business.")
                    swipeRefreshLayout.isRefreshing = false
                    return@launch
                }

                val businesses = assignmentResponse.body()?.data
                if (businesses.isNullOrEmpty()) {
                    masterList = emptyList()
                    applyFilters()
                    swipeRefreshLayout.isRefreshing = false
                    return@launch
                }

                // Single-assignment rule per SDD: take first
                val business = businesses[0]

                // Step 2: Fetch all transactions for that business
                val txResponse = ApiClient.api.getTransactionsByBusiness(authHeader, business.id)
                if (!txResponse.isSuccessful || txResponse.body()?.success != true) {
                    showToast("Could not load income logs.")
                    swipeRefreshLayout.isRefreshing = false
                    return@launch
                }

                val allTransactions = txResponse.body()?.data ?: emptyList()

                // Step 3: Filter — only this staff's own transactions
                val myTransactions = allTransactions.filter { tx ->
                    tx.staff?.id == userId
                }

                // Step 4: Map to LogItem for the adapter
                masterList = myTransactions.map { tx ->
                    val dateTime = parseDateTime(tx.createdAt)
                    LogItem(
                        transactionId = tx.id,
                        businessName = business.name,
                        description = tx.description ?: "No description",
                        amount = "+ ₱${String.format("%,.2f", tx.amount)}",
                        date = dateTime.first,
                        time = dateTime.second,
                        receiptUrl = tx.receiptUrl
                    )
                }

                applyFilters()

            } catch (e: Exception) {
                showToast("Connection error. Please try again.")
            } finally {
                swipeRefreshLayout.isRefreshing = false
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOCAL FILTERING — date range + search query (no new API calls)
    // ─────────────────────────────────────────────────────────────────────────

    private fun applyFilters() {
        var result = masterList

        // Date range filter
        val today = LocalDate.now()
        when (activeFilter) {
            "Today" -> result = result.filter { parseLocalDate(it.date) == today }
            "This Week" -> {
                val weekStart = today.with(java.time.DayOfWeek.MONDAY)
                result = result.filter {
                    val d = parseLocalDate(it.date)
                    d != null && !d.isBefore(weekStart) && !d.isAfter(today)
                }
            }
            "This Month" -> {
                result = result.filter {
                    val d = parseLocalDate(it.date)
                    d != null && d.month == today.month && d.year == today.year
                }
            }
        }

        // Search filter (description OR amount, case-insensitive)
        if (activeQuery.isNotEmpty()) {
            result = result.filter { item ->
                item.description.contains(activeQuery, ignoreCase = true) ||
                item.amount.contains(activeQuery, ignoreCase = true)
            }
        }

        filteredList = result
        adapter = LogsAdapter(filteredList)
        recyclerView.adapter = adapter
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FILTER DIALOG — Today / This Week / This Month / All
    // ─────────────────────────────────────────────────────────────────────────

    private fun showFilterDialog() {
        val options = arrayOf("All", "Today", "This Week", "This Month")
        val currentIndex = when (activeFilter) {
            "Today" -> 1
            "This Week" -> 2
            "This Month" -> 3
            else -> 0
        }
        AlertDialog.Builder(this)
            .setTitle("Filter by Date Range")
            .setSingleChoiceItems(options, currentIndex) { dialog, which ->
                activeFilter = if (which == 0) null else options[which]
                applyFilters()
                dialog.dismiss()
            }
            .show()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Parses an ISO-style LocalDateTime string (e.g. "2026-04-11T09:45:00")
     * into a Pair of human-readable (date, time) strings.
     */
    private fun parseDateTime(raw: String): Pair<String, String> {
        return try {
            val dt = LocalDateTime.parse(raw.substring(0, 19))
            val datePart = dt.format(DateTimeFormatter.ofPattern("MMM d, yyyy"))
            val timePart = dt.format(DateTimeFormatter.ofPattern("hh:mm a"))
            Pair(datePart, "• $timePart")
        } catch (e: Exception) {
            Pair(raw, "")
        }
    }

    private fun parseLocalDate(humanDate: String): LocalDate? {
        return try {
            LocalDate.parse(humanDate, DateTimeFormatter.ofPattern("MMM d, yyyy"))
        } catch (e: Exception) { null }
    }

    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
