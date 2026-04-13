package com.elvin.multibiz

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.elvin.multibiz.R

data class LogItem(
    val transactionId: String,
    val businessName: String,     // for the Details "Assigned Location" card
    val description: String,      // shown in the list item (not the business name)
    val amount: String,
    val date: String,
    val time: String,
    val receiptUrl: String? = null
)

class LogsAdapter(private val logsList: List<LogItem>) :
    RecyclerView.Adapter<LogsAdapter.LogViewHolder>() {

    class LogViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val textDescription: TextView = itemView.findViewById(R.id.textDescription)
        val textDate: TextView = itemView.findViewById(R.id.textDate)
        val textTime: TextView = itemView.findViewById(R.id.textTime)
        val textIncomeAmount: TextView = itemView.findViewById(R.id.textIncomeAmount)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LogViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_log_record, parent, false)
        return LogViewHolder(view)
    }

    override fun onBindViewHolder(holder: LogViewHolder, position: Int) {
        val log = logsList[position]
        holder.textDescription.text = log.description
        holder.textDate.text = log.date
        holder.textTime.text = log.time
        holder.textIncomeAmount.text = log.amount

        holder.itemView.setOnClickListener { view ->
            val context = view.context
            val intent = android.content.Intent(context, LogDetailsActivity::class.java).apply {
                putExtra("TRANSACTION_ID", log.transactionId)
                putExtra("EXTRA_LOCATION", log.businessName)
                putExtra("EXTRA_AMOUNT", log.amount)
                putExtra("EXTRA_DESCRIPTION", log.description)
                putExtra("EXTRA_DATE", log.date)
                putExtra("EXTRA_TIME", log.time)
                putExtra("EXTRA_RECEIPT_URL", log.receiptUrl ?: "")
            }
            context.startActivity(intent)
        }
    }

    override fun getItemCount(): Int = logsList.size
}

