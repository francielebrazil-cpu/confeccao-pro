package com.example.offlinefirst.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductionDao {
    @Query("SELECT * FROM employees")
    fun getAllEmployees(): Flow<List<EmployeeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEmployee(employee: EmployeeEntity)

    @Query("SELECT * FROM production_entries WHERE date = :date")
    fun getProductionByDate(date: String): Flow<List<ProductionEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProductionEntry(entry: ProductionEntryEntity)

    @Query("""
        SELECT 
            e.id as employeeId,
            e.name as employeeName,
            SUM(p.quantity) as totalQuantity,
            SUM(p.hours_worked) as totalHours,
            e.target_per_hour as targetPerHour
        FROM employees e
        LEFT JOIN production_entries p ON e.id = p.employee_id AND p.date = :date
        GROUP BY e.id
    """)
    fun getDailyProductionReport(date: String): Flow<List<DailyProductionReport>>
}

data class DailyProductionReport(
    val employeeId: String,
    val employeeName: String,
    val totalQuantity: Int?,
    val totalHours: Double?,
    val targetPerHour: Int
) {
    val efficiency: Double
        get() {
            val actual = totalQuantity ?: 0
            val hours = totalHours ?: 0.0
            if (hours <= 0) return 0.0
            val expected = hours * targetPerHour
            return (actual.toDouble() / expected) * 100.0
        }
}
