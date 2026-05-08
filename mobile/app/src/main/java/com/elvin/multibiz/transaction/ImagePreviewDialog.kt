package com.elvin.multibiz.transaction

import com.elvin.multibiz.R

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ImageView
import androidx.fragment.app.DialogFragment
import coil.load

class ImagePreviewDialog : DialogFragment() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Make the dialog full screen matching the app theme but dark
        setStyle(STYLE_NORMAL, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.dialog_image_preview, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val imageUrl = arguments?.getString("IMAGE_URL") ?: ""
        
        val photoView = view.findViewById<ImageView>(R.id.photoView)
        val btnClose = view.findViewById<ImageButton>(R.id.btnClose)

        // Load the image using Coil with a smooth crossfade
        if (imageUrl.isNotEmpty()) {
            photoView.load(imageUrl) {
                crossfade(true)
                placeholder(android.R.drawable.ic_menu_gallery)
                error(android.R.drawable.ic_dialog_info)
            }
        }

        btnClose.setOnClickListener {
            dismiss()
        }
    }

    companion object {
        const val TAG = "ImagePreviewDialog"

        fun newInstance(imageUrl: String): ImagePreviewDialog {
            val args = Bundle()
            args.putString("IMAGE_URL", imageUrl)
            val fragment = ImagePreviewDialog()
            fragment.arguments = args
            return fragment
        }
    }
}
