package com.example.offlinefirst.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "items")
data class ItemEntity(
    @PrimaryKey
    @SerializedName("id")
    val id: String, // UUID from Supabase or locally generated
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("description")
    val description: String,
    
    @SerializedName("updated_at")
    val updatedAt: Long = System.currentTimeMillis(),
    
    // Local-only flags
    val isSynced: Boolean = true,
    val isDeleted: Boolean = false // Soft delete for offline sync
)
