package com.example.offlinefirst.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "employees")
data class EmployeeEntity(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    @SerializedName("name")
    val name: String,
    @ColumnInfo(name = "target_per_hour")
    @SerializedName("target_per_hour")
    val targetPerHour: Int = 10,
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "production_entries")
data class ProductionEntryEntity(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    @ColumnInfo(name = "employee_id")
    @SerializedName("employee_id")
    val employeeId: String,
    @SerializedName("quantity")
    val quantity: Int,
    @ColumnInfo(name = "hours_worked")
    @SerializedName("hours_worked")
    val hoursWorked: Double,
    @SerializedName("date")
    val date: String,
    @ColumnInfo(name = "updated_at")
    @SerializedName("updated_at")
    val updatedAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)
