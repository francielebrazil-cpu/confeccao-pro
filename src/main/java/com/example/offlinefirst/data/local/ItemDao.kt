package com.example.offlinefirst.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ItemDao {
    @Query("SELECT * FROM items WHERE isDeleted = 0 ORDER BY updatedAt DESC")
    fun getAllItems(): Flow<List<ItemEntity>>

    @Query("SELECT * FROM items WHERE id = :id")
    suspend fun getItemById(id: String): ItemEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: ItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItems(items: List<ItemEntity>)

    @Update
    suspend fun updateItem(item: ItemEntity)

    @Delete
    suspend fun deleteItem(item: ItemEntity)

    @Query("UPDATE items SET isDeleted = 1, isSynced = 0, updatedAt = :timestamp WHERE id = :id")
    suspend fun softDeleteItem(id: String, timestamp: Long = System.currentTimeMillis())

    @Query("SELECT * FROM items WHERE isSynced = 0")
    suspend fun getUnsyncedItems(): List<ItemEntity>

    @Query("DELETE FROM items WHERE isDeleted = 1 AND isSynced = 1")
    suspend fun clearSyncedDeletedItems()
}
