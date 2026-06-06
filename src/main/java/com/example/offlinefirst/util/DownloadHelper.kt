package com.example.offlinefirst.util

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import java.io.File

class DownloadHelper(private val context: Context) {

    fun downloadReport(url: String, fileName: String) {
        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle("Downloading $fileName")
            .setDescription("Downloading report...")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)

        val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val downloadId = downloadManager.enqueue(request)

        Toast.makeText(context, "Download started...", Toast.LENGTH_SHORT).show()
    }

    /**
     * Helper to open the downloaded file.
     * Note: In a real app, you'd use FileProvider to get a content URI.
     */
    fun openDownloadedFile(fileName: String) {
        val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), fileName)
        if (file.exists()) {
            // Use Intent with FileProvider to open the file
            Toast.makeText(context, "Opening $fileName...", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(context, "File not found!", Toast.LENGTH_SHORT).show()
        }
    }
}
