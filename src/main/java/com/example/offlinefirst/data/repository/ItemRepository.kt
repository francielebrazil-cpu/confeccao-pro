package com.example.offlinefirst.data.repository

import com.example.offlinefirst.data.local.ItemDao
import com.example.offlinefirst.data.local.ItemEntity
import com.example.offlinefirst.data.remote.SupabaseApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import java.util.UUID

class ItemRepository(
    private val itemDao: ItemDao,
    private val supabaseApi: SupabaseApi
) {
    val allItems: Flow<List<ItemEntity>> = itemDao.getAllItems()

    suspend fun addItem(name: String, description: String) {
        val newItem = ItemEntity(
            id = UUID.randomUUID().toString(),
            name = name,
            description = description,
            isSynced = false
        )
        itemDao.insertItem(newItem)
    }

    suspend fun updateItem(item: ItemEntity) {
        val updatedItem = item.copy(
            updatedAt = System.currentTimeMillis(),
            isSynced = false
        )
        itemDao.updateItem(updatedItem)
    }

    suspend fun deleteItem(id: String) {
        itemDao.softDeleteItem(id)
    }

    /**
     * Bidirectional Sync Strategy:
     * 1. Pull remote data and merge with local (Last-Write-Wins based on timestamp).
     * 2. Push local unsynced changes to remote.
     */
    suspend fun syncWithSupabase(): Result<Unit> {
        return try {
            // 1. Pull Remote
            val remoteResponse = supabaseApi.getItems()
            if (remoteResponse.isSuccessful) {
                val remoteItems = remoteResponse.body() ?: emptyList()
                val localItems = itemDao.getAllItems().first()
                
                // Merge logic: If remote is newer, update local.
                remoteItems.forEach { remoteItem ->
                    val localItem = localItems.find { it.id == remoteItem.id }
                    if (localItem == null || remoteItem.updatedAt > localItem.updatedAt) {
                        itemDao.insertItem(remoteItem.copy(isSynced = true))
                    }
                }
            }

            // 2. Push Local Unsynced
            val unsyncedItems = itemDao.getUnsyncedItems()
            if (unsyncedItems.isNotEmpty()) {
                // Handle deletions separately if needed, or just push everything.
                val pushResponse = supabaseApi.upsertItems(unsyncedItems)
                if (pushResponse.isSuccessful) {
                    unsyncedItems.forEach { item ->
                        itemDao.insertItem(item.copy(isSynced = true))
                    }
                }
            }
            
            // 3. Clean up deleted items that are now synced
            itemDao.clearSyncedDeletedItems()
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
