package com.elvin.multibiz.utils

import android.app.Activity
import android.content.Intent
import android.graphics.Typeface
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.graphics.toColorInt
import com.elvin.multibiz.HomeActivity
import com.elvin.multibiz.LogsActivity
import com.elvin.multibiz.R

private const val COLOR_ACTIVE   = "#123458"
private const val COLOR_INACTIVE = "#9E9E9E"

/**
 * Sets up the custom bottom navigation bar included via layout_bottom_nav.xml.
 *
 * @param activity      The current Activity context.
 * @param navRoot       The root View of the included layout_bottom_nav include tag.
 * @param activeTabId   The R.id of the tab that represents the CURRENT screen
 *                      (e.g. R.id.nav_tab_home on HomeActivity).
 *
 * Active-state highlighting is applied INSTANTLY (no animation) to avoid
 * the flash/glitch that occurs with the native BottomNavigationView on
 * Activity transitions.
 */
fun setupBottomNav(activity: Activity, navRoot: View, activeTabId: Int) {

    // --- Grab all tab containers ---
    val tabHome    = navRoot.findViewById<LinearLayout>(R.id.nav_tab_home)
    val tabLogs    = navRoot.findViewById<LinearLayout>(R.id.nav_tab_logs)
    val tabProfile = navRoot.findViewById<LinearLayout>(R.id.nav_tab_profile)

    // --- Grab all icons ---
    val iconHome    = navRoot.findViewById<ImageView>(R.id.nav_icon_home)
    val iconLogs    = navRoot.findViewById<ImageView>(R.id.nav_icon_logs)
    val iconProfile = navRoot.findViewById<ImageView>(R.id.nav_icon_profile)

    // --- Grab all labels ---
    val labelHome    = navRoot.findViewById<TextView>(R.id.nav_label_home)
    val labelLogs    = navRoot.findViewById<TextView>(R.id.nav_label_logs)
    val labelProfile = navRoot.findViewById<TextView>(R.id.nav_label_profile)

    // --- Activate the correct tab instantly, no animation ---
    setTabState(iconHome,    labelHome,    activeTabId == R.id.nav_tab_home)
    setTabState(iconLogs,    labelLogs,    activeTabId == R.id.nav_tab_logs)
    setTabState(iconProfile, labelProfile, activeTabId == R.id.nav_tab_profile)

    // --- Wire up navigation click listeners ---
    tabHome.setOnClickListener {
        if (activeTabId != R.id.nav_tab_home) {
            navigateTo(activity, HomeActivity::class.java)
        }
    }

    tabLogs.setOnClickListener {
        if (activeTabId != R.id.nav_tab_logs) {
            navigateTo(activity, LogsActivity::class.java)
        }
    }

    tabProfile.setOnClickListener {
        // Reserved for future ProfileActivity
    }
}

/** Applies active (dark blue, bold) or inactive (gray, normal) style to a tab. */
private fun setTabState(icon: ImageView, label: TextView, isActive: Boolean) {
    val color = if (isActive) COLOR_ACTIVE.toColorInt() else COLOR_INACTIVE.toColorInt()
    icon.setColorFilter(color)
    label.setTextColor(color)
    label.setTypeface(null, if (isActive) Typeface.BOLD else Typeface.NORMAL)
}

/** Launches a target Activity with no transition animation and clears the back stack. */
private fun <T : Activity> navigateTo(from: Activity, to: Class<T>) {
    val intent = Intent(from, to).apply {
        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    from.startActivity(intent)
    from.overridePendingTransition(0, 0) // Zero animation = no glitch flash
    from.finish()
}
