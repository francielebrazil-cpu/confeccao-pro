package com.example.offlinefirst.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import com.google.gson.annotations.SerializedName
import java.util.UUID

@Entity(tableName = "partners")
data class PartnerEntity(
    @PrimaryKey
    @SerializedName("id")
    val id: String = UUID.randomUUID().toString(),
    @SerializedName("name")
    val name: String,
    @SerializedName("type")
    val type: String, // "CLIENT", "SUPPLIER"
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey
    @SerializedName("id")
    val id: String = UUID.randomUUID().toString(),
    @SerializedName("description")
    val description: String,
    @SerializedName("amount")
    val amount: Double,
    @SerializedName("date")
    val date: String,
    @ColumnInfo(name = "partner_name")
    @SerializedName("partner_name")
    val partnerName: String,
    @SerializedName("type")
    val type: String, // "INCOME", "EXPENSE"
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)
