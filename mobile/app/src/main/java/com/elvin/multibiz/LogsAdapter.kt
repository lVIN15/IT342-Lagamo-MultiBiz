package com.elvin.multibiz

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.elvin.multibiz.R

data class LogItem(
    val businessName: String,
    val time: String,
    val amount: String
)

class LogsAdapter(private val logsList: List<LogItem>) :
    RecyclerView.Adapter<LogsAdapter.LogViewHolder>() {

    class LogViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val textBusinessName: TextView = itemView.findViewById(R.id.textBusinessName)
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
        holder.textBusinessName.text = log.businessName
        holder.textTime.text = log.time
        holder.textIncomeAmount.text = log.amount
    }

    override fun getItemCount(): Int {
        return logsList.size
    }
}
