package com.example.offlinefirst.data.repository

import com.example.offlinefirst.data.local.*
import com.example.offlinefirst.data.remote.SupabaseApi
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class ProductionRepository(
    private val productionDao: ProductionDao,
    private val supabaseApi: SupabaseApi
) {
    fun getDailyReport(date: String): Flow<List<DailyProductionReport>> = 
        productionDao.getDailyProductionReport(date)

    fun getAllEmployees(): Flow<List<EmployeeEntity>> = 
        productionDao.getAllEmployees()

    suspend fun addEmployee(name: String, target: Int) {
        val employee = EmployeeEntity(
            id = UUID.randomUUID().toString(),
            name = name,
            targetPerHour = target
        )
        productionDao.insertEmployee(employee)
    }

    suspend fun addProductionEntry(employeeId: String, quantity: Int, hours: Double, date: String) {
        val entry = ProductionEntryEntity(
            id = UUID.randomUUID().toString(),
            employeeId = employeeId,
            quantity = quantity,
            hoursWorked = hours,
            date = date,
            isSynced = false
        )
        productionDao.insertProductionEntry(entry)
    }
}
