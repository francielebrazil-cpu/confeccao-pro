package com.example.offlinefirst.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.offlinefirst.data.repository.ItemRepository

class SyncWorker(
    context: Context,
    params: WorkerParameters,
    private val repository: ItemRepository
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val result = repository.syncWithSupabase()
            if (result.isSuccess) {
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            Result.failure()
        }
    }
}
