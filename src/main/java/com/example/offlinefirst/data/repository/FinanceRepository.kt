package com.example.offlinefirst.data.repository

import com.example.offlinefirst.data.local.FinanceDao
import com.example.offlinefirst.data.local.PartnerEntity
import com.example.offlinefirst.data.local.TransactionEntity
import com.example.offlinefirst.data.remote.SupabaseApi
import kotlinx.coroutines.flow.Flow

class FinanceRepository(
    private val financeDao: FinanceDao,
    private val api: SupabaseApi
) {
    val allPartners: Flow<List<PartnerEntity>> = financeDao.getAllPartners()
    val allTransactions: Flow<List<TransactionEntity>> = financeDao.getAllTransactions()

    suspend fun addPartner(name: String, type: String) {
        val partner = PartnerEntity(name = name, type = type)
        financeDao.insertPartner(partner)
        // Sync with Supabase could be added here
    }

    suspend fun addTransaction(description: String, amount: Double, date: String, partnerName: String, type: String) {
        val transaction = TransactionEntity(
            description = description,
            amount = amount,
            date = date,
            partnerName = partnerName,
            type = type
        )
        financeDao.insertTransaction(transaction)
        // Sync with Supabase could be added here
    }
}
